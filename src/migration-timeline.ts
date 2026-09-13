import audio from './migration-audio.json' with {type:'json'};

export const MIGRATION_DURATION=900;
export const migrationChapters=[
  {start:0,end:7.6,name:'运行中预拷贝，目标不执行'},
  {start:7.6,end:15.3,name:'已传页再变脏，再次传送'},
  {start:15.3,end:23,name:'暂停源端，补齐最终状态'},
  {start:23,end:30,name:'配置交接后恢复目标'},
];
const cue=(text:string)=>{
  const c=audio.flatMap(a=>a.captions).find(c=>c.text===text);
  if(!c)throw new Error(`Missing migration cue: ${text}`);
  return Math.ceil(c.start*30);
};
export const migrationBeats={
  prepare:25,copy:cue('内存先传到目标。'),
  dirty:cue('已传的页又被修改，'),retry:cue('就标记为脏，再次传送。')+10,
  redirty:cue('源端继续写，还会再变。'),pause:cue('最后，先暂停源端。')+10,
  finalRam:cue('补齐剩余内存，'),device:cue('再传处理器和设备状态。'),
  config:cue('配置归属转到目标，'),resume:cue('再恢复执行。')+6,cancel:390,
};
// Eight tiles stand for RAM page groups; v1/v2/v3 are teaching labels, not wire fields.
export const migrationTransfers=[
  ...Array.from({length:8},(_,page)=>({page,version:1,start:migrationBeats.copy+page*12,end:migrationBeats.copy+page*12+18})),
  {page:2,version:2,start:migrationBeats.retry,end:migrationBeats.retry+24},
  {page:5,version:2,start:migrationBeats.retry+26,end:migrationBeats.retry+50},
  {page:2,version:3,start:migrationBeats.finalRam,end:migrationBeats.finalRam+24},
];
export function migrationStateAt(frame:number,failed=false){
  const f=Math.max(0,Math.min(MIGRATION_DURATION-1,Math.floor(frame)));
  const cancelled=failed&&f>=migrationBeats.cancel,cleaned=cancelled&&f>=migrationBeats.cancel+30;
  const reached=(at:number)=>!cancelled&&f>=at;
  const source=Array.from({length:8},(_,i)=>i===2&&f>=migrationBeats.redirty?3:(i===2&&f>=migrationBeats.dirty||i===5&&f>=migrationBeats.dirty+15)?2:1);
  const destination=Array.from({length:8},(_,i)=>cleaned?0:migrationTransfers.filter(t=>t.page===i&&t.end<=f&&(!cancelled||t.end<migrationBeats.cancel)).at(-1)?.version??0);
  const paused=reached(migrationBeats.pause),deviceReady=reached(migrationBeats.device+42);
  const completed=deviceReady&&destination.every((v,i)=>v===source[i]);
  const configMoved=reached(migrationBeats.config+30),targetExecuting=reached(migrationBeats.resume);
  return {frame:f,chapter:migrationChapters.findIndex(c=>f<c.end*30),cancelled,cleaned,source,destination,
    pending:source.map((v,i)=>v!==destination[i]),paused,deviceReady,completed,configMoved,targetExecuting,
    sourceExecuting:!paused,sourceProcessExists:!reached(migrationBeats.resume+45),
    targetProcessExists:f>=migrationBeats.prepare&&!cleaned,
    configOwner:configMoved?'B':'C',storageId:'nfs/vm-100-disk-0',
    inFlight:cancelled?[]:migrationTransfers.filter(t=>f>=t.start&&f<t.end),
  };
}
