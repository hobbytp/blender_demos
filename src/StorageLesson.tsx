import {Html5Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Card,Text,Wire} from './HaPilot';
import {StorageScene} from './StoragePilot';
import audio from './storage-lesson-audio.json';
import {storageLessonBeats,storageLessonCue as cue,storageLessonEvents as e,storageLessonStateAt,storageReplayBeats} from './storage-lesson-timeline';

const blue='#347aa8',green='#347d70',amber='#b18635',muted='#73847e',purple='#7e759c',red='#a85448';

export function StorageLesson(){
  const f=useCurrentFrame(),s=storageLessonStateAt(f),ch=s.chapter,b=s.isReplay?storageReplayBeats:storageLessonBeats;
  const caption=audio.find(c=>f>=c.start*30&&f<(c.start+c.duration+.25)*30)?.captions.filter(c=>c.start*30<=f).at(-1)?.text??'';
  const titles=['存储编号、类型、卷名与格式：先别混在一起','卷引用如何进入插件实现？','NFS 在线、挂载与卷检查是三层证据','控制路径结束后，数据从哪里流动？','同一个接口，为什么返回不同形态？','配置相同，数据就已经共享了吗？','三个错误，分别停在哪一层？','清空失败状态，再回放正常因果链'];
  const capability=ch===7&&f>=e.capability,dim=ch===0||ch===4||ch===5||ch===6||capability;
  const panel=(title:string)=><g><rect x={110} y={245} width={1700} height={660} rx={18} fill='#fffefa' stroke='#c7d7ce' strokeWidth={2}/><Text x={960} y={300} size={30} bold center>{title}</Text></g>;
  const reveal=(at:number)=>.15+.85*Math.max(0,Math.min(1,(f-at)/18));
  const motion=(points:number[][],at:number,color=amber)=><Wire points={points} frame={f} active={f>=at&&f<at+24} progress={Math.max(0,Math.min(1,(f-at)/24))} color={color}/>;
  const note=ch===1?(f>=e.pluginProcess?'插件调用发生在启动管理进程内部':f>=e.nodeChecks?'配置已找到；继续检查 disabled 与 nodes':'跟踪 nas:100/vm-100-disk-0.raw'):ch===2?(f>=e.dedupe?'先按存储编号去重激活，再逐卷检查':f>=e.existingMount?'已挂载可复用；正常主线展示初始未挂载':'在线检查、挂载状态与文件存在分别观察'):ch===3?'上方是资源准备；下方单独跟踪一次需要访问服务端的读取':s.isReplay&&!capability?'新的正常回放；失败案例的状态已经清空':undefined;
  const footer=ch===0?'四个名字各自回答一个问题':ch===4?'接口相同，插件返回的路径或后端描述可以不同':ch===5?'共享来自后端与访问条件；shared 标记不会搬运数据':ch===6?'每例独立开始；都没有继续到 QEMU 打开镜像':capability?'能力判断委托给具体插件，并带上当前操作条件':undefined;
  return <>
    <StorageScene frame={f} state={s} timing={b} title={titles[ch]} caption={caption} note={note} footer={footer} dim={dim}>
      {ch===0&&<g>{panel('一份 VM 磁盘引用，包含四类身份')}
        {[
          ['Storage ID','nas','定位 storage.cfg 中的一份配置',e.identityId,purple,190,390],
          ['Storage type','nfs','选择 NFSPlugin 实现',e.identityType,blue,1010,390],
          ['Volume name','100/vm-100-disk-0.raw','定位后端中的卷对象',e.identityVolume,amber,190,590],
          ['Image format','raw','描述镜像数据组织方式',e.identityFormat,green,1010,590],
        ].map(([title,value,why,at,color,x,y])=><g key={String(title)} opacity={reveal(Number(at))}><Card x={Number(x)} y={Number(y)} w={720} title={String(title)} value={String(value)} color={String(color)}/><Text x={Number(x)+360} y={Number(y)+133} size={23} center color={muted}>{String(why)}</Text></g>)}
        <Text x={960} y={830} size={27} center bold color={amber}>存储类型 ≠ 镜像格式　／　存储编号 ≠ 卷名</Text>
      </g>}
      {ch===1&&<g>
        {f>=e.nodeChecks&&<g><rect x={1390} y={240} width={470} height={122} rx={14} fill='#fffefa' stroke={green}/><Text x={1625} y={282} size={23} center bold color={green}>节点可用条件</Text><Text x={1625} y={326} size={22} center>disabled = 0 · nodes 包含 pve1</Text></g>}
        {f>=e.pluginProcess&&<rect x={684} y={454} width={552} height={82} rx={12} fill='none' stroke={purple} strokeWidth={4}/>}
      </g>}
      {ch===2&&<g>
        <g opacity={reveal(cue('在线检查通过，'))}><rect x={1400} y={245} width={450} height={112} rx={14} fill='#fffefa' stroke={blue}/><Text x={1625} y={286} size={23} center bold color={blue}>check_connection ✓</Text><Text x={1625} y={328} size={21} center>服务可联系 ≠ 镜像可读取</Text></g>
        {f>=e.existingMount&&<g><rect x={90} y={690} width={470} height={58} rx={10} fill='#fffefa' stroke={amber}/><Text x={325} y={728} size={21} center>另一分支：已有正确挂载 → 复用</Text></g>}
        {f>=e.dedupe&&<g><rect x={680} y={690} width={560} height={58} rx={10} fill='#fffefa' stroke={purple}/><Text x={960} y={728} size={21} center>activate storage once → activate each volume</Text></g>}
      </g>}
      {ch===4&&<g>{panel('四种独立路径：文件、逻辑卷、RBD 用户态与 krbd')}
        {[
          ['NFS 文件','NFSPlugin','/mnt/pve/nas/…raw','QEMU → VFS / NFS',e.compareFile,purple],
          ['LVM-thin','LvmThinPlugin','/dev/vg/vm-100-disk-0','QEMU → host_device',e.compareLvm,blue],
          ['RBD · krbd=0','RBDPlugin','rbd:pool/image:…','QEMU / librbd → Ceph',e.compareRbd,amber],
          ['RBD · krbd=1','RBDPlugin','映射后的 /dev/rbd…','QEMU → kernel rbd',e.compareKrbd,green],
        ].map(([title,plugin,path,io,at,color],i)=><g key={String(title)} opacity={reveal(Number(at))}>
          <Card x={145+i*420} y={385} w={370} title={String(title)} value={String(plugin)} color={String(color)} small/>
          <path d={`M${330+i*420},475 L${330+i*420},535`} stroke={String(color)} strokeWidth={3}/>
          <Card x={145+i*420} y={535} w={370} title='路径 / 后端描述' value={String(path)} color={String(color)} small/>
          <Text x={330+i*420} y={688} size={22} center bold color={String(color)}>{String(io)}</Text>
        </g>)}
        <Text x={960} y={805} size={24} center color={muted}>VM 对照；RBD 省略监视器、认证和连接参数，不展示密钥</Text>
      </g>}
      {ch===5&&<g>{panel(f<e.sharedCompare?'同一份配置，两块各自独立的本地磁盘':'同一导出目录，两台节点分别完成本机准备')}
        <Card x={180} y={390} w={520} title='节点甲 · storage.cfg' value={f<e.sharedCompare?'local: data · /var/lib/vz':'nfs: nas · /mnt/pve/nas'} color={purple}/>
        <Card x={1220} y={390} w={520} title='节点乙 · storage.cfg' value={f<e.sharedCompare?'local: data · /var/lib/vz':'nfs: nas · /mnt/pve/nas'} color={purple}/>
        {f<e.sharedCompare?<>
          <Card x={180} y={610} w={520} title='甲的本地磁盘' value='只有甲本机的数据' color={blue}/><Card x={1220} y={610} w={520} title='乙的本地磁盘' value='只有乙本机的数据' color={blue}/>
          <Text x={960} y={690} size={34} center bold color={red}>同名配置 / shared=1 不会复制文件</Text>
        </>:<>
          <Card x={700} y={610} w={520} title='NFS 后端 · 同一 export' value='/vmstore/images/100/…raw' color={green}/>
          <path d='M440 480 L440 555 L820 555 L820 610' fill='none' stroke={blue} strokeWidth={3}/><path d='M1480 480 L1480 555 L1100 555 L1100 610' fill='none' stroke={blue} strokeWidth={3}/>
          {motion([[440,480],[440,555],[820,555],[820,610]],e.nodeARead,blue)}{motion([[1480,480],[1480,555],[1100,555],[1100,610]],e.nodeBRead,blue)}
          <Text x={960} y={768} size={28} center bold color={green}>{f>=e.nodeAMounted?'甲、乙各自挂载完成 → 访问同一个后端对象':'两边分别检查权限、网络与挂载状态'}</Text>
        </>}
        <Text x={960} y={845} size={22} center color={muted}>数据共享成立后，是否允许同一 VM 并发运行仍由其他协调机制决定</Text>
      </g>}
      {ch===6&&<g>{panel(s.failure==='disabled'?'独立案例一：存储配置被禁用':s.failure==='mount'?'独立案例二：在线检查通过，但 mount 失败':'独立案例三：已挂载，但目标镜像不存在')}
        <Card x={175} y={455} w={470} title='配置 / 前置条件' value={s.failure==='disabled'?'disabled = 1':s.failure==='mount'?'check_connection ✓':'NFS mount ✓'} color={s.failure==='disabled'?red:green} small/>
        <Card x={725} y={455} w={470} title='后端准备 / 卷检查' value={s.failure==='disabled'?'尚未进入插件':s.failure==='mount'?'nfs_mount → ERROR':'activate_volume → file missing'} color={s.failureReported?red:amber} small/>
        <Card x={1275} y={455} w={470} title='QEMU / VM 100' value='没有打开镜像 · 没有启动' color={muted} small/>
        {motion([[645,500],[725,500]],s.failure==='disabled'?e.disabledError-18:s.failure==='mount'?e.mountError-18:e.missingError-18,amber)}
        {s.failureReported&&<Text x={960} y={675} size={31} center bold color={red}>{s.failure==='disabled'?'storage_check_enabled 拒绝':s.failure==='mount'?'挂载未成功返回，mounted 保持 false':'卷级存在性检查抛出错误'}</Text>}
        <Text x={960} y={790} size={27} center>配置存在、服务在线、挂载成功：每项只覆盖自己的检查范围</Text>
        <Text x={960} y={850} size={22} center color={muted}>教学示意；未执行故障注入、挂载或 VM 启动</Text>
      </g>}
      {capability&&<g>{panel('volume_has_feature：把问题交给当前插件')}
        <Card x={680} y={500} w={560} title='具体插件的能力判断' value='volume_has_feature(…)' color={purple}/>
        {[
          ['操作','snapshot / clone',210,390,blue],['卷与状态','current / snap / running',210,665,amber],['镜像格式','raw / qcow2 / vmdk',1310,390,green],['配置与版本','当前 storage.cfg + 代码',1310,665,purple],
        ].map(([title,value,x,y,color],i)=><g key={String(title)} opacity={reveal(e.capability+i*28)}><Card x={Number(x)} y={Number(y)} w={400} title={String(title)} value={String(value)} color={String(color)} small/><path d={`M${Number(x)<960?610:1310},${Number(y)+45} L${Number(x)<960?680:1240},545`} stroke={String(color)} strokeWidth={3}/></g>)}
        <Text x={960} y={825} size={27} center bold color={amber}>“网络存储支持什么”不是一个脱离插件与状态的统一答案</Text>
      </g>}
    </StorageScene>
    {audio.map(c=><Sequence key={c.file} from={Math.round(c.start*30)} durationInFrames={Math.ceil(c.duration*30)}><Html5Audio src={staticFile(c.file)}/></Sequence>)}
  </>;
}
