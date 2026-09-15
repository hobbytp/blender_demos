export const COROSYNC_DURATION = 900;

export const corosyncChapters = [
  {start: 0, end: 7, name: '正常 token 轮转'},
  {start: 7, end: 14, name: '链路失效与等待'},
  {start: 14, end: 23, name: '成员组状态机'},
  {start: 23, end: 30, name: '成员视图驱动仲裁'},
];

export type MembershipPhase = 'OPERATIONAL' | 'GATHER' | 'COMMIT' | 'RECOVERY';

export function corosyncStateAt(frame: number) {
  const f = Math.max(0, Math.min(COROSYNC_DURATION - 1, frame));
  const phase: MembershipPhase = f < 420 ? 'OPERATIONAL' : f < 510 ? 'GATHER' : f < 585 ? 'COMMIT' : f < 660 ? 'RECOVERY' : 'OPERATIONAL';
  return {
    frame: f,
    chapter: corosyncChapters.findIndex(part => f / 30 < part.end),
    linkFailed: f >= 210,
    tokenTimedOut: f >= 420,
    phase,
    membershipInstalled: f >= 660,
    regularDelivered: f >= 690,
    quorumUpdated: f >= 750,
  };
}
