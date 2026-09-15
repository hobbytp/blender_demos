import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {test} from 'node:test';
import audio from '../src/corosync-audio.json' with {type:'json'};
import {COROSYNC_DURATION,corosyncStateAt as state} from '../src/corosync-timeline.ts';

test('link evidence precedes membership installation and quorum recalculation',()=>{
  assert.equal(state(209).linkFailed,false);
  assert.deepEqual([state(210).linkFailed,state(210).tokenTimedOut,state(210).membershipInstalled],[true,false,false]);
  assert.deepEqual([state(420).phase,state(510).phase,state(585).phase,state(660).phase],['GATHER','COMMIT','RECOVERY','OPERATIONAL']);
  assert.equal(state(659).membershipInstalled,false);
  assert.deepEqual([state(660).membershipInstalled,state(689).regularDelivered,state(749).quorumUpdated],[true,false,false]);
  assert.deepEqual([state(690).regularDelivered,state(750).quorumUpdated],[true,true]);
  const forward=Array.from({length:COROSYNC_DURATION},(_,f)=>state(f));
  for(let f=COROSYNC_DURATION-1;f>=0;f--){
    const s=state(f);assert.deepEqual(s,forward[f]);
    if(s.membershipInstalled)assert.ok(s.tokenTimedOut);
    if(s.regularDelivered)assert.ok(s.membershipInstalled);
    if(s.quorumUpdated)assert.ok(s.regularDelivered);
  }
  assert.equal(audio.length,4);
  for(const [i,clip] of audio.entries()){
    assert.ok(clip.duration>0&&clip.start+clip.duration<clip.end&&clip.end<=30);
    assert.ok(existsSync(new URL(`../public/${clip.file}`,import.meta.url)));
    if(i)assert.ok(clip.start>=audio[i-1].end);
  }
});
