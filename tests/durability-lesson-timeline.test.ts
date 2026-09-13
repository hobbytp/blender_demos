import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {DURABILITY_LESSON_DURATION as duration,durabilityLessonBeats as b,durabilityReplayBeats as r,durabilityLessonEvents as e,durabilityLessonStateAt as state} from '../src/durability-lesson-timeline.ts';
test('durability lesson preserves completion ordering, explicit independent reset, FUA and reverse seeking',()=>{
  for(const t of [b,r]){
    const steps=['write','qemuWrite','backendWrite','cache','writeAck','flush','qemuFlush','backendFlush','hostFlush','deviceCache','deviceFlush','stable','hostComplete','backendComplete','virtioComplete','flushAck'] as const;
    steps.slice(1).forEach((key,i)=>assert.ok(t[key]>t[steps[i]],key));
  }
  assert.ok(r.flushAck<duration);
  const forward=Array.from({length:duration},(_,f)=>state(f));
  for(let f=duration-1;f>=0;f--){
    const s=state(f);
    assert.deepEqual(s,forward[f]);
    assert.ok(!s.flushAck||s.virtioComplete&&s.stable);
    assert.ok(!s.virtioComplete||s.backendComplete);
    assert.ok(!s.backendComplete||s.hostComplete);
    assert.ok(!s.hostComplete||s.stable);
    assert.ok(!s.stable||s.deviceFlush&&s.deviceCached);
    assert.ok(!s.fuaAck||s.fuaStable);
    if(s.powerOff)assert.ok(s.chapter===4&&s.writeAck&&!s.cached&&!s.stable&&!s.flushSent);
    if(s.chapter===5)assert.ok(!s.powerOff&&s.cached&&s.writeAck,'normal path must explicitly reset the power-loss example');
  }
  assert.ok(state(b.stable).stable&&!state(b.stable).flushAck);
  assert.equal(state(e.none).mode,'none');assert.equal(state(e.unsafe).mode,'unsafe');
  assert.ok(state(e.fuaStable).fuaStable&&!state(e.fuaStable).fuaAck);
  const clips=JSON.parse(readFileSync('src/durability-lesson-audio.json','utf8'));
  assert.equal(clips.length,11);
  for(const c of clips){
    assert.ok(existsSync(`public/${c.file}`));
    assert.ok(c.start+c.duration<c.end&&c.end<=420);
    assert.ok(c.captions.every((p:{start:number;text:string})=>p.start>=c.start&&p.start<c.start+c.duration&&p.text.length<=16));
  }
});
