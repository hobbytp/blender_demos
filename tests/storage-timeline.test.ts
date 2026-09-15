import assert from 'node:assert/strict';
import {test} from 'node:test';
import {existsSync} from 'node:fs';
import audio from '../src/storage-audio.json' with {type:'json'};
import {storageBeats as b,storageStateAt as state,STORAGE_DURATION} from '../src/storage-timeline.ts';
test('NFS resource preparation precedes independent disk data flow',()=>{
  const events=Object.values(b);assert.ok(events.every((f,i)=>f>=0&&f<STORAGE_DURATION&&(!i||f>events[i-1])));
  assert.ok(b.mounted>=b.mountRequest+24&&b.checked>=b.mounted+24&&b.opened>=b.delivered+24);
  const forward=Array.from({length:STORAGE_DURATION},(_,f)=>state(f));
  for(let f=899;f>=0;f--){const s=state(f);assert.deepEqual(s,forward[f]);if(s.opened)assert.ok(s.path&&s.checked&&s.mounted&&s.plugin);if(s.readCompleted)assert.ok(s.opened&&s.readRequested);assert.equal(s.configurationCopiesData,false);assert.equal(s.pluginCarriesDiskIO,false);assert.equal(s.realExperiment,false);}
  assert.equal(state(0).mounted,false);assert.equal(state(899).readCompleted,true);
  assert.equal(audio.length,4);for(const c of audio){assert.ok(c.start+c.duration<c.end&&c.end<=30);assert.ok(existsSync(new URL(`../public/${c.file}`,import.meta.url)));}
});
