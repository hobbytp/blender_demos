import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {MIGRATION_DURATION,migrationBeats as b,migrationTransfers,migrationStateAt as state} from '../src/migration-timeline.ts';

test('migration preserves a single executor and hands over only complete state; early cancellation keeps the source',()=>{
  const forward=Array.from({length:MIGRATION_DURATION},(_,f)=>state(f));
  for(let f=MIGRATION_DURATION-1;f>=0;f--){
    const s=state(f),failure=state(f,true);
    assert.deepEqual(s,forward[f]);
    assert.ok(!(s.sourceExecuting&&s.targetExecuting));
    assert.ok(!s.targetExecuting||s.completed&&s.configMoved&&s.paused);
    assert.ok(!s.configMoved||s.completed);
    assert.ok(s.sourceProcessExists||s.targetExecuting);
    assert.equal(s.storageId,'nfs/vm-100-disk-0');
    assert.ok(failure.sourceExecuting&&!failure.targetExecuting&&!failure.configMoved);
    if(failure.cleaned)assert.ok(!failure.targetProcessExists&&failure.destination.every(v=>v===0));
  }
  for(const t of migrationTransfers){
    assert.notEqual(state(t.end-1).destination[t.page],t.version,'arrival must precede receiver state change');
    assert.equal(state(t.end).destination[t.page],t.version);
  }
  assert.equal(state(b.redirty).source[2],3);
  assert.equal(state(b.redirty).destination[2],2);
  assert.ok(state(b.pause).pending[2]);
  assert.ok(state(b.resume).sourceProcessExists,'source process cleanup follows target resume');
  for(const clip of JSON.parse(readFileSync('src/migration-audio.json','utf8'))){
    assert.ok(existsSync(`public/${clip.file}`));
    assert.ok(clip.start+clip.duration<=clip.end&&clip.end<=30);
    assert.ok(clip.captions.every((c:{start:number})=>c.start>=clip.start&&c.start<clip.end));
  }
});
