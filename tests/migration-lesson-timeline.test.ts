import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {MIGRATION_LESSON_DURATION,migrationCue,migrationLessonBeats as b,migrationLessonTransfers,migrationLessonStateAt as state} from '../src/migration-lesson-timeline.ts';

test('full migration lesson preserves handover safety, distinguishes replay and waits for independent request evidence',()=>{
  const forward=Array.from({length:MIGRATION_LESSON_DURATION},(_,f)=>state(f));
  for(let f=MIGRATION_LESSON_DURATION-1;f>=0;f--){
    const s=state(f);
    assert.deepEqual(s,forward[f]);
    assert.ok(!(s.sourceExecuting&&s.targetExecuting));
    assert.ok(!s.targetExecuting||s.paused&&s.completed&&s.configMoved);
    assert.ok(!s.configMoved||s.completed);
    assert.ok(s.sourceProcessExists||s.targetExecuting);
    if(s.replay){
      assert.equal(s.chapter,9);
      assert.ok(s.sourceExecuting&&!s.targetExecuting&&!s.configMoved);
      if(s.cleaned)assert.ok(!s.targetProcessExists&&s.destination.every(v=>v===0));
    }
  }
  for(const t of migrationLessonTransfers){
    assert.notEqual(state(t.end-1).destination[t.page],t.version);
    assert.equal(state(t.end).destination[t.page],t.version);
  }
  assert.ok(state(b.resume).sourceProcessExists);
  assert.ok(!state(b.cleanup).sourceProcessExists);
  assert.ok(state(305*30).targetExecuting&&!state(305*30).requestConfirmed);
  assert.ok(state(315*30).requestConfirmed);
  assert.ok(!state(380*30).answer&&state(382*30).answer);
  const clips=JSON.parse(readFileSync('src/migration-lesson-audio.json','utf8'));
  for(const c of clips){
    assert.ok(existsSync(`public/${c.file}`));
    assert.ok(c.start+c.duration<c.end&&c.end<=420);
    assert.ok(c.captions.every((p:{start:number})=>p.start>=c.start&&p.start<c.end));
  }
  const question=clips[10];
  assert.ok(migrationCue('不能只看内存。')/30-(question.start+question.duration)>=6);
});
