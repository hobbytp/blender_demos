import {useEffect,useState} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,Html5Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Card,Text,Wire} from './HaPilot';
import audio from './backup-audio.json';
import {BACKUP_DURATION,backupBeats as b,backupStateAt} from './backup-timeline';
const green='#347d70',blue='#347aa8',amber='#b18635',purple='#7e759c',muted='#73847e',paper='#f8f7f2';
export function BackupPilot(){
  const f=useCurrentFrame(),s=backupStateAt(f);
  const [handle]=useState(()=>delayRender('Backup font'));
  useEffect(()=>{new FontFace('Quorum Noto',`url(${staticFile('fonts/NotoSansSC.ttf')})`,{weight:'100 900'}).load().then(font=>{document.fonts.add(font);continueRender(handle);}).catch(cancelRender);},[handle]);
  const caption=audio.find(c=>f>=c.start*30&&f<(c.start+c.duration+.3)*30)?.captions.filter(c=>c.start*30<=f).at(-1)?.text??'';
  const flow=(points:number[][],end:number,color=amber,n=24)=><Wire points={points} frame={f} active={f>=end-n&&f<end} progress={Math.max(0,Math.min(1,(f-end+n)/n))} color={color}/>;
  return <AbsoluteFill style={{background:paper,fontFamily:'Quorum Noto, sans-serif'}}>
    <svg viewBox='0 0 1920 1080' width='100%' height='100%' role='img' aria-label='备份内部机制：冻结、保护、解冻与旧数据复制'>
      <defs>{[green,blue,amber,purple,muted].map(color=><marker key={color} id={`ha-${color.slice(1)}`} markerWidth={7} markerHeight={7} refX={6} refY={3.5} orient='auto'><path d='M1 1 L6 3.5 L1 6' fill='none' stroke={color} strokeWidth={1.5}/></marker>)}</defs>
      <Text x={60} y={48} size={20} bold color={green}>PVE 06 / LIVE BACKUP · FOLLOW THE OLD DATA</Text>
      <Text x={60} y={110} size={42} bold>{['冻结的是文件系统，不是整台 VM','建立备份保护后解冻，复制继续','新写入遇到旧数据：先保护，再覆盖','文件系统、备份与应用：三个不同的状态'][s.chapter]}</Text>
      <Text x={60} y={158} size={23} color={muted}>Linux VM · snapshot 备份模式 · QGA 正常 · 单虚拟磁盘 → VMA 归档 · 无 fleecing / 错误</Text>
      <Text x={60} y={202} size={22} bold color={blue}>块 X 尚未备份时遇到新写入：保护备份时间点的 X=v1；其他块仍待复制</Text>
      {[[60,450,'Host · 备份编排'],[560,510,'Guest · 来宾内部'],[1120,740,'Host · QEMU 与存储']].map(([x,w,title])=><g key={String(title)}><rect x={Number(x)} y={230} width={Number(w)} height={675} rx={20} fill={Number(x)===560?'#f1eae2':'#e6eee7'} stroke='#c7d7ce'/><Text x={Number(x)+25} y={275} size={27} bold>{String(title)}</Text></g>)}
      <Card x={90} y={315} w={390} title='vzdump · 任务编排' value={s.thawAcknowledged?'已获 thaw 响应':s.startAcknowledged?'backup 已启动':s.freezeAcknowledged?'已获 freeze 响应':s.freezeRequested?'等待 freeze 响应':'准备备份 VM'} color={s.thawAcknowledged?green:amber} small/>
      <Card x={90} y={565} w={390} title='备份状态 · 独立于 FS' value={s.startAcknowledged?'任务进行中，未完成':f>=b.backupRequest?'等待启动响应':'尚未建立任务'} color={s.started?blue:muted} small/>
      <Text x={285} y={720} size={26} center bold color={amber}>任务标识 ≠ 完整备份</Text>
      <Text x={285} y={770} size={22} center color={muted}>等待后续数据与最终结果</Text>
      <Card x={590} y={315} w={450} title='QEMU Guest Agent · 来宾代理' value={s.thawed?'解冻成功':s.frozen?'冻结成功':s.syncing?'同步 / 冻结处理中':s.freezeRequested?'收到冻结请求':'等待命令'} color={s.thawed?green:s.frozen?amber:muted} small/>
      <Card x={590} y={475} w={450} title='应用 · 独立协调边界' value='本例未配置应用专用 hook' color={amber} small/>
      <Text x={815} y={608} size={23} center bold color={amber}>应用一致性：未验证</Text>
      <Card x={590} y={665} w={450} title='Guest 本地文件系统' value={s.thawed?'已解冻，可继续写入':s.frozen?'已冻结，写入暂受限':s.syncing?'同步并冻结中':'正常运行'} color={s.frozen?amber:s.thawed?green:muted} small/>
      <Text x={815} y={835} size={21} center color={muted}>不把 FS freeze 画成 CPU 停机</Text>
      <Card x={1150} y={355} w={320} title='QEMU · CBW 过滤器' value={s.writeBlocked?'新写入等待旧块复制':s.overwritten?'旧块已保护，写已放行':s.protected?'保护已建立':'尚未安装'} color={s.writeBlocked?amber:s.protected?purple:muted} small/>
      <Card x={1530} y={355} w={300} title='QEMU · 备份任务' value={s.started?'后台复制进行中':'等待启动'} color={s.started?blue:muted} small/>
      <Card x={1150} y={645} w={320} title='运行中的虚拟磁盘' value={`X: ${s.sourceX} · Y: v1`} color={s.overwritten?purple:blue}/>
      <Card x={1530} y={645} w={300} title='VMA 归档目标' value={`X: ${s.backupX??'待复制'} · Y: ${s.copiedY?'v1':'待复制'}`} color={s.oldSafe?green:blue} small/>
      <Text x={1680} y={785} size={23} center bold color={amber}>其他块待复制</Text>
      <Text x={1490} y={848} size={22} center color={muted}>块与队列为教学示意；未展示归档完成</Text>
      {flow([[480,340],[590,340]],b.freezeRequest)}
      {flow([[590,387],[480,387]],b.freezeAck,green)}
      {flow([[480,365],[590,365]],b.thawRequest)}
      {flow([[590,395],[480,395]],b.thawAck,green,18)}
      <Text x={535} y={305} size={17} center color={amber}>QGA 命令</Text>
      {flow([[1040,375],[1090,375],[1090,710],[1040,710]],b.frozen,amber)}
      {flow([[1040,375],[1090,375],[1090,710],[1040,710]],b.thawed,green)}
      {flow([[480,400],[535,400],[535,290],[1310,290],[1310,355]],b.backupRequest,amber)}
      <Text x={815} y={310} size={18} center color={amber}>QMP backup：建立保护与任务</Text>
      {flow([[1470,382],[1530,382]],b.started,purple)}
      {flow([[1680,355],[1680,310],[1115,310],[1115,455],[285,455],[285,565]],b.started+18,green,18)}
      {flow([[1040,690],[1105,690],[1105,405],[1150,405]],b.newWrite,purple)}
      {flow([[1190,645],[1190,445]],b.oldRead,blue,18)}
      {flow([[1470,415],[1530,415]],b.oldSent,blue,18)}
      {flow([[1800,445],[1800,645]],b.oldSafe,blue,18)}
      {flow([[1430,445],[1430,645]],b.overwrite,purple)}
      {flow([[1190,645],[1190,445]],b.copiedY-36,blue,18)}
      {flow([[1470,415],[1530,415]],b.copiedY-18,blue,18)}
      {flow([[1800,445],[1800,645]],b.copiedY,blue,18)}
      <Text x={1310} y={530} size={22} center bold color={purple}>写前复制 CBW</Text>
      <Text x={1310} y={605} size={20} center color={s.newWrite?purple:muted}>{s.overwritten?'新值 v2 写入':'先读旧值 v1'}</Text>
      <Text x={1655} y={590} size={18} center color={blue}>{s.oldSafe?'旧 X=v1 已复制':'旧数据 → 备份'}</Text>
      <Text x={60} y={952} size={22} bold color={amber}>FS 状态：{s.frozen?'冻结':s.thawed?'已解冻':'运行 / 准备冻结'}　｜　备份：{s.started?'进行中':'待启动'}　｜　应用协调：未验证</Text>
      <Text x={60} y={990} size={18} color={muted}>琥珀：控制命令 · 绿：响应 / 已保护 · 紫：新写入 · 蓝：旧数据复制 · 无应用 hook / VSS · 时间非实测</Text>
      <Text x={1800} y={990} size={18} center color={green}>{s.chapter+1} / 4</Text>
      <rect y={1010} width={1920} height={70} fill='#ecefe8'/><Text x={960} y={1055} size={29} center bold>{caption}</Text>
      <rect y={1075} width={1920*(f+1)/BACKUP_DURATION} height={5} fill={green}/>
    </svg>
    {audio.map(c=><Sequence key={c.file} from={Math.round(c.start*30)} durationInFrames={Math.round((c.end-c.start)*30)} layout='none'><Html5Audio src={staticFile(c.file)}/></Sequence>)}
  </AbsoluteFill>;
}
