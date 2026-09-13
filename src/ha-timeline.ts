export const HA_DURATION = 900;
export const haChapters = [
  {start:0, end:7.6, name:'失联，VM 却仍在运行'},
  {start:7.6, end:15.4, name:'本机 watchdog 自隔离'},
  {start:15.4, end:23.4, name:'多数侧等待安全锁条件'},
  {start:23.4, end:30, name:'放行恢复，磁盘不搬家'},
];
// Editorial beats aligned to ha-audio.json word boundaries, never protocol timeouts.
export const haBeats = {partition:12, quorum:42, lockLost:91, muxExpired:285, reset:360, fenceWait:465, lockAcquired:564, fenceConfirmed:588, recovery:705};
export function haStateAt(frame:number, normal=false) {
  const f=Math.max(0,Math.min(HA_DURATION-1,frame));
  const reached=(beat:number)=>!normal && f>=beat;
  const partitioned=reached(haBeats.partition), lockLost=reached(haBeats.lockLost);
  const hostReset=reached(haBeats.reset), lockAcquired=reached(haBeats.lockAcquired);
  return {frame:f, chapter:normal?0:haChapters.findIndex(c=>f/30<c.end), partitioned,
    quorumLost:reached(haBeats.quorum), lockLost, muxExpired:reached(haBeats.muxExpired), hostReset,
    oldVmRunning:!hostReset, lockAcquired, fenceConfirmed:reached(haBeats.fenceConfirmed),
    fenceWaiting:reached(haBeats.fenceWait), recovery:reached(haBeats.recovery),
    majorityHasQuorum:true, targetVmRunning:false, storageAvailable:true};
}
