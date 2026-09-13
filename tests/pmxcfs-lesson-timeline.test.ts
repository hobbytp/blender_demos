import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {PMXCFS_LESSON_DURATION as duration,pmxcfsLessonBeats as b,pmxcfsLessonEvents as e,pmxcfsLessonChapters as chapters,pmxcfsLessonStateAt as state} from '../src/pmxcfs-lesson-timeline.ts';

test('pmxcfs lesson preserves causal writes, independent examples and mutually exclusive business locks through seeking',()=>{
  const forward=Array.from({length:duration},(_,f)=>state(f));
  for(let f=duration-1;f>=0;f--){
    const s=state(f);
    assert.deepEqual(s,forward[f]);
    assert.ok(s.chapter>=0&&s.chapter<11);
    for(let i=0;i<3;i++){
      assert.ok(!s.memory[i]||s.delivered[i]&&s.sent);
      assert.ok(!s.database[i]||s.memory[i]);
      assert.equal(s.versions[i],s.database[i]?2:1);
    }
    assert.ok(!s.returned||s.localResult&&s.database[0]);
    assert.ok(!s.denied||s.isolated&&s.votes[2]<s.threshold);
    assert.ok(!s.readReturned||s.readRequested&&s.database[0]);
    assert.ok(!s.workingA||s.lockOwner==='A'&&s.refreshedA);
    assert.ok(!s.workingB||s.lockOwner==='B'&&s.refreshedB);
    assert.ok(!(s.workingA&&s.workingB));
    if(s.chapter===8)assert.ok(!s.isolated,'lock example explicitly returns to a healthy scenario');
    if(s.chapter===7&&s.denied)assert.deepEqual(s.versions,[2,2,2]);
    if(s.isReplay)assert.ok(!s.isolated&&!s.denied);
    if(f>0&&s.chapter===3)for(let i=0;i<3;i++)assert.ok(s.queue[i]>=forward[f-1].queue[i]&&s.queue[i]-forward[f-1].queue[i]<=1);
  }
  assert.ok(state(b.returned).returned&&!state(b.returned).database[2]);
  assert.ok(state(b.remoteDatabase).database[2]);
  assert.equal(state(e.releaseA).lockOwner,null);
  assert.equal(state(e.lockB).lockOwner,'B');
  assert.ok(!state(e.replay).returned&&state(duration-1).returned,'summary is a new replay, not a reverse recovery');
  assert.equal(chapters.at(-1)!.end*30,duration);
  const audio=JSON.parse(readFileSync('src/pmxcfs-lesson-audio.json','utf8'));
  assert.equal(audio.length,11);
  for(const [i,c] of audio.entries()){
    assert.ok(existsSync(`public/${c.file}`));
    assert.ok(c.start>=chapters[i].start&&c.start+c.duration<c.end&&c.end<=chapters[i].end);
    assert.ok(c.captions.every((p:{start:number;text:string})=>p.start>=c.start&&p.start<c.start+c.duration&&p.text.length<=16));
  }
});
