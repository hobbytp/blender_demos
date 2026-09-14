import assert from 'node:assert/strict';
import {test} from 'node:test';
import {existsSync} from 'node:fs';
import audio from '../src/lifecycle-audio.json' with {type:'json'};
import {LIFECYCLE_DURATION as duration,lifecycleBeats as b,lifecycleStateAt as state} from '../src/lifecycle-timeline.ts';
test('VM start pilot separates asynchronous task, process and observed results',()=>{
  const order=[b.request,b.proxy,b.daemon,b.fork,b.lock,b.check,b.resources,b.launch,b.process,b.done,b.taskQuery,b.taskResult,b.vmQuery,b.vmResult];
  assert.ok(order.every((frame,i)=>i===0||frame>order[i-1]));
  assert.ok(b.upid>b.fork&&b.upid<b.done);
  assert.ok(b.vmResult<duration&&b.process+24<b.vmQuery);
  assert.equal(state(b.upid).taskDone,false);
  assert.equal(state(b.upid).vmObserved,false);
  assert.equal(state(b.done).locked,false);
  assert.equal(state(b.done).taskObserved,false);
  const snapshots=Array.from({length:duration},(_,f)=>state(f));
  for(let f=duration-1;f>=0;f--){
    const s=state(f);assert.deepEqual(s,snapshots[f]);
    if(s.qemu)assert.ok(s.resources&&s.checked);
    if(s.taskObserved)assert.ok(s.taskDone&&s.upid);
    if(s.vmObserved)assert.ok(s.qemu);
    assert.equal(s.applicationVerified,false);assert.equal(s.realExperiment,false);
  }
  assert.equal(state(-1).frame,0);assert.equal(state(duration).frame,duration-1);
  assert.equal(audio.length,4);
  audio.forEach((clip,i)=>{
    assert.ok(existsSync(new URL(`../public/${clip.file}`,import.meta.url)));
    assert.ok(clip.duration>0&&clip.start+clip.duration<clip.end);
    if(i)assert.ok(clip.start>=audio[i-1].end);
    assert.ok(clip.captions.every(c=>c.start>=clip.start&&c.start<clip.start+clip.duration));
  });
});
