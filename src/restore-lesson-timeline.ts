import audio from './restore-lesson-audio.json' with {type:'json'};
import {restoreStateAt} from './restore-timeline.ts';
export const RESTORE_LESSON_DURATION=12600;
export const restoreLessonChapters=[{start:0,end:35,name:'恢复承诺与责任边界'},{start:35,end:85,name:'恢复点与 RPO 缺口'},{start:85,end:140,name:'解包、映射与任务结果'},{start:140,end:185,name:'隔离核验与系统启动'},{start:185,end:240,name:'数据库与日志回放'},{start:240,end:295,name:'查询和验收范围'},{start:295,end:355,name:'RTO 与完整恢复用时'},{start:355,end:420,name:'失败边界与因果回放'}];
export const restoreLessonCue=(text:string)=>{const c=audio.flatMap(a=>a.captions).find(c=>c.text===text);if(!c)throw Error(`Missing restore lesson cue: ${text}`);return Math.ceil(c.start*30);};
const cue=restoreLessonCue;
export const restoreLessonBeats={extract:cue('恢复工具读取归档，')+24,mapped:cue('接着分配目标卷，')+24,
  disks:cue('现在磁盘内容恢复完成。')+24,restored:cue('恢复任务才有成功结果。')+24,
  start:cue('操作方发出启动请求。')+24,os:cue('来宾系统进入运行状态。')+24,recover:cue('于是进入崩溃恢复。')+24,
  redo:cue('日志回放完成之后，')+24,ready:cue('数据库才进入可连接状态。')+24,
  query:cue('测试端发出查询，'),appQuery:cue('请求进入应用接口，')+24,sql:cue('应用再向数据库查询。')+24,
  sqlResult:cue('数据库返回记录，')+24,response:cue('应用把结果送回测试端。')+24,checked:cue('于是本次读取检查通过。')+24};
const replayQuery=cue('业务请求往返。');
export const restoreReplayBeats={extract:cue('归档先进入恢复工具。')+18,mapped:cue('设备映射建立。')+18,
  disks:cue('磁盘内容恢复完成，')+18,restored:cue('最终配置也写入成功。')+18,
  start:cue('核验隔离条件后启动。')+18,os:cue('系统运行，数据库开始恢复。')+12,recover:cue('系统运行，数据库开始恢复。')+36,
  redo:cue('日志推动数据页完成重做。')+24,ready:cue('数据库就绪。')+18,
  query:replayQuery,appQuery:replayQuery+18,sql:replayQuery+36,sqlResult:replayQuery+54,response:replayQuery+72,
  checked:Math.max(replayQuery+90,cue('核对结果后，本次检查通过。')+30)};
export const restoreLessonEvents={rpoBoundary:cue('目标边界就是九点四十五分。'),failedCandidate:cue('但备份任务已经失败。'),selected:cue('当前只能选择较早的一份。'),gap:cue('已经超过十五分钟的要求。'),
  isolation:cue('本例由操作方核验隔离网络，')+24,resources:cue('以及虚拟硬件的兼容条件。')+24,
  scope:cue('这条成功路径有明确前提：'),evidence:cue('完整验收还要检查，'),
  rtoSteps:['准备和决策用了五分钟。','磁盘恢复用了二十分钟。','接着系统启动用了三分钟，','数据库恢复用了四分钟。','业务验证又用了十分钟，','最后切换用了三分钟。'].map(cue),rtoTotal:cue('总用时四十五分钟，'),
  failure:cue('普通归档的解包如果报错，')+24,cleanup:cue('代码会进入清理并抛出错误，')+24,pbs:cue('另一种方式是在线恢复，'),replay:cue('现在重新回放正常路径。')};
export const recoveryExample={outageMinute:600,pointMinute:570,archiveFinishedMinute:580,rpoMinutes:15,failedPointMinute:590,rtoMinutes:30,stagesMinutes:[5,20,3,4,10,3]};
export function restoreLessonStateAt(frame:number){
  const f=Math.max(0,Math.min(RESTORE_LESSON_DURATION-1,Math.floor(frame))),isReplay=f>=restoreLessonEvents.replay;
  return {...restoreStateAt(f,RESTORE_LESSON_DURATION,isReplay?restoreReplayBeats:restoreLessonBeats),chapter:restoreLessonChapters.findIndex(c=>f<c.end*30),isReplay,
    isolationChecked:f>=restoreLessonEvents.isolation,resourcesChecked:f>=restoreLessonEvents.resources,
    selectedPoint:f>=restoreLessonEvents.selected?recoveryExample.pointMinute:null,
    gapMinutes:recoveryExample.outageMinute-recoveryExample.pointMinute,rpoMet:false,
    exampleRecoveryMinutes:recoveryExample.stagesMinutes.reduce((a,b)=>a+b,0),rtoMet:false,
    allBusinessVerified:false,productionRestored:false,realExperiment:false};
}
