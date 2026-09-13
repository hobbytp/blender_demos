import {useEffect,useState,type ReactNode} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,Html5Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Card,Text,Wire} from './HaPilot';
import audio from './migration-audio.json';
import {MIGRATION_DURATION,migrationBeats as beats,migrationStateAt} from './migration-timeline';

const ink='#243f4b',green='#347d70',blue='#347aa8',amber='#b18635',red='#b96b50',muted='#73847e',paper='#f8f7f2';
const ramp=(f:number,start:number,length=24)=>Math.max(0,Math.min(1,(f-start)/length));
const tile=(side:number,index:number)=>({x:100+side*980+(index%4)*176,y:430+Math.floor(index/4)*104});

export function MigrationPilot({failed=false}:{failed?:boolean}){
  const f=useCurrentFrame(),s=migrationStateAt(f,failed);
  const titles=['源端继续运行，内存先传过去','已传过的页，又被修改了','最后一次同步，为什么要暂停？','交接配置归属，再恢复目标执行'];
  const notes=['同一健康集群 · C → B · 本片从目标接收进程准备开始','脏页表示内容又变了；不是内存损坏，也不是磁盘脏块','暂停窗口为讲解放大：剩余 RAM + vCPU / 设备状态','QEMU 传输完成、配置交接、目标执行，是三个步骤'];
  const caption=failed?(s.cancelled?'仅示意切换前传输失败：源端仍可运行，目标接收进程清理。':'失败对照（无旁白）：目标尚未执行，源端和控制路径可用。'):audio.find(c=>f>=c.start*30&&f<(c.start+c.duration+.3)*30)?.captions.filter(c=>c.start*30<=f).at(-1)?.text??'';
  return <>
    <MigrationScene frame={f} state={s} title={s.cancelled?'切换前失败，源端继续运行':titles[s.chapter]} note={s.cancelled?'限定分支：源端健康、尚未暂停交接；不能外推为任意失败都可回退':notes[s.chapter]} caption={caption}/>
    {!failed&&audio.map(c=><Sequence key={c.file} from={Math.round(c.start*30)} durationInFrames={Math.round((c.end-c.start)*30)} layout='none'><Html5Audio src={staticFile(c.file)}/></Sequence>)}
  </>;
}

export function MigrationScene({frame:f,state:s,title,note,caption,timing=beats,duration=MIGRATION_DURATION,chapterCount=4,dim=false,children}:{frame:number;state:ReturnType<typeof migrationStateAt>;title:string;note:string;caption:string;timing?:typeof beats;duration?:number;chapterCount?:number;dim?:boolean;children?:ReactNode}){
  const [handle]=useState(()=>delayRender('Migration scene font'));
  useEffect(()=>{new FontFace('Quorum Noto',`url(${staticFile('fonts/NotoSansSC.ttf')})`,{weight:'100 900'}).load().then(font=>{document.fonts.add(font);continueRender(handle);}).catch(cancelRender);},[handle]);
  return <AbsoluteFill style={{background:paper,fontFamily:'Quorum Noto, sans-serif'}}>
    <svg viewBox='0 0 1920 1080' width='100%' height='100%' role='img' aria-label='热迁移内部机制：内存脏页、最终同步与执行交接'>
      <defs>{[green,blue,amber,red,muted].map(color=><marker key={color} id={`ha-${color.slice(1)}`} markerWidth={7} markerHeight={7} refX={6} refY={3.5} orient='auto'><path d='M1 1 L6 3.5 L1 6' fill='none' stroke={color} strokeWidth={1.5}/></marker>)}</defs>
      <Text x={60} y={47} size={20} bold color={green}>PVE 02 / LIVE MIGRATION · INSIDE QEMU</Text>
      <Text x={60} y={112} size={43} bold>{title}</Text>
      <Text x={62} y={158} size={23} color={muted}>{note}</Text>
      <g transform='translate(1590,50)'><path d='M0 0 H95 L190 60 H0 Z' fill='none' stroke='#adc8c5' strokeWidth={2}/>{[[0,0,'A'],[95,0,'B'],[190,60,'C']].map(([x,y,name])=><g key={name} transform={`translate(${x},${y})`}><circle r={20} fill='#e0ede5' stroke={green}/><Text x={0} y={8} size={22} center bold>{name}</Text></g>)}<Text x={42} y={108} size={17} color={green}>全部节点有 quorum</Text></g>

      <rect x={60} y={210} width={850} height={565} rx={20} fill='#f1eae2' stroke='#d7c8bc'/>
      <rect x={1040} y={210} width={820} height={565} rx={20} fill='#e6eee7' stroke='#c7d7ce'/>
      <Text x={90} y={251} size={29} bold>源节点 C · VM 100</Text><Text x={1070} y={251} size={29} bold>目标节点 B · incoming</Text>
      <Text x={580} y={251} size={22} bold color={s.sourceExecuting?green:amber}>{s.sourceExecuting?'执行中':s.sourceProcessExists?'已停执行 / 进程保留':'源 QEMU 已清理'}</Text>
      <Text x={1535} y={251} size={22} bold color={s.targetExecuting?green:muted}>{s.targetExecuting?'执行中':s.cleaned?'接收进程已清理':s.targetProcessExists?'仅接收 / 不执行':'尚未准备接收进程'}</Text>

      <g opacity={dim?.18:1}>
      <Card x={100} y={285} w={330} title='vCPU · 来宾指令执行' value={s.sourceExecuting?'运行 / 可修改 RAM':s.sourceProcessExists?'已暂停，不再执行指令':'源 QEMU 进程已清理'} color={s.sourceExecuting?green:amber} small/>
      <Card x={535} y={285} w={335} title='QEMU · 迁移发送端' value={s.cancelled?'传输中止':s.completed?'状态传输 completed':s.paused?'最终状态同步':'pre-copy / 脏页跟踪'} color={s.cancelled?red:blue} small/>
      <Card x={1080} y={285} w={335} title='QEMU · 迁移接收端' value={s.cleaned?'已清理':s.completed?'状态齐备':s.targetProcessExists?'接收并装载状态':'准备 incoming'} color={s.cleaned?muted:blue} small/>
      <Card x={1490} y={285} w={330} title='vCPU · 执行门' value={s.targetExecuting?'恢复指令执行':'尚未恢复执行'} color={s.targetExecuting?green:amber} small/>
      <Wire points={[[870,330],[1080,330]]} frame={f} active={!s.cancelled&&s.targetProcessExists&&!s.completed} color={s.cancelled?red:blue} dashed={s.cancelled}/>
      <Text x={975} y={300} size={18} center color={blue}>迁移数据流</Text>
      <Wire points={[[430,350],[475,350],[475,430]]} frame={f} active={s.sourceExecuting} color={green}/>
      <Text x={95} y={411} size={20} bold>源 RAM · 8 组页的教学示意</Text>
      <Text x={1080} y={411} size={20} bold>目标 RAM · 接收副本 ≠ 运行副本</Text>

      {[s.source,s.destination].map((versions,side)=><g key={side} opacity={side===0&&!s.sourceProcessExists||side===1&&s.cleaned?.35:1}>
        {versions.map((version,i)=>{
          const p=tile(side,i),pending=s.pending[i],changed=side===0&&version>1;
          const color=side===0?(pending&&changed?amber:blue):version===0?muted:pending?amber:green;
          const flash=side===0&&((i===2&&f>=timing.dirty&&f<timing.dirty+18)||(i===5&&f>=timing.dirty5&&f<timing.dirty5+18)||(i===2&&f>=timing.redirty&&f<timing.redirty+18));
          return <g key={i}><rect x={p.x} y={p.y} width={155} height={86} rx={10} fill={flash?'#f5ddb3':version===0?'#f5f4ee':side===0?'#fffaf0':'#f5fbf5'} stroke={color} strokeWidth={flash?4:2} strokeDasharray={version===0?'5 5':undefined}/><Text x={p.x+15} y={p.y+28} size={19} bold color={color}>P{i}</Text><Text x={p.x+15} y={p.y+64} size={24} bold>{version?`v${version}`:'待接收'}</Text>{side===0&&changed&&pending&&<Text x={p.x+75} y={p.y+63} size={18} color={amber}>脏 *</Text>}{side===1&&version>0&&pending&&<Text x={p.x+75} y={p.y+63} size={18} color={amber}>旧值</Text>}</g>;
        })}
      </g>)}
      {s.inFlight.map(t=>{
        const a=tile(0,t.page),b=tile(1,t.page),p=ramp(f,t.start,t.end-t.start),x=a.x+77+(b.x-a.x)*p,y=a.y+43-80*Math.sin(p*Math.PI);
        return <g key={`${t.page}-${t.version}`}><path d={`M${a.x+77} ${a.y+43} Q${(a.x+b.x)/2+77} ${a.y-110} ${b.x+77} ${b.y+43}`} fill='none' stroke={t.version>1?amber:blue} strokeDasharray='5 5' opacity={.3}/><rect x={x-39} y={y-19} width={78} height={38} rx={8} fill={t.version>1?amber:blue} stroke={paper} strokeWidth={3}/><Text x={x} y={y+7} size={19} color='#fffefa' center bold>P{t.page} v{t.version}</Text></g>;
      })}

      <Text x={100} y={655} size={19} bold color={s.cancelled?muted:amber}>{s.cancelled?'跟踪撤销 · 下方不再表示待迁移集合':'待发送集合 · 未传或再次变脏'}</Text>
      {s.pending.map((pending,i)=><g key={i}><rect x={100+i*68} y={672} width={52} height={36} rx={6} fill={!s.cancelled&&pending?amber:'#e1e8e0'}/><Text x={126+i*68} y={697} size={19} center color={!s.cancelled&&pending?'#fffefa':muted}>{i}</Text></g>)}
      <Text x={665} y={698} size={24} bold color={amber}>{s.cancelled?'中止':`${s.pending.filter(Boolean).length} 组待传`}</Text>
      <Text x={100} y={746} size={18} color={muted}>v1 / v2 / v3 仅用于辨识变化，不是迁移协议中的版本号</Text>

      <rect x={1080} y={651} width={740} height={100} rx={12} fill='#fffefa' stroke={s.deviceReady?green:'#c7d7ce'} strokeWidth={2}/>
      <Text x={1100} y={683} size={22} bold color={s.deviceReady?green:amber}>最终 vCPU / 虚拟设备状态</Text>
      <Text x={1100} y={725} size={25} bold>{s.cancelled?'未交接':s.targetExecuting?'状态已交接 · 执行已恢复':s.deviceReady?'已装载 · 等待管理层恢复':s.paused?'暂停窗口内完成一致性同步':'等待源端暂停与最终同步'}</Text>
      {s.paused&&!s.deviceReady&&f>=timing.device&&<Wire points={[[870,365],[975,365],[975,701],[1080,701]]} frame={f} active color={amber} progress={ramp(f,timing.device,42)}/>}
      </g>

      <Wire points={[[360,775],[360,817],[815,817],[815,844]]} frame={f} active={s.sourceExecuting} color={blue}/>
      <Wire points={[[1550,775],[1550,817],[1105,817],[1105,844]]} frame={f} active={s.targetExecuting} color={blue} dashed={!s.targetExecuting}/>
      <Text x={420} y={805} size={18} color={blue}>来宾磁盘 I/O</Text><Text x={1220} y={805} size={18} color={blue}>来宾磁盘 I/O</Text>
      <rect x={815} y={844} width={290} height={83} rx={15} fill='#fffefa' stroke={blue} strokeWidth={2}/>
      <Text x={960} y={877} size={25} bold center color={blue}>共享 NFS</Text><Text x={960} y={909} size={20} center>同一磁盘 · 不复制</Text>
      <rect x={65} y={850} width={655} height={80} rx={12} fill='#ecefe8'/>
      <Text x={85} y={879} size={21} bold>PVE 管理层 · 配置归属：{s.configOwner}</Text>
      <Text x={85} y={914} size={22} color={s.configMoved?green:muted}>{s.cancelled?'失败清理，保留 C 的归属':s.configMoved?'已转到 B，发出 resume':s.completed?'传输完成，准备交接':'准备目标 → QMP migrate → 查询状态'}</Text>
      <Wire points={[[720,900],[780,900],[780,952],[1880,952],[1880,390],[1655,390],[1655,375]]} frame={f} active={s.configMoved&&!s.targetExecuting} color={green}/>
      <rect x={1190} y={850} width={655} height={80} rx={12} fill={s.targetExecuting?'#d4e7d9':'#f1eae2'}/>
      <Text x={1210} y={880} size={22} bold color={s.targetExecuting?green:amber}>{s.cancelled?'源端继续，目标不执行':s.targetExecuting?'目标继续原来的运行状态':s.paused?'暂停窗口 · 为讲解放大':s.targetProcessExists?'目标已有进程，但来宾未执行':'目标尚未建立接收进程'}</Text>
      <Text x={1210} y={914} size={19} color={muted}>{s.targetExecuting?'源进程随后清理；不需要重新启动来宾系统':'主机 QEMU 进程存在 ≠ 来宾 vCPU 正在运行'}</Text>
      {children}
      <Text x={65} y={986} size={18} color={muted}>教学编排，非实测停顿 · 共享存储 / pre-copy · 未演示 post-copy 或本地磁盘迁移</Text>
      <Text x={1770} y={986} size={18} color={green} center>{s.cancelled?'失败对照':`${s.chapter+1} / ${chapterCount}`}</Text>
      <rect y={1010} width={1920} height={70} fill='#ecefe8'/><Text x={960} y={1055} size={30} center bold>{caption}</Text>
      <rect y={1075} width={1920*(f+1)/duration} height={5} fill={green}/>
    </svg>
  </AbsoluteFill>;
}
