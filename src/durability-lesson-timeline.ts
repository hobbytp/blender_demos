import audio from './durability-lesson-audio.json' with {type:'json'};
import {durabilityStateAt,durabilityBeats} from './durability-timeline.ts';
export const DURABILITY_LESSON_DURATION=12600;
export const durabilityLessonChapters=[
  {start:0,end:30,name:'写成功的含义'}, {start:30,end:65,name:'展开四层责任边界'},
  {start:65,end:100,name:'固定存储配置'}, {start:100,end:145,name:'WRITE 去程与回程'},
  {start:145,end:180,name:'断电反例'}, {start:180,end:230,name:'FLUSH 向下执行'},
  {start:230,end:265,name:'完成逐层返回'}, {start:265,end:305,name:'拆解缓存模式'},
  {start:305,end:340,name:'PREFLUSH 与 FUA'}, {start:340,end:380,name:'应用与事务的边界'},
  {start:380,end:420,name:'三问验收与回放'},
];
export function durabilityLessonCue(text:string){
  const c=audio.flatMap(a=>a.captions).find(c=>c.text===text);
  if(!c)throw new Error(`Missing durability lesson cue: ${text}`);
  return Math.ceil(c.start*30);
}
const cue=durabilityLessonCue;
export const durabilityLessonBeats={
  write:cue('来宾提交第一次写入。'),qemuWrite:cue('虚拟设备接收请求，')+24,
  backendWrite:cue('块后端执行文件写入。')+24,cache:cue('数据进入宿主页缓存。')+24,
  writeAck:cue('最终返回来宾。')+36,flush:cue('来宾现在提交刷新请求。'),
  qemuFlush:cue('虚拟设备转交块后端。')+24,backendFlush:cue('虚拟设备转交块后端。')+60,
  hostFlush:cue('文件后端开始同步调用。')+36,deviceCache:cue('数据先到设备的易失缓存。')+30,
  deviceFlush:cue('设备随后兑现相关刷新。')+30,stable:cue('新内容才到非易失存储。')+36,
  hostComplete:cue('宿主的同步调用先完成。')+30,backendComplete:cue('再返回文件和块后端。')+30,
  virtioComplete:cue('接着通知虚拟设备。')+30,flushAck:cue('最后来宾才收到刷新完成。')+36,
  powerCut:cue('现在模拟失去供电。')+24,
};
export const durabilityLessonEvents={
  none:cue('再看绕过宿主页缓存的模式。'),unsafe:cue('最后是允许忽略刷新的模式。'),
  preflush:cue('它们要先到非易失存储。')+36,fua:cue('再看强制单次写入持久化。'),
  fuaStable:cue('本次写入自身到达非易失存储，')+30,fuaAck:cue('才允许报告这次请求完成。')+30,
  answerOne:cue('答案是不能仅凭它保证。'),answerTwo:cue('还需要等待结果向上返回。'),
  answerThree:cue('答案也是否定的。'),replay:cue('现在回放正常路径。'),
};
const r=durabilityLessonEvents.replay;
export const durabilityReplayBeats={...durabilityBeats,write:r+18,qemuWrite:r+42,backendWrite:r+66,cache:r+90,writeAck:r+135,
  flush:r+165,qemuFlush:r+189,backendFlush:r+213,hostFlush:r+237,deviceCache:r+267,deviceFlush:r+291,stable:r+321,
  hostComplete:r+345,backendComplete:r+369,virtioComplete:r+393,flushAck:r+417,powerCut:DURABILITY_LESSON_DURATION+1};
export function durabilityLessonStateAt(frame:number){
  const f=Math.max(0,Math.min(DURABILITY_LESSON_DURATION-1,Math.floor(frame)));
  const chapter=durabilityLessonChapters.findIndex(c=>f<c.end*30),isReplay=f>=r,b=isReplay?durabilityReplayBeats:durabilityLessonBeats;
  // The opening and quiz revisit an already completed WRITE; chapter 5 explicitly resets the power-loss example.
  const shown=chapter===0||chapter===10&&!isReplay?b.writeAck:chapter===1||chapter===2?0:f;
  const s=durabilityStateAt(shown,chapter===4,DURABILITY_LESSON_DURATION,b);
  return {...s,frame:f,chapter,isReplay,mode:f<durabilityLessonEvents.none?'writeback':f<durabilityLessonEvents.unsafe?'none':'unsafe',
    preflushStable:chapter===8&&f>=durabilityLessonEvents.preflush,
    fuaStable:chapter===8&&f>=durabilityLessonEvents.fuaStable,fuaAck:chapter===8&&f>=durabilityLessonEvents.fuaAck};
}
