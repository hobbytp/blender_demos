import audio from './storage-audio.json' with {type:'json'};
export const STORAGE_DURATION=900;
export const storageChapters=[{start:0,end:7.5,name:'卷标识与存储配置'},{start:7.5,end:15,name:'插件、挂载与卷检查'},{start:15,end:22.5,name:'路径交给 QEMU'},{start:22.5,end:30,name:'实际数据走哪条路'}];
const cue=(text:string)=>{const hits=audio.flatMap(a=>a.captions).filter(c=>c.text===text);if(hits.length!==1)throw Error(`Expected one storage cue: ${text}`);return Math.ceil(hits[0].start*30);};
const lookup=cue('先定位存储配置，')+18,plugin=Math.max(lookup+24,cue('再按类型选择插件。')+18);
const mount=cue('插件确认挂载，')+12,mountRequest=mount+24,mounted=mountRequest+24;
const checked=Math.max(mounted+24,cue('并检查镜像文件存在。')+24),path=Math.max(checked+18,cue('卷标识解析成本机路径，')+18);
const delivered=Math.max(path+24,cue('交给虚拟机进程打开。')+18),opened=delivered+24;
const read=Math.max(opened+24,cue('数据经过宿主文件系统，')+12),kernel=read+24,server=Math.max(kernel+24,cue('再到存储服务器。')+12),returned=server+24,completed=returned+24;
export const storageBeats={lookup,plugin,mount,mountRequest,mounted,checked,path,delivered,opened,read,kernel,server,returned,completed};
export function storageStateAt(frame:number,duration=STORAGE_DURATION,b=storageBeats){const f=Math.max(0,Math.min(duration-1,Math.floor(frame)));return {frame:f,chapter:storageChapters.findIndex(c=>f<c.end*30),configured:f>=b.lookup,plugin:f>=b.plugin,mounted:f>=b.mounted,checked:f>=b.checked,path:f>=b.path,opened:f>=b.opened,readRequested:f>=b.read,readCompleted:f>=b.completed,configurationCopiesData:false,pluginCarriesDiskIO:false,realExperiment:false};}
