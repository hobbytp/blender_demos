import {stateAt} from './timeline.ts';

export const FLOW_DURATION = 900;
export const flowChapters = [
  {start: 0, end: 8, name: '展开节点内部'},
  {start: 8, end: 14, name: '通信检测与重组'},
  {start: 14, end: 19, name: '成员与票数传播'},
  {start: 19, end: 22, name: '通知文件系统'},
  {start: 22, end: 30, name: '跟随配置写入'},
];
// Presentation beats reveal one causal step at a time; not protocol timings.
export function flowStateAt(frame: number) {
  const f = Math.max(0, Math.min(FLOW_DURATION - 1, frame));
  return {...stateAt(f < 240 ? 0 : f < 420 ? 600 : 900), seconds: f / 30,
    chapter: flowChapters.findIndex(chapter => f / 30 < chapter.end),
    votesShown: f >= 510, notified: f >= 630, writeArrived: f >= 711, writeReturned: f >= 789};
}
