import {Html5Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Card,Text,Wire} from './HaPilot';
import {BackupScene} from './BackupPilot';
import audio from './backup-lesson-audio.json';
import {BACKUP_LESSON_DURATION,backupLessonCue as cue,backupLessonBeats as b,backupReplayBeats,backupLessonEvents as e,backupLessonStateAt} from './backup-lesson-timeline';
const green='#347d70',blue='#347aa8',amber='#b18635',purple='#7e759c',muted='#73847e';
const titles=['已经解冻，为什么还能保留过去？','固定拓扑：控制命令与磁盘数据分开走','先确认冻结，不能只看代理在线','保护建立 → 任务启动 → 解冻 → 继续复制','同一份备份：未保护旧块与已保护旧块','独立应用对照：PostgreSQL 干净停库','清理标记、任务结果与恢复证据','三问验收：沿着旧数据回放'];
const ramp=(f:number,start:number,n=30)=>Math.max(0,Math.min(1,(f-start)/n));
export function BackupLesson(){
  const f=useCurrentFrame(),s=backupLessonStateAt(f),ch=s.chapter;
  const scopePanel=ch===2&&f>=cue('命令返回的数量也很重要，'),failure=ch===6&&f<e.evidence;
  const dim=scopePanel||ch===5||ch===6||ch===7&&!s.isReplay;
  const caption=audio.find(c=>f>=c.start*30&&f<(c.start+c.duration+.3)*30)?.captions.filter(c=>c.start*30<=f).at(-1)?.text??'';
  const motion=(points:number[][],end:number,color=amber,n=24)=><Wire points={points} frame={f} active={f>=end-n&&f<end} progress={ramp(f,end-n,n)} color={color}/>;
  const panel=()=> <rect x={105} y={310} width={1710} height={605} rx={18} fill='#fffefa' stroke='#c7d7ce' strokeWidth={2}/>;
  const outline=(x:number,y:number,w:number,color=blue)=><rect x={x+4} y={y+4} width={w-8} height={82} rx={16} fill='none' stroke={color} strokeWidth={4}/>;
  const reveal=(text:string)=>.12+.88*ramp(f,cue(text));
  const note=ch===5?'独立保守方案：完整 PostgreSQL 集群位于同一被备份磁盘；停库持续到备份结束':ch===6?'冻结错误对照与验收清单分别展开；不把建议执行的检查显示成已通过':ch===7?'回放采用新的正常备份示意；时间点、覆盖范围与恢复证据分别判断':'正常主线：Linux VM · X / 甲，Y / 乙为示意逻辑块；只追踪单次备份';
  const footer=ch===5?`数据库：${s.appRestarted?'已重启（示意）':s.appStopped?'已干净停止':'准备 / 停止中'}　｜　FS：${s.appFrozen?'冻结':f>=e.appThaw?'已解冻':'运行'}　｜　恢复验证：未执行`:ch===6?'错误清理 ≠ 冻结成功　｜　归档任务结果 ≠ 业务恢复证据':undefined;
  const focus=ch===1?(f<cue('中间是来宾内部。')?[90,315,390]:f<cue('应用有自己的缓冲和事务，')?[590,315,450]:f<cue('右边是模拟器的块层。')?[590,475,450]:[1530,355,300]):null;
  return <>
    <BackupScene frame={f} state={s} timing={s.isReplay?backupReplayBeats:b} duration={BACKUP_LESSON_DURATION} title={s.isReplay?'正常路径回放 · 新的一次备份示意':titles[ch]} caption={caption} dim={dim} note={note} footer={footer} scope='Linux VM · snapshot 模式 → VMA 归档 · 主线无错误 / 无 fleecing · 应用与失败对照单独展开'>
      {ch===0&&<g>{outline(1150,645,320,purple)}{outline(1530,645,300,green)}<Text x={960} y={930} size={22} center bold color={amber}>开场先看结果：运行盘向前变化，归档仍在保留原时间点</Text></g>}
      {focus&&outline(focus[0],focus[1],focus[2])}
      {ch===1&&<g>
        {motion([[480,340],[590,340]],cue('冻结命令沿控制路径传递，')+24)}
        {motion([[1190,645],[1190,445],[1470,445],[1470,415],[1530,415]],cue('旧数据走另一条复制路径。')+24,blue)}
        <Text x={960} y={930} size={22} center bold color={muted}>角色导览中的箭头仅示意通道；下一章才启动正常备份</Text>
      </g>}
      {ch===2&&!scopePanel&&<g>{outline(s.freezeAcknowledged?90:590,315,s.freezeAcknowledged?390:450,s.frozen?amber:blue)}<Text x={960} y={930} size={22} center bold color={amber}>{s.freezeAcknowledged?'成功响应已到达；后续还要建立备份保护':'QGA 在线、命令发出与 FS 已冻结，是不同观察点'}</Text></g>}
      {scopePanel&&<g>
        {panel()}
        <Text x={960} y={365} size={29} center bold>原位展开冻结边界 · 正常案例成功冻结至少一个本地文件系统</Text>
        <Card x={170} y={435} w={455} title='QGA · 成功返回' value='返回已冻结文件系统的数量' color={green} small/>
        <Card x={730} y={435} w={455} title='可冻结的本地文件系统' value='同步后冻结；相关写入受限' color={amber} small/>
        <Card x={1290} y={435} w={455} title='不支持 / 未冻结的范围' value='不能由请求成功泛化覆盖' color={muted} small/>
        <g opacity={reveal('还有网络文件系统，')}><Card x={170} y={635} w={735} title='Guest 网络文件系统' value='不属于本命令的本地冻结承诺' color={muted}/></g>
        <g opacity={reveal('应用事务是否完成，')}><Card x={1010} y={635} w={735} title='应用 · 缓冲 / 事务 / 外部系统' value='仍需应用自身的协调与验证' color={purple}/></g>
        <Text x={960} y={825} size={28} center bold color={amber}>冻结范围必须明确：返回 0 不能画成“全部数据受保护”</Text>
        <Text x={960} y={877} size={22} center color={muted}>QGA guest-fsfreeze-freeze；不模拟多盘、远程存储或 Windows VSS</Text>
      </g>}
      {ch===3&&<g>
        {outline(s.thawed?590:s.started?1530:1150,s.thawed?665:355,s.thawed?450:s.started?300:320,s.thawed?green:purple)}
        <Text x={960} y={930} size={22} center bold color={amber}>{s.thawed?'解冻以后仍在复制；snapshot 模式不要求底层先做存储快照':'冻结窗口保护备份时间点，不覆盖整段后台复制时间'}</Text>
      </g>}
      {ch===4&&<g>
        <rect x={90} y={695} width={390} height={140} rx={12} fill='#fffefa' stroke={s.yWriteRequested?green:amber}/>
        <Text x={285} y={737} size={25} center bold color={s.yWriteRequested?green:amber}>{s.yWriteRequested?'Y / 乙：旧内容已保护':'X / 甲：先保护，再覆盖'}</Text>
        <Text x={285} y={786} size={22} center>{s.yWriteRequested?'无需为本次覆盖再复制旧乙':s.oldSafe?'旧甲复制成功，允许覆盖':'先复制旧甲，再放行覆盖'}</Text>
        {s.yWriteRequested&&<g>
          <Card x={1150} y={355} w={320} title='QEMU · CBW 过滤器' value={s.yOverwritten?'乙的新写已放行':'乙已保护，无需再复制'} color={green} small/>
          {motion([[1040,690],[1105,690],[1105,405],[1150,405]],e.writeY,purple)}
          {motion([[1430,445],[1430,645]],e.overwriteY,purple)}
        </g>}
        <Text x={960} y={930} size={22} center bold color={s.writeBlocked?amber:green}>{s.yWriteRequested?'同一备份的 Y=v1 已复制；运行盘 Y=v2 不覆盖归档旧值':s.writeBlocked?'覆盖请求等待旧块保护成功；不是整个 Guest 停机':'复制状态协调后台扫描与写入触发的保护'}</Text>
      </g>}
      {ch===5&&<g>
        {panel()}
        <Text x={960} y={365} size={28} center bold>独立对照 · 手动协调 PostgreSQL；不是 PVE 自动提供的应用 hook</Text>
        <Card x={170} y={425} w={455} title='操作方 · 应用协调' value={f>=e.appRestart-24?'备份结束后请求重启':f>=e.appStopRequest?'请求正常停库':'确定可接受停库窗口'} color={amber} small/>
        <Card x={730} y={425} w={455} title='Guest · PostgreSQL' value={s.appRestarted?'备份结束后重启':s.appStopped?'确认干净退出':'运行 / 停止处理中'} color={s.appStopped?green:purple} small/>
        {motion([[625,457],[730,457]],e.appStopRequest)}
        {motion([[730,490],[625,490]],e.appStopped,green)}
        <Card x={1290} y={425} w={455} title='同一备份磁盘 · 完整范围' value={s.appScopeReady?'数据目录 + WAL + 事务状态':'等待核对完整范围'} color={s.appScopeReady?blue:muted} small/>
        {motion([[1185,470],[1290,470]],e.appScope,blue)}
        <Card x={170} y={645} w={455} title='Guest FS · QGA 协作' value={s.appFrozen?'已冻结':f>=e.appThaw?'已解冻；其他服务可写':'等待应用退出和范围核对'} color={s.appFrozen?amber:f>=e.appThaw?green:muted} small/>
        <Card x={730} y={645} w={455} title='Host · QEMU 块层' value={s.appBackupDone?'选定成功结束分支':s.appProtected?'已保护；复制继续':'等待建立备份保护'} color={s.appProtected?blue:muted} small/>
        <Card x={1290} y={645} w={455} title='备份产物 → 后续恢复' value={s.appBackupDone?'得到产物，恢复仍未验证':'等待全部复制与输出结果'} color={s.appBackupDone?amber:muted} small/>
        {motion([[397,515],[397,645]],e.appFreeze,amber)}
        {motion([[625,675],[730,675]],e.appProtect,purple)}
        {motion([[730,705],[625,705]],e.appThaw,green)}
        {motion([[1185,690],[1290,690]],e.appBackupDone,blue)}
        {motion([[955,735],[955,780],[130,780],[130,560],[397,560],[397,515]],e.appBackupDone+18,green,18)}
        {motion([[625,457],[730,457]],e.appRestart,amber)}
        <Text x={960} y={810} size={27} center bold color={amber}>{f>=cue('完整一致快照也可能支持，')?'完整一致快照可经 WAL 恢复；无 hook 不代表必然损坏':'本对照持续停库直到备份结束；代价是应用不可用时间更长'}</Text>
        <Text x={960} y={866} size={22} center color={muted}>PG 18 文件级备份文档 · 单磁盘包含完整集群 · 无外部业务系统 / 在线基础备份</Text>
      </g>}
      {failure&&<g>
        {panel()}
        <Text x={960} y={365} size={29} center bold>独立错误分支 · freeze 调用返回错误，不推断最终文件系统状态</Text>
        <Card x={170} y={440} w={455} title='Host · 冻结调用结果' value={s.freezeError?'捕获并记录错误':'等待 freeze 调用结果'} color={amber} small/>
        <Card x={730} y={440} w={455} title='Host · 后续清理责任' value={s.cleanupRequired?'标记：仍需尝试 thaw':'尚未设置清理标记'} color={purple} small/>
        <Card x={1290} y={440} w={455} title='Host → QGA · 解冻尝试' value={s.thawAttempted?'已发起；结果待核对':'等待安排清理'} color={amber} small/>
        {motion([[625,485],[730,485]],e.cleanup,purple)}
        {motion([[1185,485],[1290,485]],e.thawAttempt,amber)}
        <Card x={170} y={670} w={735} title='已知证据' value={s.freezeError?'freeze 失败；不能宣称冻结成功':'等待调用结果'} color={amber}/>
        <Card x={1010} y={670} w={735} title='Guest · 最终实际状态' value='未知：核对返回值与实际状态' color={muted}/>
        <Text x={960} y={845} size={26} center bold color={purple}>清理标记只安排后续动作；不等于成功、无需清理或最终已解冻</Text>
      </g>}
      {ch===6&&!failure&&<g>
        {panel()}
        <Text x={960} y={358} size={29} center bold>恢复证据逐层增加 · 以下为验收要求，尚未执行这些实验</Text>
        {[
          ['第一步只是任务已经启动。','任务启动','获得任务标识 ≠ 已完成归档'],
          ['第二步要等复制结果，','复制与输出结果','核对任务错误、输出链退出结果'],
          ['随后检查产物是否可读。','产物检查','可读取 ≠ 已经证明业务可用'],
          ['再在隔离环境恢复并启动。','隔离恢复演练','恢复数据并启动相容环境'],
          ['最后检查业务数据与功能。','业务验证','核对数据、约束与关键功能'],
        ].map(([text,title,value],i)=><g key={title} opacity={reveal(text)}>
          <Text x={180} y={430+i*100} size={27} bold>{i+1}. {title}</Text>
          <Text x={720} y={430+i*100} size={25} color={amber}>{value}</Text>
          <Text x={1650} y={430+i*100} size={22} center color={muted}>需核验</Text>
        </g>)}
        <Text x={960} y={890} size={22} center color={muted}>实际验收必须保存环境版本、操作记录和恢复结果；本片为机制教学</Text>
      </g>}
      {ch===7&&!s.isReplay&&<g>
        {panel()}
        <Text x={960} y={365} size={29} center bold>暂停思考：每个“成功”究竟证明了哪一层？</Text>
        {['解冻 = 整份备份完成？','文件系统冻结 = 事务完成？','任务成功 = 业务恢复成功？'].map((text,i)=><g key={text} opacity={reveal(['解冻意味着整份备份完成吗？','文件系统冻结证明事务完成吗？','归档任务成功就能放心恢复吗？'][i])}>
          <Text x={180} y={485+i*145} size={30} bold>{i+1}. {text}</Text>
          <Text x={1380} y={485+i*145} size={26} center bold color={green}>{f>=[e.answerOne,e.answerTwo,e.answerThree][i]?['不等于，保护后仍要复制','不能替代应用自己的证据','还需恢复与业务检查'][i]:'？'}</Text>
        </g>)}
      </g>}
    </BackupScene>
    {audio.map(c=><Sequence key={c.file} from={Math.round(c.start*30)} durationInFrames={Math.round((c.end-c.start)*30)} layout='none'><Html5Audio src={staticFile(c.file)}/></Sequence>)}
  </>;
}
