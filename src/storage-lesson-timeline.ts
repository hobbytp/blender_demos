import audio from './storage-lesson-audio.json' with {type:'json'};
import {storageStateAt} from './storage-timeline.ts';

export const STORAGE_LESSON_DURATION=12600;
export const storageLessonChapters=[
  {start:0,end:35,name:'四个名字：ID、类型、卷与格式'},
  {start:35,end:85,name:'卷引用如何选择插件'},
  {start:85,end:140,name:'NFS 挂载与卷级检查'},
  {start:140,end:195,name:'文件路径与一次真实读取'},
  {start:195,end:250,name:'文件、块设备与 RBD 路径'},
  {start:250,end:310,name:'配置共享与数据共享'},
  {start:310,end:365,name:'三个独立失败阶段'},
  {start:365,end:420,name:'正常回放与能力判断'},
];
export const storageLessonCue=(text:string)=>{const hits=audio.flatMap(a=>a.captions).filter(c=>c.text===text);if(hits.length!==1)throw Error(`Expected one storage lesson cue: ${text}`);return Math.ceil(hits[0].start*30);};
const cue=storageLessonCue;
export const storageLessonBeats={
  lookup:cue('再查找对应存储配置。')+18,
  plugin:cue('随后按类型找到插件。')+18,
  mount:cue('插件再读取本机挂载状态。')+12,
  mountRequest:cue('因此请求宿主建立挂载。')+12,
  mounted:cue('正常返回后，挂载可用。')+18,
  checked:cue('随后检查镜像文件存在。')+18,
  path:cue('现在解析这块卷的本机路径。')+18,
  delivered:cue('路径和格式交给虚拟机进程。')+18,
  opened:cue('进程随后打开镜像文件。')+18,
  read:cue('下面单独发出一次读取。')+12,
  kernel:cue('请求先进入宿主文件系统。')+18,
  server:cue('所以继续经过存储网络。')+18,
  returned:cue('数据再返回宿主，')+18,
  completed:cue('最后回到虚拟机进程。')+18,
};
export const storageReplayBeats={
  lookup:cue('卷引用定位配置，')+12,
  plugin:cue('类型选择对应插件。')+12,
  mount:cue('确认挂载，检查已有文件。'),
  mountRequest:cue('确认挂载，检查已有文件。')+24,
  mounted:cue('确认挂载，检查已有文件。')+48,
  checked:cue('确认挂载，检查已有文件。')+72,
  path:cue('解析路径，交给虚拟机打开。')+12,
  delivered:cue('解析路径，交给虚拟机打开。')+36,
  opened:cue('解析路径，交给虚拟机打开。')+60,
  read:cue('再发起独立的数据读取，')+12,
  kernel:cue('再发起独立的数据读取，')+36,
  server:cue('请求到达后端，数据返回。')+12,
  returned:cue('请求到达后端，数据返回。')+36,
  completed:cue('请求到达后端，数据返回。')+60,
};
export const storageLessonEvents={
  identityId:cue('存储编号，定位一份配置。'),identityType:cue('存储类型，决定使用哪种插件。'),identityVolume:cue('卷名，定位后端中的一个对象。'),identityFormat:cue('镜像格式，描述数据的组织方式。'),
  nodeChecks:cue('禁用标记可以阻止激活，'),pluginProcess:cue('这不是发消息给新服务，'),existingMount:cue('如果原本已经挂载，'),dedupe:cue('同一个存储的多个卷，'),
  compareFile:cue('先保留文件型存储。'),compareLvm:cue('再看本地精简逻辑卷。'),compareRbd:cue('再看分布式块存储。'),compareKrbd:cue('启用内核映射则是另一分支，'),
  localCompare:cue('先看本地目录的对照。'),sharedCompare:cue('现在切换到真正的共享后端。'),nodeAMounted:cue('并且分别完成本机挂载。')+12,nodeARead:cue('甲的访问到达这个后端，'),nodeBRead:cue('乙的访问也到达同一个后端。'),
  disabledCase:cue('第一例，存储配置被禁用。'),disabledError:cue('激活入口检查后拒绝，')+18,mountCase:cue('第二例，在线检查已经通过，'),mountError:cue('但本机挂载执行失败。')+18,missingCase:cue('第三例，挂载已经成功，'),missingError:cue('卷级检查抛出错误，')+18,
  replay:365*30,capability:cue('要判断快照和克隆能力，'),
};

export function storageLessonStateAt(frame:number){
  const f=Math.max(0,Math.min(STORAGE_LESSON_DURATION-1,Math.floor(frame))),chapter=storageLessonChapters.findIndex(c=>f<c.end*30),isReplay=f>=storageLessonEvents.replay;
  const normal=storageStateAt(f,STORAGE_LESSON_DURATION,isReplay?storageReplayBeats:storageLessonBeats);
  const failure=chapter===6?(f>=storageLessonEvents.missingCase?'missing':f>=storageLessonEvents.mountCase?'mount':'disabled'):null;
  const failed=failure==='missing'?{...storageStateAt(0),configured:true,plugin:true,mounted:true}:failure==='mount'?{...storageStateAt(0),configured:true,plugin:true}:{...storageStateAt(0),configured:true};
  return {...(failure?failed:normal),frame:f,chapter,isReplay,failure,
    failureReported:failure==='missing'?f>=storageLessonEvents.missingError:failure==='mount'?f>=storageLessonEvents.mountError:failure==='disabled'?f>=storageLessonEvents.disabledError:false,
    configurationCopiesData:false,pluginCarriesDiskIO:false,realExperiment:false};
}
