import {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player, type PlayerRef} from '@remotion/player';
import {QuorumPilot} from './QuorumPilot';
import {chapters as originalChapters, DURATION as originalDuration, FPS, stateAt} from './timeline';
import {QuorumDark} from './QuorumDark';
import {darkChapters, DARK_DURATION, darkStateAt} from './dark-timeline';
import './style.css';
import {QuorumEditorial} from './QuorumEditorial';
import {editorialChapters, EDITORIAL_DURATION, editorialStateAt} from './editorial-timeline';
import {QuorumFlow, QuorumLesson} from './QuorumFlow';
import {lessonChapters, LESSON_DURATION, lessonStateAt} from './lesson-timeline';
const isLesson = new URLSearchParams(location.search).get('sample') === 'lesson';
import {flowChapters, FLOW_DURATION, flowStateAt} from './flow-timeline';
import {HaPilot} from './HaPilot';
import {haChapters, HA_DURATION, haStateAt} from './ha-timeline';
import {HaLesson} from './HaLesson';
import {haLessonChapters, HA_LESSON_DURATION, haLessonStateAt} from './ha-lesson-timeline';
import {VirtqueuePilot} from './VirtqueuePilot';
import {VIRTQUEUE_DURATION,virtqueueChapters,virtqueueStateAt} from './virtqueue-timeline';
import {VirtqueueLesson} from './VirtqueueLesson';
import {VIRTQUEUE_LESSON_DURATION,virtqueueLessonChapters,virtqueueLessonStateAt} from './virtqueue-lesson-timeline';
import {BackupPilot} from './BackupPilot';
import {BACKUP_DURATION,backupChapters,backupStateAt} from './backup-timeline';
import {BackupLesson} from './BackupLesson';
import {BACKUP_LESSON_DURATION,backupLessonChapters,backupLessonStateAt} from './backup-lesson-timeline';
import {RestorePilot} from './RestorePilot';
import {RESTORE_DURATION,restoreChapters,restoreStateAt} from './restore-timeline';
import {RestoreLesson} from './RestoreLesson';
import {RESTORE_LESSON_DURATION,restoreLessonChapters,restoreLessonStateAt} from './restore-lesson-timeline';
import {LifecyclePilot} from './LifecyclePilot';
import {LIFECYCLE_DURATION,lifecycleChapters,lifecycleStateAt} from './lifecycle-timeline';
import {LifecycleLesson} from './LifecycleLesson';
import {LIFECYCLE_LESSON_DURATION,lifecycleLessonChapters,lifecycleLessonStateAt} from './lifecycle-lesson-timeline';
import {StoragePilot} from './StoragePilot';
import {STORAGE_DURATION,storageChapters,storageStateAt} from './storage-timeline';
import {StorageLesson} from './StorageLesson';
import {STORAGE_LESSON_DURATION,storageLessonChapters,storageLessonStateAt} from './storage-lesson-timeline';
const isStorageLesson = new URLSearchParams(location.search).get('sample') === 'storage-lesson';
const isStorage = isStorageLesson || new URLSearchParams(location.search).get('sample') === 'storage';
const isLifecycleLesson = new URLSearchParams(location.search).get('sample') === 'lifecycle-lesson';
const isLifecycle = isLifecycleLesson || new URLSearchParams(location.search).get('sample') === 'lifecycle';
const isRestoreLesson = new URLSearchParams(location.search).get('sample') === 'restore-lesson';
const isRestore = isRestoreLesson || new URLSearchParams(location.search).get('sample') === 'restore';
const isBackupLesson = new URLSearchParams(location.search).get('sample') === 'backup-lesson';
const isBackup = isBackupLesson || new URLSearchParams(location.search).get('sample') === 'backup';
const isVirtqueueLesson = new URLSearchParams(location.search).get('sample') === 'virtqueue-lesson';
const isVirtqueue = isVirtqueueLesson || new URLSearchParams(location.search).get('sample') === 'virtqueue';
import {DurabilityLesson} from './DurabilityLesson';
import {DURABILITY_LESSON_DURATION,durabilityLessonChapters,durabilityLessonStateAt} from './durability-lesson-timeline';
const isDurabilityLesson = new URLSearchParams(location.search).get('sample') === 'durability-lesson';
import {DurabilityPilot} from './DurabilityPilot';
import {DURABILITY_DURATION,durabilityChapters,durabilityStateAt} from './durability-timeline';
const isDurability = new URLSearchParams(location.search).get('sample') === 'durability' || isDurabilityLesson;
import {PmxcfsPilot} from './PmxcfsPilot';
import {pmxcfsChapters, PMXCFS_DURATION, pmxcfsStateAt} from './pmxcfs-timeline';
import {PmxcfsLesson} from './PmxcfsLesson';
import {pmxcfsLessonChapters,PMXCFS_LESSON_DURATION,pmxcfsLessonStateAt} from './pmxcfs-lesson-timeline';
const isPmxcfsLesson = new URLSearchParams(location.search).get('sample') === 'pmxcfs-lesson';
const isPmxcfs = isPmxcfsLesson || new URLSearchParams(location.search).get('sample') === 'pmxcfs';
import {MigrationLesson} from './MigrationLesson';
import {migrationLessonChapters, MIGRATION_LESSON_DURATION, migrationLessonStateAt} from './migration-lesson-timeline';
const isMigrationLesson = new URLSearchParams(location.search).get('sample') === 'migration-lesson';
import {MigrationPilot} from './MigrationPilot';
import {migrationChapters, MIGRATION_DURATION, migrationStateAt} from './migration-timeline';
const isMigration = new URLSearchParams(location.search).get('sample') === 'migration';
const isMigrationContent = isMigration || isMigrationLesson;
const isHaLesson = new URLSearchParams(location.search).get('sample') === 'ha-lesson';
const isHa = new URLSearchParams(location.search).get('sample') === 'ha';
const isHaContent = isHa || isHaLesson;
const isFlow = new URLSearchParams(location.search).get('sample') === 'flow';
const isEditorial = new URLSearchParams(location.search).get('sample') === 'editorial';

const isDark = new URLSearchParams(location.search).get('sample') === 'dark';
const DURATION = isStorageLesson ? STORAGE_LESSON_DURATION : isStorage ? STORAGE_DURATION : isLifecycleLesson ? LIFECYCLE_LESSON_DURATION : isLifecycle ? LIFECYCLE_DURATION : isRestoreLesson ? RESTORE_LESSON_DURATION : isRestore ? RESTORE_DURATION : isBackupLesson ? BACKUP_LESSON_DURATION : isBackup ? BACKUP_DURATION : isVirtqueueLesson ? VIRTQUEUE_LESSON_DURATION : isVirtqueue ? VIRTQUEUE_DURATION : isDurabilityLesson ? DURABILITY_LESSON_DURATION : isDurability ? DURABILITY_DURATION : isPmxcfsLesson ? PMXCFS_LESSON_DURATION : isPmxcfs ? PMXCFS_DURATION : isMigrationLesson ? MIGRATION_LESSON_DURATION : isMigration ? MIGRATION_DURATION : isHaLesson ? HA_LESSON_DURATION : isHa ? HA_DURATION : isLesson ? LESSON_DURATION : isFlow ? FLOW_DURATION : isEditorial ? EDITORIAL_DURATION : isDark ? DARK_DURATION : originalDuration;
const chapters = isStorageLesson ? storageLessonChapters : isStorage ? storageChapters : isLifecycleLesson ? lifecycleLessonChapters : isLifecycle ? lifecycleChapters : isRestoreLesson ? restoreLessonChapters : isRestore ? restoreChapters : isBackupLesson ? backupLessonChapters : isBackup ? backupChapters : isVirtqueueLesson ? virtqueueLessonChapters : isVirtqueue ? virtqueueChapters : isDurabilityLesson ? durabilityLessonChapters : isDurability ? durabilityChapters : isPmxcfsLesson ? pmxcfsLessonChapters : isPmxcfs ? pmxcfsChapters : isMigrationLesson ? migrationLessonChapters : isMigration ? migrationChapters : isHaLesson ? haLessonChapters : isHa ? haChapters : isLesson ? lessonChapters : isFlow ? flowChapters : isEditorial ? editorialChapters : isDark ? darkChapters : originalChapters;
document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
if(isHaContent) document.title='HA 自隔离与恢复 · PVE 图解课';
if(isMigrationContent) document.title='热迁移内部机制 · PVE 图解课';

if(isDurability) document.title='写入持久性 · PVE 图解课';
if(isPmxcfs) document.title='pmxcfs 配置复制 · PVE 图解课';

if(isVirtqueue) document.title='Virtqueue 内部机制 · PVE 图解课';
if(isStorage) document.title='存储插件与数据路径 · PVE 图解课';
if(isLifecycle) document.title='VM 启动内部机制 · PVE 图解课';
if(isRestore) document.title='灾难恢复 · PVE 图解课';
if(isBackup) document.title='备份与应用一致性 · PVE 图解课';
function App() {
  const player = useRef<PlayerRef>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState('');
  const [normal, setNormal] = useState(false);
  const [failed, setFailed] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [powerLoss,setPowerLoss] = useState(false);
  const [poll,setPoll] = useState(false);
  // Keep the playback clock stable when frameupdate refreshes the controls.
  const inputProps = useMemo(()=>({normal,failed,blocked,powerLoss,poll,lesson:isLesson}),[normal,failed,blocked,powerLoss,poll]);
  const state = isStorageLesson ? storageLessonStateAt(frame) : isStorage ? storageStateAt(frame) : isLifecycleLesson ? lifecycleLessonStateAt(frame) : isLifecycle ? lifecycleStateAt(frame) : isRestoreLesson ? restoreLessonStateAt(frame) : isRestore ? restoreStateAt(frame) : isBackupLesson ? backupLessonStateAt(frame) : isBackup ? backupStateAt(frame) : isVirtqueueLesson ? virtqueueLessonStateAt(frame) : isVirtqueue ? virtqueueStateAt(frame,poll) : isDurabilityLesson ? durabilityLessonStateAt(frame) : isDurability ? durabilityStateAt(frame,powerLoss) : isPmxcfsLesson ? pmxcfsLessonStateAt(frame) : isPmxcfs ? pmxcfsStateAt(frame,blocked) : isMigrationLesson ? migrationLessonStateAt(frame) : isMigration ? migrationStateAt(frame,failed) : isHaLesson ? haLessonStateAt(frame,normal) : isHa ? haStateAt(frame,normal) : isLesson ? lessonStateAt(frame) : isFlow ? flowStateAt(frame) : isEditorial ? editorialStateAt(frame) : isDark ? darkStateAt(frame) : stateAt(frame);

  useEffect(() => {
    const current = player.current!;
    const onFrame = () => setFrame(current.getCurrentFrame());
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {setFrame(DURATION - 1); setPlaying(false);};
    const onMute = () => setMuted(current.isMuted());
    const onError = () => setError('播放出现问题，请重新加载页面后重试。');
    current.addEventListener('frameupdate', onFrame);
    current.addEventListener('play', onPlay);
    current.addEventListener('pause', onPause);
    current.addEventListener('ended', onEnded);
    current.addEventListener('mutechange', onMute);
    current.addEventListener('error', onError);
    return () => {
      current.removeEventListener('frameupdate', onFrame);
      current.removeEventListener('play', onPlay);
      current.removeEventListener('pause', onPause);
      current.removeEventListener('ended', onEnded);
      current.removeEventListener('mutechange', onMute);
      current.removeEventListener('error', onError);
    };
  }, []);

  const seek = (target: number) => {
    player.current!.pause();
    player.current!.seekTo(target);
    setFrame(target);
    setPlaying(false);
  };
  const toggle = () => {
    if (playing) player.current!.pause();
    else {
      if (frame >= DURATION - 1) seek(0);
      player.current!.play();
    }
  };

  return <div className='page'>
    <header className='masthead'>
      <a className='brand' href='./'><span className='brand-mark'>P</span>PVE 图解课<span className='brand-note'>CLUSTER NOTES</span></a>
      <a className='edition' href={isStorage ? isStorageLesson ? '?sample=storage' : '?sample=storage-lesson' : isLifecycle ? isLifecycleLesson ? '?sample=lifecycle' : '?sample=lifecycle-lesson' : isRestore ? isRestoreLesson ? '?sample=restore' : '?sample=restore-lesson' : isBackup ? isBackupLesson ? '?sample=backup' : '?sample=backup-lesson' : isVirtqueue ? isVirtqueueLesson ? '?sample=virtqueue' : '?sample=virtqueue-lesson' : isDurability ? isDurabilityLesson ? '?sample=durability' : '?sample=durability-lesson' : isPmxcfs ? isPmxcfsLesson ? '?sample=pmxcfs' : '?sample=pmxcfs-lesson' : isMigrationContent ? isMigrationLesson ? '?sample=migration' : '?sample=migration-lesson' : isHaContent ? isHaLesson ? '?sample=ha' : '?sample=ha-lesson' : isLesson ? '?sample=flow' : '?sample=lesson'}>{isStorage ? isStorageLesson ? '对比：30 秒存储样片 ↗' : '观看：7 分钟存储完整课 ↗' : isLifecycle ? isLifecycleLesson ? '对比：30 秒启动样片 ↗' : '观看：7 分钟启动完整课 ↗' : isRestore ? isRestoreLesson ? '对比：30 秒灾难恢复样片 ↗' : '观看：7 分钟灾难恢复完整课 ↗' : isBackup ? isBackupLesson ? '对比：30 秒备份机制样片 ↗' : '观看：7 分钟备份一致性完整讲解 ↗' : isVirtqueue ? isVirtqueueLesson ? '对比：30 秒 Virtqueue 样片 ↗' : '观看：7 分钟 Virtqueue 完整讲解 ↗' : isDurability ? isDurabilityLesson ? '对比：30 秒写入持久性样片 ↗' : '观看：7 分钟写入持久性完整讲解 ↗' : isPmxcfs ? isPmxcfsLesson ? '对比：30 秒 pmxcfs 机制样片 ↗' : '观看：7 分钟 pmxcfs 完整讲解 ↗' : isMigrationContent ? isMigrationLesson ? '对比：30 秒热迁移样片 ↗' : '观看：7 分钟热迁移完整讲解 ↗' : isHaContent ? isHaLesson ? '对比：30 秒机制样片 ↗' : '观看：7 分钟 HA 完整讲解 ↗' : isLesson ? '对比：30 秒动态样片 ↗' : '观看：75 秒完整试讲 ↗'}</a>
    </header>
    <main>
      <div className='intro'><div><p className='eyebrow'>{isStorage?'从卷引用，追到实际数据路径':isLifecycle?'从一次启动，理解 PVE 管理链路':isRestore?'从归档恢复，走到业务证据':isBackup?'备份还在复制，为什么可以解冻？':isVirtqueue?'一份缓冲区，如何跨越 Guest / Host？':isDurability?'从一次写完成，追问数据保存在哪里':isPmxcfs?'从一次写入，理解配置复制':isMigrationContent?'从运行中的内存变化，理解热迁移':'从一次网络分区，理解集群协作'}</p><h1>{isStorage ? 'PVE 如何把存储配置变成可用磁盘？' : isLifecycle ? '点击启动 VM 后，PVE 做了什么？' : isRestore ? '恢复完成之后，业务真的可用了吗？' : isBackup ? '备份与应用一致性：冻结保护了什么？' : isVirtqueue ? 'Virtqueue：通知、数据与完成如何协作？' : isDurability ? '写入返回成功，数据就能抗断电吗？' : isPmxcfs ? '一次配置修改，如何成为共享状态？' : isMigrationContent ? 'VM 还在写内存，如何完成切换？' : isHaContent ? '旧 VM 还活着，何时才敢接管？' : isDark ? '通信断了，谁还能写？' : '谁还能修改集群配置？'}</h1></div><p className='duration'>{isStorageLesson||isLifecycleLesson||isRestoreLesson||isBackupLesson||isVirtqueueLesson||isDurabilityLesson||isHaLesson||isMigrationLesson||isPmxcfsLesson?'7 分钟':`${DURATION / FPS} 秒`}<span>中文讲解 · 可暂停回看</span></p></div>
      {isVirtqueue&&!isVirtqueueLesson&&<div className='ha-scenarios' role='group' aria-label='队列通知场景'>{[false,true].map(value=><button key={String(value)} aria-pressed={poll===value} onClick={()=>{seek(0);setPoll(value);}}>{value?'轮询 used（无旁白）':'通知与完成正常路径'}</button>)}</div>}
      {isDurability&&!isDurabilityLesson&&<div className='ha-scenarios' role='group' aria-label='持久化场景'>{[false,true].map(value=><button key={String(value)} aria-pressed={powerLoss===value} onClick={()=>{seek(0);setPowerLoss(value);}}>{value?'WRITE 后模拟断电（无旁白）':'WRITE 与 FLUSH 完整路径'}</button>)}</div>}
      {isPmxcfs&&!isPmxcfsLesson&&<div className='ha-scenarios' role='group' aria-label='配置写入场景'>{[false,true].map(value=><button key={String(value)} aria-pressed={blocked===value} onClick={()=>{seek(0);setBlocked(value);}}>{value?'仅看无 quorum（无旁白）':'写入机制与分区对照'}</button>)}</div>}
      {isMigration&&<div className='ha-scenarios' role='group' aria-label='迁移场景选择'>{[false,true].map(value=><button key={String(value)} aria-pressed={failed===value} onClick={()=>{seek(0);setFailed(value);}}>{value?'切换前失败（无旁白）':'成功迁移'}</button>)}</div>}
      {isHaContent&&<div className='ha-scenarios' role='group' aria-label='场景选择'>{[false,true].map(value=><button key={String(value)} aria-pressed={normal===value} onClick={()=>{seek(0);setNormal(value);}}>{value?'正常对照（无旁白）':isHaLesson?'持续分区 · 完整讲解':'持续分区 · 机制样片'}</button>)}</div>}
      <div className='lesson-grid'>
        <section className='player-shell' aria-label='教学动画播放器'>
          <Player ref={player} component={isStorageLesson ? StorageLesson : isStorage ? StoragePilot : isLifecycleLesson ? LifecycleLesson : isLifecycle ? LifecyclePilot : isRestoreLesson ? RestoreLesson : isRestore ? RestorePilot : isBackupLesson ? BackupLesson : isBackup ? BackupPilot : isVirtqueueLesson ? VirtqueueLesson : isVirtqueue ? VirtqueuePilot : isDurabilityLesson ? DurabilityLesson : isDurability ? DurabilityPilot : isPmxcfsLesson ? PmxcfsLesson : isPmxcfs ? PmxcfsPilot : isMigrationLesson ? MigrationLesson : isMigration ? MigrationPilot : isHaLesson ? HaLesson : isHa ? HaPilot : isLesson ? QuorumLesson : isFlow ? QuorumFlow : isEditorial ? QuorumEditorial : isDark ? QuorumDark : QuorumPilot} inputProps={inputProps} durationInFrames={DURATION} fps={FPS} compositionWidth={1920} compositionHeight={1080} style={{width: '100%'}} controls={false} autoPlay={false} loop={false} clickToPlay={false} doubleClickToFullscreen={false} moveToBeginningWhenEnded={false} showVolumeControls={false}/>
          <div className='controls'>
            <button className='play-button' onClick={toggle} aria-label={playing ? '暂停' : '播放'}>{playing ? 'Ⅱ 暂停' : '▶ 播放'}</button>
            <button className='icon-button' onClick={() => seek(0)} aria-label='重播'>↺</button>
            <input aria-label='播放进度' type='range' min={0} max={DURATION - 1} value={frame} onChange={(event) => seek(Number(event.target.value))}/>
            <output className='time'>{String(Math.floor(frame / FPS)).padStart(2, '0')} / {DURATION / FPS}</output>
            <button className='sound-button' onClick={() => {muted ? player.current!.unmute() : player.current!.mute();}} aria-pressed={!muted} aria-label={muted ? '开启旁白' : '静音'}>{muted ? '旁白关' : '旁白开'}</button>
          </div>
          {error && <p role='alert' className='error'>{error}</p>}
        </section>
        <aside className='chapters' aria-label='关键步骤'>
          <p className='section-label'>沿着因果链，逐步理解</p>
          <ol>{chapters.map((part, i) => <li key={part.start}>
            <button onClick={() => {if(isHaContent)setNormal(false);if(isMigration)setFailed(false);if(isPmxcfs)setBlocked(false);if(isDurability)setPowerLoss(false);setPoll(false);seek(part.start * FPS);}} aria-current={(!isDurability||!powerLoss)&&(!isPmxcfs||!blocked)&&(!isHaContent||!normal)&&(!isMigration||!failed)&&state.chapter === i ? 'step' : undefined}>
              <span className='chapter-index'>{String(i + 1).padStart(2, '0')}</span><span>{part.name}</span><time>{String(Math.floor(part.start / 60)).padStart(2, '0')}:{String(Math.floor(part.start % 60)).padStart(2, '0')}</time>
            </button>
          </li>)}</ol>
          <p className='chapter-help'>点击步骤后暂停。<br/>看清状态，再继续播放。</p>
        </aside>
      </div>
      <div className='lesson-foot'>
        <p><span className='small-dot'/>{isStorage?isStorageLesson?'NFS / LVM-thin / RBD · 控制路径与数据路径分开':'NFS · 已有 raw 镜像 · 挂载与数据路径分开':isLifecycle?'非 HA · 同节点 API · 普通冷启动 · 正常路径':isRestore?'普通 VMA 恢复 · 隔离环境 · PostgreSQL 日志回放':isBackup?'Linux VM · QGA · snapshot 模式 · VMA 归档':isVirtqueue?'VirtIO-net TX · split virtqueue · vhost-net / TAP':isDurability?'显式 writeback · 本地 raw 文件 · 下层兑现刷新语义':isPmxcfs?'三节点 · 同一配置路径 · 文件层写入示意':isMigrationContent?'共享 NFS · pre-copy · 源端与目标均健康':'三个节点 · 每节点一票 · 无 QDevice'}</p>
        <p>时间经过教学编排，非真实故障计时。</p>
      </div>
      <details className='sources'><summary>场景说明与依据</summary><p>{isStorage?isStorageLesson?'正常主线为已有 raw 镜像、NFS 可用且初始未挂载；文件路径与一次需要访问服务端的读取分开。后端对照展示 NFS 文件、LVM-thin 块设备、RBD 用户态描述与 krbd；共享对照和三个失败案例各自初始化，结尾重新回放正常路径。未执行挂载、故障注入、VM 启动或实际 I/O。':'单节点 pve1、已有 raw 镜像、NFS 可用且初始未挂载、默认 images 路径、无快照与自定义映射。插件准备挂载并检查文件，QEMU 使用本机路径。数据段示意一次需要访问服务端的读取，省略缓存与 NFS RPC 细节；不是每次读取都访问网络。未执行挂载、VM 启动或实际 I/O。':isLifecycleLesson?'普通非 HA 冷启动主线，展开 UPID 字段、配置互斥与业务 lock 标记、资源准备、任务日志与独立状态查询。重复启动、迁移锁标记及卷激活错误是独立案例，结尾重新回放正常过程；主线不继承失败状态。没有实际启动、清锁或故障注入。':isLifecycle?'VM 100 已停止、非 HA、非模板，不恢复挂起状态；用户权限、quorum、存储与网络配置正常。UPID 返回与后台任务并行，动画选择一种合法教学顺序；任务结束、VM 运行与应用就绪分开观察。两次查询均经原 API 路径，画面折叠转发细节。未启动真实 VM。':isRestoreLesson?'普通 VMA 恢复主线，保留独立隔离核验、数据库日志回放、已知查询与验收边界。另设 RPO 15 分钟要求 / 30 分钟数据缺口、RTO 30 分钟目标 / 45 分钟恢复过程两个算例，均非实测；错误和 PBS live-restore 对照独立展开，未执行生产切换或实机恢复。':isRestore?'新 VM、单磁盘完整一致快照、普通 VMA 恢复且不自动启动。操作方在启动前核验隔离网络；数据库数据、WAL 与事务状态完整，无外部依赖。采用 PostgreSQL 启动时回放 WAL 的成功示意；查询通过只覆盖本次检查，不证明全部业务恢复或达到 RPO/RTO 目标。未执行实机恢复。':isBackupLesson?'正常主线：单磁盘 Linux VM、QGA 与冻结选项正常、VMA 归档、无 fleecing。另设 PostgreSQL 干净停库到备份结束的保守对照，以及冻结错误后的清理责任对照；不把清理标记当成功证明。产物检查、隔离恢复与业务验证是验收要求，未实际执行。':isBackup?'本例 QGA 与冻结选项正常，单磁盘、无应用 hook、无 fleecing、无错误。备份保护建立后解冻；覆盖未备份的块之前先复制旧内容。片尾仍有其他块待复制，不宣称备份完成或应用一致性。未做实机备份和恢复测试。':isVirtqueue?'Guest Linux、VirtIO-net、split ring、内核 vhost-net 与 TAP，单个复制发送请求且无错误。无 packed、indirect、EVENT_IDX。通知是提醒，队列在 Guest RAM；used 不证明远端收到网络包。轮询对照抑制完成通知，由驱动主动检查 used；未做实机实验。':isDurability?'本例从来宾块设备请求开始，显式使用 VirtIO Block、writeback、本地 raw 文件与线程式 I/O。选择后台回写未完成的窗口；无并发新写入和 I/O 错误，假定文件系统和设备正确兑现刷新语义。断电预设仅为示意，未做实机断电测试；不等同于应用 write()、fsync() 或业务事务的完整保证。':isPmxcfs?'三节点已同步、权限满足，只跟踪已进入 FUSE 的单个写操作；不代表 GUI/API 的完整事务。分区章节展示 C 已失去 quorum 后的新写入；锁章节与片尾明确回到独立健康示例。SQLite 完成不等于每次断电持久性保证，配置复制不复制虚拟磁盘。':isMigrationContent?'健康集群内的 C → B 预拷贝迁移：共享 NFS、兼容 CPU 与网络，不含本地磁盘或 post-copy。失败对照仅限源端暂停前传输失败且源端和控制路径可用；未做实机迁移验收。':isHaContent?`PVE 9.x 机制示意：三节点与共享 NFS；C 的全部 Corosync 通信路径持续失效，存储仍可访问。假定 watchdog 工作正常。两侧并行处理，不以动画秒数代表协议超时。${isHaLesson?'全片展示目标节点重新启动 VM，应用就绪由独立探测示意；未做实机故障验收。':'样片止于 recovery，未展示目标 VM 启动。'}`:'画面中的连线代表全部有效集群通信路径。配置修改比较同一 VM 100 的 pmxcfs 文件层写入，不代表某个 GUI 或 API 请求的完整行为。虚拟机运行状态不由票数动画直接推断。'}</p><p>{isStorage&&<a href={`https://github.com/hobbytp/blender_demos/blob/prototype/quorum-pilot/docs/notes/${isStorageLesson?'storage-plugins-7min':'pve-ep09-storage-plugins'}.md`}>{isStorageLesson?'第九集完整课、分镜与源码依据':'第九集样片分镜与源码依据'}</a>}{isLifecycle&&<a href='https://github.com/hobbytp/blender_demos/blob/prototype/quorum-pilot/docs/notes/pve-ep08-vm-lifecycle.md'>第八集分镜与源码依据</a>}{isRestore&&<a href='https://github.com/hobbytp/blender_demos/blob/prototype/quorum-pilot/docs/notes/pve-ep07-disaster-recovery.md'>第七集分镜与源码依据</a>}{isBackup&&<a href='https://github.com/hobbytp/blender_demos/blob/prototype/quorum-pilot/docs/notes/pve-ep06-backup-consistency.md'>第六集分镜与源码依据</a>}{isVirtqueue&&<a href='https://github.com/hobbytp/blender_demos/blob/prototype/quorum-pilot/docs/notes/pve-ep05-virtqueue.md'>第五集分镜与源码依据</a>}{isDurability&&<a href='https://github.com/hobbytp/blender_demos/blob/prototype/quorum-pilot/docs/notes/pve-ep04-write-durability.md'>第四集分镜与固定源码依据</a>}{isPmxcfs&&<a href='https://github.com/hobbytp/blender_demos/blob/prototype/quorum-pilot/docs/notes/pve-ep03-pmxcfs.md'>第三集分镜与固定源码依据</a>}{isMigrationContent&&<a href='https://github.com/hobbytp/blender_demos/blob/prototype/quorum-pilot/docs/notes/pve-ep02-live-migration.md'>第二集脚本与固定源码依据</a>}{isHaContent&&<a href='https://github.com/hobbytp/blender_demos/blob/prototype/quorum-pilot/docs/notes/pve-ep01-ha-fencing.md'>首集脚本与固定源码依据</a>}<a href='https://github.com/proxmox/pve-docs/blob/master/pmxcfs.adoc'>Proxmox · pmxcfs</a><a href='https://github.com/corosync/corosync/blob/main/man/votequorum.5'>Corosync · votequorum</a><a href='https://github.com/proxmox/pve-docs/blob/master/ha-manager.adoc'>Proxmox · HA</a></p></details>
    </main>
    <footer><span>PVE 图解课 / {isStorage?'09':isLifecycle?'08':isRestore?'07':isBackup?'06':isVirtqueue?'05':isDurability?'04':isPmxcfs?'03':isMigrationContent?'02':'01'}</span><span>先理解原理，再讨论故障。</span></footer>
  </div>;
}

createRoot(document.getElementById('root')!).render(<App/>);
