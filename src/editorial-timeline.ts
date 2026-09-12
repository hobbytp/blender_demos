import {stateAt} from './timeline.ts';

export const EDITORIAL_DURATION = 300;
export const editorialChapters = [
  {start: 0, end: 2, name: '集群通信'},
  {start: 2, end: 4, name: '检测与重组'},
  {start: 4, end: 6, name: '成员与票数'},
  {start: 6, end: 10, name: '配置写入结果'},
];
export function editorialStateAt(frame: number) {
  const f = Math.max(0, Math.min(299, frame));
  return {...stateAt(f < 54 ? 0 : f < 120 ? 600 : 900), seconds: f / 30,
    chapter: editorialChapters.findIndex(chapter => f / 30 < chapter.end)};
}
