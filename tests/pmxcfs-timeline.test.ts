import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {PMXCFS_DURATION,pmxcfsBeats as b,pmxcfsStateAt as state} from '../src/pmxcfs-timeline.ts';

test('pmxcfs applies only delivered operations, returns local results and refuses writes without quorum',()=>{
  const forward=Array.from({length:PMXCFS_DURATION},(_,f)=>state(f));
  for(let f=PMXCFS_DURATION-1;f>=0;f--){
    const s=state(f),blocked=state(f,true);
    assert.deepEqual(s,forward[f]);
    for(let i=0;i<3;i++){
      assert.ok(!s.memory[i]||s.delivered[i]&&s.sent);
      assert.ok(!s.database[i]||s.memory[i]);
      assert.equal(s.versions[i],s.database[i]?2:1);
      assert.equal(blocked.versions[i],1);
    }
    assert.ok(!s.returned||s.localResult&&s.database[0]);
    assert.ok(!blocked.sent&&!blocked.accepted&&!blocked.returned);
    assert.equal(s.expectedVotes,3);assert.equal(s.threshold,2);
    if(s.isolated)assert.deepEqual(s.votes,[2,2,1]);
  }
  assert.ok(state(b.returned).returned&&!state(b.returned).database[2],'local return is not all-node database ACK collection');
  assert.ok(state(899).denied&&state(899).readBack);
  assert.deepEqual(state(899).versions,[2,2,2],'rejected new write must not change the previous value');
  const clips=JSON.parse(readFileSync('src/pmxcfs-audio.json','utf8'));
  for(const c of clips){
    assert.ok(existsSync(`public/${c.file}`));
    assert.ok(c.start+c.duration<c.end&&c.end<=30);
    assert.ok(c.captions.every((p:{start:number})=>p.start>=c.start&&p.start<c.end));
  }
});
