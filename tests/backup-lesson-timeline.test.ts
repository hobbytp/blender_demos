import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {BACKUP_LESSON_DURATION as duration,backupLessonBeats as b,backupReplayBeats as r,backupLessonEvents as e,backupLessonStateAt as state} from '../src/backup-lesson-timeline.ts';
test('backup lesson preserves old blocks, scope, independent cleanup and reversible frame states',()=>{
  const keys=['freezeRequest','sync','frozen','freezeAck','backupRequest','protection','started','startAck','thawRequest','thawed','thawAck','copiedY','newWrite','oldRead','oldSent','oldSafe','overwrite'] as const;
  for(const timing of [b,r])keys.slice(1).forEach((k,i)=>assert.ok(timing[k]>timing[keys[i]],k));
  const forward=Array.from({length:duration},(_,f)=>state(f));
  for(let f=duration-1;f>=0;f--){
    const s=state(f);assert.deepEqual(s,forward[f]);
    assert.ok(!s.started||s.protected&&s.freezeAcknowledged);
    assert.ok(!s.thawed||s.startAcknowledged);
    assert.ok(!s.overwritten||s.oldSafe&&!s.writeBlocked);
    if(s.overwritten){assert.equal(s.backupX,'v1');assert.equal(s.sourceX,'v2');}
    if(s.yWriteRequested)assert.ok(s.copiedY,'Y old data must be safe before its new write');
    if(s.yOverwritten)assert.equal(s.sourceY,'v2');
    if(s.appProtected)assert.ok(s.appScopeReady&&s.appStopped||s.appRestarted);
    if(s.appRestarted)assert.ok(s.appBackupDone&&!s.appFrozen);
    if(s.cleanupRequired)assert.ok(s.freezeError);
    if(s.thawAttempted)assert.ok(s.cleanupRequired);
    assert.equal(s.cleanupResult,'unknown');assert.equal(s.restoreVerified,false);
    assert.equal(s.backupComplete,false);assert.equal(s.applicationConsistent,'unverified');
  }
  assert.ok(state(b.started).started&&!state(b.started).startAcknowledged);
  assert.ok(state(b.oldSafe-1).writeBlocked&&!state(b.oldSafe-1).overwritten);
  assert.equal(state(b.oldSafe).sourceX,'v1','old value remains before overwrite');
  assert.ok(state(e.appProtect).appStopped&&state(e.appProtect).appFrozen);
  assert.ok(state(e.appThaw).appStopped&&!state(e.appThaw).appBackupDone);
  assert.ok(state(e.cleanup).freezeError&&state(e.cleanup).cleanupRequired&&!state(e.cleanup).thawAttempted);
  assert.equal(state(e.replay).protected,false,'replay is a fresh backup');
  assert.ok(state(duration-1).overwritten);
  const clips=JSON.parse(readFileSync('src/backup-lesson-audio.json','utf8'));
  assert.equal(clips.length,8);
  for(const c of clips){assert.ok(existsSync(`public/${c.file}`));assert.ok(c.start+c.duration<c.end&&c.end<=420);assert.ok(c.captions.every((p:{start:number;text:string})=>p.start>=c.start&&p.start<c.start+c.duration&&p.text.length<=16));}
});
