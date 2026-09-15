import assert from 'node:assert/strict';
import {test} from 'node:test';
import {existsSync} from 'node:fs';
import audio from '../src/lifecycle-lesson-audio.json' with {type:'json'};
import {LIFECYCLE_LESSON_DURATION as duration,lifecycleLessonBeats as main,lifecycleReplayBeats as replay,lifecycleLessonEvents as e,lifecycleLessonStateAt as state} from '../src/lifecycle-lesson-timeline.ts';
test('full VM lifecycle preserves independent failures and resets the replay',()=>{
  for(const b of [main,replay]){
    const order=[b.request,b.proxy,b.daemon,b.fork,b.lock,b.check,b.resources,b.launch,b.process,b.done,b.taskQuery,b.taskResult,b.vmQuery,b.vmResult];
    assert.ok(order.every((f,i)=>i===0||f>order[i-1]));
    assert.ok(b.upid>=b.fork+24&&b.upid<b.done);
    assert.ok(b.taskResult>=b.taskQuery+24&&b.vmResult>=b.vmQuery+24&&b.vmResult<duration);
    assert.ok(b.process+24<b.vmQuery);
  }
  const frames=Array.from({length:duration},(_,f)=>state(f));
  for(let f=duration-1;f>=0;f--){
    const s=state(f);assert.deepEqual(s,frames[f]);
    if(s.qemu)assert.ok(s.resources&&s.checked);
    if(s.taskObserved)assert.ok(s.taskDone&&s.upid);
    if(s.vmObserved)assert.ok(s.qemu);
    if(s.failure){assert.equal(s.taskDone,false);assert.equal(s.vmObserved,false);assert.equal(s.attemptCreatedVm,false);}
    assert.equal(s.applicationVerified,false);assert.equal(s.realExperiment,false);
  }
  assert.equal(state(e.duplicateError).failureReported,true);
  assert.equal(state(e.duplicateError).existingVmRunning,true);
  assert.equal(state(e.businessCase).failureReported,false);
  assert.equal(state(e.businessCase).existingVmRunning,null);
  assert.equal(state(e.storageCase).failureReported,false);
  assert.equal(state(e.storageError).failureReported,true);
  assert.equal(state(e.replay).failure,null);assert.equal(state(e.replay).qemu,false);assert.equal(state(e.replay).upid,false);
  assert.equal(audio.length,8);
  for(const [i,c] of audio.entries()){
    assert.ok(existsSync(new URL(`../public/${c.file}`,import.meta.url)));
    assert.ok(c.duration>0&&c.start+c.duration<c.end&&c.end<=420);
    if(i)assert.ok(c.start>=audio[i-1].end);
  }
});
