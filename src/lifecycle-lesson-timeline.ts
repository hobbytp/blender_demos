import audio from './lifecycle-lesson-audio.json' with {type:'json'};
import {lifecycleStateAt} from './lifecycle-timeline.ts';
export const LIFECYCLE_LESSON_DURATION=12600;
export const lifecycleLessonChapters=[{start:0,end:35,name:'四种成功与观察对象'},{start:35,end:85,name:'API 入口与特权边界'},{start:85,end:140,name:'后台任务、UPID 与并行'},{start:140,end:195,name:'两种锁与启动检查'},{start:195,end:255,name:'资源准备与 QEMU 启动'},{start:255,end:310,name:'任务日志与独立状态查询'},{start:310,end:365,name:'重复启动、业务锁与卷失败'},{start:365,end:420,name:'正常路径回放与排查顺序'}];
export const lifecycleLessonCue=(text:string)=>{const hits=audio.flatMap(a=>a.captions).filter(c=>c.text===text);if(hits.length!==1)throw Error(`Expected one lifecycle lesson cue: ${text}`);return Math.ceil(hits[0].start*30);};
const cue=lifecycleLessonCue;
export const lifecycleLessonBeats={request:cue('现在发出启动请求。')+12,proxy:cue('请求进入代理进程。')+18,daemon:cue('转交本机的守护进程。')+18,
  fork:cue('服务派生任务子进程。')+24,upid:cue('一条把任务号返回客户端，')+24,
  lock:cue('先取得这台虚拟机的配置锁，')+18,check:cue('再读取配置并检查状态。')+18,
  resources:cue('再生成虚拟机启动参数。')+24,launch:cue('然后运行虚拟机进程。')+12,process:cue('然后运行虚拟机进程。')+36,
  done:cue('正常返回后，任务写入成功。')+24,
  taskQuery:cue('先按任务号查询任务，'),taskResult:cue('本例结果是成功。')+24,
  vmQuery:cue('再按虚拟机号查询运行状态。'),vmResult:cue('本例返回正在运行，')+24};
export const lifecycleReplayBeats={request:cue('请求进入代理，')-12,proxy:cue('请求进入代理，')+12,daemon:cue('再到本机特权服务。')+18,
  fork:cue('前置条件通过，创建后台任务。')+24,upid:cue('任务号沿响应路径返回，')+24,
  lock:cue('后台独立取得配置锁。')+18,check:cue('读取配置，检查当前状态。')+18,
  resources:cue('准备存储卷和启动参数，')+18,launch:cue('再运行虚拟机进程。')+12,process:cue('再运行虚拟机进程。')+36,
  done:cue('后置处理结束，任务成功。')+24,
  taskQuery:cue('客户端分别查询任务，'),taskResult:cue('客户端分别查询任务，')+24,
  vmQuery:cue('以及虚拟机的运行状态。'),vmResult:cue('以及虚拟机的运行状态。')+24};
export const lifecycleLessonEvents={upid:cue('现在展开任务号的结构。'),locks:cue('现在区分两种锁。'),business:cue('右边是配置里的业务标记，'),busy:cue('如果互斥锁被另一操作占用，'),timeout:cue('超过获取锁的时限就失败。'),
  storage:cue('接着准备启动资源。'),activate:cue('启动编排先激活相关卷，'),command:cue('再生成虚拟机启动参数。'),scope:cue('编排进入系统资源作用域，'),
  evidence:cue('任务日志记录这次操作的输出，'),fields:cue('同一个停止字段，'),
  duplicate:cue('第一种，重复发出启动请求。'),duplicateCheck:cue('检查发现它已经运行，')+18,duplicateError:cue('于是这次任务报告错误。')+18,
  businessCase:cue('第二种，配置有迁移锁标记。'),businessError:cue('因此在资源准备之前被拒绝。')+18,
  storageCase:cue('第三种，启动前激活卷失败。'),storageError:cue('错误沿调用链返回任务，')+18,
  replay:365*30,summary:cue('以后看到界面里的一个结果，')};
export function lifecycleLessonStateAt(frame:number){
  const f=Math.max(0,Math.min(LIFECYCLE_LESSON_DURATION-1,Math.floor(frame))),chapter=lifecycleLessonChapters.findIndex(c=>f<c.end*30),isReplay=f>=lifecycleLessonEvents.replay;
  const normal=lifecycleStateAt(f,LIFECYCLE_LESSON_DURATION,isReplay?lifecycleReplayBeats:lifecycleLessonBeats);
  const failure=chapter===6?(f>=lifecycleLessonEvents.storageCase?'storage':f>=lifecycleLessonEvents.businessCase?'business':'duplicate'):null;
  return {...(failure?lifecycleStateAt(0):normal),frame:f,chapter,isReplay,failure,
    failureReported:failure==='storage'?f>=lifecycleLessonEvents.storageError:failure==='business'?f>=lifecycleLessonEvents.businessError:failure==='duplicate'?f>=lifecycleLessonEvents.duplicateError:false,
    existingVmRunning:failure==='duplicate'?true:null,attemptCreatedVm:failure?false:normal.qemu,
    applicationVerified:false,realExperiment:false};
}
