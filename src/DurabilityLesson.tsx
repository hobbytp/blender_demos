import {Html5Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Card,Text,Wire} from './HaPilot';
import {DurabilityScene} from './DurabilityPilot';
import audio from './durability-lesson-audio.json';
import {DURABILITY_LESSON_DURATION,durabilityLessonCue as cue,durabilityLessonBeats as b,durabilityReplayBeats,durabilityLessonEvents as e,durabilityLessonStateAt} from './durability-lesson-timeline';
const green='#347d70',blue='#347aa8',amber='#b18635',red='#b96b50',muted='#73847e';
const titles=['已经收到 WRITE OK，数据保存在哪里？','原位展开：请求、执行、缓存与介质','先固定路径，再讨论完成语义','WRITE：数据向下，结果向上','独立断电对照：历史成功不保证新值留存','回到正常路径：FLUSH 继续向下执行','下层完成之后，结果还要逐级返回','三个开关，不是一个“安全 / 不安全”标签','Linux 块层：PREFLUSH 与 FUA 的承诺','块请求之外，应用还需要自己的协议','三问验收：由谁完成、存在哪里、依赖什么'];
const ramp=(f:number,start:number,n=30)=>Math.max(0,Math.min(1,(f-start)/n));
export function DurabilityLesson(){
  const f=useCurrentFrame(),s=durabilityLessonStateAt(f),ch=s.chapter;
  const clip=audio.find(c=>f>=c.start*30&&f<(c.start+c.duration+.3)*30);
  const caption=clip?.captions.filter(c=>c.start*30<=f).at(-1)?.text??'';
  const reveal=(text:string)=>.12+.88*ramp(f,cue(text));
  const panel=()=> <rect x={105} y={310} width={1710} height={605} rx={18} fill='#fffefa' stroke='#c7d7ce' strokeWidth={2}/>;
  const outline=(x:number,y:number,w:number,color=blue)=> <rect x={x-6} y={y-6} width={w+12} height={102} rx={16} fill='none' stroke={color} strokeWidth={4}/>;
  const focus=ch===1?(f<cue('接着是虚拟设备的模拟。')?[90,385,300]:f<cue('块后端再把它交给文件后端。')?[510,385,340]:f<cue('宿主内核管理文件和页缓存。')?[510,600,340]:f<cue('设备内部还有自己的写缓存。')?[960,600,360]:f<cue('最下方才是非易失存储。')?[1500,600,320]:[1500,775,320]):null;
  return <>
    <DurabilityScene frame={f} state={s} timing={s.isReplay?durabilityReplayBeats:b} duration={DURABILITY_LESSON_DURATION} powerLoss={ch===4} title={s.isReplay?'正常路径回放 · 新的一次示意请求':titles[ch]} caption={caption} shortMotion dim={ch===2||ch===7||ch===8||ch===9||ch===10&&!s.isReplay}>
      {ch===0&&<g>
        {outline(90,540,300,green)}
        {f>=cue('新内容却还在宿主页缓存。')&&outline(960,600,360,amber)}
        <Text x={960} y={900} size={25} center bold color={amber}>开场观察已完成的 W1；下一章从头追踪</Text>
      </g>}
      {focus&&outline(focus[0],focus[1],focus[2])}
      {ch===2&&<g>
        {panel()}
        <Text x={960} y={365} size={30} center bold>选定路径：配置只决定边界，不代替数据流</Text>
        {['VirtIO Block · write-cache=on','cache=writeback · raw 文件','aio=threads · 本地文件系统'].map((value,i)=><g key={value} opacity={reveal(['虚拟写缓存显式开启。','宿主使用回写模式。','文件操作选择线程式路径。'][i])}>
          <Card x={165+i*550} y={420} w={500} title={['Guest 设备','QEMU 文件后端','Host 执行路径'][i]} value={value} small/>
        </g>)}
        <Card x={225} y={620} w={500} title='PVE · 管理配置' value='配置 / 启动阶段' color={green}/>
        <Card x={1160} y={620} w={500} title='QEMU · 运行进程' value='随后执行块设备请求' color={blue}/>
        <Wire points={[[725,665],[1160,665]]} frame={f} active={f>=cue('管理配置决定这些参数，')&&f<cue('管理配置决定这些参数，')+45} progress={ramp(f,cue('管理配置决定这些参数，'),45)} color={green}/>
        <Text x={960} y={795} size={28} center bold color={amber}>不是每次 I/O 都经过管理服务</Text>
        <Text x={960} y={860} size={23} center color={muted}>显式教学案例 · 不宣称 PVE 默认值 · 后端变化需重新核查</Text>
      </g>}
      {ch===3&&s.writeAck&&<Text x={960} y={900} size={26} center bold color={amber}>对照左侧 WRITE OK 与右下角 v1：完成条件不同</Text>}
      {ch===5&&<Text x={960} y={900} size={23} center bold color={blue}>正常供电 · 同一已完成写的后续 FLUSH · 不是断电后的恢复</Text>}
      {ch===6&&<g>{outline(s.flushAck?90:s.virtioComplete?510:s.backendComplete?510:960,s.flushAck?725:s.virtioComplete?385:s.backendComplete?600:385,s.flushAck?300:s.virtioComplete||s.backendComplete?340:360,green)}</g>}
      {ch===7&&<g>
        {panel()}
        <Text x={960} y={365} size={30} center bold>cache 模式拆解 · QEMU 文档对应组合</Text>
        {['模式','虚拟写缓存','绕过宿主页缓存','忽略 FLUSH'].map((v,i)=><Text key={v} x={[265,625,1060,1520][i]} y={425} size={25} center bold>{v}</Text>)}
        {['writeback','none','unsafe'].map((name,i)=><g key={name} opacity={s.mode===name?1:.3}>
          <rect x={160} y={455+i*95} width={1595} height={75} rx={10} fill={name==='unsafe'?'#f4e4da':'#e6eee7'} stroke={s.mode===name?green:muted} strokeWidth={s.mode===name?3:1}/>
          {[name,'on',i===1?'on':'off',i===2?'on':'off'].map((v,j)=><Text key={j} x={[265,625,1060,1520][j]} y={503+i*95} size={29} center bold color={i===2?red:blue}>{v}</Text>)}
        </g>)}
        <Card x={210} y={770} w={645} title='宿主页缓存' value={s.mode==='none'?'本模式绕过此层':'本模式可以使用此层'} color={blue}/>
        <Card x={1050} y={770} w={645} title='设备自己的易失写缓存' value={s.mode==='unsafe'?'刷新可被忽略：持久化无保证':'仍需兑现相关持久化条件'} color={s.mode==='unsafe'?red:amber} small/>
        <Text x={950} y={820} size={21} center color={muted}>分别判断</Text>
      </g>}
      {ch===8&&<g>
        {panel()}
        <Text x={960} y={365} size={28} center bold>独立语义对照 · 不映射成同名 Guest / 硬件命令</Text>
        <Text x={505} y={425} size={28} center bold color={amber}>REQ_PREFLUSH：此前完成的写</Text>
        <Text x={1400} y={425} size={28} center bold color={blue}>REQ_FUA：本次写的完成条件</Text>
        <Card x={185} y={475} w={620} title='设备易失缓存 · 已完成写 A、B' value={s.preflushStable?'A、B 已达到持久化条件':'A、B 尚待持久化'} color={amber}/>
        <Card x={1085} y={475} w={620} title='本次写 C · FUA' value={s.fuaAck?'现在才允许报告 C 完成':s.fuaStable?'C 已持久化，结果待返回':'等待本次写入持久化'} color={s.fuaAck?green:blue} small/>
        <Card x={185} y={690} w={620} title='非易失存储 · 先前写' value={s.preflushStable?'A、B 已持久保存':'尚未确认 A、B 持久化'} color={s.preflushStable?green:muted}/>
        <Card x={1085} y={690} w={620} title='非易失存储 · 本次写' value={s.fuaStable?'C 已持久保存':'尚未确认 C 持久化'} color={s.fuaStable?green:muted}/>
        <Wire points={[[495,565],[495,690]]} frame={f} active={f>=e.preflush-36&&f<e.preflush} progress={ramp(f,e.preflush-36,36)} color={blue}/>
        <Wire points={[[1325,565],[1325,690]]} frame={f} active={f>=e.fuaStable-36&&f<e.fuaStable} progress={ramp(f,e.fuaStable-36,36)} color={blue}/>
        <Wire points={[[1495,690],[1495,565]]} frame={f} active={f>=e.fuaAck-36&&f<e.fuaAck} progress={ramp(f,e.fuaAck-36,36)} color={green}/>
        <Text x={960} y={855} size={23} center color={muted}>PREFLUSH：有载荷时先刷新再开始该 I/O；FUA：自身持久化后才完成</Text>
      </g>}
      {ch===9&&<g>
        {panel()}
        <Text x={960} y={365} size={30} center bold>从已解释的块层，向上寻找尚需核查的保证</Text>
        {['应用 / 数据库','Guest 文件系统与日志','块设备请求与完成'].map((v,i)=><g key={v} opacity={reveal(['应用写入和块请求不是一回事。','还要追踪文件系统和日志协议。','下层持久化是一个重要条件，'][i])}>
          <Card x={180} y={420+i*145} w={620} title={v} value={['同步时机 / 提交协议 / 错误处理','具体实现与恢复条件','本集已展示 WRITE / FLUSH'][i]} color={i===2?green:amber} small/>
          {i<2&&<Wire points={[[490,510+i*145],[490,565+i*145]]} frame={f} dashed color={muted}/>}
        </g>)}
        {['持久化 ≠ 整笔事务原子性','持久化 ≠ 副本或备份','成功提示 ≠ 跨层证据'].map((v,i)=><g key={v} opacity={reveal(['却不自动提供整笔事务原子性。','也不能替代副本和备份。','替代整条路径的分析。'][i])}><Text x={1300} y={480+i*145} size={29} center bold color={amber}>{v}</Text></g>)}
        <Text x={960} y={865} size={23} center color={muted}>虚线表示分析边界；未模拟应用完整协议</Text>
      </g>}
      {ch===10&&!s.isReplay&&<g>
        {panel()}
        <Text x={960} y={365} size={30} center bold>暂停思考，再沿层次解释答案</Text>
        {['WRITE OK 就表示数据已持久化？','介质完成，Guest 立即知道？','none 会关闭设备缓存？'].map((v,i)=><g key={v} opacity={i===0||f>=[0,cue('介质完成后，来宾立即知道吗？'),cue('绕过宿主页缓存，')][i]?1:.12}>
          <Text x={180} y={470+i*140} size={30} bold>{i+1}. {v}</Text>
          <Text x={1340} y={470+i*140} size={28} center bold color={green}>{f>=[e.answerOne,e.answerTwo,e.answerThree][i]?['不能仅凭它保证','还要等待完成回程','不会'][i]:'？'}</Text>
        </g>)}
      </g>}
    </DurabilityScene>
    {audio.map(c=><Sequence key={c.file} from={Math.round(c.start*30)} durationInFrames={Math.round((c.end-c.start)*30)} layout='none'><Html5Audio src={staticFile(c.file)}/></Sequence>)}
  </>;
}
