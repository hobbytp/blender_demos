import audio from './backup-lesson-audio.json' with {type:'json'};
import {backupStateAt} from './backup-timeline.ts';
export const BACKUP_LESSON_DURATION=12600;
export const backupLessonChapters=[
  {start:0,end:35,name:'冻结、复制与恢复承诺'},{start:35,end:80,name:'Guest / Host 责任边界'},
  {start:80,end:130,name:'QGA 冻结与成功证据'},{start:130,end:185,name:'保护建立后解冻'},
  {start:185,end:250,name:'旧块与覆盖写竞争'},{start:250,end:305,name:'数据库协调的具体对照'},
  {start:305,end:365,name:'错误清理与恢复证据'},{start:365,end:420,name:'三问与因果回放'},
];
export function backupLessonCue(text:string){
  const c=audio.flatMap(a=>a.captions).find(c=>c.text===text);
  if(!c)throw new Error(`Missing backup lesson cue: ${text}`);
  return Math.ceil(c.start*30);
}
const cue=backupLessonCue;
const sync=cue('代理开始同步并冻结。')+24,frozen=cue('成功后，本例文件系统被冻结。')+24;
const protection=cue('块层建立写前复制保护。')+24,started=cue('然后启动后台备份任务。')+24;
const thawRequest=cue('编排随后请求解冻。')+24,thawed=cue('文件系统恢复写入。')+24;
export const backupLessonBeats={
  freezeRequest:cue('编排发出冻结请求。')+24,sync,frozen,freezeAck:cue('冻结响应回到编排端。')+24,
  backupRequest:cue('编排请求启动备份。')+24,protection,started,startAck:cue('启动响应返回宿主。')+24,
  thawRequest,thawed,thawAck:cue('解冻响应回到编排。')+24,copiedY:cue('后台先复制示意块乙。')+30,
  newWrite:cue('来宾提交甲的新值。')+24,oldRead:cue('块层读取甲的旧内容。')+24,
  oldSent:cue('旧内容进入备份复制路径。')+24,oldSafe:cue('目标成功接收这份旧内容。')+24,
  overwrite:cue('现在才允许覆盖运行盘。')+24,
};
export const backupLessonEvents={
  writeY:cue('来宾提交乙的新值。')+24,overwriteY:cue('随后乙在运行盘上改变。')+24,
  appStopRequest:cue('先正常停止数据库。')+24,appStopped:cue('确认数据库已经干净退出。')+24,
  appScope:cue('本例都位于同一个被备份磁盘。')+24,
  appFreeze:cue('随后冻结并建立备份保护。')+12,appProtect:cue('随后冻结并建立备份保护。')+48,
  appThaw:cue('解冻之后，其他服务可以写入。')+24,
  appBackupDone:cue('直到备份流程成功结束。')+36,appRestart:cue('之后再启动数据库。')+24,
  freezeError:cue('冻结调用返回错误。')+24,cleanup:cue('仍保留后续解冻的清理标记。')+24,
  thawAttempt:cue('调用解冻也不保证已经解冻，')+24,evidence:cue('现在回到归档的完成判定。'),
  answerOne:cue('不意味着，保护建立后仍要复制。'),answerTwo:cue('不能，应用协调需要独立证据。'),
  answerThree:cue('还需要实际恢复和业务检查。'),replay:cue('现在回放一次正常路径。'),
};
const replayFreeze=cue('代理冻结本地文件系统。')+24,replayProtection=cue('块层保护建立，任务启动。')+12;
const replayThaw=cue('收到启动响应后解冻。')+24,replayWrite=cue('未备份的旧块遇到覆盖写。')+24;
const replayCopy=cue('先复制旧内容，再写入新值。')+12;
export const backupReplayBeats={
  freezeRequest:replayFreeze-24,sync:replayFreeze-12,frozen:replayFreeze,freezeAck:replayFreeze+18,
  backupRequest:replayProtection-18,protection:replayProtection,started:replayProtection+18,startAck:replayProtection+36,
  thawRequest:replayThaw-24,thawed:replayThaw,thawAck:replayThaw+18,
  copiedY:cue('后台复制已经继续运行。')+30,newWrite:replayWrite,
  oldRead:replayCopy,oldSent:replayCopy+18,oldSafe:replayCopy+36,overwrite:replayCopy+60,
};
export function backupLessonStateAt(frame:number){
  const f=Math.max(0,Math.min(BACKUP_LESSON_DURATION-1,Math.floor(frame))),e=backupLessonEvents;
  const chapter=backupLessonChapters.findIndex(c=>f<c.end*30),isReplay=f>=e.replay;
  const timing=isReplay?backupReplayBeats:backupLessonBeats,shown=chapter===0?timing.overwrite:chapter===1?0:f;
  const s=backupStateAt(shown,BACKUP_LESSON_DURATION,timing);
  return {...s,frame:f,chapter,isReplay,startAcknowledged:shown>=timing.startAck,
    sourceY:chapter===0||!isReplay&&f>=e.overwriteY?'v2':'v1',
    yWriteRequested:chapter===4&&f>=e.writeY,yOverwritten:chapter===4&&f>=e.overwriteY,
    appStopped:chapter===5&&f>=e.appStopped&&f<e.appRestart,appScopeReady:chapter===5&&f>=e.appScope,
    appFrozen:chapter===5&&f>=e.appFreeze&&f<e.appThaw,appProtected:chapter===5&&f>=e.appProtect,
    appBackupDone:chapter===5&&f>=e.appBackupDone,appRestarted:chapter===5&&f>=e.appRestart,
    freezeError:chapter===6&&f>=e.freezeError,cleanupRequired:chapter===6&&f>=e.cleanup,
    thawAttempted:chapter===6&&f>=e.thawAttempt,cleanupResult:'unknown' as const,restoreVerified:false,
  };
}
