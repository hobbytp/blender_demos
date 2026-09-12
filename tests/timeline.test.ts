import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {DURATION, FPS, chapters, stateAt} from '../src/timeline.ts';

test('network partition preserves expected votes, waits for detection, and denies minority writes', () => {
  assert.equal(DURATION / FPS, 75);
  assert.equal(chapters[0].start, 0);
  assert.equal(chapters.at(-1)!.end, 75);
  chapters.slice(1).forEach((part, i) => assert.equal(chapters[i].end, part.start));
  for (let frame = 0; frame < DURATION; frame++) {
    const state = stateAt(frame);
    assert.equal(state.expectedVotes, 3);
    assert.equal(state.threshold, 2);
    assert.ok(state.nodes.every((node) => node.power === 'on'));
    if (frame < 20 * FPS) {
      assert.ok(state.nodes.every((node) => node.quorate && node.writable && node.votes === 3));
    } else if (frame < 30 * FPS) {
      assert.ok(state.detecting);
      assert.ok(state.nodes.every((node) => node.quorate === null && node.writable === null));
    } else {
      assert.deepEqual(state.nodes[0].members, ['A', 'B']);
      assert.deepEqual(state.nodes[2].members, ['C']);
      assert.ok(state.nodes[0].quorate && state.nodes[1].writable);
      assert.equal(state.nodes[2].quorate, false);
      assert.equal(state.nodes[2].writable, false);
    }
  }
  const prior = stateAt(600);
  stateAt(DURATION - 1);
  assert.deepEqual(stateAt(600), prior, 'backward seek must produce the same state');
});

test('all narration WAVs fit their slots without clipping or overlapping', () => {
  const lines = JSON.parse(readFileSync(new URL('../src/narration.json', import.meta.url), 'utf8'));
  let previousEnd = 0;
  lines.forEach((line: {start: number; end: number}, i: number) => {
    assert.ok(line.start >= previousEnd && line.end <= 75);
    previousEnd = line.end;
    const wav = readFileSync(new URL(`../public/audio/${String(i + 1).padStart(2, '0')}.wav`, import.meta.url));
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
    assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
    let byteRate = 0;
    let bytes = 0;
    for (let offset = 12; offset + 8 <= wav.length;) {
      const size = wav.readUInt32LE(offset + 4);
      const chunk = wav.toString('ascii', offset, offset + 4);
      if (chunk === 'fmt ') byteRate = wav.readUInt32LE(offset + 16);
      if (chunk === 'data') bytes = size;
      offset += 8 + size + (size % 2);
    }
    assert.ok(bytes > 0 && byteRate > 0);
    assert.ok(bytes / byteRate <= line.end - line.start - 0.1, `clip ${i + 1} would be cut off`);
  });
});
