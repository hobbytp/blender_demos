import audio from './durability-audio.json' with {type:'json'};
export const DURABILITY_DURATION=900;
export const durabilityChapters=[
  {start:0,end:7.6,name:'WRITE 到缓存并返回'},
  {start:7.6,end:15.3,name:'FLUSH 沿后端向下执行'},
  {start:15.3,end:23,name:'数据持久化后返回刷新结果'},
  {start:23,end:30,name:'区分完成条件与下层前提'},
];
const cue=(text:string)=>{
  const c=audio.flatMap(a=>a.captions).find(c=>c.text===text);
  if(!c)throw new Error(`Missing durability cue: ${text}`);
  return Math.ceil(c.start*30);
};
const write=cue('写入进入虚拟磁盘。'),cache=Math.max(write+60,cue('数据先到宿主页缓存。')+30);
const writeAck=Math.max(cache+60,cue('写完成可以先返回。')+30);
const flush=cue('来宾再发出刷新请求。'),deviceCache=cue('脏数据继续向下写出。')+36;
const stable=Math.max(deviceCache+36,cue('下层完成持久化之后，')+30);
const flushAck=Math.max(stable+90,cue('刷新完成才返回来宾。')+48);
export const durabilityBeats={write,qemuWrite:write+24,backendWrite:cache-24,cache,writeAck,flush,
  qemuFlush:flush+24,backendFlush:flush+48,hostFlush:flush+72,deviceFlush:deviceCache+24,
  deviceCache,stable,hostComplete:stable+24,backendComplete:stable+48,virtioComplete:flushAck-24,flushAck,powerCut:flush-15};
export function durabilityStateAt(frame:number,powerLoss=false,duration=DURABILITY_DURATION,b=durabilityBeats){
  const f=Math.max(0,Math.min(duration-1,Math.floor(frame)));
  const powerOff=powerLoss&&f>=b.powerCut;
  return {frame:f,chapter:durabilityChapters.findIndex(c=>f<c.end*30),powerOff,
    writeSent:f>=b.write,qemuWrite:f>=b.qemuWrite,backendWrite:f>=b.backendWrite,
    cached:f>=b.cache&&!powerOff,writeAck:f>=b.writeAck,
    flushSent:!powerLoss&&f>=b.flush,qemuFlush:!powerLoss&&f>=b.qemuFlush,
    backendFlush:!powerLoss&&f>=b.backendFlush,hostFlush:!powerLoss&&f>=b.hostFlush,
    deviceFlush:!powerLoss&&f>=b.deviceFlush,deviceCached:!powerLoss&&f>=b.deviceCache,
    stable:!powerLoss&&f>=b.stable,hostComplete:!powerLoss&&f>=b.hostComplete,
    backendComplete:!powerLoss&&f>=b.backendComplete,virtioComplete:!powerLoss&&f>=b.virtioComplete,
    flushAck:!powerLoss&&f>=b.flushAck,
    durableGuarantee:!powerLoss&&f>=b.flushAck,
  };
}
