import {useEffect,useState} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,Html5Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Card,Text,Wire} from './HaPilot';
import audio from './ha-lesson-audio.json';
import {HA_LESSON_DURATION,haCue,haLessonBeats as beats,haLessonChapters,haLessonStateAt} from './ha-lesson-timeline';

const ink='#243f4b',green='#347d70',blue='#347aa8',amber='#b18635',red='#b96b50',muted='#73847e',paper='#f8f7f2';
const ramp=(f:number,start:number,length=24)=>Math.max(0,Math.min(1,(f-start)/length));
const titles=['旧 VM 还活着，何时才敢接管？','打开节点：谁决策，谁执行？','先看正常路径：锁、续期与协作','只断集群通信，业务仍可能继续','续锁失败，不等于立即停止 VM','两层 watchdog，让旧实例退出','回看并行发生的多数侧等待','成功来自锁操作，不是关机回执','恢复不是一道远程启动命令','VM 已运行，应用就一定可用吗？','暂停判断：现在能启动吗？','两条因果链，共同构成安全接管'];
const notes=['问题预览 · C 的业务与存储网络仍通','回到故障前 · CRM 管理锁 ≠ 节点 agent lock','短脉冲是本地调用；矩形消息是配置层协作','固定场景：每节点一票，三票集群，无 QDevice','失去 quorum → 配置层只读 → agent lock 更新失败','LRM 客户端续期 → watchdog-mux → 主机 watchdog','这是同一次故障的另一侧；不是此刻才开始检测','锁的有效性约束 + 工作正常的 watchdog 保护','本例选择 B；目标由放置规则与可用条件共同决定','HA 期望状态 / QEMU 实际状态 / 独立应用探测','假设仍未取得旧节点锁：有 quorum 是否足够？','配置归属改变，磁盘始终原位；恢复实例重新启动'];

export function HaLesson({normal=false}:{normal?:boolean}) {
  const f=useCurrentFrame(),s=haLessonStateAt(f,normal),ch=s.chapter;
  const [handle]=useState(()=>delayRender('HA full lesson font'));
  useEffect(()=>{new FontFace('Quorum Noto',`url(${staticFile('fonts/NotoSansSC.ttf')})`,{weight:'100 900'}).load().then(font=>{document.fonts.add(font);continueRender(handle);}).catch(cancelRender);},[handle]);
  const activeClip=audio.find(c=>f>=c.start*30&&f<(c.start+c.duration+.4)*30);
  const caption=normal?'正常对照：成功续锁后才续期；管理状态和执行结果经配置层协作。':activeClip?.captions.filter(c=>c.start*30<=f).at(-1)?.text??'';
  const normalFlow=normal||ch===2;
  // Staged reveals preserve node identity and every component's coordinates.
  const revealed=(at:number)=>normal||ch>=2?1:ch===0?.12:.12+.88*ramp(f,at,30);
  const localFlow=normalFlow||ch===4||ch===5;
  const cfsFlow=normalFlow&&(normal?f%600>=300:f>=haCue('另一条路径负责管理协作。'));
  const lockPhase=f%150, collaborationPhase=f%240;
  const cDim=ch>=6?.52:1,bDim=ch===4||ch===5?.48:1;
  const cStatus=s.hostReset?'主机已复位':s.quorumLost?'1 票 / 无 quorum':s.partitioned?'成员检测中':'3 票 / 有 quorum';
  const bStatus=s.quorumLost?'2 票 / 有 quorum':'3 票 / 有 quorum';
  const quiz=ch===10&&!normal,answer=f>=380*30;
  const chapterStart=haLessonChapters[ch].start*30;
  const progress=(f-chapterStart)/((haLessonChapters[ch].end-haLessonChapters[ch].start)*30);
  const focus=ch===4?{x:90,y:320,w:790,h:106}:ch===5?{x:90,y:482,w:790,h:119}:ch===7?{x:1040,y:320,w:790,h:106}:ch===8?{x:1040,y:484,w:790,h:257}:null;
  const eventRows=normal?[
    {name:'C 本机 · 正常保护',x:65,color:green,steps:['续锁成功','本地续期','持续喂狗'],done:[true,true,true]},
    {name:'B 决策 · 正常协作',x:1160,color:green,steps:['持管理锁','读取结果','维持现状'],done:[true,true,true]},
  ]:[
    {name:'C 本机 · 客观状态',x:65,color:red,steps:['失锁','停止喂狗','复位'],done:[s.lockLost,s.muxExpired,s.hostReset]},
    {name:'B 决策 · 已知依据',x:1160,color:green,steps:['未知 / 等待','取得旧锁','恢复'],done:[s.quorumLost,s.lockAcquired,s.recovery]},
  ];
  return <AbsoluteFill style={{background:paper,fontFamily:'Quorum Noto, sans-serif'}}>
    <svg viewBox='0 0 1920 1080' width='100%' height='100%' role='img' aria-label='PVE HA 完整讲解：节点内部协作、自隔离与资源恢复'>
      <defs>{[blue,green,amber,red,muted].map(color=><marker key={color} id={`ha-${color.slice(1)}`} markerWidth={7} markerHeight={7} refX={6} refY={3.5} orient='auto'><path d='M1 1 L6 3.5 L1 6' fill='none' stroke={color} strokeWidth={1.5}/></marker>)}</defs>
      <Text x={60} y={47} size={20} bold color={green}>PVE 01 / HA · INSIDE THE NODE</Text>
      <Text x={60} y={112} size={42} bold>{normal?'正常对照：沿着内部路径观察':titles[ch]}</Text>
      <Text x={62} y={158} size={24} color={muted}>{normal?'同一拓扑 · C 运行 VM 100 · B 为 active CRM':notes[ch]}</Text>
      <g transform='translate(1570,45)'>
        <path d='M0 0 H100 L200 64 H0 Z M100 0 V64' fill='none' stroke='#adc8c5' strokeWidth={2}/>
        {s.partitioned&&<path d='M142 10 L163 77' stroke={red} strokeWidth={4} strokeDasharray='5 5'/>}
        {[[0,0,'A'],[100,0,'B'],[200,64,'C']].map(([x,y,name])=><g key={name} transform={`translate(${x},${y})`}><circle r={20} fill={name==='C'&&s.partitioned?'#f1e1d8':'#e0ede5'} stroke={name==='C'&&s.partitioned?red:green}/><Text x={0} y={8} size={22} center bold>{name}</Text></g>)}
        <Text x={65} y={107} size={17} color={muted}>固定拓扑参照</Text>
      </g>
      <g opacity={quiz?.15:1}>
        <rect x={60} y={210} width={850} height={568} rx={20} fill='#f1eae2' stroke='#d7c8bc'/>
        <rect x={1010} y={210} width={850} height={568} rx={20} fill='#e6eee7' stroke='#c7d7ce'/>
        <Text x={88} y={250} size={28} bold>节点 C · 本机内部</Text>
        <Text x={600} y={250} size={22} bold color={s.quorumLost?red:green}>{cStatus}</Text>
        <Text x={1038} y={250} size={28} bold>节点 B · active CRM 所在</Text>
        <Text x={1610} y={250} size={22} bold color={green}>{bStatus}</Text>
        <g opacity={revealed(haCue('配置、锁和管理状态，'))}>
          <Wire points={[[270,330],[270,288],[1650,288],[1650,330]]} frame={f} active={cfsFlow&&collaborationPhase<100&&!s.partitioned} color={blue} dashed={s.partitioned}/>
          <Wire points={[[1650,330],[1650,304],[270,304],[270,330]]} frame={f} active={cfsFlow&&collaborationPhase>=150&&!s.partitioned} color={green} dashed={s.partitioned}/>
          <rect x={668} y={271} width={585} height={42} rx={8} fill={paper}/>
          <Text x={960} y={298} size={19} center color={s.partitioned?red:blue}>{s.partitioned?'× C 的全部 Corosync 通信路径中断':'配置层复制 · 各节点本地副本 · 非第四台服务器'}</Text>
        </g>
        <g opacity={cDim}>
          <g opacity={revealed(haCue('C的LRM持有本机代理锁，'))*(s.hostReset?.38:1)}>
            <Card x={100} y={330} w={345} title={cfsFlow?'pmxcfs · C 本地 HA 状态':'pmxcfs · C 的 agent lock'} value={s.lockLost?'更新失败 / 只读约束':cfsFlow?'管理期望 / 本机执行结果':'C 的 LRM 持有'} color={s.lockLost?red:green} small/>
            <Card x={530} y={330} w={340} title='LRM · 本地资源管理' value={s.lockLost?'lost_agent_lock':cfsFlow?'读取期望 / 写回结果':'active · 持有 agent lock'} color={s.lockLost?red:blue} small/>
            <Wire points={[[530,350],[445,350]]} frame={f} active={localFlow&&!s.lockLost&&(cfsFlow?collaborationPhase>=150&&collaborationPhase<200:lockPhase<50)} color={blue}/>
            <Wire points={[[445,397],[530,397]]} frame={f} active={localFlow&&!s.lockLost&&(cfsFlow?collaborationPhase>=100&&collaborationPhase<150:lockPhase>=50&&lockPhase<100)} color={green}/>
            <Text x={483} y={378} size={17} center color={s.lockLost?red:blue}>{s.lockLost?'× 失败':cfsFlow?'状态':'续锁'}</Text>
          </g>
          <g opacity={(normal||ch>=2?1:.12)*(s.hostReset?.38:1)}>
            <Wire points={[[700,420],[700,498]]} frame={f} active={localFlow&&!s.lockLost&&lockPhase>=100} dashed={s.lockLost} color={amber}/>
            <Text x={535} y={456} size={17} color={s.lockLost?red:amber}>{s.lockLost?'× 本地续期中止':'成功后续期'}</Text>
            <Text x={725} y={460} size={16} color={muted}>UNIX socket</Text>
            <Card x={530} y={498} w={340} title='watchdog-mux · 复用器' value={s.muxExpired?'客户端超期 / 停止喂狗':'监督 HA 客户端续期'} color={s.muxExpired?red:amber} small/>
            <Card x={100} y={498} w={345} title='主机 watchdog' value={s.hostReset?'超时触发复位':s.muxExpired?'等待设备超时':'已武装 / 持续获喂狗'} color={s.muxExpired?red:amber} small/>
            <Wire points={[[530,554],[445,554]]} frame={f} active={localFlow&&!s.muxExpired} color={amber} dashed={s.muxExpired}/>
            <Text x={483} y={527} size={17} center color={amber}>喂狗</Text>
          </g>
          <Wire points={[[273,588],[273,646]]} frame={f} active={s.hostReset&&f<beats.reset+36} color={red} progress={ramp(f,beats.reset,36)}/>
          <rect x={100} y={650} width={345} height={86} rx={12} fill={s.hostReset?'#ead4c7':'#f8f4ed'}/>
          <Text x={120} y={685} size={24} bold color={s.hostReset?red:muted}>{s.hostReset?'主机复位 · 旧进程退出':'客户端 → VM 100'}</Text>
          <Text x={120} y={717} size={18} color={muted}>{s.hostReset?'观众剖面所见 · 并非 B 的遥测':'业务请求 · 与集群通信分开'}</Text>
          <Wire points={[[445,691],[530,691]]} frame={f} active={s.oldVmRunning&&(ch===0||ch===3||ch===4)} color={green}/>
          <Card x={530} y={650} w={340} title='VM 100 · QEMU 实际状态' value={s.oldVmRunning?'旧实例运行中':'旧实例已停止'} color={s.oldVmRunning?green:red}/>
          {s.oldVmRunning&&<rect x={550} y={728} width={280*((f%75)/75)} height={4} fill={green}/>}
        </g>
        <g opacity={bDim}>
          <g opacity={revealed(haCue('B的CRM持有管理锁，'))}>
            <Card x={1050} y={330} w={345} title='CRM · 持有 manager lock' value={s.crmRead?'已读取执行结果':s.selected?'选择目标 B':s.recovery?'service → recovery':s.fenceConfirmed?'fencing 判定成立':s.fenceWaiting?'service → fence':s.quorumLost?'C：unknown / 等待':'发布期望 / 读取结果'} color={s.fenceConfirmed?green:blue} small/>
            <Card x={1480} y={330} w={340} title='pmxcfs · B 本地配置层' value={s.desired?'manager_status：B/started':s.lockAcquired?'取得 C 的 agent lock':s.fenceWaiting?'旧节点锁：获取未成功':'配置 / 锁 / HA 管理状态'} color={s.lockAcquired?green:blue} small/>
            <Wire points={[[1395,350],[1480,350]]} frame={f} active={normalFlow&&collaborationPhase<50||s.fenceWaiting&&!s.lockAcquired||s.desired&&!s.lrmRead} color={blue}/>
            <Wire points={[[1480,397],[1395,397]]} frame={f} active={normalFlow&&collaborationPhase>=200||s.lockAcquired&&!s.fenceConfirmed||s.crmRead&&f<beats.crmRead+55} color={green}/>
            <Text x={1438} y={378} size={17} center color={s.lockAcquired?green:blue}>{s.lockAcquired&&!s.desired?'锁成功':'读 / 写'}</Text>
          </g>
          <g opacity={ch>=8||normal?.98:.3}>
            <Wire points={[[1650,420],[1650,498]]} frame={f} active={s.lrmRead&&!s.targetProtected} color={blue}/>
            <Text x={1485} y={460} size={18} color={blue}>读取本机任务</Text>
            <Card x={1480} y={498} w={340} title='LRM · 本地执行' value={s.result?'lrm_status：结果已写回':s.targetProtected?'B 的锁 + watchdog 保护':s.lrmRead?'读取任务 / 建立保护':'空闲 · 尚无 HA 任务'} color={s.targetProtected?green:muted} small/>
            <Card x={1050} y={498} w={345} title='资源 agent · PVEVM' value={s.qemuCall?'调用 QEMU 管理 API':s.agent?'执行本地启动动作':'等待本地任务'} color={s.agent?blue:muted} small/>
            <Wire points={[[1480,546],[1395,546]]} frame={f} active={s.agent&&!s.targetVmRunning} color={blue}/>
            <Text x={1438} y={522} size={16} center color={blue}>本地调用</Text>
            <Wire points={[[1223,588],[1223,619],[1650,619],[1650,650]]} frame={f} active={s.qemuCall&&!s.targetVmRunning} color={blue}/>
            <Wire points={[[1800,498],[1840,498],[1840,375],[1820,375]]} frame={f} active={s.result&&!s.crmRead} color={green}/>
          </g>
          <Card x={1480} y={650} w={340} title='VM 100 · QEMU 实际状态' value={s.targetVmRunning?'B：新实例运行':'尚未启动'} color={s.targetVmRunning?green:muted}/>
          {s.targetVmRunning&&<rect x={1500} y={728} width={280*((f%75)/75)} height={4} fill={green}/>}
          <rect x={1050} y={650} width={345} height={86} rx={12} fill='#f5f7ef'/>
          <Text x={1070} y={679} size={19} bold color={amber}>B 的本地 watchdog 保护</Text>
          <Text x={1070} y={701} size={17} color={amber}>CRM → mux → watchdog</Text>
          <Wire points={[[1070,711],[1200,711],[1360,711]]} frame={f} active color={amber}/>
          <Text x={1070} y={728} size={16} color={s.targetProtected?green:muted}>{s.targetProtected?'LRM 已建立自己的受保护锁':'LRM 无任务时不假定持续持锁'}</Text>
          <Text x={1055} y={763} size={17} color={muted}>{s.hostReset&&!s.fenceConfirmed?'C 已复位 ≠ B 已收到停机证明':'锁获取结果来自本地配置层；没有 C 的关机 ACK'}</Text>
        </g>
        {focus&&<rect x={focus.x} y={focus.y} width={focus.w} height={focus.h} rx={16} fill='none' stroke={ch<6?red:green} strokeWidth={3} opacity={.5+.25*Math.sin(f/25)}/>}
        <Wire points={[[700,740],[700,810],[815,810],[815,831]]} frame={f} active={s.oldVmRunning} color={blue}/>
        <Wire points={[[1650,740],[1650,810],[1105,810],[1105,831]]} frame={f} active={s.targetVmRunning} color={blue} dashed={!s.targetVmRunning}/>
        <Text x={590} y={801} size={17} color={blue}>旧实例磁盘 I/O</Text>
        <Text x={1220} y={799} size={17} color={s.targetVmRunning?blue:muted}>{s.targetVmRunning?'新实例磁盘 I/O':'目标可访问 · 无新实例 I/O'}</Text>
        <rect x={815} y={831} width={290} height={92} rx={15} fill='#fffefa' stroke={blue} strokeWidth={2}/>
        <Text x={960} y={867} size={25} bold center color={blue}>共享 NFS</Text>
        <Text x={960} y={901} size={20} center>同一磁盘 · 始终原位</Text>
        {ch===8&&<g transform={`translate(${575+660*ramp(f,beats.configMoved,48)},922)`} opacity={s.selected?1:0}><rect width={255} height={30} rx={8} fill='#e0ede5' stroke={green}/><Text x={127} y={23} size={18} center color={green}>VM 配置归属：{s.configMoved?'B':'C'}</Text></g>}
        {eventRows.map(row=><g key={row.name} transform={`translate(${row.x},851)`}>
          <Text x={0} y={0} size={19} bold color={row.color}>{row.name}</Text>
          {row.steps.map((label,i)=><g key={label} opacity={row.done[i]?1:.28}><circle cx={i*205+8} cy={29} r={5} fill={row.color}/>{i<2&&<path d={`M${i*205+18} 29 H${(i+1)*205-4}`} stroke={row.color} strokeWidth={2}/>}<Text x={i*205} y={64} size={20} color={row.color}>{label}</Text></g>)}
        </g>)}
      </g>
      {ch===9&&!normal&&<g>
        <rect x={190} y={390} width={1540} height={355} rx={22} fill='#fffefa' stroke='#c7d7ce' strokeWidth={2}/>
        <Text x={960} y={439} size={26} bold center>三个状态，三个不同的判断依据</Text>
        {[
          ['HA 期望状态','started','来自管理状态',true],
          ['QEMU 实际状态','新进程运行','来自本地执行结果',true],
          ['应用独立探测',s.appReady?'应用就绪':'恢复中 / 未证实','示意：外部业务探测',s.appReady],
        ].map(([name,value,note,ok],i)=><g key={String(name)}><Card x={230+i*495} y={482} w={465} title={String(name)} value={String(value)} color={ok?green:amber}/><Text x={250+i*495} y={615} size={21} color={muted}>{String(note)}</Text></g>)}
        <Wire points={[[1230,640],[1680,640]]} frame={f} active={s.probe&&!s.appReady} color={blue}/>
        <Text x={960} y={699} size={24} bold center color={blue}>共享磁盘可访问；旧运行内存没有传送到 B</Text>
      </g>}
      {quiz&&<g>
        <rect x={265} y={260} width={1390} height={580} rx={24} fill='#fffefa' stroke='#c7d7ce' strokeWidth={2}/>
        <Text x={960} y={321} size={22} center color={muted}>回到启动门前 · 假设题，不改变前面的真实叙事状态</Text>
        <Text x={960} y={397} size={35} center bold>A+B 有 quorum，但尚未取得 C 的 agent lock</Text>
        <Card x={345} y={445} w={550} title='集群管理条件' value='有 quorum ✓' color={green}/>
        <Card x={1025} y={445} w={550} title='安全隔离条件' value='旧节点锁尚未取得 …' color={amber}/>
        <Text x={960} y={607} size={39} center bold color={answer?amber:ink}>{answer?'继续等待，不启动恢复实例':'能启动恢复实例吗？'}</Text>
        <Text x={960} y={674} size={25} center color={muted}>{answer?'quorum + fencing 条件 + 目标运行条件':'保留五秒思考，也可以暂停视频。'}</Text>
        {answer&&<Text x={960} y={749} size={24} center color={red}>看不到旧节点，不能代替旧实例已安全退出的依据。</Text>}
      </g>}
      <Text x={960} y={964} size={23} bold center color={ch===9?blue:muted}>{normal?'正常路径持续工作：成功续锁 → 本地续期 → 设备喂狗':ch===0?'“失联”是观测；“已停止”是另一个必须建立的结论。':ch===1?'CRM 决策 · LRM 执行 · pmxcfs 协作 · NFS 保存磁盘':ch===2?'本地续期与跨节点状态传播，是不同的路径。':ch===3||ch===4?'quorum 变化不等于向既有 QEMU 进程发出停止命令。':ch===5?'保护前提：watchdog 已武装、工作正常，并能够复位主机。':ch===6?'多数侧并行等待；任何单个超时都不等于端到端恢复时间。':ch===7?'取得旧节点锁 → fencing 判定成立 → recovery':ch===8?'配置归属改变；磁盘位置不变；启动由目标 LRM 本地执行。':ch===9?'进程运行不等于业务可用；缓存持久化与应用一致性另有条件。':ch===10?'只有票数，还不足以解释安全接管。':'下一集：节点仍能协作时，热迁移如何转移运行状态？'}</Text>
      <Text x={65} y={995} size={16} color={muted}>教学时间轴，非实测计时 · PVE 9.x 机制示意 · 固定源码与前提见配套笔记</Text>
      <Text x={1800} y={995} size={18} center color={green}>{normal?'正常对照':`${String(ch+1).padStart(2,'0')} / 12`}</Text>
      <rect y={1010} width={1920} height={70} fill='#ecefe8'/><Text x={960} y={1055} size={30} center bold>{caption}</Text>
      <rect y={1075} width={1920*(f+1)/HA_LESSON_DURATION} height={5} fill={green}/>
      {!normal&&<rect x={60} y={180} width={1400*Math.max(0,progress)} height={3} fill='#c1d5c9'/>}
    </svg>
    {!normal&&audio.map(clip=><Sequence key={clip.file} from={Math.round(clip.start*30)} durationInFrames={Math.round((clip.end-clip.start)*30)} layout='none'><Html5Audio src={staticFile(clip.file)}/></Sequence>)}
  </AbsoluteFill>;
}
