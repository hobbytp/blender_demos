import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import audio from '../src/restore-lesson-audio.json' with {type:'json'};
import {RESTORE_LESSON_DURATION,restoreLessonBeats,restoreReplayBeats,restoreLessonEvents as e,restoreLessonStateAt as stateAt,recoveryExample as example} from '../src/restore-lesson-timeline.ts';
test('full recovery lesson preserves causal gates, objective arithmetic and independent evidence',()=>{
  for(const b of [restoreLessonBeats,restoreReplayBeats]){
    const order=[b.extract,b.mapped,b.disks,b.restored,b.start,b.os,b.recover,b.redo,b.ready,b.query,b.appQuery,b.sql,b.sqlResult,b.response,b.checked];
    assert.ok(order.every((v,i)=>i===0||v>order[i-1]));
    for(const [start,end] of [[b.query,b.appQuery],[b.appQuery,b.sql],[b.sql,b.sqlResult],[b.sqlResult,b.response]])assert.ok(end-start>=18,'query must arrive before next hop starts');
    assert.ok(!stateAt(b.restored).started);assert.ok(!stateAt(b.os).ready);assert.ok(!stateAt(b.ready).checked);assert.ok(!stateAt(b.response).checked);assert.ok(stateAt(b.checked).checked);
  }
  assert.ok(e.isolation<e.resources&&e.resources<restoreLessonBeats.start-24);
  assert.ok(stateAt(e.replay-1).checked&&!stateAt(e.replay).checked,'replay must reset the successful instance');
  assert.equal(example.outageMinute-example.pointMinute,30);assert.equal(example.outageMinute-example.archiveFinishedMinute,20);assert.ok(30>example.rpoMinutes);
  assert.equal(example.stagesMinutes.reduce((a,b)=>a+b,0),45);assert.ok(45>example.rtoMinutes);
  const forward=Array.from({length:RESTORE_LESSON_DURATION},(_,f)=>stateAt(f));
  for(let f=RESTORE_LESSON_DURATION-1;f>=0;f--){const s=stateAt(f);assert.deepEqual(s,forward[f]);if(s.started)assert.ok(s.restored&&s.isolationChecked&&s.resourcesChecked);if(s.checked)assert.ok(s.ready&&s.response);assert.ok(!s.allBusinessVerified&&!s.productionRestored&&!s.realExperiment);assert.notEqual(s.selectedPoint,example.failedPointMinute);}
  assert.equal(audio.length,8);
  for(const [i,c] of audio.entries()){assert.ok(existsSync(new URL(`../public/${c.file}`,import.meta.url)));assert.ok(c.start+c.duration<c.end);assert.ok(i===0||c.start>=audio[i-1].end);assert.ok(c.captions.every(p=>p.start>=c.start&&p.start<c.start+c.duration));}
});
