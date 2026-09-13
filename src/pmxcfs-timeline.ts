import audio from './pmxcfs-audio.json' with {type:'json'};
export const PMXCFS_DURATION=900;
export const pmxcfsChapters=[
  {start:0,end:7.6,name:'文件写入与 quorum 检查'},
  {start:7.6,end:15.3,name:'交付操作，更新本地副本'},
  {start:15.3,end:23,name:'本机处理后返回结果'},
  {start:23,end:30,name:'无 quorum 的写入对照'},
];
const cue=(text:string)=>{
  const c=audio.flatMap(a=>a.captions).find(c=>c.text===text);
  if(!c)throw new Error(`Missing pmxcfs cue: ${text}`);
  return Math.ceil(c.start*30);
};
export const pmxcfsBeats={
  request:cue('写入先到本机文件系统。'),gate:cue('通过仲裁检查，'),
  send:cue('再把操作送入集群通信。'),deliver:cue('各节点按一致顺序接收操作，'),
  memory:cue('再更新自己的内存状态，'),database:cue('和本地数据库。'),
  localResult:cue('本机处理自己的消息后，')+20,returned:cue('写调用返回结果。')+24,
  contrast:cue('无仲裁时，写入被拒绝。'),read:cue('旧配置仍可读，'),
};
export type PmxcfsTiming=typeof pmxcfsBeats & {remoteDatabase?:number};
export function pmxcfsStateAt(frame:number,blocked=false,duration=PMXCFS_DURATION,b:PmxcfsTiming=pmxcfsBeats){
  const f=Math.max(0,Math.min(duration-1,Math.floor(frame)));
  const isolated=blocked||f>=b.contrast;
  const delivered=[0,12,24].map(delay=>!blocked&&f>=b.deliver+30+delay);
  const memory=[b.memory+24,b.memory+45,b.memory+75].map((at,i)=>delivered[i]&&f>=at);
  // C finishes later in this teaching schedule; A does not collect per-node disk ACKs.
  const database=[b.database+30,b.database+55,b.remoteDatabase??b.returned+45].map((at,i)=>memory[i]&&f>=at);
  const secondRequest=blocked?b.request:b.contrast+12;
  return {frame:f,chapter:pmxcfsChapters.findIndex(c=>f<c.end*30),isolated,
    request:!blocked&&f>=b.request,accepted:!blocked&&f>=b.gate+20,
    sent:!blocked&&f>=b.send+35,delivered,memory,database,
    localResult:database[0]&&f>=b.localResult,returned:database[0]&&f>=b.returned,
    secondRequest,denied:isolated&&f>=secondRequest+55,
    readBack:isolated&&f>=(blocked?secondRequest+110:b.read+30),
    versions:database.map(done=>done?2:1),votes:isolated?[2,2,1]:[3,3,3],
    expectedVotes:3,threshold:2,
  };
}
