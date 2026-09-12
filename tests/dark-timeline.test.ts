import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {test} from 'node:test';
import {DARK_DURATION, darkChapters, darkStateAt} from '../src/dark-timeline.ts';

test('30-second edit retains detection, fixed quorum and minority write protection', () => {
  assert.equal(DARK_DURATION, 30 * 30);
  darkChapters.slice(1).forEach((chapter, i) => assert.equal(chapter.start, darkChapters[i].end));
  for (let f = 0; f < DARK_DURATION; f++) {
    const state = darkStateAt(f);
    assert.equal(state.expectedVotes, 3);
    assert.equal(state.threshold, 2);
    assert.ok(state.nodes.every(node => node.power === 'on'));
    if (f >= 50 && f < 210) {
      assert.equal(state.detecting, true);
      assert.ok(state.nodes.every(node => node.writable === null && node.members === null));
    } else if (f >= 210) {
      assert.deepEqual(state.nodes.map(node => node.votes), [2, 2, 1]);
      assert.deepEqual(state.nodes.map(node => node.writable), [true, true, false]);
    } else assert.ok(state.nodes.every(node => node.writable === true));
  }
  const before = darkStateAt(150);
  darkStateAt(899);
  assert.deepEqual(darkStateAt(150), before);
});

test('neural narration fits, captions stay readable and word beats remain within each clip', () => {
  const clips = JSON.parse(readFileSync(new URL('../src/dark-audio.json', import.meta.url), 'utf8'));
  let end = 0;
  for (const clip of clips) {
    assert.ok(clip.start >= end && clip.end <= 30);
    assert.ok(clip.duration > 0 && clip.start + clip.duration < clip.end - .1);
    assert.ok(existsSync(new URL(`../public/${clip.file}`, import.meta.url)));
    let beat = clip.start;
    for (const caption of clip.captions) {
      assert.ok(caption.start >= beat && caption.start < clip.start + clip.duration);
      assert.ok(caption.text.length <= 16);
      beat = caption.start;
    }
    end = clip.end;
  }
});
