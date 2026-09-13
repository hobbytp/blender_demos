import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {HA_LESSON_DURATION,haLessonBeats as beats,haLessonChapters,haLessonStateAt} from '../src/ha-lesson-timeline.ts';

test('HA full lesson preserves single-instance safety and separate application readiness through reverse seeking',()=>{
  const forward=Array.from({length:HA_LESSON_DURATION},(_,f)=>haLessonStateAt(f));
  for(let f=HA_LESSON_DURATION-1;f>=0;f--){
    const s=haLessonStateAt(f);
    assert.deepEqual(s,forward[f]);
    assert.ok(!s.hostReset||s.muxExpired&&s.lockLost);
    assert.ok(!s.lockAcquired||s.hostReset&&s.fenceWaiting);
    assert.ok(!s.fenceConfirmed||s.lockAcquired);
    assert.ok(!s.recovery||s.fenceConfirmed&&s.majorityHasQuorum);
    assert.ok(!s.targetVmRunning||s.recovery&&s.targetProtected&&s.configMoved&&s.desired&&s.qemuCall);
    assert.ok(!(s.oldVmRunning&&s.targetVmRunning),'never run both copies in this fixed scenario');
    assert.ok(!s.appReady||s.targetVmRunning&&s.probe);
    const n=haLessonStateAt(f,true);
    assert.ok(n.oldVmRunning&&!n.partitioned&&!n.lockLost&&!n.targetVmRunning&&!n.appReady);
  }
  assert.ok(haLessonStateAt(beats.lockLost).oldVmRunning);
  assert.ok(!haLessonStateAt(beats.reset).lockAcquired,'director view is not a fencing result');
  assert.ok(!haLessonStateAt(beats.running).appReady,'QEMU running does not mean application ready');
  assert.ok(haLessonStateAt(HA_LESSON_DURATION-1).appReady);
  assert.equal(haLessonStateAt(30*30).partitioned,false,'opening preview explicitly returns to normal');
  for(let i=0;i<haLessonChapters.length;i++){
    const c=haLessonChapters[i];
    assert.equal(c.start,i?haLessonChapters[i-1].end:0);
    assert.equal(haLessonStateAt(c.start*30).chapter,i);
  }
  const clips=JSON.parse(readFileSync('src/ha-lesson-audio.json','utf8'));
  for(const [i,clip] of clips.entries()){
    assert.ok(existsSync(`public/${clip.file}`));
    assert.ok(clip.start+clip.duration<=clip.end&&clip.end<=420);
    assert.ok(!i||clips[i-1].end<=clip.start);
    assert.ok(clip.captions.every((c:{start:number},j:number)=>c.start>=clip.start&&c.start<clip.end&&(!j||c.start>clip.captions[j-1].start)));
  }
  assert.ok(clips[11].start-(clips[10].start+clips[10].duration)>=5,'leave five seconds to think before the answer');
});
