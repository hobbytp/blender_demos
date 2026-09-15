import {Html5Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {LifecycleScene} from './LifecyclePilot';
import {Card,Text,Wire} from './HaPilot';
import audio from './lifecycle-lesson-audio.json';
import {lifecycleLessonCue as cue,lifecycleLessonBeats,lifecycleReplayBeats,lifecycleLessonEvents as e,lifecycleLessonStateAt} from './lifecycle-lesson-timeline';
const green='#347d70',blue='#347aa8',amber='#b18635',purple='#7e759c',muted='#73847e',red='#b96b50';
export function LifecycleLesson(){
  const f=useCurrentFrame(),s=lifecycleLessonStateAt(f),ch=s.chapter,b=s.isReplay?lifecycleReplayBeats:lifecycleLessonBeats;
  const upid=ch===2&&f>=e.upid,locks=ch===3&&f>=e.locks,prepare=ch===4&&f<b.launch-12;
  const logs=ch===5&&f>=e.evidence&&f<b.vmQuery,fields=ch===5&&f>=e.fields,summary=ch===7&&f>=e.summary;
  const dim=ch===0||upid||locks||prepare||logs||fields||ch===6||summary;
  const caption=audio.find(c=>f>=c.start*30&&f<(c.start+c.duration+.25)*30)?.captions.filter(c=>c.start*30<=f).at(-1)?.text??'';
  const titles=['一个启动动作，四种不同的证据','管理请求：入口与特权边界','后台任务与 UPID：两条并行路径','互斥锁与业务锁：各自保护什么？','从配置与存储卷，到 QEMU 进程','任务结束、VM 运行、应用就绪','独立失败对照：先定位失败阶段','正常路径回放：按对象寻找证据'];
  const panel=(title:string)=><g><rect x={110} y={300} width={1700} height={605} rx={18} fill='#fffefa' stroke='#c7d7ce' strokeWidth={2}/><Text x={960} y={352} size={30} bold center>{title}</Text></g>;
  const reveal=(text:string)=>.15+.85*Math.max(0,Math.min(1,(f-cue(text))/18));
  const motion=(points:number[][],at:number,color=amber)=><Wire points={points} frame={f} active={f>=at&&f<at+24} progress={Math.max(0,Math.min(1,(f-at)/24))} color={color}/>;
  const focus=(x:number,y:number,w:number,color=amber)=><rect x={x+4} y={y+4} width={w-8} height={82} rx={12} fill='none' stroke={color} strokeWidth={4}/>;
  const footer=ch===0?'HTTP 响应、任务结果、进程状态、业务健康分别取证':upid?'UPID 标识这次操作；它不是 VMID，也不是业务就绪证明':locks?'互斥锁获取成功后，仍需检查配置内的业务 lock 标记':prepare?'读取配置、激活存储卷、生成参数；此时尚未启动 QEMU':logs?'任务结束后读取退出结果与日志；警告也需要查看':fields?'同一个字段名，先确认它属于哪个对象':ch===6?'独立案例；任务出错不能直接推断 VM 已停止':summary?'请求 → 任务 → 编排 → 进程 → 独立验收':undefined;
  return <>
    <LifecycleScene frame={f} state={s} timing={b} title={titles[ch]} caption={caption} dim={dim} footer={footer}
      note={ch===6?'三个独立失败案例；不沿用正常主线的成功状态':locks?'先区分两种锁；下方互斥冲突示例独立于正常主线':s.isReplay?'新的正常启动回放；清空前面失败对照的结果':undefined}>
      {ch===0&&<g>{panel('“成功”之前，先明确观察对象')}
        {[['HTTP 请求','收到 UPID','请求被接收，'],['后台任务','stopped + exitstatus','后台任务结束，'],['VM 进程','status: running','虚拟机正在运行，'],['应用服务','独立业务验收','应用可以提供服务，']].map(([t,v,c],i)=><g key={t} opacity={reveal(c)}><Card x={160+i*405} y={460} w={385} title={t} value={v} color={[purple,green,blue,amber][i]} small/></g>)}
        <g opacity={reveal('这是四个不同的问题。')}><Text x={960} y={671} size={33} center bold>同一次操作，不同层的结果不能互相代替</Text></g>
        <Text x={960} y={786} size={25} center color={muted}>主线：已停止 VM · 非 HA · 普通冷启动 · 目标节点本机 API</Text>
        <Text x={960} y={850} size={22} center color={muted}>权限、quorum 与资源条件满足；未实际调用启动接口</Text>
      </g>}
      {ch===1&&<g>{f<b.daemon?focus(500,305,350,blue):focus(970,305,400,blue)}
        <g opacity={reveal('本例用户拥有电源管理权限，')}><Text x={1515} y={325} size={23} bold color={green}>VM.PowerMgmt ✓</Text><Text x={1515} y={364} size={23} color={green}>quorum ✓</Text></g>
        {f>=cue('如果虚拟机由高可用管理，')&&<g><rect x={485} y={430} width={420} height={150} rx={12} fill='#fffefa' stroke={amber}/><Text x={505} y={468} size={22} bold color={amber}>边界：HA 管理的 VM</Text><Text x={505} y={509} size={23}>hastart → ha-manager</Text><Text x={505} y={548} size={20} color={muted}>独立分支，不进入本例 qmstart</Text></g>}
      </g>}
      {ch===2&&!upid&&<g>{s.worker?focus(90,455,300,purple):focus(970,305,400,purple)}
        <Text x={680} y={503} size={24} bold center color={purple}>响应路径与任务执行并行</Text>
        <Text x={680} y={549} size={22} center>父子进程先完成初始化握手</Text>
      </g>}
      {upid&&<g>{panel('UPID：定位节点上的这一次任务')}
        {[['node','pve1','它包含节点，'],['pid / pstart','任务进程 / 起始标识','任务进程号与进程起始标识，'],['starttime','任务开始时间','以及任务开始时间。'],['type / id','qmstart / 100','还包含任务类型、对象编号，'],['user','发起任务的用户','和发起任务的用户。']].map(([t,v,c],i)=><g key={t} opacity={reveal(c)}><Card x={i<3?180+i*530:445+(i-3)*600} y={i<3?435:590} w={i<3?490:530} title={t} value={v} color={purple}/></g>)}
        <g opacity={reveal('任务进程号不是虚拟机进程号，')}><Text x={960} y={775} size={31} center bold color={amber}>任务 PID ≠ QEMU PID　／　UPID ≠ VMID</Text></g>
        <Text x={960} y={850} size={23} center color={muted}>此处按字段展示；不是可提交的完整 UPID 字符串</Text>
      </g>}
      {locks&&<g>{panel('操作互斥与业务占用：两个检查层次')}
        <Card x={180} y={425} w={740} title='lock_config · 本机配置互斥' value='flock → 执行临界区 → 释放句柄' color={blue}/>
        <Text x={550} y={564} size={24} center>同节点、同 VM 的相关操作串行进入</Text>
        <g opacity={f>=e.business?1:.15}><Card x={1010} y={425} w={740} title='check_lock · 配置内业务标记' value='例如 lock: migrate → 普通启动拒绝' color={amber}/><Text x={1380} y={564} size={24} center>取得互斥，不代表业务检查已通过</Text></g>
        {f>=e.busy?<g>
          <Text x={960} y={658} size={24} center bold color={amber}>独立互斥冲突对照：另一操作持续持锁</Text>
          <Card x={260} y={703} w={550} title='任务 A · 持有互斥锁' value='临界区尚未退出' color={blue}/>
          <Card x={1110} y={703} w={550} title='任务 B · 获取同一锁' value={f>=e.timeout?'获取超时 → 任务错误':'等待取得锁，尚未开始启动'} color={f>=e.timeout?red:amber}/>
          {motion([[810,748],[1110,748]],e.busy,amber)}
          <Text x={960} y={857} size={21} center color={muted}>本片不模拟真实超时长度；不建议未核实占用就清锁</Text>
        </g>:<Text x={960} y={741} size={29} center bold>正常主线继续：没有冲突，业务标记检查通过</Text>}
      </g>}
      {prepare&&<g>{panel('配置描述资源；编排把它变成启动条件')}
        {[['存储卷','activate_volumes',e.activate],['虚拟硬件参数','config_to_command',e.command],['资源作用域','enter_systemd_scope',e.scope]].map(([t,v,at],i)=><g key={String(t)} opacity={f>=Number(at)?1:.18}><Card x={180+i*545} y={485} w={455} title={String(t)} value={String(v)} color={blue}/></g>)}
        {motion([[635,530],[725,530]],e.command-24,blue)}{motion([[1180,530],[1270,530]],e.scope-24,amber)}
        <Text x={960} y={703} size={30} center bold color={amber}>激活引用的卷 ≠ 把整块虚拟磁盘复制一遍</Text>
        <Text x={960} y={810} size={24} center>准备完成后，回到原拓扑运行 QEMU；辅助设备与后置步骤合并显示</Text>
      </g>}
      {ch===4&&!prepare&&<g>
        {s.taskDone?focus(500,620,350,green):s.qemu?<rect x={1464} y={504} width={342} height={207} rx={14} fill='none' stroke={green} strokeWidth={4}/>:focus(970,305,400,amber)}
        <Text x={680} y={475} size={24} center bold color={s.taskDone?green:amber}>{s.taskDone?'任务已经结束，VM 继续运行':'任务仍在完成启动编排'}</Text>
        <Text x={680} y={519} size={22} center>任务生命周期与 VM 生命周期分离</Text>
      </g>}
      {logs&&<g>{panel('任务日志与退出结果：结束只是第一步')}
        {[['TASK OK','正常返回且没有警告',green],['TASK ERROR: …','执行异常；查看失败阶段',red],['TASK WARNINGS: n','存在警告；检查具体内容',amber]].map(([t,v,color],i)=><g key={t} opacity={.15+.85*Math.max(0,Math.min(1,(f-e.evidence-i*38)/18))}><Card x={200+i*530} y={475} w={470} title={t} value={v} color={color} small/></g>)}
        <Text x={960} y={694} size={29} center bold>任务 status = stopped 后，再看 exitstatus</Text>
        <Text x={960} y={810} size={24} center color={muted}>上面是结果类别对照；正常主线只产生 OK，不会同时产生三种结果</Text>
      </g>}
      {fields&&<g>{panel('字段相似，描述的对象不同')}
        <Card x={200} y={455} w={680} title='GET /tasks/{upid}/status' value='stopped + exitstatus: OK' color={green}/>
        <Card x={1040} y={455} w={680} title='GET /qemu/{vmid}/status/current' value='status: running' color={blue}/>
        <Text x={540} y={636} size={29} center bold>这次启动任务已经结束</Text><Text x={1380} y={636} size={29} center bold>这台 VM 的进程正在运行</Text>
        <Text x={960} y={752} size={31} center color={amber} bold>应用登录 / 数据库 / 外部依赖：尚未验证</Text>
        <Text x={960} y={846} size={23} center color={muted}>通过任务号看一次操作，通过 VMID 看实例，再用业务探测看服务</Text>
      </g>}
      {ch===6&&<g>{panel(s.failure==='duplicate'?'独立案例一：第一项启动已完成，再发一次启动':s.failure==='business'?'独立案例二：配置业务标记阻止普通启动':'独立案例三：初始已停止，激活卷时失败')}
        <Card x={180} y={455} w={470} title='前提 / 失败点' value={s.failure==='duplicate'?'旧 QEMU 已在运行':s.failure==='business'?'lock: migrate；不跳过检查':'尚未执行 QEMU 启动命令'} color={amber} small/>
        <Card x={725} y={455} w={470} title='本次后台任务' value={s.failureReported?'任务结束 · ERROR':'进入检查 / 等待错误结果'} color={s.failureReported?red:muted} small/>
        <Card x={1270} y={455} w={470} title='VM 状态 / 本次效果' value={s.failure==='duplicate'?'旧进程仍运行，无第二个进程':s.failure==='business'?'本例未查询 VM 实际状态':'本次没有启动新进程'} color={s.failure==='duplicate'?blue:muted} small/>
        {motion([[650,500],[725,500]],s.failure==='duplicate'?e.duplicateCheck:s.failure==='business'?e.businessError-24:e.storageError-24,amber)}
        {s.failureReported&&<Text x={960} y={682} size={30} center bold color={red}>{s.failure==='duplicate'?'检查发现 already running → 抛出错误':s.failure==='business'?'check_lock 拒绝 → 没有进入资源准备':'卷激活抛错 → 返回任务错误与日志'}</Text>}
        <Text x={960} y={785} size={27} center>错误对应具体阶段；任务出错不等于原有 VM 被停止</Text>
        <Text x={960} y={850} size={22} center color={muted}>没有执行重复启动、清锁或故障注入；三个案例的状态独立</Text>
      </g>}
      {summary&&<g>{panel('启动问题的观察顺序')}
        {[['请求','有没有进入任务？'],['任务','UPID / 日志 / 退出结果'],['VM','进程与运行状态'],['业务','独立健康与功能验收']].map(([t,v],i)=><g key={t} opacity={.15+.85*Math.max(0,Math.min(1,(f-e.summary-i*32)/18))}><Card x={160+i*405} y={470} w={385} title={t} value={v} color={[purple,green,blue,amber][i]} small/></g>)}
        <Text x={960} y={693} size={32} center bold>先定位对象与失败阶段，再决定下一步操作</Text>
        <Text x={960} y={809} size={25} center color={muted}>PVE 负责编排与反馈；应用可用性需要另外的证据</Text>
      </g>}
    </LifecycleScene>
    {audio.map(c=><Sequence key={c.file} from={Math.round(c.start*30)} durationInFrames={Math.ceil(c.duration*30)}><Html5Audio src={staticFile(c.file)}/></Sequence>)}
  </>;
}
