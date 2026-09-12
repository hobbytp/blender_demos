import {chapters, DURATION} from './timeline.ts';
import {flowStateAt} from './flow-timeline.ts';

export {chapters as lessonChapters, DURATION as LESSON_DURATION};
// Reuse the approved scene beats, while network messages retain their own clock.
const beats = [[0,0],[210,48],[600,240],[900,420],[1140,465],[1290,510],
  [1440,570],[1560,630],[1650,666],[1770,711],[1860,759],[1920,789],[2010,840],[2249,899]];
export function lessonFrameAt(frame: number) {
  const f=Math.max(0,Math.min(DURATION-1,frame));
  const index=beats.findIndex((beat,i)=>i>0 && f<=beat[0]);
  const [from,start]=beats[index-1], [to,end]=beats[index];
  return start+(end-start)*(f-from)/(to-from);
}
export function lessonStateAt(frame: number) {
  const seconds=Math.max(0,Math.min(DURATION-1,frame))/30;
  return {...flowStateAt(lessonFrameAt(frame)), seconds,
    chapter:chapters.findIndex(chapter=>seconds<chapter.end)};
}
