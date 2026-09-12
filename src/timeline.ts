// Prototype: one fixed teaching scenario, not a Corosync simulator.
export const FPS = 30;
export const DURATION = 75 * FPS;
export const chapters = [
  {start: 0, end: 7, name: '一个问题', title: '机器还开着，为什么配置不能写？', note: '电源状态 ≠ 集群配置写入资格'},
  {start: 7, end: 20, name: '认识角色', title: '三个节点，三种职责', note: '通信与成员关系 → 票数判断 → 配置文件系统'},
  {start: 20, end: 30, name: '通信中断', title: '断开的，是集群通信', note: '通信异常 → 检测 → 成员关系重组'},
  {start: 30, end: 43, name: '成员变化', title: '同一个集群，两个成员视图', note: '成员视图变了，预期总票数仍然是 3'},
  {start: 43, end: 55, name: '判断 quorum', title: '门槛仍是两票', note: '2 票达到门槛 · 1 票达不到门槛'},
  {start: 55, end: 67, name: '写入结果', title: '同一份配置，两种写入结果', note: 'quorum 决定这一侧能否继续接受集群配置写入'},
  {start: 67, end: 75, name: '回顾与延伸', title: '配置只读，不等于虚拟机立即停止', note: '运行与恢复，还要看 HA 等机制'},
] as const;

export function stateAt(frame: number) {
  const seconds = Math.max(0, Math.min(DURATION - 1, frame)) / FPS;
  const chapter = chapters.findIndex((part) => seconds < part.end);
  const detecting = seconds >= 20 && seconds < 30;
  const partitioned = seconds >= 30;
  return {
    seconds, chapter, detecting, partitioned,
    broken: seconds >= 20,
    expectedVotes: 3,
    threshold: 2,
    nodes: ['A', 'B', 'C'].map((id) => {
      const isolated = partitioned && id === 'C';
      return {
        id, power: 'on' as const,
        members: detecting ? null : partitioned ? (isolated ? ['C'] : ['A', 'B']) : ['A', 'B', 'C'],
        votes: detecting ? null : partitioned ? (isolated ? 1 : 2) : 3,
        quorate: detecting ? null : !isolated,
        writable: detecting ? null : !isolated,
      };
    }),
  };
}
