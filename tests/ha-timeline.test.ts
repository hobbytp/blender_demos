import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {HA_DURATION,haBeats,haStateAt} from '../src/ha-timeline.ts';

test('HA recovery never outruns fencing; reverse seeks reproduce the same causal state',()=>{
  const forward=Array.from({length:HA_DURATION},(_,f)=>haStateAt(f));
  for(let f=HA_DURATION-1;f>=0;f--){
    const s=haStateAt(f);
    assert.deepEqual(s,forward[f]);
    assert.ok(!s.hostReset||s.muxExpired&&s.lockLost);
    assert.ok(!s.lockAcquired||s.hostReset&&s.fenceWaiting);
    assert.ok(!s.fenceConfirmed||s.lockAcquired);
    assert.ok(!s.recovery||s.fenceConfirmed&&s.majorityHasQuorum);
    assert.equal(s.targetVmRunning,false,'pilot stops at recovery, not target startup');
    assert.equal(s.storageAvailable,true);
    const n=haStateAt(f,true);
    assert.ok(n.oldVmRunning&&!n.recovery&&!n.hostReset&&!n.lockLost&&!n.partitioned);
  }
  assert.ok(haStateAt(haBeats.lockLost).oldVmRunning,'losing quorum/lock is not immediate VM termination');
  assert.ok(!haStateAt(haBeats.reset).lockAcquired,'majority still waits after director-view reset');
  assert.ok(haStateAt(HA_DURATION-1).recovery);
  for(const clip of JSON.parse(readFileSync('src/ha-audio.json','utf8'))){
    assert.ok(existsSync(`public/${clip.file}`));
    assert.ok(clip.start+clip.duration<=clip.end&&clip.end<=30);
    assert.ok(clip.captions.every((c:{start:number})=>c.start>=clip.start&&c.start<clip.end));
  }
});
