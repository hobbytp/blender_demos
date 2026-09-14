import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {BACKUP_DURATION as duration,backupBeats as b,backupStateAt as state} from '../src/backup-timeline.ts';
test('backup preserves old blocks before overwrite and separates freeze, job and application evidence',()=>{
  const order=['freezeRequest','sync','frozen','freezeAck','backupRequest','protection','started','thawRequest','thawed','thawAck','copiedY','newWrite','oldRead','oldSent','oldSafe','overwrite'] as const;
  order.slice(1).forEach((k,i)=>assert.ok(b[k]>b[order[i]],k));
  const forward=Array.from({length:duration},(_,f)=>state(f));
  for(let f=duration-1;f>=0;f--){
    const s=state(f);assert.deepEqual(s,forward[f]);
    assert.ok(!s.started||s.protected&&s.freezeAcknowledged);
    assert.ok(!s.thawed||s.startAcknowledged);
    assert.ok(!s.newWrite||s.thawed);
    assert.ok(!s.oldSafe||s.protected&&s.newWrite);
    assert.ok(!s.overwritten||s.oldSafe&&!s.writeBlocked);
    if(s.overwritten){assert.equal(s.sourceX,'v2');assert.equal(s.backupX,'v1');}
    assert.equal(s.backupComplete,false);assert.equal(s.applicationConsistent,'unverified');
  }
  assert.ok(state(b.started).frozen&&!state(b.started).startAcknowledged);
  assert.ok(state(b.thawed).started&&!state(b.thawed).backupComplete);
  assert.ok(state(b.oldSafe-1).writeBlocked&&state(b.oldSafe-1).sourceX==='v1');
  const clips=JSON.parse(readFileSync('src/backup-audio.json','utf8'));
  assert.equal(clips.length,4);
  for(const c of clips){assert.ok(existsSync(`public/${c.file}`));assert.ok(c.start+c.duration<c.end&&c.end<=30);assert.ok(c.captions.every((p:{start:number;text:string})=>p.start>=c.start&&p.start<c.start+c.duration&&p.text.length<=16));}
});
