import {useEffect,useState} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,Html5Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Card,Text,Wire} from './HaPilot';
import audio from './durability-audio.json';
import {DURABILITY_DURATION,durabilityBeats as b,durabilityStateAt} from './durability-timeline';

const green='#347d70',blue='#347aa8',amber='#b18635',red='#b96b50',muted='#73847e',paper='#f8f7f2';
export function DurabilityPilot({powerLoss=false}:{powerLoss?:boolean}){
  const f=useCurrentFrame(),s=durabilityStateAt(f,powerLoss);
  const [handle]=useState(()=>delayRender('Durability font'));
  useEffect(()=>{new FontFace('Quorum Noto',`url(${staticFile('fonts/NotoSansSC.ttf')})`,{weight:'100 900'}).load().then(font=>{document.fonts.add(font);continueRender(handle);}).catch(cancelRender);},[handle]);
  const titles=['WRITE 完成，可以早于持久保存','FLUSH 继续向下，等待后端兑现','先完成持久化，再返回 FLUSH 完成','两种完成，两个不同的承诺'];
  const caption=powerLoss?(s.powerOff?'模拟断电：之前收到 WRITE OK，也不能保证新值留存。':'独立对照（无旁白）：选择回写尚未完成、未发出 FLUSH 的时刻断电。'):audio.find(c=>f>=c.start*30&&f<(c.start+c.duration+.3)*30)?.captions.filter(c=>c.start*30<=f).at(-1)?.text??'';
  const flow=(points:number[][],start:number,end:number,color=blue,enabled=true)=><Wire points={points} frame={f} active={enabled&&!s.powerOff&&f>=start&&f<end} progress={Math.max(0,Math.min(1,(f-start)/(end-start)))} color={color}/>;
  return <AbsoluteFill style={{background:paper,fontFamily:'Quorum Noto, sans-serif'}}>
    <svg viewBox='0 0 1920 1080' width='100%' height='100%' role='img' aria-label='写入持久性：WRITE、FLUSH 与易失缓存的内部路径'>
      <defs>{[green,blue,amber,red,muted].map(color=><marker key={color} id={`ha-${color.slice(1)}`} markerWidth={7} markerHeight={7} refX={6} refY={3.5} orient='auto'><path d='M1 1 L6 3.5 L1 6' fill='none' stroke={color} strokeWidth={1.5}/></marker>)}</defs>
      <Text x={60} y={48} size={20} bold color={green}>PVE 04 / WRITE DURABILITY · FOLLOW THE COMPLETION</Text>
      <Text x={60} y={110} size={42} bold>{s.powerOff?'断电对照：WRITE 已完成，新值仍无保证':powerLoss?'对照：只完成 WRITE，随后模拟断电':titles[s.chapter]}</Text>
      <Text x={60} y={158} size={23} color={muted}>显式 writeback · VirtIO Block · 本地 raw 文件 · aio=threads · 不代表 PVE 默认配置</Text>
      <Text x={60} y={202} size={22} bold color={blue}>从块设备请求开始：W1 修改同一数据块；不等同于应用 write() 或整项业务事务</Text>
      {[[60,380,'Guest · 来宾'],[480,400,'QEMU · 用户态进程'],[920,440,'Host · Linux 内核'],[1460,400,'Storage · 存储设备']].map(([x,w,title])=><g key={String(title)}>
        <rect x={Number(x)} y={245} width={Number(w)} height={680} rx={20} fill={Number(x)===480?'#f1eae2':'#e6eee7'} stroke='#c7d7ce'/>
        <Text x={Number(x)+25} y={286} size={26} bold>{String(title)}</Text>
      </g>)}
      <Text x={100} y={330} size={19} color={muted}>请求与完成分别观察</Text>
      <Text x={515} y={330} size={19} color={muted}>设备模拟 → 块后端</Text>
      <Text x={960} y={330} size={19} color={muted}>文件系统与页缓存</Text>
      <Text x={1500} y={330} size={19} color={muted}>假定正确兑现刷新语义</Text>
      <g opacity={s.powerOff?.3:1}>
        <Card x={90} y={385} w={300} title='virtio-blk · 请求队列' value={s.flushSent?'提交 FLUSH':s.writeSent?'提交 WRITE W1':'准备 W1'} color={s.flushSent?amber:blue} small/>
        <Card x={510} y={385} w={340} title='virtio-blk · 设备模拟' value={s.virtioComplete?'FLUSH 结果返回':s.qemuFlush?'处理刷新请求':s.qemuWrite?'处理 W1':'等待请求'} color={s.virtioComplete?green:s.qemuFlush?amber:blue} small/>
        <Card x={510} y={600} w={340} title='块后端 · raw → file' value={s.backendComplete?'文件后端刷新完成':s.backendFlush?'转交文件后端刷新':s.backendWrite?'提交文件写入':'等待写入'} color={s.backendComplete?green:s.backendFlush?amber:blue} small/>
        <Card x={960} y={385} w={360} title='文件系统 · fdatasync' value={s.hostComplete?'刷新调用已完成':s.hostFlush?'等待下层兑现':'尚无刷新请求'} color={s.hostComplete?green:s.hostFlush?amber:muted} small/>
        <Card x={960} y={600} w={360} title='宿主页缓存 · 易失 RAM' value={s.powerOff?'易失内容不可用':s.cached?'新内容 v2 在缓存':'原内容 v1'} color={s.cached?blue:muted} small/>
        <Card x={1500} y={385} w={320} title='设备控制器' value={s.stable?'持久化已完成':s.deviceFlush?'刷新处理中':'等待数据 / 刷新'} color={s.stable?green:s.deviceFlush?amber:muted} small/>
        <Card x={1500} y={600} w={320} title='设备写缓存 · 易失' value={s.deviceCached?'v2 已到达': '尚未收到 v2'} color={s.deviceCached?blue:muted} small/>
        {flow([[390,430],[510,430]],b.write,b.qemuWrite)}
        {flow([[680,475],[680,600]],b.qemuWrite,b.backendWrite)}
        {flow([[850,635],[960,635]],b.backendWrite,b.cache)}
        {flow([[960,665],[850,665]],b.cache,b.writeAck-36,green)}
        {flow([[535,600],[535,475]],b.writeAck-36,b.writeAck-18,green)}
        {flow([[510,450],[460,450],[460,580],[390,580]],b.writeAck-18,b.writeAck,green)}
        {flow([[390,410],[510,410]],b.flush,b.qemuFlush,amber,!powerLoss)}
        {flow([[810,475],[810,600]],b.qemuFlush,b.backendFlush,amber,!powerLoss)}
        {flow([[850,650],[890,650],[890,430],[960,430]],b.backendFlush,b.hostFlush,amber,!powerLoss)}
        {flow([[1320,430],[1500,430]],b.deviceCache,b.deviceFlush,amber,!powerLoss)}
        {flow([[1140,475],[1140,600]],b.hostFlush,b.hostFlush+24,amber,!powerLoss)}
        {flow([[1320,645],[1500,645]],b.deviceCache-36,b.deviceCache,blue,!powerLoss)}
        {flow([[1660,690],[1660,775]],b.stable-36,b.stable,blue,!powerLoss)}
        {flow([[1500,455],[1320,455]],b.stable,b.stable+24,green,!powerLoss)}
        {flow([[960,450],[905,450],[905,675],[850,675]],b.stable+24,b.stable+48,green,!powerLoss)}
        {flow([[825,600],[825,475]],b.stable+48,b.flushAck-24,green,!powerLoss)}
        {flow([[510,465],[450,465],[450,765],[390,765]],b.flushAck-24,b.flushAck,green,!powerLoss)}
      </g>
      <Card x={90} y={540} w={300} title='WRITE 完成 · 历史结果' value={s.writeAck?'已收到 WRITE OK':'等待 WRITE 结果'} color={s.writeAck?green:muted} small/>
      <Card x={90} y={725} w={300} title='FLUSH 完成' value={s.flushAck?'已收到 FLUSH OK':s.powerOff?'未取得刷新完成':s.flushSent?'等待刷新完成':'尚未提交 FLUSH'} color={s.flushAck?green:s.powerOff?red:amber} small/>
      <Card x={1500} y={775} w={320} title='非易失存储' value={s.powerOff?'新内容留存无保证':s.stable?'v2 已持久保存':'本例尚为 v1'} color={s.stable?green:s.powerOff?red:muted} small/>
      <Text x={690} y={752} size={21} center color={blue}>蓝色：数据 / 写请求</Text>
      <Text x={690} y={794} size={21} center color={amber}>琥珀色：刷新控制请求</Text>
      <Text x={690} y={836} size={21} center color={green}>绿色：完成结果向上返回</Text>
      <Text x={1140} y={752} size={21} center bold color={s.durableGuarantee?green:amber}>{s.durableGuarantee?'本例刷新条件已兑现':'WRITE OK ≠ 持久化保证'}</Text>
      <Text x={1140} y={797} size={19} center color={muted}>缓存中仍有副本，不等于仍是脏数据</Text>
      {s.powerOff&&<g><rect x={500} y={490} width={1340} height={95} rx={12} fill='#f4e4da' stroke={red}/><Text x={1170} y={531} size={28} center bold color={red}>模拟断电 · 易失状态不可依赖</Text><Text x={1170} y={566} size={22} center color={red}>新值可能丢失或不完整；不宣称必然完整退回 v1</Text></g>}
      <Text x={60} y={963} size={20} color={muted}>本例选择后台回写尚未完成的窗口；实际也可能提前写出。无并发新写入、无 I/O 错误。</Text>
      <Text x={60} y={995} size={18} color={muted}>教学时间与版本标签 · FLUSH 不携带新的数据副本 · 下层遵守持久化语义是前提</Text>
      <Text x={1800} y={995} size={18} center color={green}>{powerLoss?'断电对照':`${s.chapter+1} / 4`}</Text>
      <rect y={1010} width={1920} height={70} fill='#ecefe8'/><Text x={960} y={1055} size={29} center bold>{caption}</Text>
      <rect y={1075} width={1920*(f+1)/DURABILITY_DURATION} height={5} fill={green}/>
    </svg>
    {!powerLoss&&audio.map(c=><Sequence key={c.file} from={Math.round(c.start*30)} durationInFrames={Math.round((c.end-c.start)*30)} layout='none'><Html5Audio src={staticFile(c.file)}/></Sequence>)}
  </AbsoluteFill>;
}
