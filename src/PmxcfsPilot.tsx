import {useEffect,useState} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,Html5Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Card,Text,Wire} from './HaPilot';
import audio from './pmxcfs-audio.json';
import {PMXCFS_DURATION,pmxcfsBeats as b,pmxcfsStateAt} from './pmxcfs-timeline';

const green='#347d70',blue='#347aa8',amber='#b18635',red='#b96b50',muted='#73847e',paper='#f8f7f2';
const progress=(f:number,at:number,length:number)=>Math.max(0,Math.min(1,(f-at)/length));
export function PmxcfsPilot({blocked=false}:{blocked?:boolean}){
  const f=useCurrentFrame(),s=pmxcfsStateAt(f,blocked);
  const [handle]=useState(()=>delayRender('pmxcfs font'));
  useEffect(()=>{new FontFace('Quorum Noto',`url(${staticFile('fonts/NotoSansSC.ttf')})`,{weight:'100 900'}).load().then(font=>{document.fonts.add(font);continueRender(handle);}).catch(cancelRender);},[handle]);
  const titles=['一次本地写入，如何成为集群状态？','交付的是操作，各节点更新自己的副本','写入结果，沿本机路径返回','对照：C 已失去 quorum，拒绝新写入'];
  const caption=blocked?'无 quorum 对照（无旁白）：C 的写入被拒绝，已保存的配置仍可读取。':audio.find(c=>f>=c.start*30&&f<(c.start+c.duration+.3)*30)?.captions.filter(c=>c.start*30<=f).at(-1)?.text??'';
  return <AbsoluteFill style={{background:paper,fontFamily:'Quorum Noto, sans-serif'}}>
    <svg viewBox='0 0 1920 1080' width='100%' height='100%' role='img' aria-label='pmxcfs 内部机制：操作交付、本地副本与写入返回'>
      <defs>{[green,blue,amber,red,muted].map(color=><marker key={color} id={`ha-${color.slice(1)}`} markerWidth={7} markerHeight={7} refX={6} refY={3.5} orient='auto'><path d='M1 1 L6 3.5 L1 6' fill='none' stroke={color} strokeWidth={1.5}/></marker>)}</defs>
      <Text x={60} y={47} size={20} bold color={green}>PVE 03 / PMXCFS · INSIDE THE CONFIGURATION PATH</Text>
      <Text x={60} y={108} size={42} bold>{blocked?titles[3]:titles[s.chapter]}</Text>
      <Text x={60} y={152} size={22} color={muted}>{s.isolated?'分区已经稳定：A+B 有 quorum，C 无 quorum；不模拟本段之前的故障检测':'三节点已同步、无并发冲突；只跟踪一个已进入 FUSE 的配置写操作'}</Text>
      <Text x={60} y={192} size={23} bold color={blue}>同一对象：/etc/pve/nodes/B/qemu-server/100.conf · 描述字段示意</Text>
      {['A','B','C'].map((name,i)=>{
        const x=60+i*620,deniedNode=i===2&&s.isolated;
        const arrival=b.deliver+30+i*12,memAt=b.memory+[24,45,75][i],dbAt=[b.database+30,b.database+55,b.returned+45][i];
        return <g key={name}>
          <rect x={x} y={225} width={560} height={680} rx={20} fill={i===0?'#f1eae2':'#e6eee7'} stroke='#c7d7ce'/>
          <Text x={x+25} y={261} size={28} bold>节点 {name}{i===0?' · 写入方':''}</Text>
          <Text x={x+330} y={261} size={21} bold color={deniedNode?red:green}>{s.votes[i]} 票 / {deniedNode?'无':'有'} quorum</Text>
          <rect x={x+50} y={285} width={460} height={70} rx={10} fill='#fffefa' stroke={deniedNode?red:blue}/>
          <Text x={x+70} y={312} size={21} bold>本机 /etc/pve · FUSE 入口</Text>
          <Text x={x+70} y={340} size={21} color={deniedNode?red:blue}>{s.memory[i]&&!s.database[i]?'本地更新中 · 读取等待':deniedNode&&s.denied?'写入拒绝 · 配置仍为 v'+s.versions[i]:i===0&&s.request&&!s.returned?`W1 等待结果 · 可见 v${s.versions[i]}`:`可见配置 v${s.versions[i]}${i===0&&s.returned?' · 写调用已返回':''}`}</Text>
          <rect x={x+18} y={372} width={524} height={378} rx={14} fill='none' stroke='#9ab5ab' strokeDasharray='7 5'/>
          <Text x={x+275} y={393} size={18} bold color={muted}>pmxcfs 进程内部</Text>
          <Card x={x+50} y={411} w={210} title='quorum 检查' value={deniedNode?'拒绝新写入':'允许此写入'} color={deniedNode?red:green} small/>
          <Card x={x+295} y={411} w={215} title='DCDB / DFSM' value={s.delivered[i]?'已交付 W1':'操作 / 接收'} color={blue} small/>
          <Wire points={[[x+155,355],[x+155,411]]} frame={f} active={i===0&&s.request&&!s.accepted||deniedNode&&f>=s.secondRequest&&!s.denied} color={deniedNode?red:blue}/>
          <Wire points={[[x+260,460],[x+295,460]]} frame={f} active={i===0&&s.accepted&&!s.sent} color={green} dashed={deniedNode}/>
          <Card x={x+50} y={532} w={460} title='memdb · 内存配置树' value={`内容 v${s.memory[i]?2:1}${s.memory[i]&&!s.database[i]?' · 本地操作处理中':''}`} color={s.memory[i]?green:muted} small/>
          <Wire points={[[x+400,501],[x+400,532]]} frame={f} active={s.delivered[i]&&!s.memory[i]} progress={progress(f,arrival,memAt-arrival)} color={blue}/>
          <Card x={x+50} y={652} w={460} title='SQLite · 本地配置数据库' value={s.database[i]?'W1 本地更新完成':s.memory[i]?'正在更新本地数据库':'保留配置 v1'} color={s.database[i]?green:muted} small/>
          <Wire points={[[x+280,622],[x+280,652]]} frame={f} active={s.memory[i]&&!s.database[i]} progress={progress(f,memAt,dbAt-memAt)} color={blue}/>
          <Card x={x+50} y={790} w={460} title='Corosync · CPG 组通信' value={deniedNode?'分区已稳定 · 无新写操作':'一致顺序交付 · 含发送节点'} color={deniedNode?red:blue} small/>
          <Wire points={[[x+510,445],[x+550,445],[x+550,830],[x+510,830]]} frame={f} active={i===0&&!blocked&&f>=b.send&&!s.sent} progress={progress(f,b.send,35)} color={blue}/>
          <Wire points={[[x+50,835],[x+30,835],[x+30,513],[x+400,513],[x+400,501]]} frame={f} active={!blocked&&f>=b.deliver+i*12&&!s.delivered[i]} progress={progress(f,b.deliver+i*12,30)} color={blue}/>
          {i===0&&<Wire points={[[x+50,696],[x+8,696],[x+8,322],[x+50,322]]} frame={f} active={s.localResult&&!s.returned} progress={progress(f,b.localResult,b.returned-b.localResult)} color={green}/>}
          {deniedNode&&<Wire points={[[x+50,453],[x+7,453],[x+7,326],[x+50,326]]} frame={f} active={f>=s.secondRequest+25&&!s.denied} progress={progress(f,s.secondRequest+25,30)} color={red}/>}
          {deniedNode&&s.readBack&&<Text x={x+55} y={776} size={19} bold color={green}>本地读取：保留的配置 v{s.versions[i]}</Text>}
          {deniedNode&&<Wire points={[[x+50,575],[x+21,575],[x+21,344],[x+50,344]]} frame={f} active={f>=(blocked?s.secondRequest+80:b.read)&&!s.readBack} progress={progress(f,blocked?s.secondRequest+80:b.read,30)} color={green}/>}
        </g>;
      })}
      <Wire points={[[570,880],[570,930],[1580,930],[1580,880]]} frame={f} active={s.sent&&!s.delivered[2]} progress={progress(f,b.send+35,b.deliver+24-b.send-35)} color={blue} dashed={s.isolated}/>
      <Wire points={[[570,880],[570,930],[960,930],[960,880]]} frame={f} active={s.sent&&!s.delivered[1]} color={blue}/>
      <Wire points={[[330,790],[330,766],[570,766],[570,790]]} frame={f} active={s.sent&&!s.delivered[0]} color={blue}/>
      <Text x={982} y={963} size={19} center bold color={blue}>CPG 逻辑路径：传写操作，不复制数据库文件</Text>
      <Text x={60} y={993} size={17} color={muted}>{s.chapter===2&&!blocked?'返回依据是本机交付处理结果；不画所有节点的落盘 ACK。':'教学编排，非实测时延 · v1/v2 为示意 · 虚拟机磁盘另属存储层'}</Text>
      <Text x={1800} y={993} size={18} center color={green}>{blocked?'无 quorum':`${s.chapter+1} / 4`}</Text>
      <rect y={1010} width={1920} height={70} fill='#ecefe8'/><Text x={960} y={1055} size={30} center bold>{caption}</Text>
      <rect y={1075} width={1920*(f+1)/PMXCFS_DURATION} height={5} fill={green}/>
    </svg>
    {!blocked&&audio.map(c=><Sequence key={c.file} from={Math.round(c.start*30)} durationInFrames={Math.round((c.end-c.start)*30)} layout='none'><Html5Audio src={staticFile(c.file)}/></Sequence>)}
  </AbsoluteFill>;
}
