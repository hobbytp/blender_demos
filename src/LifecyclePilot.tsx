import {useEffect,useState,type ReactNode} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,Html5Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Card,Text,Wire} from './HaPilot';
import audio from './lifecycle-audio.json';
import {lifecycleBeats,lifecycleStateAt} from './lifecycle-timeline';
const green='#347d70',blue='#347aa8',amber='#b18635',purple='#7e759c',muted='#73847e',paper='#f8f7f2';
export function LifecycleScene({frame:f,state:s,timing:b=lifecycleBeats,title,caption='',note,footer,dim=false,children}:{frame:number;state:ReturnType<typeof lifecycleStateAt>;timing?:typeof lifecycleBeats;title?:string;caption?:string;note?:string;footer?:string;dim?:boolean;children?:ReactNode}){
  const [handle]=useState(()=>delayRender('Lifecycle font'));
  useEffect(()=>{new FontFace('Quorum Noto',`url(${staticFile('fonts/NotoSansSC.ttf')})`,{weight:'100 900'}).load().then(font=>{document.fonts.add(font);continueRender(handle);}).catch(cancelRender);},[handle]);
  const flow=(points:number[][],start:number,end:number,color=amber)=>{const departure=Math.max(start,end-24);return <Wire points={points} frame={f} active={f>=departure&&f<end} progress={Math.max(0,Math.min(1,(f-departure)/(end-departure)))} color={color}/>;};
  const query=(start:number,result:number,y:number,color:string)=><g opacity={f>=start?1:.15}>
    {flow([[390,y],[500,y]],start,start+12,amber)}
    {flow([[500,y+28],[390,y+28]],start+12,result,color)}
  </g>;
  return <AbsoluteFill style={{background:paper,fontFamily:'Quorum Noto, sans-serif'}}>
    <svg viewBox='0 0 1920 1080' role='img' aria-label='PVE 启动机制：API、后台任务、锁与 VM 状态' style={{width:'100%',height:'100%'}}>
      <defs>{[green,blue,amber,purple].map(color=><marker key={color} id={`ha-${color.slice(1)}`} markerWidth='7' markerHeight='7' refX='6' refY='3' orient='auto'><path d='M0,0 L6,3 L0,6' fill='none' stroke={color} strokeWidth='1.5'/></marker>)}</defs>
      <Text x={60} y={48} size={21} color={green} bold>PVE 08 / VM LIFECYCLE · FOLLOW THE REQUEST</Text>
      <Text x={60} y={112} size={43} bold>{title??'点击启动之后，PVE 内部发生了什么？'}</Text>
      <Text x={60} y={160} size={24} color={muted}>正常主线前提：目标节点本机 API · VM 100 初始停止 · 非 HA / 非模板</Text>
      <Text x={60} y={203} size={25} bold color={blue}>{note??(s.taskObserved?'任务结果与运行状态是两份证据':s.worker?'任务号返回与后台执行并行；此处按教学节奏展开':'跟踪 POST /nodes/pve1/qemu/100/status/start')}</Text>
      <g opacity={dim?.10:1}>
      <rect x={60} y={230} width={360} height={675} rx={24} fill='#e9efe9'/>
      <rect x={460} y={230} width={1400} height={675} rx={24} fill='#f0ece3'/>
      <Text x={85} y={270} size={26} bold>浏览器 / 管理客户端</Text>
      <Text x={485} y={270} size={26} bold>目标 PVE 节点 · 管理进程与 VM 进程</Text>
      <Card x={90} y={305} w={300} title='启动按钮 / POST' value={f>=b.request?'已发送启动请求':'VM 100 · 已停止'} color={blue} small/>
      <Card x={500} y={305} w={350} title='pveproxy · www-data' value={s.proxy?'HTTPS 8006 → 本机转交':'API 入口 · 等待请求'} color={s.proxy?blue:muted} small/>
      <Card x={970} y={305} w={400} title='pvedaemon · root' value={s.daemon?'启动 API · 权限 / 前置检查':'127.0.0.1:85'} color={s.daemon?blue:muted} small/>
      <Card x={90} y={455} w={300} title='启动请求的响应' value={s.upid?'UPID · qmstart / VM 100':'尚未收到任务号'} color={s.upid?purple:muted} small/>
      <Text x={235} y={575} size={22} center bold color={amber}>任务号 ≠ 启动成功</Text>
      <g opacity={s.worker?1:.24}>
        <rect x={935} y={480} width={450} height={350} rx={16} fill='#fffefa' stroke={s.taskDone?green:purple} strokeWidth={2}/>
        <Text x={955} y={516} size={25} bold color={purple}>qmstart · 后台任务子进程</Text>
        <Text x={955} y={551} size={20} color={muted}>fork_worker → vm_start</Text>
        {[{y:605,label:'配置互斥锁',value:s.taskDone?'已释放':s.locked?'持有中':'等待取得',on:s.locked||s.taskDone},
          {y:671,label:'读取配置 / 检查状态',value:s.checked?'通过':'待检查',on:s.checked},
          {y:737,label:'激活卷 / 生成启动参数',value:s.resources?'已准备':'待执行',on:s.resources}].map(row=><g key={row.y}>
          <circle cx={962} cy={row.y-8} r={7} fill={row.on?green:muted}/><Text x={980} y={row.y} size={22}>{row.label}</Text><Text x={1285} y={row.y} size={21} color={row.on?green:muted}>{row.value}</Text>
        </g>)}
        <Text x={1160} y={795} size={21} center color={s.taskDone?green:amber}>{s.taskDone?'编排结束 · 返回任务结果':'后台独立推进，不等浏览器再次发令'}</Text>
      </g>
      <g opacity={s.qemu?1:.3}>
        <rect x={1460} y={500} width={350} height={215} rx={16} fill='#fffefa' stroke={s.qemu?green:muted} strokeWidth={2}/>
        <Text x={1480} y={536} size={26} bold>QEMU · VM 100 进程</Text>
        <Text x={1480} y={575} size={24} color={s.qemu?green:muted}>{s.qemu?'进程已启动（正常示意）':'尚未启动'}</Text>
        {[{x:1480,label:'vCPU'},{x:1638,label:'虚拟设备'}].map(e=><g key={e.x}><rect x={e.x} y={603} width={148} height={57} rx={8} fill={s.qemu?'#e2eee7':'#ecece5'}/><Text x={e.x+74} y={640} size={23} center>{e.label}</Text></g>)}
        <Text x={1635} y={693} size={21} center color={amber}>Guest OS / 应用：未验收</Text>
      </g>
      <Card x={500} y={620} w={350} title='任务状态 API · 按 UPID' value={s.taskDone?'stopped · exitstatus: OK':'任务尚未完成'} color={s.taskDone?green:muted} small/>
      <Text x={675} y={739} size={18} center color={muted}>stopped 指任务结束，不是 VM 停止</Text>
      <Card x={500} y={755} w={350} title='VM 状态 API · 按 VMID' value={f>=b.process+24?'status: running':s.qemu?'读取进程状态':'status: stopped'} color={f>=b.process+24?blue:muted} small/>
      <Card x={90} y={620} w={300} title='任务查询的结果' value={s.taskObserved?'任务结束 · OK':'尚未取得完成证据'} color={s.taskObserved?green:muted} small/>
      <Card x={90} y={755} w={300} title='VM 查询的结果' value={s.vmObserved?'VM 正在运行':'尚未取得运行证据'} color={s.vmObserved?blue:muted} small/>
      {flow([[390,345],[500,345]],b.request,b.proxy,blue)}
      {flow([[850,345],[970,345]],b.proxy,b.daemon,blue)}
      {flow([[1170,395],[1170,480]],b.fork-24,b.fork,purple)}
      {flow([[970,377],[850,377]],b.upid-24,b.upid-12,purple)}
      {flow([[500,377],[446,377],[446,500],[390,500]],b.upid-12,b.upid,purple)}
      {flow([[1385,595],[1460,595]],b.launch,b.process,amber)}
      {flow([[935,782],[886,782],[886,683],[850,683]],b.done-18,b.done,green)}
      {flow([[1810,680],[1830,680],[1830,867],[870,867],[870,818],[850,818]],b.process,b.process+24,blue)}
      {query(b.taskQuery,b.taskResult,647,green)}{query(b.vmQuery,b.vmResult,781,blue)}
      <Text x={680} y={891} size={18} center color={muted}>两次 GET 均经原 API 路径；此处折叠转发细节</Text>
      <Text x={1635} y={772} size={22} center color={amber}>锁只保护启动编排</Text>
      <Text x={1635} y={813} size={22} center>不是 VM 整个运行期的锁</Text>
      </g>
      {children}
      <Text x={960} y={949} size={27} center bold color={dim?amber:s.vmObserved?amber:purple}>{footer??(s.vmObserved?'任务 OK + VM running，仍需独立验证应用就绪':s.upid?'HTTP 请求已返回；后台任务仍可继续执行':'请求、任务、VM：观察不同对象的状态')}</Text>
      <Text x={960} y={990} size={20} center color={muted}>蓝：请求 / VM 状态　紫：任务创建 / UPID　金：启动控制　绿：任务结果　｜　教学示意，未启动真实 VM</Text>
      <rect x={0} y={1010} width={1920} height={70} fill='#243f4b'/><Text x={960} y={1056} size={29} center bold color='#fffefa'>{caption}</Text>
    </svg>
  </AbsoluteFill>;
}
export function LifecyclePilot(){
  const f=useCurrentFrame(),s=lifecycleStateAt(f);
  const caption=audio.find(c=>f>=c.start*30&&f<(c.start+c.duration+.25)*30)?.captions.filter(c=>c.start*30<=f).at(-1)?.text??'';
  return <><LifecycleScene frame={f} state={s} caption={caption}/>{audio.map(c=><Sequence key={c.file} from={Math.round(c.start*30)} durationInFrames={Math.ceil(c.duration*30)}><Html5Audio src={staticFile(c.file)}/></Sequence>)}</>;
}
