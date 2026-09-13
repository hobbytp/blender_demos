import {Html5Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Card,Text,Wire} from './HaPilot';
import {MigrationScene} from './MigrationPilot';
import audio from './migration-lesson-audio.json';
import {MIGRATION_LESSON_DURATION,migrationCue as cue,migrationLessonBeats as beats,migrationFailureBeats,migrationLessonStateAt} from './migration-lesson-timeline';

const green='#347d70',blue='#347aa8',amber='#b18635',red='#b96b50',muted='#73847e',paper='#fffefa';
const ramp=(f:number,at:number,n=30)=>Math.max(0,Math.min(1,(f-at)/n));
const titles=['源端还在写，目标怎么追得上？','管理、迁移、磁盘：三条不同路径','先准备进程，但不给执行权','传过的内存，又发生了变化','传出与新增：一场收敛的竞争','最后暂停，接住一致的运行状态','传输完成，不等于整个交接完成','进程还在，不代表来宾还在执行','任务成功，业务仍要单独验收','回看：源端暂停之前，传输失败','内存全部收到，就能开始执行吗？','一条因果链，接住运行状态'];
const notes=['新的健康场景 · C → B · 对比上一集的 HA 重新启动','逻辑路径示意 · 不要求三张网卡 · RAM 不经 Corosync 运输','兼容 CPU / machine / 软件与资源 · 共享 NFS · 本例无不可迁移直通','源端写入 → 跟踪变化 → 后续同步 · 版本号仅用于教学','待传集合不断变化；下面是定性示意，不是实测带宽曲线','教学时间轴放大停顿；不规定内部序列化顺序','本例 PVE 路径：配置归属移动 → 恢复目标 → 清理源进程','源来宾执行先停止；源 QEMU 进程随后退出','迁移状态 / 来宾执行 / 独立请求结果，各有自己的证据','独立失败分支 · 不是成功迁移的倒退 · 源端和控制路径健康','假设题：只知道 RAM 已收到，不足以判断执行条件','回到成功路径总结 · 下一集：配置为什么能够跨节点协作'];

export function MigrationLesson(){
  const f=useCurrentFrame(),s=migrationLessonStateAt(f),ch=s.chapter;
  const clip=audio.find(c=>f>=c.start*30&&f<(c.start+c.duration+.3)*30);
  const caption=clip?.captions.filter(c=>c.start*30<=f).at(-1)?.text??'';
  const reveal=(text:string)=>.15+.85*ramp(f,cue(text));
  const panel=(y=425,h=330)=><rect x={120} y={y} width={1680} height={h} rx={18} fill={paper} stroke='#c7d7ce' strokeWidth={2}/>;
  const rateFocus=ch===4&&f>=cue('这就是预拷贝的竞争：');
  const pressure=f>=cue('如果新增脏页太快，'),mitigation=f>=cue('本路径启用了自动收敛，');
  const phase=(f%120)/120;
  return <>
    <MigrationScene frame={f} state={s} title={titles[ch]} note={notes[ch]} caption={caption} timing={s.replay?migrationFailureBeats:beats} duration={MIGRATION_LESSON_DURATION} chapterCount={12} dim={[0,1,8,10,11].includes(ch)}>
      {ch===0&&<g>
        {panel(310,440)}
        <Text x={960} y={359} size={28} center bold>同一份磁盘，能否接续同一段运行状态？</Text>
        <Card x={185} y={407} w={660} title='上一集：HA 故障恢复' value='安全隔离后，在目标重新启动' color={muted}/>
        <g opacity={reveal('热迁移要接住这些状态。')}>
          <Card x={1070} y={407} w={660} title='本集：健康节点之间的热迁移' value='把运行状态交接给目标' color={green}/>
          <Text x={1110} y={550} size={24} color={green}>RAM · vCPU · 虚拟设备状态</Text>
        </g>
        <Text x={220} y={550} size={24} color={muted}>没有搬运旧节点的运行内存</Text>
        <Wire points={[[845,450],[1070,450]]} frame={f} color={green}/>
        <Text x={960} y={612} size={30} center bold color={blue}>源端继续执行，就可能继续修改内存</Text>
        <rect x={420} y={651} width={1080} height={42} rx={10} fill='#e9eee5'/>
        <Text x={960} y={680} size={22} center>核心问题：怎样结束这场追赶？</Text>
      </g>}
      {ch===1&&<g>
        {panel(300,450)}
        <g opacity={reveal('PVE管理迁移任务，')}>
          <Card x={170} y={328} w={450} title='PVE · 迁移任务' value='准备 / 控制 / 查询' color={green}/>
          <Wire points={[[620,375],[1230,375]]} frame={f} active={f>=cue('向QEMU发出控制命令。')} color={green}/>
          <Text x={930} y={358} size={22} center color={green}>QMP 控制命令</Text>
          <Card x={1230} y={328} w={510} title='QEMU · 控制接口' value='接受命令，返回迁移状态' color={green}/>
        </g>
        <g opacity={reveal('运行状态的数据，')}>
          <Card x={170} y={470} w={450} title='C · 源 QEMU' value='读取和发送状态' color={blue}/>
          <Wire points={[[620,515],[1230,515]]} frame={f} active={f>=cue('在两个QEMU之间传送。')} color={blue}/>
          <Text x={930} y={496} size={22} center color={blue}>RAM / vCPU / 设备状态</Text>
          <Card x={1230} y={470} w={510} title='B · 目标 QEMU' value='接收并装载状态' color={blue}/>
        </g>
        <g opacity={reveal('下方的共享存储，')}>
          <Card x={170} y={613} w={450} title='来宾磁盘访问' value='读写同一虚拟磁盘' color={blue}/>
          <Wire points={[[620,658],[1230,658]]} frame={f} active={f>=cue('仍然保存同一块虚拟磁盘。')} color={blue}/>
          <Text x={930} y={640} size={22} center color={blue}>磁盘 I/O · 独立于 RAM 传输</Text>
          <Card x={1230} y={613} w={510} title='共享 NFS' value='磁盘数据保持原位' color={blue}/>
        </g>
      </g>}
      {ch===2&&<g>
        {panel()}
        <Text x={155} y={466} size={25} bold>迁移准备 · 条件逐项成立</Text>
        {[
          ['配置锁 / 运行状态','迁移前先检查配置锁、'],
          ['目标 CPU / machine / 软件','CPU、机器类型和软件版本，'],
          ['存储 / 可迁移资源','本例排除不可迁移的直通资源。'],
        ].map(([label,text],i)=><g key={label} opacity={reveal(text)}><rect x={155} y={491+i*68} width={735} height={49} rx={8} fill='#e9eee5'/><Text x={179} y={525+i*68} size={23} color={green}>{label}</Text><Text x={843} y={525+i*68} size={24} bold center color={green}>✓</Text></g>)}
        <Wire points={[[890,585],[1060,585]]} frame={f} active={f>=cue('检查通过，设置迁移锁。')&&f<beats.prepare} color={green}/>
        <Card x={1060} y={491} w={690} title='迁移锁' value={f>=cue('检查通过，设置迁移锁。')?'配置 lock = migrate':'等待预检'} color={green}/>
        <Card x={1060} y={618} w={690} title='目标 incoming QEMU' value={s.targetProcessExists?'进程已存在 · 执行门仍关闭':'准备接收进程'} color={s.targetProcessExists?amber:muted}/>
      </g>}
      {rateFocus&&<g>
        {panel(630,133)}
        <Text x={155} y={668} size={21} bold color={amber}>新增脏页</Text>
        <rect x={290} y={646} width={420} height={25} rx={5} fill='#edece4'/>
        <rect x={290} y={646} width={(pressure?370:170)+20*Math.sin(f/20)} height={25} rx={5} fill={amber}/>
        <Text x={155} y={718} size={21} bold color={blue}>传出状态</Text>
        <rect x={290} y={695} width={420} height={25} rx={5} fill='#edece4'/>
        <rect x={290} y={695} width={290+12*Math.sin(f/17)} height={25} rx={5} fill={blue}/>
        <Wire points={[[735,660],[950,660]]} frame={f} active color={amber}/>
        <Text x={1090} y={668} size={23} bold color={pressure?amber:green}>{pressure?'新增过快 → 剩余难以缩小':'传出较快 → 剩余有望缩小'}</Text>
        <Text x={1090} y={717} size={21} color={muted}>{mitigation?'自动收敛 / 调整停顿：存在代价':'定性示意 · 无实测单位 · 不保证收敛'}</Text>
      </g>}
      {ch===5&&<g>
        <rect x={920} y={435} width={105} height={210} rx={10} fill={s.paused?'#f1dfc0':'#e9eee5'}/>
        {['源端',s.paused?'已停':'运行','目标',s.targetExecuting?'运行':'未执行'].map((t,i)=><Text key={i} x={972} y={477+i*43} size={22} center bold color={amber}>{t}</Text>)}
      </g>}
      {ch===6&&<g>
        {panel(630,133)}
        {[
          ['QEMU 传输',s.completed?'completed':'等待最终状态',s.completed],
          ['配置归属',s.configMoved?'已转到 B':'仍属于 C',s.configMoved],
          ['目标来宾',s.targetExecuting?'恢复执行':'执行门关闭',s.targetExecuting],
        ].map(([label,value,done],i)=><Card key={String(label)} x={150+i*560} y={650} w={505} title={String(label)} value={String(value)} color={done?green:amber}/>)}
      </g>}
      {ch===7&&<g>
        {panel(430,320)}
        <Text x={960} y={475} size={25} center bold>分别观察：宿主机进程与来宾执行</Text>
        {[
          ['C · 源端',s.sourceProcessExists?'进程仍存在':'进程已清理','来宾执行已停止'],
          ['B · 目标端','进程存在','来宾继续执行'],
        ].map(([name,process,guest],i)=><g key={name}><Card x={170+i*900} y={505} w={670} title={name} value={process} color={i?green:muted}/><Text x={210+i*900} y={645} size={27} bold color={i?green:amber}>{guest}</Text>{i===1&&<rect x={1110} y={676} width={550*phase} height={5} fill={green}/>}</g>)}
      </g>}
      {ch===8&&<g>
        {panel(300,450)}
        <Card x={160} y={328} w={430} title='客户端' value='发出业务请求' color={blue}/>
        <Wire points={[[590,375],[740,375]]} frame={f} active={f>=cue('客户端请求要走到目标。')} color={blue}/>
        <Card x={740} y={328} w={450} title='目标宿主机业务网络' value='桥接 / 防火墙 / conntrack' color={amber} small/>
        <Wire points={[[1190,375],[1340,375]]} frame={f} active={s.probe} color={blue}/>
        <Card x={1340} y={328} w={410} title='B · 来宾应用' value={s.requestConfirmed?'本次请求成功':'结果待独立验证'} color={s.requestConfirmed?green:amber}/>
        <Wire points={[[1545,418],[1545,461],[375,461],[375,418]]} frame={f} active={s.probe&&!s.requestConfirmed} color={green} progress={ramp(f,cue('业务仍需独立探测。'),cue('探测成功，才确认本次请求。')+35-cue('业务仍需独立探测。'))}/>
        <g opacity={reveal('因此，分别检查迁移任务、')}>
          {[
            ['迁移任务','完成 · 任务结果',green],
            ['来宾执行','已恢复 · 执行状态',green],
            ['业务请求',s.requestConfirmed?'本次成功 · 探测结果':'未证实 · 需要探测',s.requestConfirmed?green:amber],
          ].map(([name,value,color],i)=><Card key={name} x={160+i*550} y={509} w={510} title={name} value={value} color={color}/>)}
        </g>
        <Text x={960} y={656} size={26} center bold color={amber}>来宾地址相同 ≠ 所有连接状态都已经接续</Text>
        <Text x={960} y={705} size={22} center color={muted}>连接跟踪迁移是尽力而为；一次成功不代表所有连接无损</Text>
      </g>}
      {ch===9&&<g>
        <rect x={915} y={465} width={118} height={145} rx={10} fill='#f2e2d7'/>
        <Text x={974} y={507} size={24} center bold color={red}>回看</Text>
        <Text x={974} y={548} size={20} center color={red}>切换前</Text>
        <Text x={974} y={586} size={20} center color={red}>{s.cancelled?'传输失败':'仍在传输'}</Text>
      </g>}
      {ch===10&&<g>
        {panel(310,440)}
        <Text x={960} y={366} size={25} center color={muted}>独立假设题 · 不改变前面成功迁移的状态</Text>
        <Card x={185} y={414} w={660} title='已知条件' value='目标收到全部 RAM' color={green}/>
        <Card x={1070} y={414} w={660} title='尚未建立的条件' value='最终状态 / 管理交接' color={amber}/>
        <Text x={960} y={577} size={36} center bold color={s.answer?amber:blue}>{s.answer?'不能只凭 RAM 完整就恢复执行':'现在能打开目标执行门吗？'}</Text>
        <Text x={960} y={641} size={25} center color={muted}>{s.answer?'源端已停 → 最终状态 → 配置交接 → 目标恢复':'问题结束后留约六秒思考，也可以暂停。'}</Text>
        {s.answer&&<Text x={960} y={701} size={24} center color={green}>只看到一个完成标志，还不足以证明全部条件成立。</Text>}
      </g>}
      {ch===11&&<g>
        {panel(310,440)}
        {[
          ['预拷贝','运行中预拷贝，'],['重传变化','跟踪并重传变化，'],
          ['暂停同步','暂停并同步最终状态，'],['交接并恢复','交接配置，再恢复目标。'],
        ].map(([label,text],i)=><g key={label} opacity={reveal(text)}><Card x={155+i*423} y={392} w={360} title={`0${i+1}`} value={label} color={i<2?blue:green}/>{i<3&&<Wire points={[[515+i*423,440],[578+i*423,440]]} frame={f} active={f>=cue(text)} color={green}/>}</g>)}
        <Text x={960} y={558} size={30} center bold color={blue}>运行状态交接 · 共享磁盘可以保持原位</Text>
        <g opacity={reveal('下一集打开pmxcfs，')}>
          <rect x={545} y={605} width={830} height={95} rx={14} fill='#e0ede5'/>
          <Text x={960} y={643} size={26} center bold color={green}>下一集：pmxcfs</Text>
          <Text x={960} y={678} size={24} center>配置如何复制、写入与协作？</Text>
        </g>
      </g>}
    </MigrationScene>
    {audio.map(c=><Sequence key={c.file} from={Math.round(c.start*30)} durationInFrames={Math.round((c.end-c.start)*30)} layout='none'><Html5Audio src={staticFile(c.file)}/></Sequence>)}
  </>;
}
