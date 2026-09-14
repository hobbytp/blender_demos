import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import audio from '../src/restore-audio.json' with {type:'json'};
import {RESTORE_DURATION,restoreBeats as b,restoreStateAt} from '../src/restore-timeline.ts';
test('restore evidence stays layered through forward playback and reverse seeks',()=>{
  const order=[b.extract,b.mapped,b.disks,b.restored,b.start,b.os,b.recover,b.redo,b.ready,b.query,b.appQuery,b.sql,b.sqlResult,b.response,b.checked];
  assert.ok(order.every((v,i)=>i===0||v>order[i-1]));
  const forward=Array.from({length:RESTORE_DURATION},(_,i)=>restoreStateAt(i));
  for(let f=RESTORE_DURATION-1;f>=0;f--){
    const s=restoreStateAt(f);assert.deepEqual(s,forward[f]);
    if(s.started)assert.ok(s.restored&&s.disks&&s.mapped);
    if(s.ready)assert.ok(s.os&&s.redone&&!s.recovering);
    if(s.checked)assert.ok(s.ready&&s.response);
    assert.ok(s.isolated&&!s.productionRestored&&!s.realExperiment);
  }
  assert.ok(!restoreStateAt(b.restored).started);
  assert.ok(!restoreStateAt(b.os).ready);
  assert.ok(!restoreStateAt(b.ready).checked);
  assert.ok(!restoreStateAt(b.response).checked);
  assert.ok(restoreStateAt(899).checked);
  assert.deepEqual(restoreStateAt(-1),restoreStateAt(0));
  assert.deepEqual(restoreStateAt(900),restoreStateAt(899));
  for(const c of audio){assert.ok(existsSync(new URL(`../public/${c.file}`,import.meta.url)));assert.ok(c.start+c.duration<c.end);assert.ok(c.captions.every(p=>p.start>=c.start&&p.start<c.start+c.duration));}
});
