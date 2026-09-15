import assert from 'node:assert/strict';
import {test} from 'node:test';
import {existsSync} from 'node:fs';
import audio from '../src/storage-lesson-audio.json' with {type:'json'};
import {STORAGE_LESSON_DURATION as duration,storageLessonBeats as main,storageReplayBeats as replay,storageLessonEvents as e,storageLessonStateAt as state} from '../src/storage-lesson-timeline.ts';

test('full storage lesson preserves causal flow and independent failures',()=>{
  for(const b of [main,replay]){
    const order=[b.lookup,b.plugin,b.mount,b.mountRequest,b.mounted,b.checked,b.path,b.delivered,b.opened,b.read,b.kernel,b.server,b.returned,b.completed];
    assert.ok(order.every((f,i)=>i===0||f>order[i-1]));
    assert.ok(b.mounted>=b.mountRequest+24&&b.checked>=b.mounted+24&&b.opened>=b.delivered+24&&b.completed>=b.returned+24);
  }
  const frames=Array.from({length:duration},(_,f)=>state(f));
  for(let f=duration-1;f>=0;f--){
    const s=state(f);assert.deepEqual(s,frames[f]);
    if(s.opened)assert.ok(s.path&&s.checked&&s.mounted&&s.plugin&&s.configured);
    if(s.readCompleted)assert.ok(s.readRequested&&s.opened);
    if(s.failure)assert.equal(s.opened,false);
    assert.equal(s.configurationCopiesData,false);assert.equal(s.pluginCarriesDiskIO,false);assert.equal(s.realExperiment,false);
  }
  assert.equal(state(e.disabledError).failureReported,true);assert.equal(state(e.disabledError).plugin,false);
  assert.equal(state(e.mountCase).failureReported,false);assert.equal(state(e.mountError).mounted,false);
  assert.equal(state(e.missingCase).mounted,true);assert.equal(state(e.missingCase).checked,false);assert.equal(state(e.missingError).failureReported,true);
  assert.equal(state(e.replay).failure,null);assert.equal(state(e.replay).configured,false);assert.equal(state(e.replay).opened,false);
  assert.equal(audio.length,8);
  for(const [i,c] of audio.entries()){
    assert.ok(existsSync(new URL(`../public/${c.file}`,import.meta.url)));
    assert.ok(c.duration>0&&c.start+c.duration<c.end&&c.end<=420);
    if(i)assert.ok(c.start>=audio[i-1].end);
  }
});
