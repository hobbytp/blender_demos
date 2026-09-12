import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {lessonFrameAt, lessonStateAt, lessonChapters, LESSON_DURATION} from '../src/lesson-timeline.ts';
import {stateAt} from '../src/timeline.ts';

test('75-second lesson retains approved chapter boundaries and safe state sequence', () => {
  let previous=Infinity;
  for(let f=LESSON_DURATION-1;f>=0;f--) {
    const mapped=lessonFrameAt(f), s=lessonStateAt(f), expected=stateAt(f);
    assert.ok(mapped>=0 && mapped<=899 && mapped<=previous);
    previous=mapped;
    assert.equal(s.chapter,expected.chapter);
    assert.equal(s.detecting,expected.detecting);
    assert.deepEqual(s.nodes,expected.nodes);
    assert.equal(s.expectedVotes,3);
    assert.equal(s.threshold,2);
    assert.ok(!s.votesShown || f>=1290);
    assert.ok(!s.notified || s.votesShown);
    assert.ok(!s.writeArrived || f>=1650 && s.notified);
    assert.ok(!s.writeReturned || s.writeArrived);
  }
  for(const [i,chapter] of lessonChapters.entries()) assert.equal(lessonStateAt(chapter.start*30).chapter,i);
  assert.equal(lessonFrameAt(-20),0);
  assert.equal(lessonFrameAt(3000),899);
  for(const clip of JSON.parse(readFileSync('src/lesson-audio.json','utf8'))) {
    assert.ok(existsSync(`public/${clip.file}`));
    assert.ok(clip.start+clip.duration<=clip.end && clip.end<=75);
    assert.ok(clip.captions.every((c:{start:number;text:string})=>c.start>=clip.start && c.start<clip.end && c.text.length<=16));
  }
});
