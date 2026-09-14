import audio from './restore-audio.json' with {type:'json'};
export const RESTORE_DURATION=900;
export const restoreChapters=[{start:0,end:7.5,name:'归档与恢复目标'},{start:7.5,end:14.5,name:'启动不等于就绪'},{start:14.5,end:22.5,name:'数据库日志回放'},{start:22.5,end:30,name:'查询与业务证据'}];
const cue=(text:string)=>{const c=audio.flatMap(a=>a.captions).find(c=>c.text===text);if(!c)throw new Error(`Missing restore cue: ${text}`);return Math.ceil(c.start*30);};
const query=cue('发出查询，');
export const restoreBeats={extract:cue('先把配置和磁盘，')+24,mapped:cue('恢复到隔离环境。')+24,
  disks:cue('磁盘写完，')+12,restored:cue('磁盘写完，')+20,start:cue('再启动虚拟机。')+24,
  os:cue('系统开始运行，')+24,recover:cue('数据库仍可能恢复中。')+12,
  redo:cue('数据库回放日志，')+24,ready:cue('再接受连接；')+24,
  query,appQuery:query+18,sql:query+36,sqlResult:query+54,response:query+72,checked:cue('本次检查通过，')+18};
export function restoreStateAt(frame:number){
  const f=Math.max(0,Math.min(RESTORE_DURATION-1,Math.floor(frame))),b=restoreBeats;
  return {frame:f,chapter:restoreChapters.findIndex(c=>f<c.end*30),mapped:f>=b.mapped,disks:f>=b.disks,
    restored:f>=b.restored,started:f>=b.start,os:f>=b.os,recovering:f>=b.recover&&f<b.ready,
    redone:f>=b.redo,ready:f>=b.ready,response:f>=b.response,checked:f>=b.checked,
    isolated:true,productionRestored:false,realExperiment:false};
}
