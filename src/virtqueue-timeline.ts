import audio from './virtqueue-audio.json' with {type:'json'};
export const VIRTQUEUE_DURATION=900;
export const virtqueueChapters=[{start:0,end:7.6,name:'描述符与可用环发布'},{start:7.6,end:15.3,name:'按地址访问并提交数据'},{start:15.3,end:23,name:'已用环与缓冲回收'},{start:23,end:30,name:'通知与完成的边界'}];
const cue=(text:string)=>{const c=audio.flatMap(a=>a.captions).find(c=>c.text===text);if(!c)throw new Error(`Missing virtqueue cue: ${text}`);return Math.ceil(c.start*30);};
const desc=cue('驱动填写描述符。')+30,available=cue('发布可用环索引。')+30;
const kick=Math.max(available+24,cue('再通知后端。')+24),consume=cue('后端按描述符访问数据。')+24;
const tap=cue('把数据提交到虚拟网口。')+45,used=cue('后端发布已用环。')+30;
const irq=Math.max(used+30,cue('再发出完成通知。')+30),read=Math.max(irq+24,cue('驱动读取结果，')+24);
export const virtqueueBeats={desc,availableEntry:available-15,available,kick,consume,data:consume+30,tap,usedEntry:used-15,used,irq,read,reclaim:Math.max(read+24,cue('回收缓冲区。')+24)};
export function virtqueueStateAt(frame:number,poll=false){
  const f=Math.max(0,Math.min(VIRTQUEUE_DURATION-1,Math.floor(frame))),b=virtqueueBeats;
  return {frame:f,chapter:virtqueueChapters.findIndex(c=>f<c.end*30),poll,
    descriptor:f>=b.desc,availableEntry:f>=b.availableEntry,available:f>=b.available,kicked:f>=b.kick,
    consumed:f>=b.consume,dataAccessed:f>=b.data,tapAccepted:f>=b.tap,usedEntry:f>=b.usedEntry,used:f>=b.used,
    interrupted:!poll&&f>=b.irq,readUsed:f>=b.read,reclaimed:f>=b.reclaim,
    remoteReceived:'unknown' as const};
}
