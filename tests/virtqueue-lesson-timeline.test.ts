import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {VIRTQUEUE_LESSON_DURATION as duration,virtqueueLessonBeats as b,virtqueueReplayBeats as r,virtqueueLessonEvents as e,virtqueueLessonStateAt as state} from '../src/virtqueue-lesson-timeline.ts';
test('full virtqueue lesson preserves ownership, publication order, polling recheck and deterministic seeking',()=>{
  const keys=['desc','availableEntry','available','kick','consume','data','tap','usedEntry','used','irq','read','reclaim'] as const;
  for(const timing of [b,r])keys.slice(1).forEach((k,i)=>assert.ok(timing[k]>timing[keys[i]],k));
  const forward=Array.from({length:duration},(_,f)=>state(f));
  for(let f=duration-1;f>=0;f--){
    const s=state(f);assert.deepEqual(s,forward[f]);
    assert.ok(!s.available||s.availableEntry&&s.descriptor);
    assert.ok(!s.consumed||s.available);
    assert.ok(!s.tapAccepted||s.dataAccessed&&s.consumed);
    assert.ok(!s.used||s.usedEntry&&s.tapAccepted);
    assert.ok(!s.interrupted||s.used);
    assert.ok(!s.reclaimed||s.used&&s.readUsed);
    assert.equal(s.remoteReceived,'unknown');
    if(s.poll)assert.equal(s.interrupted,false);
    if(s.raceRechecked)assert.ok(s.notificationsEnabled&&s.racePublished);
  }
  assert.ok(state(b.available).available&&!state(b.available).kicked);
  assert.ok(state(b.used).used&&!state(b.used).reclaimed);
  assert.equal(state(250*30).used,false,'independent polling example must reset completion');
  assert.ok(state(e.pollReclaim).reclaimed&&!state(e.pollReclaim).interrupted);
  assert.ok(state(e.racePublish).racePublished&&!state(e.racePublish).notificationsEnabled);
  assert.ok(state(e.reenable).notificationsEnabled&&!state(e.reenable).raceRechecked);
  assert.equal(state(e.replay).available,false,'replay starts a fresh request');
  assert.ok(state(duration-1).reclaimed);
  const clips=JSON.parse(readFileSync('src/virtqueue-lesson-audio.json','utf8'));
  assert.equal(clips.length,10);
  for(const c of clips){assert.ok(existsSync(`public/${c.file}`));assert.ok(c.start+c.duration<c.end&&c.end<=420);assert.ok(c.captions.every((p:{start:number;text:string})=>p.start>=c.start&&p.start<c.start+c.duration&&p.text.length<=16));}
});
