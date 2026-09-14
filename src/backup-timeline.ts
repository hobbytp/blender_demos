import audio from './backup-audio.json' with {type:'json'};
export const BACKUP_DURATION=900;
export const backupChapters=[{start:0,end:7.5,name:'代理与文件系统冻结'},{start:7.5,end:14.2,name:'保护建立后解冻'},{start:14.2,end:23.2,name:'先保旧数据，再覆盖'},{start:23.2,end:30,name:'应用一致性的边界'}];
const cue=(text:string)=>{const c=audio.flatMap(a=>a.captions).find(c=>c.text===text);if(!c)throw new Error(`Missing backup cue: ${text}`);return Math.ceil(c.start*30);};
const sync=cue('代理同步并冻结。')+9,frozen=sync+24,protection=cue('备份保护建立后，')-12;
const thawRequest=cue('随后解冻。')+12,thawed=thawRequest+24,oldRead=cue('先备份这块旧数据，')+12;
export const backupBeats={freezeRequest:cue('先请求冻结文件系统。')+24,sync,frozen,freezeAck:frozen+24,
  backupRequest:protection-24,protection,started:protection+24,thawRequest,thawed,thawAck:thawed+18,
  copiedY:Math.max(thawed+48,cue('复制仍在继续。')+45),newWrite:cue('新写入到来，')+15,
  oldRead,oldSent:oldRead+18,oldSafe:oldRead+36,overwrite:Math.max(oldRead+60,cue('再允许覆盖。')+36)};
export function backupStateAt(frame:number){
  const f=Math.max(0,Math.min(BACKUP_DURATION-1,Math.floor(frame))),b=backupBeats;
  return {frame:f,chapter:backupChapters.findIndex(c=>f<c.end*30),freezeRequested:f>=b.freezeRequest,syncing:f>=b.sync&&f<b.frozen,
    frozen:f>=b.frozen&&f<b.thawed,freezeAcknowledged:f>=b.freezeAck,protected:f>=b.protection,started:f>=b.started,
    startAcknowledged:f>=b.started+18,thawed:f>=b.thawed,thawAcknowledged:f>=b.thawAck,copiedY:f>=b.copiedY,newWrite:f>=b.newWrite,
    oldSafe:f>=b.oldSafe,writeBlocked:f>=b.newWrite&&f<b.oldSafe,overwritten:f>=b.overwrite,
    sourceX:f>=b.overwrite?'v2':'v1',backupX:f>=b.oldSafe?'v1':null,
    backupComplete:false,applicationConsistent:'unverified' as const};
}
