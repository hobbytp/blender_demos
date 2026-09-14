import audio from './lifecycle-audio.json' with {type:'json'};
export const LIFECYCLE_DURATION=900;
export const lifecycleChapters=[{start:0,end:7.5,name:'请求进入特权服务'},{start:7.5,end:15,name:'任务号与后台执行'},{start:15,end:22.5,name:'配置锁与启动编排'},{start:22.5,end:30,name:'两种状态，分别查询'}];
const cue=(text:string)=>{const hits=audio.flatMap(a=>a.captions).filter(c=>c.text===text);if(hits.length!==1)throw new Error(`Expected one lifecycle cue: ${text}`);return Math.ceil(hits[0].start*30);};
export const lifecycleBeats={request:cue('点击启动，')+12,proxy:cue('请求先到代理入口，')+15,daemon:cue('再交给本机的特权服务。')+24,
  fork:cue('服务创建后台任务，')+24,upid:cue('返回任务号。')+24,
  lock:cue('后台取得配置锁，')+24,check:cue('检查状态，准备资源，')+12,resources:cue('检查状态，准备资源，')+40,
  launch:cue('再启动虚拟机进程。')+18,process:cue('再启动虚拟机进程。')+42,
  done:cue('任务结果和运行状态，')+6,taskQuery:cue('任务结果和运行状态，')+18,taskResult:cue('任务结果和运行状态，')+42,
  vmQuery:cue('需要分别查询；')+6,vmResult:cue('需要分别查询；')+30};
export function lifecycleStateAt(frame:number){
  const f=Math.max(0,Math.min(LIFECYCLE_DURATION-1,Math.floor(frame))),b=lifecycleBeats;
  return {frame:f,chapter:lifecycleChapters.findIndex(c=>f<c.end*30),proxy:f>=b.proxy,daemon:f>=b.daemon,
    worker:f>=b.fork,upid:f>=b.upid,locked:f>=b.lock&&f<b.done,checked:f>=b.check,resources:f>=b.resources,
    qemu:f>=b.process,taskDone:f>=b.done,taskObserved:f>=b.taskResult,vmObserved:f>=b.vmResult,
    applicationVerified:false,realExperiment:false};
}
