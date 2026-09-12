import {stateAt} from './timeline.ts';

export const DARK_DURATION = 900;
export const darkChapters = [
  {start: 0, end: 7, name: '通信中断'},
  {start: 7, end: 14, name: '成员视图'},
  {start: 14, end: 22, name: '仲裁判断'},
  {start: 22, end: 30, name: '配置写入'},
];

// Reuse the verified scenario, with a shorter teaching clock (not protocol time).
export function darkStateAt(frame: number) {
  const f = Math.max(0, Math.min(DARK_DURATION - 1, frame));
  const sourceFrame = f < 50 ? 0 : f < 210 ? 600 + (f - 50) * 299 / 160 : 900;
  return {...stateAt(sourceFrame), seconds: f / 30,
    chapter: darkChapters.findIndex((chapter) => f < chapter.end * 30)};
}
