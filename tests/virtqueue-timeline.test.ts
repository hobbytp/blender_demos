import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {VIRTQUEUE_DURATION as duration,virtqueueBeats as b,virtqueueStateAt as state} from '../src/virtqueue-timeline.ts';
test('split virtqueue publishes before consumption and returns buffers only after used is read, including polling',()=>{
  const keys=['desc','availableEntry','available','kick','consume','data','tap','usedEntry','used','irq','read','reclaim'] as const;
  keys.slice(1).forEach((k,i)=>assert.ok(b[k]>b[keys[i]],k));
  const forward=Array.from({length:duration},(_,f)=>state(f));
  for(let f=duration-1;f>=0;f--){
    const s=state(f),p=state(f,true);assert.deepEqual(s,forward[f]);
    for(const t of [s,p]){
      assert.ok(!t.available||t.availableEntry&&t.descriptor);
      assert.ok(!t.consumed||t.available);
      assert.ok(!t.tapAccepted||t.dataAccessed&&t.consumed);
      assert.ok(!t.used||t.usedEntry&&t.tapAccepted);
      assert.ok(!t.interrupted||t.used);
      assert.ok(!t.reclaimed||t.readUsed&&t.used);
      assert.equal(t.remoteReceived,'unknown');
    }
    assert.equal(p.interrupted,false);assert.equal(p.reclaimed,s.reclaimed);
  }
  assert.ok(state(b.used).used&&!state(b.used).reclaimed);
  assert.ok(state(b.reclaim,true).reclaimed&&!state(b.reclaim,true).interrupted);
  const clips=JSON.parse(readFileSync('src/virtqueue-audio.json','utf8'));
  assert.equal(clips.length,4);
  for(const c of clips){assert.ok(existsSync(`public/${c.file}`));assert.ok(c.start+c.duration<c.end&&c.end<=30);assert.ok(c.captions.every((p:{start:number;text:string})=>p.start>=c.start&&p.start<c.start+c.duration&&p.text.length<=16));}
});
