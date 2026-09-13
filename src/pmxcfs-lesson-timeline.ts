import audio from './pmxcfs-lesson-audio.json' with {type:'json'};
import {pmxcfsStateAt} from './pmxcfs-timeline.ts';

export const PMXCFS_LESSON_DURATION=12600;
export const pmxcfsLessonChapters=[
  {start:0,end:30,name:'三个入口，同一个对象'},
  {start:30,end:65,name:'展开节点内部'},
  {start:65,end:105,name:'写入先检查资格'},
  {start:105,end:145,name:'一致顺序，包含自己'},
  {start:145,end:185,name:'各自更新本地副本'},
  {start:185,end:225,name:'返回结果究竟等谁'},
  {start:225,end:260,name:'读取走本机'},
  {start:260,end:300,name:'无 quorum 的新写入'},
  {start:300,end:340,name:'顺序不等于业务事务'},
  {start:340,end:380,name:'沿边界诊断问题'},
  {start:380,end:420,name:'判断题与因果回放'},
];
export function pmxcfsLessonCue(text:string){
  const c=audio.flatMap(a=>a.captions).find(c=>c.text===text);
  if(!c)throw new Error(`Missing pmxcfs lesson cue: ${text}`);
  return Math.ceil(c.start*30);
}
const cue=pmxcfsLessonCue;
export const pmxcfsLessonBeats={
  request:cue('现在，一次写操作进入甲。'),gate:cue('发送前先检查本机仲裁状态。'),
  send:cue('进入集群组通信。'),deliver:cue('发送节点自己也接收这条操作。'),
  memory:cue('操作抵达后，内存才变成新值。'),database:cue('随后记录到本地数据库。'),
  localResult:cue('然后记录本机处理结果。')+20,returned:cue('现在，结果沿本机调用链返回。')+48,
  remoteDatabase:cue('看丙，它可以稍晚完成。')+60,
  contrast:cue('分区已经稳定，'),read:cue('本机仍然返回保存的配置。'),
};
const replay=cue('现在重放那条健康路径。');
export const pmxcfsReplayBeats={request:replay,gate:replay+30,send:replay+65,deliver:replay+115,memory:replay+170,database:replay+205,localResult:replay+280,returned:replay+325,contrast:PMXCFS_LESSON_DURATION+1,read:PMXCFS_LESSON_DURATION+1};
export const pmxcfsLessonEvents={
  readRequest:cue('一个读请求进入甲的文件入口。'),readMemory:cue('它访问本机内存中的配置。'),readResult:cue('结果沿本机路径返回。')+36,
  deniedRequest:cue('在丙上发起一次新的写入。'),denied:cue('仲裁检查拒绝它继续前进。')+30,
  queue:cue('旁边另举两条操作的队列例子。'),queueDeliver:cue('先交付第一条，再交付第二条。'),
  lockRequest:cue('两个调用者竞争同一个锁目录。'),lockA:cue('第一个取得锁，第二个等待。')+30,
  refreshA:cue('持锁者先刷新配置，')+24,workA:cue('再进入受保护的业务操作。')+24,
  releaseA:cue('完成后释放锁目录。')+30,lockB:cue('第二个随后取得锁，')+30,
  refreshB:cue('刷新后再处理自己的任务。')+24,
  answerOne:cue('答案是不能。'),questionTwo:cue('再看甲的写调用返回。'),answerTwo:cue('答案也不能这样推断。'),replay,
};

export function pmxcfsLessonStateAt(frame:number){
  const f=Math.max(0,Math.min(PMXCFS_LESSON_DURATION-1,Math.floor(frame)));
  const chapter=pmxcfsLessonChapters.findIndex(c=>f<c.end*30),e=pmxcfsLessonEvents;
  const isReplay=f>=replay,b=isReplay?pmxcfsReplayBeats:pmxcfsLessonBeats;
  // These chapters explicitly revisit a healthy example, not recovery from the partition.
  const healthyReview=chapter===8||chapter===9||chapter===10&&f>=e.questionTwo&&!isReplay;
  const s=pmxcfsStateAt(healthyReview?pmxcfsLessonBeats.contrast-1:f,false,PMXCFS_LESSON_DURATION,b);
  const secondRequest=isReplay?PMXCFS_LESSON_DURATION+1:e.denied-55;
  const lockOwner=f<e.lockA||f>=e.releaseA&&f<e.lockB?null:f<e.releaseA?'A':'B';
  return {...s,frame:f,chapter,isReplay,secondRequest,
    denied:s.isolated&&f>=e.denied,readBack:s.isolated&&f>=b.read+30,
    readRequested:chapter===6&&f>=e.readRequest,readReturned:chapter===6&&f>=e.readResult,
    queue:[0,18,42].map(delay=>f<e.queueDeliver+30+delay?0:f<e.queueDeliver+120+delay?1:2),
    lockOwner:chapter===8?lockOwner:null,
    refreshedA:chapter===8&&f>=e.refreshA,workingA:chapter===8&&f>=e.workA&&f<e.releaseA,
    refreshedB:chapter===8&&f>=e.refreshB,workingB:chapter===8&&f>=e.refreshB+30,
    answerOne:f>=e.answerOne,answerTwo:f>=e.answerTwo,
  };
}
