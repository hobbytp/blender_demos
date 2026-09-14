import {Html5Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Card,Text,Wire} from './HaPilot';
import {RestoreScene} from './RestorePilot';
import audio from './restore-lesson-audio.json';
import {restoreLessonCue as cue,restoreLessonBeats,restoreReplayBeats,restoreLessonEvents as e,restoreLessonStateAt,recoveryExample as example} from './restore-lesson-timeline';
const green='#347d70',blue='#347aa8',amber='#b18635',purple='#7e759c',muted='#73847e',red='#b96b50';
const ramp=(f:number,start:number,n=24)=>Math.max(0,Math.min(1,(f-start)/n));
export function RestoreLesson(){
  const f=useCurrentFrame(),s=restoreLessonStateAt(f),ch=s.chapter,b=s.isReplay?restoreReplayBeats:restoreLessonBeats;
  const isolation=ch===3&&f<b.start-24,scope=ch===4&&f>=e.scope,evidence=ch===5&&f>=e.evidence,failure=ch===7&&!s.isReplay;
  const dim=ch===0||ch===1||isolation||scope||evidence||ch===6||failure;
  const caption=audio.find(c=>f>=c.start*30&&f<(c.start+c.duration+.25)*30)?.captions.filter(c=>c.start*30<=f).at(-1)?.text??'';
  const titles=['恢复完成，是哪一层的完成？','RPO：数据时间点与业务要求','归档 → 设备映射 → 目标卷 → 任务结果','先核验隔离，再启动恢复实例','日志回放：从磁盘状态到数据库就绪','业务验收：请求、结果与检查范围','RTO：把整个恢复过程放进时间轴','失败边界与正常路径回放'];
  const panel=(title:string)=><g><rect x={110} y={300} width={1700} height={605} rx={18} fill='#fffefa' stroke='#c7d7ce' strokeWidth={2}/><Text x={960} y={350} size={29} bold center>{title}</Text></g>;
  const reveal=(text:string)=>.14+.86*ramp(f,cue(text));
  const outline=(x:number,y:number,w:number,color=blue)=><rect x={x+4} y={y+4} width={w-8} height={82} rx={12} fill='none' stroke={color} strokeWidth={4}/>;
  const motion=(points:number[][],end:number,color=amber,n=24)=><Wire points={points} frame={f} active={f>=end-n&&f<end} progress={ramp(f,end-n,n)} color={color}/>;
  const note=ch===1?'独立案例：10:00 中断；RPO 要求 15 分钟；仅 09:30 时间点的归档可用':ch===6?'独立计时算例：RTO 目标 30 分钟；本例约定从中断到验收并切换完成':failure?'独立失败 / PBS 对照；不沿用前面成功实例的状态':'普通 VMA · 隔离恢复 · 选定成功路径；没有实际执行恢复或生产切换';
  const footer=ch===0?'磁盘、系统、数据库、业务各自需要证据':ch===1?(f>=e.gap?'数据时间缺口 30 分钟 > RPO 要求 15 分钟':'恢复点是数据状态的时间，不是归档复制结束时间'):isolation?'新 VMID / 随机 MAC 都不能替代隔离核验':scope?'完整数据库集群与所需日志必须同时被恢复':evidence?'本次读取通过；写入、依赖及生产切换仍未验证':ch===6?(f>=e.rtoTotal?'独立算例：45 分钟 > 30 分钟目标；不是隔离实例的实测':'本例计时口径：中断 → 准备 → 恢复 → 验收 → 切换'):failure?'错误不能继承成功状态；PBS live-restore 是另一条路径':undefined;
  return <>
    <RestoreScene frame={f} state={s} timing={b} title={s.isReplay?'正常路径回放 · 新的一次隔离恢复':titles[ch]} caption={caption} dim={dim} note={note} footer={footer}>
      {ch===0&&<g>{panel('四个问题，四层证据')}
        {[['归档 / 目标卷','任务与产物','归档能否还原磁盘，'],['虚拟机 / OS','启动状态','虚拟机能否启动，'],['数据库','恢复与连接','数据库能否接受连接，'],['业务','数据与功能验收','业务数据是否符合预期，']].map(([t,v,c],i)=><g key={t} opacity={reveal(c)}><Card x={170+i*405} y={455} w={365} title={t} value={v} color={[blue,green,purple,amber][i]} small/></g>)}
        <g opacity={reveal('先看恢复点能有多旧，')}><Card x={260} y={675} w={650} title='RPO · 恢复点目标' value='数据需要恢复到多近的过去？' color={blue}/></g>
        <g opacity={reveal('再看服务要多久回来。')}><Card x={1010} y={675} w={650} title='RTO · 恢复时间目标' value='约定的服务最多允许多久恢复？' color={amber}/></g>
        <Text x={960} y={855} size={23} center color={muted}>目标来自业务；后续用具体恢复过程验证能力</Text>
      </g>}
      {ch===1&&<g>{panel('10:00 中断：可用数据能回到哪里？')}
        <line x1={230} y1={475} x2={1690} y2={475} stroke={muted} strokeWidth={3}/>
        {[[230,'09:30'],[716,'09:40'],[960,'09:45'],[1203,'09:50'],[1690,'10:00']].map(([x,label])=><g key={label}><line x1={Number(x)} y1={460} x2={Number(x)} y2={490} stroke={muted} strokeWidth={2}/><Text x={Number(x)} y={435} center size={23}>{label}</Text></g>)}
        {f>=e.rpoBoundary&&<g><rect x={960} y={458} width={730} height={33} fill={blue} opacity={.12}/><Text x={1325} y={533} size={24} center bold color={blue}>目标允许的回退窗口：15 分钟</Text></g>}
        <g opacity={reveal('第一份的一致性时间点，')}><Card x={180} y={585} w={720} title='候选 A · 数据时间点 09:30' value='09:40 完成归档；本例确认可用' color={s.selectedPoint?green:blue}/>{s.selectedPoint&&<Text x={540} y={719} size={25} center bold color={green}>选择 A；不把 09:40 当恢复点</Text>}</g>
        <g opacity={reveal('第二份指向九点五十分，')}><Card x={1020} y={585} w={720} title='候选 B · 数据时间点 09:50' value={f>=e.failedCandidate?'任务失败，不能作为可用归档':'候选时间较新，仍需任务证据'} color={f>=e.failedCandidate?red:muted}/></g>
        {f>=e.gap&&<g><path d='M230 750 V778 H1690 V750' stroke={red} strokeWidth={3} fill='none'/><Text x={960} y={827} size={30} center bold color={red}>10:00 − 09:30 = {s.gapMinutes} 分钟　／　未满足 15 分钟要求</Text></g>}
        <Text x={960} y={878} size={21} center color={muted}>分钟表示数据时间缺口；丢失记录数量另行核对</Text>
      </g>}
      {ch===2&&<g>
        {outline(s.restored?530:s.mapped?530:90,s.restored?320:s.mapped?690:320,s.mapped||s.restored?400:330,s.restored?green:blue)}
        {f>=b.mapped+24&&f<b.disks&&<Wire points={[[930,390],[946,390],[946,665],[850,665],[850,690]]} frame={f} active color={blue}/>}
      </g>}
      {isolation&&<g>{panel('启动前：操作方核验，不由新 VMID 自动保证')}
        <Card x={170} y={425} w={460} title='恢复实例保留的身份' value='地址 / 凭据 / 定时任务' color={amber} small/>
        <Card x={730} y={425} w={460} title='操作方 · 隔离网络' value={s.isolationChecked?'隔离已核验（示意）':'确认测试网与生产隔离'} color={s.isolationChecked?green:amber} small/>
        <Card x={1290} y={425} w={460} title='目标资源 / 虚拟硬件' value={s.resourcesChecked?'本例启动条件满足':'检查容量与兼容条件'} color={s.resourcesChecked?green:muted} small/>
        {motion([[630,470],[730,470]],e.isolation)}{motion([[1190,470],[1290,470]],e.resources)}
        <g opacity={reveal('新编号不等于网络隔离，')}><Text x={960} y={625} size={32} center bold color={amber}>新编号 ≠ 隔离　　随机 MAC ≠ 隔离</Text></g>
        <Text x={960} y={719} size={25} center>测试端只访问隔离实例；生产接入仍未执行</Text>
        <Text x={960} y={820} size={23} center color={muted}>随后回到同一拓扑：操作方发出启动请求 → Guest OS → 数据库</Text>
      </g>}
      {ch===3&&!isolation&&outline(1040,320,360,s.os?green:amber)}
      {ch===4&&!scope&&<g>{outline(1430,s.redone?320:530,400,s.ready?green:purple)}
        {motion([[1630,410],[1630,475],[1220,475],[1220,530]],cue('启动过程读取日志，')+24,purple)}
        {motion([[1400,575],[1430,575]],cue('把需要的修改应用到数据页。')+24,purple)}
      </g>}
      {scope&&<g>{panel('数据库恢复成功依赖什么？')}
        {[['完整数据目录','不能只还原单表文件'],['WAL 与事务状态','必须覆盖恢复所需范围'],['一致的数据时间点','多卷场景另需协调']].map(([t,v],i)=><Card key={t} x={170+i*560} y={440} w={460} title={t} value={v} color={[blue,purple,amber][i]} small/>)}
        <g opacity={reveal('干净停库的备份，')}><Text x={960} y={651} size={28} center bold color={green}>干净停库备份：不必经历相同的崩溃恢复</Text></g>
        <g opacity={reveal('日志不能凭空补出，')}><Text x={960} y={761} size={30} center bold color={amber}>日志不能补出从未进入该备份的数据</Text></g>
        <Text x={960} y={855} size={22} center color={muted}>本片不是连续归档 / PITR 流程；不额外假定存在备份之后的 WAL</Text>
      </g>}
      {ch===5&&!evidence&&outline(s.response?90:1430,730,s.response?330:400,s.checked?green:amber)}
      {evidence&&<g>{panel('本次查询通过以后：其余证据仍需取得')}
        {[['已知订单读取','已通过（示意）',green],['受控写入 / 读回','待核验',amber],['数据约束 / 登录','待核验',amber],['外部依赖','本例未覆盖',muted],['服务切换 / 流量','未执行',muted],['检查记录与范围','需保留证据',blue]].map(([t,v,c],i)=><Card key={t} x={180+i%3*560} y={425+Math.floor(i/3)*210} w={450} title={t} value={v} color={c} small/>)}
        <Text x={960} y={868} size={22} center color={muted}>外部队列、对象存储和密钥不会随着 VM 启动自动恢复</Text>
      </g>}
      {ch===6&&<g>{panel('独立算例 · 10:00 中断 → 10:45 完成验收并切换')}
        {[['准备 / 决策','10:00 → 10:05'],['磁盘恢复','10:05 → 10:25'],['系统启动','10:25 → 10:28'],['数据库恢复','10:28 → 10:32'],['业务验证','10:32 → 10:42'],['服务切换','10:42 → 10:45']].map(([t,range],i)=><g key={t} opacity={.14+.86*ramp(f,e.rtoSteps[i])}><Card x={180+i%3*560} y={415+Math.floor(i/3)*185} w={450} title={`${i+1}. ${t} · ${example.stagesMinutes[i]} 分钟`} value={range} color={i===1?blue:amber} small/></g>)}
        <Text x={960} y={779} size={24} center color={muted}>步骤按执行顺序排列；卡片宽度不表示时间比例</Text>
        {f>=e.rtoTotal&&<Text x={960} y={852} size={32} center bold color={red}>5 + 20 + 3 + 4 + 10 + 3 = {s.exampleRecoveryMinutes} 分钟　&gt;　RTO 30 分钟</Text>}
      </g>}
      {failure&&<g>{panel(f<e.pbs?'独立失败对照 · 普通 VMA 解包报错':'独立方案对照 · 不混用恢复模式')}
        {f<e.pbs?<g>
          <Card x={180} y={445} w={450} title='vma extract' value={f>=e.failure?'解包报错（示意）':'独立失败分支'} color={red}/>
          <Card x={735} y={445} w={450} title='恢复编排' value={f>=e.cleanup?'尝试清理并抛出错误':'等待错误处理'} color={amber}/>
          <Card x={1290} y={445} w={450} title='目标实例' value='不能标记完整恢复成功' color={muted} small/>
          {motion([[630,490],[735,490]],e.cleanup,amber)}
          <Text x={960} y={701} size={31} center bold color={red}>部分磁盘内容 ≠ 可用的完整恢复实例</Text>
          <Text x={960} y={824} size={23} center color={muted}>需要检查错误与清理结果；本片未执行失败注入</Text>
        </g>:<g>
          <Card x={220} y={445} w={690} title='本片 · 普通 VMA' value='恢复完成 → 单独启动' color={blue}/>
          <Card x={1010} y={445} w={690} title='PBS · live-restore' value='可在后台复制时启动' color={purple}/>
          <Text x={960} y={683} size={28} center bold color={amber}>PBS 专用路径；不适用于普通 VMA 归档</Text>
          <Text x={960} y={780} size={23} center>失败时存在不完整数据等独立风险，不能套用普通恢复状态</Text>
        </g>}
      </g>}
    </RestoreScene>
    {audio.map(c=><Sequence key={c.file} from={Math.round(c.start*30)} durationInFrames={Math.ceil(c.duration*30)}><Html5Audio src={staticFile(c.file)}/></Sequence>)}
  </>;
}
