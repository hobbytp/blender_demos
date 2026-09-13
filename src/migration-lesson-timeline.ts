import audio from './migration-lesson-audio.json' with {type:'json'};
import {migrationStateAt} from './migration-timeline.ts';

export const MIGRATION_LESSON_DURATION=420*30;
export const migrationLessonChapters=[
  {start:0,end:30,name:'热迁移保留什么'},
  {start:30,end:65,name:'管理、迁移与磁盘三条路径'},
  {start:65,end:100,name:'预检与 incoming 执行门'},
  {start:100,end:135,name:'预拷贝与再次变脏'},
  {start:135,end:175,name:'重传与收敛的竞争'},
  {start:175,end:215,name:'最终暂停与一致状态'},
  {start:215,end:250,name:'配置交接与恢复执行'},
  {start:250,end:285,name:'源进程清理与共享磁盘'},
  {start:285,end:325,name:'业务连续性单独验收'},
  {start:325,end:365,name:'回看切换前失败分支'},
  {start:365,end:395,name:'判断题：内存齐了就能执行吗'},
  {start:395,end:420,name:'因果链与下一集'},
];
export function migrationCue(text:string){
  const c=audio.flatMap(a=>a.captions).find(c=>c.text===text);
  if(!c)throw new Error(`Missing migration lesson cue: ${text}`);
  return Math.ceil(c.start*30);
}
export const migrationLessonBeats={
  prepare:migrationCue('目标启动接收进程。')+20,
  copy:migrationCue('开始第一轮内存预拷贝。'),
  dirty:migrationCue('现在，源端再次写入P2。')+25,
  dirty5:migrationCue('P5也发生了变化。')+20,
  retry:migrationCue('下一轮重传已经变化的页。'),
  redirty:migrationCue('源端又把P2改成版本三。')+20,
  pause:migrationCue('先暂停源端来宾执行。')+25,
  finalRam:migrationCue('再完成剩余内存同步。'),
  device:migrationCue('同时交接处理器和设备状态。'),
  completed:migrationCue('QEMU报告传输完成。')+20,
  config:migrationCue('配置的节点归属转到B。'),
  resume:migrationCue('目标恢复执行。')+20,
  cleanup:migrationCue('源QEMU进程随后清理。')+35,
  cancel:Infinity,cancelCleanup:Infinity,
};
const b=migrationLessonBeats;
export const migrationLessonTransfers=[
  ...Array.from({length:8},(_,page)=>({page,version:1,start:b.copy+page*12,end:b.copy+page*12+18})),
  {page:2,version:2,start:b.retry,end:b.retry+24},
  {page:5,version:2,start:b.retry+26,end:b.retry+50},
  {page:2,version:3,start:b.finalRam,end:b.finalRam+24},
];
// A separate, explicitly labelled replay; it is not a reversal of the successful handover.
export const migrationFailureBeats={...b,prepare:325*30,copy:325*30,
  dirty:328*30,dirty5:328*30+15,retry:329*30,redirty:330*30,
  pause:Infinity,finalRam:Infinity,device:Infinity,completed:Infinity,config:Infinity,resume:Infinity,cleanup:Infinity,
  cancel:migrationCue('现在，迁移传输失败。')+20,
  cancelCleanup:migrationCue('管理流程取消并清理接收端。')+30,
};
const failureTransfers=Array.from({length:8},(_,page)=>({page,version:1,start:325*30+page*12,end:325*30+page*12+18}));
export function migrationLessonStateAt(frame:number){
  const f=Math.max(0,Math.min(MIGRATION_LESSON_DURATION-1,Math.floor(frame)));
  const chapter=migrationLessonChapters.findIndex(c=>f<c.end*30),replay=chapter===9;
  const state=migrationStateAt(f,replay,replay?migrationFailureBeats:b,replay?failureTransfers:migrationLessonTransfers,MIGRATION_LESSON_DURATION);
  return {...state,chapter,replay,probe:f>=migrationCue('业务仍需独立探测。'),
    requestConfirmed:f>=migrationCue('探测成功，才确认本次请求。')+35,
    answer:f>=migrationCue('不能只看内存。')};
}
