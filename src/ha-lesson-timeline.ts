import audio from './ha-lesson-audio.json' with {type:'json'};

export const HA_LESSON_DURATION=420*30;
export const haLessonChapters=[
  {start:0,end:30,name:'失联为何不能立即接管'},
  {start:30,end:65,name:'打开节点：角色与两类锁'},
  {start:65,end:100,name:'正常续期与状态协作'},
  {start:100,end:135,name:'分区与 quorum'},
  {start:135,end:170,name:'失锁，旧 VM 仍在运行'},
  {start:170,end:210,name:'两层 watchdog 与自隔离'},
  {start:210,end:250,name:'回看多数侧的并行等待'},
  {start:250,end:285,name:'取得旧锁，确认 fencing'},
  {start:285,end:330,name:'配置归属与本地启动'},
  {start:330,end:365,name:'重启不等于应用已恢复'},
  {start:365,end:395,name:'暂停判断：现在能启动吗'},
  {start:395,end:420,name:'两条因果链与下一集'},
];
// Exact phrase boundaries from the rendered voice, in editorial frames, not protocol time.
export function haCue(text:string) {
  const caption=audio.flatMap(c=>c.captions).find(c=>c.text===text);
  if(!caption) throw new Error(`Missing HA narration cue: ${text}`);
  return Math.ceil(caption.start*30);
}
export const haLessonBeats={
  previewPartition:haCue('现在，集群通信断开。'),
  partition:haCue('C的所有集群通信路径断开，'),
  quorum:haCue('C只有一票，不满足条件。'),
  lockLost:haCue('LRM不能成功更新代理锁，'),
  muxExpired:haCue('于是停止设备喂狗。'),
  reset:haCue('设备随后超时，触发主机复位。')+25,
  fenceWait:haCue('服务进入等待隔离的状态。'),
  acquired:haCue('B取得了旧节点的代理锁。'),
  confirmed:haCue('隔离判定在这里确认，'),
  recovery:haCue('服务随后进入恢复阶段。'),
  selected:haCue('CRM选择了B。'),
  configMoved:haCue('配置的节点归属转到B，'),
  desired:haCue('CRM发布新的管理状态，'),
  lrmRead:haCue('B的LRM读取本机任务。'),
  protected:haCue('它建立自己的锁与保护，'),
  agent:haCue('再通过本地资源代理，'),
  qemuCall:haCue('调用QEMU管理接口。'),
  running:haCue('新的虚拟机在B上启动，')+20,
  result:haCue('执行结果写回配置层，'),
  crmRead:haCue('CRM读取这个结果。'),
  probe:haCue('独立业务探测成功后，'),
  ready:haCue('才显示应用就绪。'),
};
export function haLessonStateAt(frame:number,normal=false) {
  const f=Math.max(0,Math.min(HA_LESSON_DURATION-1,Math.floor(frame)));
  const chapter=normal?2:haLessonChapters.findIndex(c=>f<c.end*30);
  const hit=(key:keyof typeof haLessonBeats)=>!normal&&f>=haLessonBeats[key];
  const preview=chapter===0&&hit('previewPartition');
  const hostReset=hit('reset'), targetVmRunning=hit('running');
  return {frame:f,chapter,preview,partitioned:preview||hit('partition'),quorumLost:preview||hit('quorum'),
    lockLost:hit('lockLost'),muxExpired:hit('muxExpired'),hostReset,oldVmRunning:!hostReset,
    fenceWaiting:hit('fenceWait'),lockAcquired:hit('acquired'),fenceConfirmed:hit('confirmed'),recovery:hit('recovery'),
    selected:hit('selected'),configMoved:hit('configMoved'),desired:hit('desired'),lrmRead:hit('lrmRead'),
    targetProtected:hit('protected'),agent:hit('agent'),qemuCall:hit('qemuCall'),targetVmRunning,
    result:hit('result'),crmRead:hit('crmRead'),probe:hit('probe'),appReady:hit('ready'),
    majorityHasQuorum:true,storageAvailable:true};
}
