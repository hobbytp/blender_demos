import {useEffect,useState,type ReactNode} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,Html5Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Card,Text,Wire} from './HaPilot';
import audio from './storage-audio.json';
import {storageBeats,storageStateAt} from './storage-timeline';
const blue='#347aa8',green='#347d70',amber='#b18635',muted='#73847e',purple='#7e759c',paper='#f8f7f2';
export function StorageScene({frame:f,state:s,timing:b=storageBeats,title,caption='',note,footer,dim=false,children}:{frame:number;state:ReturnType<typeof storageStateAt>;timing?:typeof storageBeats;title?:string;caption?:string;note?:string;footer?:string;dim?:boolean;children?:ReactNode}){
  const [handle]=useState(()=>delayRender('Storage font'));
  useEffect(()=>{new FontFace('Quorum Noto',`url(${staticFile('fonts/NotoSansSC.ttf')})`,{weight:'100 900'}).load().then(font=>{document.fonts.add(font);continueRender(handle);}).catch(cancelRender);},[handle]);
  const flow=(points:number[][],end:number,color=amber)=> <Wire points={points} frame={f} active={f>=end-24&&f<end} progress={Math.max(0,Math.min(1,(f-end+24)/24))} color={color}/>;
  return <AbsoluteFill style={{background:paper,fontFamily:'Quorum Noto, sans-serif'}}>
    <svg viewBox='0 0 1920 1080' role='img' aria-label='PVE 存储机制：卷标识、插件、挂载与数据路径' style={{width:'100%',height:'100%'}}>
      <defs>{[blue,green,amber,purple].map(color=><marker key={color} id={`ha-${color.slice(1)}`} markerWidth='7' markerHeight='7' refX='6' refY='3' orient='auto'><path d='M0 0 L6 3 L0 6' fill='none' stroke={color} strokeWidth={1.5}/></marker>)}</defs>
      <Text x={60} y={48} size={21} bold color={green}>PVE 09 / STORAGE · CONTROL AND DATA</Text>
      <Text x={60} y={112} size={43} bold>{title??['磁盘卷标识，怎样找到存储？','插件把配置变成本机可用资源','从卷标识，到 QEMU 可打开的文件','真正的磁盘数据，走另一条路径'][s.chapter]}</Text>
      <Text x={60} y={161} size={24} color={muted}>正常主线前提：已有 raw 镜像 · NFS 可用 · 初始未挂载 · 普通启动</Text>
      {note&&<Text x={60} y={203} size={24} bold color={blue}>{note}</Text>}
      <g opacity={dim?.10:1}>
      <rect x={60} y={220} width={1240} height={695} rx={24} fill='#e9efe9'/><Text x={90} y={255} size={24} bold>pve1 · 启动编排与宿主文件系统</Text>
      <rect x={1390} y={380} width={470} height={535} rx={24} fill='#f0ece3'/><Text x={1420} y={425} size={27} bold>NFS 服务器 · nas.example</Text>
      <g opacity={s.readRequested?.4:1}>
        <Card x={90} y={280} w={470} title='VM 100 配置 · scsi0 卷引用' value='nas:100/vm-100-disk-0.raw' color={purple} small/>
        <Card x={680} y={280} w={560} title='/etc/pve/storage.cfg · 已有配置' value='nfs: nas  →  server / export / path' color={s.configured?purple:muted} small/>
        {flow([[325,370],[325,450]],b.lookup-24,purple)}
        {flow([[560,486],[610,486],[610,325],[680,325]],b.lookup,purple)}
        <Card x={90} y={450} w={470} title='启动进程内 · PVE::Storage' value={s.configured?'Storage ID = nas · type = nfs':'解析卷 ID → 查找存储配置'} color={s.configured?purple:muted} small/>
        {flow([[680,345],[640,345],[640,410],[950,410],[950,450]],b.plugin,purple)}
        <Card x={680} y={450} w={560} title='同一进程内 · NFSPlugin + 基类' value={s.checked?'挂载已确认 · 镜像文件存在':s.mounted?'挂载已确认 → 检查镜像文件':s.plugin?'检查连接与挂载，必要时执行 mount':'按 type 分派，等待调用'} color={s.checked?green:s.plugin?amber:muted} small/>
        {flow([[960,540],[960,570],[325,570],[325,595]],b.path,amber)}
        <Card x={90} y={595} w={1150} title='卷路径 · 默认 images 子目录，无快照或自定义映射' value={s.path?'/mnt/pve/nas/images/100/vm-100-disk-0.raw':'存储根路径 + images + VMID + 文件名'} color={s.path?green:muted}/>
        <Text x={960} y={727} size={21} center color={muted}>插件是编排代码，不是 I/O 转发守护进程</Text>
      </g>
      {flow([[1240,495],[1335,495],[1335,800],[1240,800]],b.mount,amber)}
      {flow([[1240,815],[1350,815],[1350,495],[1420,495]],b.mountRequest,amber)}
      {flow([[1420,525],[1370,525],[1370,875],[960,875],[960,860]],b.mounted,amber)}
      {flow([[1210,770],[1260,770],[1260,560],[700,560],[700,540]],b.checked,amber)}
      <Text x={1326} y={458} size={19} center color={amber}>挂载控制</Text>
      {flow([[325,685],[325,770]],b.delivered,amber)}
      <Card x={90} y={770} w={470} title='QEMU 进程 · 文件块后端' value={s.readCompleted?'本次读取数据已返回':s.readRequested?'读取进行中 · 等待数据':s.opened?'已打开镜像 · 等待读取':f>=b.delivered?'接收文件路径 → 打开':'等待路径，尚未打开'} color={s.readCompleted?green:s.opened?blue:muted} small/>
      <Card x={680} y={770} w={560} title='宿主内核 · VFS / NFS 客户端' value={s.mounted?'/mnt/pve/nas → 远端 /vmstore':'尚未挂载远端 export'} color={s.mounted?blue:muted} small/>
      <Card x={1420} y={460} w={410} title='导出目录 /vmstore' value='images/100/…disk-0.raw' color={amber} small/>
      <Text x={1625} y={610} size={25} center bold>磁盘文件的数据在这里</Text>
      <Text x={1625} y={656} size={21} center color={muted}>已有文件；本片不分配或复制磁盘</Text>
      <rect x={1470} y={707} width={310} height={110} rx={14} fill='#fffefa' stroke={s.readCompleted?green:blue}/>
      <Text x={1625} y={746} size={23} center bold color={blue}>一次需要访问服务端的读</Text>
      <Text x={1625} y={789} size={23} center>{f>=b.returned?'数据已发回宿主':f>=b.server?'读取文件，准备返回':'尚未收到本次读取'}</Text>
      <g opacity={s.readRequested?1:.15}>
        {flow([[560,800],[680,800]],b.kernel,blue)}
        {flow([[1240,835],[1380,835],[1380,760],[1470,760]],b.server,blue)}
        {flow([[1470,790],[1400,790],[1400,892],[960,892],[960,860]],b.returned,green)}
        {flow([[680,840],[560,840]],b.completed,green)}
      </g>
      </g>
      {children}
      <Text x={960} y={958} size={28} bold center color={dim?amber:s.readCompleted?green:amber}>{footer??(s.readCompleted?'本次读取返回 ≠ 写入持久化或全部业务就绪':'配置与插件准备资源；运行时读写经 QEMU 和宿主内核')}</Text>
      <Text x={960} y={995} size={21} center color={muted}>紫：配置引用　金：启动准备　蓝 / 绿：读请求 / 数据返回　｜　配置共享 ≠ 磁盘数据共享</Text>
      <rect y={1010} width={1920} height={70} fill='#243f4b'/><Text x={960} y={1056} size={29} center bold color='#fffefa'>{caption}</Text>
    </svg>
  </AbsoluteFill>;
}
export function StoragePilot(){
  const f=useCurrentFrame(),s=storageStateAt(f);
  const caption=audio.find(c=>f>=c.start*30&&f<(c.start+c.duration+.25)*30)?.captions.filter(c=>c.start*30<=f).at(-1)?.text??'';
  return <><StorageScene frame={f} state={s} caption={caption}/>{audio.map(c=><Sequence key={c.file} from={Math.round(c.start*30)} durationInFrames={Math.ceil(c.duration*30)}><Html5Audio src={staticFile(c.file)}/></Sequence>)}</>;
}
