import {useEffect, useState, type ReactNode} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, Html5Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import audio from './ha-audio.json';
import {HA_DURATION, haBeats, haStateAt} from './ha-timeline';

const ink='#243f4b', green='#347d70', blue='#347aa8', amber='#b18635', red='#b96b50', muted='#73847e', paper='#f8f7f2';
const ramp=(f:number,start:number,length=20)=>Math.max(0,Math.min(1,(f-start)/length));
function Text({x,y,children,size=24,color=ink,bold=false,center=false}:{x:number;y:number;children:ReactNode;size?:number;color?:string;bold?:boolean;center?:boolean}) {
  return <text x={x} y={y} fontSize={size} fill={color} fontWeight={bold?700:400} textAnchor={center?'middle':'start'}>{children}</text>;
}
function Card({x,y,w,title,value,color=blue,small=false}:{x:number;y:number;w:number;title:string;value:string;color?:string;small?:boolean}) {
  return <g><rect x={x} y={y} width={w} height={90} rx={12} fill='#fffefa' stroke={color} strokeWidth={1.6}/><Text x={x+20} y={y+32} size={22} bold color={color}>{title}</Text><Text x={x+20} y={y+67} size={small?21:26} bold>{value}</Text></g>;
}
// All particles derive from the current frame, including reverse seeking.
function Wire({points,frame,active=false,color=amber,dashed=false,progress}:{points:number[][];frame:number;active?:boolean;color?:string;dashed?:boolean;progress?:number}) {
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
  let distance=(progress??((frame%48)/48))*lengths.reduce((a,b)=>a+b,0), x=points[0][0],y=points[0][1];
  for(let i=0;i<lengths.length;i++) {const t=Math.min(1,distance/lengths[i]);x=points[i][0]+t*(points[i+1][0]-points[i][0]);y=points[i][1]+t*(points[i+1][1]-points[i][1]);if(distance<=lengths[i])break;distance-=lengths[i];}
  return <g><polyline points={points.map(p=>p.join(',')).join(' ')} fill='none' stroke={color} strokeWidth={2.5} strokeDasharray={dashed?'7 7':undefined} strokeLinejoin='round' markerEnd={`url(#ha-${color.slice(1)})`} opacity={active?1:.4}/>{active&&<rect x={x-6} y={y-6} width={12} height={12} rx={3} fill={color} stroke={paper} strokeWidth={2}/>}</g>;
}

export function HaPilot({normal=false}:{normal?:boolean}) {
  const f=useCurrentFrame(), s=haStateAt(f,normal);
  const [handle]=useState(()=>delayRender('HA lesson font'));
  useEffect(()=>{new FontFace('Quorum Noto',`url(${staticFile('fonts/NotoSansSC.ttf')})`,{weight:'100 900'}).load().then(font=>{document.fonts.add(font);continueRender(handle);}).catch(cancelRender);},[handle]);
  const titles=['失去 quorum，VM 却还在运行','谁让旧实例真正退出？','多数侧有 quorum，仍要等待','安全条件成立，才允许恢复'];
  const notes=['只中断 C 的集群通信；业务与存储路径仍通。','本地续期 → watchdog-mux → 主机 watchdog','B 等待的是旧节点 agent lock，不是远程关机回执。','本片到恢复入口为止；目标 VM 尚未启动。'];
  const caption=normal?'正常对照：续锁成功 → 本地续期 → watchdog 持续受控。':audio.flatMap(c=>c.captions).filter(c=>c.start*30<=f).at(-1)?.text??'节点失联，但旧虚拟机可能仍在运行。';
  const cColor=s.hostReset?muted:s.quorumLost?red:green;
  const resetFlash=s.hostReset?1-ramp(f,haBeats.reset,18):0;
  const eventRows=normal?[{name:'C 本机',items:['续锁成功','本地续期','持续喂狗'],done:[true,true,true],color:green},
    {name:'B 决策',items:['持管理锁','读执行结果','维持现状'],done:[true,true,true],color:green}]:
    [{name:'C 本机',items:['续锁失败','停止喂狗','主机复位'],done:[s.lockLost,s.muxExpired,s.hostReset],color:red},
    {name:'B 决策',items:['状态未知','取得旧锁','允许恢复'],done:[s.quorumLost,s.lockAcquired,s.recovery],color:green}];
  return <AbsoluteFill style={{background:paper,fontFamily:'Quorum Noto, sans-serif'}}>
    <svg viewBox='0 0 1920 1080' width='100%' height='100%' role='img' aria-label='HA 自隔离与安全恢复机制'>
      <defs>{[blue,green,amber,red,muted].map(color=><marker key={color} id={`ha-${color.slice(1)}`} markerWidth={7} markerHeight={7} refX={6} refY={3.5} orient='auto'><path d='M1 1 L6 3.5 L1 6' fill='none' stroke={color} strokeWidth={1.5}/></marker>)}</defs>
      <Text x={60} y={48} size={20} bold color={green}>PVE / HA · INSIDE THE NODE</Text>
      <Text x={60} y={112} size={43} bold>{normal?'正常时，锁与 watchdog 怎样配合？':titles[s.chapter]}</Text>
      <Text x={62} y={159} size={25} color={muted}>{normal?'同一拓扑 · C 运行 VM 100 · B 为 active CRM':notes[s.chapter]}</Text>
      <g transform='translate(1570,46)'>
        <path d='M0 0 H100 L200 64 H0 Z M100 0 V64' fill='none' stroke='#adc8c5' strokeWidth={2}/>
        {s.partitioned&&<path d='M142 10 L163 77' stroke={red} strokeWidth={4} strokeDasharray='5 5'/>}
        {[[0,0,'A'],[100,0,'B'],[200,64,'C']].map(([x,y,name])=><g key={name} transform={`translate(${x},${y})`}><circle r={20} fill={name==='C'&&s.partitioned?'#f1e1d8':'#e0ede5'} stroke={name==='C'&&s.partitioned?red:green}/><Text x={0} y={8} size={22} center bold>{name}</Text></g>)}
        <Text x={55} y={107} size={17} color={muted}>全局位置参照</Text>
      </g>
      <rect x={60} y={213} width={850} height={558} rx={20} fill='#f1eae2' stroke={resetFlash>0?red:'#d7c8bc'} strokeWidth={resetFlash>0?5:1}/>
      <rect x={1010} y={213} width={850} height={558} rx={20} fill='#e6eee7' stroke='#c7d7ce'/>
      <Text x={88} y={256} size={29} bold>节点 C · 本机内部</Text>
      <Text x={610} y={255} size={22} bold color={cColor}>{s.hostReset?'主机已复位':s.quorumLost?'1 票 / 无 quorum':s.partitioned?'通信异常 / 检测中':'3 票 / 有 quorum'}</Text>
      <Text x={1038} y={256} size={29} bold>{s.quorumLost?'多数侧 A+B · 展开节点 B':'节点 B · 集群决策'}</Text>
      <Text x={1640} y={255} size={22} bold color={green}>{s.quorumLost?'2 票 / 有 quorum':'3 票 / 有 quorum'}</Text>
      <Text x={90} y={294} size={18} color={muted}>剖面所见：本机实际变化</Text>
      <Text x={1040} y={294} size={18} color={muted}>CRM 所知：以集群状态与锁结果为依据</Text>

      <g opacity={s.hostReset?.43:1}>
        <Card x={100} y={326} w={345} title='pmxcfs · C 的 agent lock' value={s.hostReset?'离线':s.lockLost?'续锁失败':s.quorumLost?'只读':'续锁成功'} color={s.quorumLost?red:green}/>
        <Card x={530} y={326} w={340} title='LRM · 本地资源管理' value={s.hostReset?'进程停止':s.lockLost?'lost_agent_lock':'active'} color={s.lockLost?red:blue} small/>
        <Wire points={[[530,347],[445,347]]} frame={f} active={!s.lockLost} color={s.lockLost?red:blue}/>
        <Wire points={[[445,392],[530,392]]} frame={f+24} active={!s.lockLost} color={green}/>
        <Text x={480} y={376} center size={17} color={s.lockLost?red:blue}>{s.lockLost?'× 失败':'续锁'}</Text>
        <Wire points={[[700,416],[700,495]]} frame={f} active={!s.lockLost} dashed={s.lockLost}/>
        <Text x={530} y={460} size={18} color={s.lockLost?red:amber}>{s.lockLost?'× 本地续期中止':'本地续期'}</Text>
        <Text x={728} y={460} size={16} color={muted}>UNIX socket</Text>
        <Card x={530} y={495} w={340} title='watchdog-mux · 复用器' value={s.muxExpired?'客户端超期 / 停止喂狗':'监督客户端续期'} color={s.muxExpired?red:amber} small/>
        <Card x={100} y={495} w={345} title='主机 watchdog' value={s.hostReset?'超时触发复位':s.muxExpired?'未获喂狗 / 等待超时':'已武装 / 持续获喂狗'} color={s.muxExpired?red:amber} small/>
        <Wire points={[[530,554],[445,554]]} frame={f} active={!s.muxExpired} color={amber} dashed={s.muxExpired}/>
        <Text x={483} y={526} size={17} center color={amber}>喂狗</Text>
      </g>
      <Wire points={[[273,585],[273,641]]} frame={f} active={s.hostReset&&f<haBeats.reset+24} color={red} progress={ramp(f,haBeats.reset,24)}/>
      <rect x={100} y={646} width={345} height={85} rx={12} fill={s.hostReset?'#ead4c7':'#f8f4ed'}/>
      <Text x={120} y={682} size={25} bold color={s.hostReset?red:muted}>{s.hostReset?'主机复位 · 旧进程退出':'自隔离保护已武装'}</Text>
      <Text x={120} y={712} size={18} color={muted}>前提：watchdog 工作正常</Text>
      <Card x={530} y={646} w={340} title='VM 100 · QEMU 实际状态' value={s.oldVmRunning?'仍在运行':'旧实例已停止'} color={s.oldVmRunning?green:red}/>
      {s.oldVmRunning&&<rect x={550} y={722} width={280*((f%75)/75)} height={4} rx={2} fill={green}/>}

      <Card x={1050} y={326} w={345} title='active CRM · 决策者' value={s.recovery?'允许恢复':s.fenceConfirmed?'fencing 条件成立':s.quorumLost?'C 状态未知 / 等待':'正常协作'} color={s.fenceConfirmed?green:blue} small/>
      <Card x={1480} y={326} w={340} title='pmxcfs · 旧节点锁' value={s.lockAcquired?'取得 C 的 agent lock':s.fenceWaiting?'尝试获取 / 未成功':'C 的 agent lock'} color={s.lockAcquired?green:amber} small/>
      <Wire points={[[1395,347],[1480,347]]} frame={f} active={s.fenceWaiting&&!s.lockAcquired} color={blue}/>
      <Wire points={[[1480,392],[1395,392]]} frame={f} active={s.lockAcquired&&!s.fenceConfirmed} color={green} progress={ramp(f,haBeats.lockAcquired,24)}/>
      <Text x={1438} y={376} size={17} center color={s.lockAcquired?green:amber}>{s.lockAcquired?'成功':'锁操作'}</Text>
      <Wire points={[[1223,416],[1223,495]]} frame={f} active={s.recovery&&f<haBeats.recovery+35} color={s.recovery?green:amber} progress={ramp(f,haBeats.recovery,35)}/>
      <rect x={1050} y={495} width={770} height={100} rx={13} fill={s.recovery?'#d4e7d9':'#fffefa'} stroke={s.recovery?green:'#bfcfc3'} strokeWidth={2}/>
      <Text x={1075} y={531} size={23} bold color={green}>VM 100 · HA 管理状态</Text>
      <Text x={1075} y={572} size={30} bold>{s.recovery?'recovery · 放行后续恢复':s.fenceWaiting?'fence · 等待隔离条件':s.quorumLost?'started · 等待离线判断':'started · 配置在 C'}</Text>
      <g transform='translate(1750,541)'>
        <rect x={-17} y={1} width={35} height={28} rx={5} fill={s.recovery?green:amber}/>
        <path d={s.recovery?'M-10 1 V-9 Q-10 -25 8 -20':'M-10 1 V-9 C-10 -23 10 -23 10 -9 V1'} fill='none' stroke={s.recovery?green:amber} strokeWidth={5}/>
      </g>
      <Text x={1055} y={644} size={23} bold color={s.fenceConfirmed?green:amber}>{s.fenceConfirmed?'✓ 安全依据：成功取得旧节点 agent lock':'等待期间，不启动另一份 VM 100'}</Text>
      <Text x={1055} y={687} size={21} color={muted}>{s.hostReset&&!s.fenceConfirmed?'C 已复位 ≠ B 已收到停机证明':'没有来自 C 的“已关机 ACK”'}</Text>
      <Text x={1055} y={729} size={20} color={muted}>目标 VM：尚未启动　·　应用：尚未恢复</Text>

      <Wire points={[[700,736],[700,810],[815,810],[815,829]]} frame={f} active={s.oldVmRunning} color={blue}/>
      <Wire points={[[1590,771],[1590,810],[1105,810],[1105,829]]} frame={f} color={blue} dashed/>
      <rect x={815} y={831} width={290} height={92} rx={15} fill='#fffefa' stroke={blue} strokeWidth={2}/>
      <Text x={960} y={869} size={25} bold center color={blue}>共享 NFS</Text>
      <Text x={960} y={900} size={21} center>同一磁盘 · 始终原位</Text>
      <Text x={565} y={813} size={18} color={blue}>磁盘 I/O</Text><Text x={1200} y={798} size={18} color={muted}>目标可访问 · 尚无新实例 I/O</Text>
      {eventRows.map((row,i)=><g key={row.name} transform={`translate(${i?1160:65},858)`}>
        <Text x={0} y={0} size={19} bold color={row.color}>{row.name}</Text>
        {row.items.map((item,j)=><g key={item} opacity={row.done[j]?1:.38}><circle cx={j*205+8} cy={31} r={5} fill={row.done[j]?row.color:muted}/>{j<2&&<path d={`M${j*205+18} 31 H${(j+1)*205-4}`} stroke={row.color} strokeWidth={2}/>}<Text x={j*205} y={64} size={20} color={row.color}>{item}</Text></g>)}
      </g>)}
      <Text x={65} y={975} size={18} color={muted}>{normal?'正常对照 · 无 QDevice · 集群通信可用':'两侧并行发生 · 无 QDevice · 持续网络分区'}</Text>
      <Text x={1130} y={975} size={18} color={muted}>教学时间轴，非实测计时 · 固定源码见配套笔记</Text>
      <rect y={1010} width={1920} height={70} fill='#ecefe8'/><Text x={960} y={1055} size={30} center bold>{caption}</Text>
      <rect y={1075} width={1920*(f+1)/HA_DURATION} height={5} fill={green}/>
    </svg>
    {!normal&&audio.map(clip=><Sequence key={clip.file} from={Math.round(clip.start*30)} durationInFrames={Math.round((clip.end-clip.start)*30)} layout='none'><Html5Audio src={staticFile(clip.file)}/></Sequence>)}
  </AbsoluteFill>;
}
