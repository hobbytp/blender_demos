import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {DURABILITY_DURATION as duration,durabilityBeats as b,durabilityStateAt as state} from '../src/durability-timeline.ts';

test('durability distinguishes WRITE completion from ordered flush completion and power-loss uncertainty',()=>{
  assert.ok(b.write<b.qemuWrite&&b.qemuWrite<b.backendWrite&&b.backendWrite<b.cache&&b.cache<b.writeAck);
  assert.ok(b.writeAck<b.powerCut&&b.powerCut<b.flush);
  assert.ok(b.hostFlush<b.deviceCache&&b.deviceCache<b.deviceFlush&&b.deviceFlush<b.stable);
  assert.ok(b.stable+48<b.flushAck-24&&b.flushAck<23*30);
  const forward=Array.from({length:duration},(_,f)=>state(f));
  for(let f=duration-1;f>=0;f--){
    const s=state(f),cut=state(f,true);
    assert.deepEqual(s,forward[f]);
    assert.ok(!s.writeAck||s.cached);
    assert.ok(!s.qemuFlush||s.flushSent);
    assert.ok(!s.backendFlush||s.qemuFlush);
    assert.ok(!s.hostFlush||s.backendFlush);
    assert.ok(!s.deviceFlush||s.deviceCached&&s.hostFlush);
    assert.ok(!s.stable||s.deviceFlush&&s.deviceCached);
    assert.ok(!s.hostComplete||s.stable);
    assert.ok(!s.backendComplete||s.hostComplete);
    assert.ok(!s.virtioComplete||s.backendComplete);
    assert.ok(!s.flushAck||s.virtioComplete);
    assert.equal(s.durableGuarantee,s.flushAck);
    assert.ok(!cut.flushSent&&!cut.stable&&!cut.durableGuarantee);
    if(cut.powerOff)assert.ok(cut.writeAck&&!cut.cached,'historical WRITE OK does not preserve volatile state');
  }
  assert.ok(state(b.writeAck).writeAck&&!state(b.writeAck).stable&&!state(b.writeAck).durableGuarantee);
  assert.ok(state(b.stable).stable&&!state(b.stable).flushAck,'completion must still travel back to guest');
  const clips=JSON.parse(readFileSync('src/durability-audio.json','utf8'));
  assert.equal(clips.length,4);
  for(const c of clips){
    assert.ok(existsSync(`public/${c.file}`));
    assert.ok(c.start+c.duration<c.end&&c.end<=30);
    assert.ok(c.captions.every((p:{start:number;text:string})=>p.start>=c.start&&p.start<c.start+c.duration&&p.text.length<=16));
  }
});
