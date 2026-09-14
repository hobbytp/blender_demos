import {useEffect,useState} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,Html5Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Card,Text,Wire} from './HaPilot';
import audio from './restore-audio.json';
import {restoreBeats as b,restoreStateAt} from './restore-timeline';
const green='#347d70',blue='#347aa8',amber='#b18635',purple='#7e759c',muted='#73847e',paper='#f8f7f2';
export function RestorePilot(){
  const f=useCurrentFrame(),s=restoreStateAt(f);
  const [handle]=useState(()=>delayRender('Restore font'));
  useEffect(()=>{new FontFace('Quorum Noto',`url(${staticFile('fonts/NotoSansSC.ttf')})`,{weight:'100 900'}).load().then(font=>{document.fonts.add(font);continueRender(handle);}).catch(cancelRender);},[handle]);
  const flow=(points:number[][],end:number,color=amber,n=24)=><Wire points={points} frame={f} active={f>=end-n&&f<end} progress={Math.max(0,Math.min(1,(f-end+n)/n))} color={color}/>;
  const caption=audio.find(c=>f>=c.start*30&&f<(c.start+c.duration+.25)*30)?.captions.filter(c=>c.start*30<=f).at(-1)?.text??'';
  return <AbsoluteFill style={{background:paper,fontFamily:'Quorum Noto, sans-serif'}}>
    <svg viewBox='0 0 1920 1080' width='100%' height='100%' role='img' aria-label='灾难恢复内部机制：归档、磁盘、数据库与业务校验'>
      <defs>{[green,blue,amber,purple,muted].map(color=><marker key={color} id={`ha-${color.slice(1)}`} markerWidth={7} markerHeight={7} refX={6} refY={3.5} orient='auto'><path d='M1 1 L6 3.5 L1 6' fill='none' stroke={color} strokeWidth={1.5}/></marker>)}</defs>
      <Text x={60} y={48} size={20} bold color={green}>PVE 07 / DISASTER RECOVERY · FOLLOW THE EVIDENCE</Text>
      <Text x={60} y={110} size={42} bold>{['归档恢复完成，业务就回来了吗？','磁盘 → VM → 数据库：逐层恢复','展开数据库：日志如何推动恢复？','让查询往返，再判断本次校验'][s.chapter]}</Text>
      <Text x={60} y={158} size={23} color={muted}>普通 VMA 恢复 · 新 VM / 隔离网络 · 单磁盘完整一致快照 · PostgreSQL 18 · 无外部依赖</Text>
      <Text x={60} y={202} size={22} bold color={blue}>选定成功路径的机制示意；未执行实机演练，动画秒数不是恢复耗时</Text>
      {[[60,390,'备份与验收'],[500,460,'Host · 恢复编排'],[1010,850,'Guest · VM 内部']].map(([x,w,title])=><g key={title}><rect x={Number(x)} y={230} width={Number(w)} height={680} rx={20} fill={Number(x)===1010?'#f1eae2':'#e6eee7'} stroke='#c7d7ce'/><Text x={Number(x)+25} y={275} size={27} bold>{title}</Text></g>)}
      <Card x={90} y={320} w={330} title='VMA · 配置' value='虚拟硬件与磁盘映射' color={blue} small/>
      <Card x={90} y={500} w={330} title='VMA · 磁盘内容' value='完整数据 + WAL 日志' color={blue} small/>
      <Text x={255} y={635} size={20} center color={muted}>前提：可用的一致快照</Text>
      <Text x={255} y={690} size={20} center color={amber}>验收：订单 42，预期已支付</Text>
      <Card x={90} y={730} w={330} title='隔离验收端 · 已知查询' value={s.checked?'本次结果符合预期':s.response?'收到结果，核对中':f>=b.query?'请求进行中':'等待数据库就绪'} color={s.checked?green:amber} small/>
      <Card x={530} y={320} w={400} title='qmrestore → vma extract' value={s.restored?'恢复任务成功（示意）':f>=b.extract?'解包 / 写入目标卷':'等待恢复请求'} color={s.restored?green:blue} small/>
      <Card x={530} y={500} w={400} title='目标卷映射 / VM 配置' value={s.restored?'最终配置已写入':s.mapped?'分配目标卷，建立映射':'等待归档配置'} color={s.mapped?blue:muted} small/>
      <Card x={530} y={690} w={400} title='目标虚拟磁盘 · 整盘' value={s.disks?'内容恢复完成':s.mapped?'磁盘内容写入中':'尚未恢复'} color={s.disks?green:muted} small/>
      <Text x={730} y={838} size={21} center bold color={amber}>操作方核验隔离，再启动</Text>
      <Card x={1040} y={320} w={360} title='vCPU / Guest OS' value={s.os?'系统运行':s.started?'启动中':'未启动'} color={s.os?green:muted} small/>
      <Card x={1430} y={320} w={400} title='PostgreSQL · 启动状态' value={s.ready?'可接受连接':s.recovering?'崩溃恢复处理中':s.os?'启动中':'未启动'} color={s.ready?green:s.recovering?amber:muted} small/>
      <g opacity={s.os?1:.3}>
        <Card x={1040} y={530} w={360} title='磁盘内 · WAL 日志' value={s.redone?'恢复所需记录已回放':'保留恢复所需记录'} color={purple} small/>
        <Card x={1430} y={530} w={400} title='数据库 · 数据页' value={s.redone?'完成本次 redo':'部分修改待 redo'} color={s.redone?green:amber} small/>
        {[0,1,2].map(i=><g key={i}><rect x={1450+i*118} y={637} width={105} height={42} rx={7} fill={s.redone?green:'#e6d9bb'}/><Text x={1502+i*118} y={665} size={20} center color={s.redone?'#fffefa':amber}>{s.redone?'已恢复':'待回放'}</Text></g>)}
      </g>
      <Card x={1430} y={730} w={400} title='应用 · 查询接口' value={f>=b.sqlResult?'订单 42：已支付':f>=b.appQuery?'处理请求 / 返回数据':s.ready?'等待独立验收':'尚未验证'} color={s.checked?green:amber} small/>
      <Text x={1220} y={759} size={22} center bold color={amber}>可连接就够了吗？</Text>
      <Text x={1220} y={797} size={21} center color={muted}>还需要业务证据</Text>
      {flow([[420,365],[530,365]],b.extract,blue)}
      {flow([[730,410],[730,500]],b.mapped,amber)}
      {flow([[420,545],[470,545],[470,435],[570,435],[570,410]],b.mapped+24,blue)}
      {flow([[930,390],[946,390],[946,665],[850,665],[850,690]],b.disks,blue,60)}
      {flow([[930,545],[980,545],[980,365],[1040,365]],b.start,amber)}
      {flow([[930,735],[995,735],[995,395],[1040,395]],b.os,blue)}
      {flow([[1400,365],[1430,365]],b.recover,amber)}
      {flow([[1630,410],[1630,475],[1220,475],[1220,530]],b.redo-24,purple)}
      {flow([[1400,575],[1430,575]],b.redo,purple)}
      {flow([[1785,530],[1785,410]],b.ready,green)}
      {flow([[420,770],[460,770],[460,868],[1500,868],[1500,820]],b.appQuery,amber,18)}
      {flow([[1830,755],[1843,755],[1843,350],[1830,350]],b.sql,amber,18)}
      {flow([[1830,390],[1853,390],[1853,790],[1830,790]],b.sqlResult,green,18)}
      {flow([[1570,820],[1570,892],[435,892],[435,795],[420,795]],b.response,green,18)}
      <Text x={620} y={888} size={18} color={amber}>查询 →</Text><Text x={820} y={888} size={18} color={green}>← 结果</Text>
      <Text x={960} y={950} size={25} center bold color={s.checked?green:amber}>{s.checked?'已知数据查询通过（示意）；其余功能与生产切换仍未验证':s.ready?'数据库就绪，业务校验仍在等待':s.restored?'磁盘与配置恢复完成，业务尚无可用证据':'每层分别等待结果，不提前点亮下游状态'}</Text>
      <Text x={960} y={990} size={21} center color={muted}>蓝：归档数据　紫：日志回放　金：控制 / 查询　绿：结果　｜　全程隔离，未接回生产</Text>
      <rect x={0} y={1010} width={1920} height={70} fill='#243f4b'/><Text x={960} y={1056} size={29} center bold color='#fffefa'>{caption}</Text>
    </svg>
    {audio.map(c=><Sequence key={c.file} from={Math.round(c.start*30)} durationInFrames={Math.ceil(c.duration*30)}><Html5Audio src={staticFile(c.file)}/></Sequence>)}
  </AbsoluteFill>;
}
