import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {editorialStateAt, EDITORIAL_DURATION} from '../src/editorial-timeline.ts';

test('editorial sample preserves detection, quorum and audio bounds when seeking', () => {
  for (let f = EDITORIAL_DURATION - 1; f >= 0; f--) {
    const state = editorialStateAt(f);
    assert.equal(state.expectedVotes, 3);
    assert.equal(state.threshold, 2);
    assert.ok(state.nodes.every(node => node.power === 'on'));
    assert.equal(state.detecting, f >= 54 && f < 120);
    assert.equal(state.nodes[2].writable, f < 54 ? true : f < 120 ? null : false);
    assert.equal(state.nodes[0].votes, f < 54 ? 3 : f < 120 ? null : 2);
  }
  const clips = JSON.parse(readFileSync('src/editorial-audio.json', 'utf8'));
  for (const clip of clips) {
    assert.ok(existsSync(`public/${clip.file}`));
    assert.ok(clip.start + clip.duration <= clip.end && clip.end <= 10);
    assert.ok(clip.captions.every((caption: {start: number}) => caption.start >= clip.start && caption.start < clip.end));
  }
});
