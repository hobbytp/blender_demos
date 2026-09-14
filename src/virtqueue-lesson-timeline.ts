import audio from './virtqueue-lesson-audio.json' with {type:'json'};
import {virtqueueStateAt} from './virtqueue-timeline.ts';
export const VIRTQUEUE_LESSON_DURATION=12600;
export const virtqueueLessonChapters=[
  {start:0,end:30,name:'回收与远端收包'}, {start:30,end:70,name:'Guest / Host 责任边界'},
  {start:70,end:115,name:'展开描述符链'}, {start:115,end:160,name:'发布顺序与内存屏障'},
  {start:160,end:205,name:'后端取用与数据提交'}, {start:205,end:250,name:'used 发布与缓冲回收'},
  {start:250,end:290,name:'通知抑制与恢复竞态'}, {start:290,end:335,name:'vhost 优化的边界'},
  {start:335,end:375,name:'分层判断完成证据'}, {start:375,end:420,name:'三问与因果回放'},
];
export function virtqueueLessonCue(text:string){
  const c=audio.flatMap(a=>a.captions).find(c=>c.text===text);
  if(!c)throw new Error(`Missing virtqueue lesson cue: ${text}`);
  return Math.ceil(c.start*30);
}
const cue=virtqueueLessonCue;
export const virtqueueLessonBeats={
  desc:cue('驱动填写两项描述符。')+30,availableEntry:cue('驱动先填写可用环槽位。')+30,
  available:cue('然后发布可用环索引。')+30,kick:cue('现在发出队列通知。')+30,
  consume:cue('后端取得描述符链。')+30,data:cue('按地址映射访问发送缓冲区。')+30,
  tap:cue('本次提交成功。')+30,usedEntry:cue('后端先填写已用环槽位。')+30,
  used:cue('后端再发布已用环索引。')+30,irq:cue('随后才发送完成通知。')+30,
  read:cue('驱动读取已用环结果。')+30,reclaim:cue('现在可以回收发送缓冲区。')+30,
};
export const virtqueueLessonEvents={
  barrier:cue('接着执行发布前的内存屏障。'),
  pollUsed:cue('后端仍然发布完成记录。')+30,pollRead:cue('驱动主动检查已用环。')+30,pollReclaim:cue('于是仍能回收缓冲区。')+30,
  race:cue('再单独看通知恢复的竞态。'),racePublish:cue('后端此时发布了一个完成。')+30,
  reenable:cue('驱动重新开启完成通知。')+30,recheck:cue('随后必须再检查队列。')+30,
  answerOne:cue('不携带，它只是提醒检查。'),answerTwo:cue('还要读取条目并找到原请求。'),answerThree:cue('不能，那个证据在更高层。'),
  replay:cue('现在回放一次正常发送。'),
};
export const virtqueueReplayBeats={
  desc:cue('描述符引用准备好的数据。')+24,availableEntry:cue('链头写入可用环。')+24,
  available:cue('经过屏障，发布索引。')+24,kick:cue('通知后端，再取用描述符。')+12,
  consume:cue('通知后端，再取用描述符。')+42,data:cue('按地址访问并提交数据。')+12,tap:cue('按地址访问并提交数据。')+48,
  usedEntry:cue('后端写入并发布已用记录。')+12,used:cue('后端写入并发布已用记录。')+48,
  irq:cue('提醒驱动，读取完成结果。')+12,read:cue('提醒驱动，读取完成结果。')+48,
  reclaim:cue('最后回收描述符和缓冲区。')+30,
};
export const virtqueuePollBeats={...virtqueueLessonBeats,desc:1,availableEntry:2,available:3,kick:4,consume:5,data:6,tap:7,
  usedEntry:virtqueueLessonEvents.pollUsed-15,used:virtqueueLessonEvents.pollUsed,irq:12601,
  read:virtqueueLessonEvents.pollRead,reclaim:virtqueueLessonEvents.pollReclaim};
export function virtqueueLessonStateAt(frame:number){
  const f=Math.max(0,Math.min(12599,Math.floor(frame))),chapter=virtqueueLessonChapters.findIndex(c=>f<c.end*30);
  const isReplay=f>=virtqueueLessonEvents.replay,poll=chapter===6;
  const timing=isReplay?virtqueueReplayBeats:poll?virtqueuePollBeats:virtqueueLessonBeats;
  const shown=chapter===0?timing.reclaim:chapter===1?0:chapter===9&&!isReplay?timing.reclaim:f;
  return {...virtqueueStateAt(shown,poll,VIRTQUEUE_LESSON_DURATION,timing),frame:f,chapter,isReplay,
    racePublished:poll&&f>=virtqueueLessonEvents.racePublish,notificationsEnabled:poll&&f>=virtqueueLessonEvents.reenable,
    raceRechecked:poll&&f>=virtqueueLessonEvents.recheck};
}
