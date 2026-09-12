import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {FLOW_DURATION, flowStateAt} from '../src/flow-timeline.ts';

test('flow playback and reverse seeking preserve quorum and causal order', () => {
  for(let f=FLOW_DURATION-1; f>=0; f--) {
    const s=flowStateAt(f);
    assert.equal(s.detecting, f>=240 && f<420);
    assert.equal(s.expectedVotes,3);
    assert.equal(s.threshold,2);
    assert.ok(s.nodes.every(node=>node.power==='on'));
    assert.equal(s.nodes[2].writable,f<240?true:f<420?null:false);
    assert.ok(!s.votesShown || s.partitioned);
    assert.ok(!s.notified || s.votesShown);
    assert.ok(!s.writeArrived || s.notified);
    assert.ok(!s.writeReturned || s.writeArrived);
    if(s.partitioned) assert.deepEqual(s.nodes.map(node=>node.members),[['A','B'],['A','B'],['C']]);
  }
  for(const clip of JSON.parse(readFileSync('src/flow-audio.json','utf8'))) {
    assert.ok(existsSync(`public/${clip.file}`));
    assert.ok(clip.start+clip.duration<=clip.end && clip.end<=30);
    assert.ok(clip.captions.every((c:{start:number;text:string})=>c.start>=clip.start && c.start<clip.end && c.text.length<=16));
  }
});
