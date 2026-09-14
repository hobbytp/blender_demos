import {useEffect,useState,type ReactNode} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,Html5Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Card,Text,Wire} from './HaPilot';
import audio from './virtqueue-audio.json';
import {VIRTQUEUE_DURATION,virtqueueBeats,virtqueueStateAt} from './virtqueue-timeline';
const green='#347d70',blue='#347aa8',amber='#b18635',purple='#7e759c',muted='#73847e',paper='#f8f7f2';
export function VirtqueuePilot({poll=false}:{poll?:boolean}){
  const f=useCurrentFrame(),s=virtqueueStateAt(f,poll);
  return <VirtqueueScene frame={f} state={s} poll={poll}/>;
}
export function VirtqueueScene({frame:f,state:s,poll=false,timing:b=virtqueueBeats,duration=VIRTQUEUE_DURATION,title,caption:customCaption,children,dim=false}:{frame:number;state:ReturnType<typeof virtqueueStateAt>;poll?:boolean;timing?:typeof virtqueueBeats;duration?:number;title?:string;caption?:string;children?:ReactNode;dim?:boolean}){
  const [handle]=useState(()=>delayRender('Virtqueue font'));
  useEffect(()=>{new FontFace('Quorum Noto',`url(${staticFile('fonts/NotoSansSC.ttf')})`,{weight:'100 900'}).load().then(font=>{document.fonts.add(font);continueRender(handle);}).catch(cancelRender);},[handle]);
  const caption=customCaption??(poll?'轮询对照：不依赖完成中断；读取 used 后才能回收。':audio.find(c=>f>=c.start*30&&f<(c.start+c.duration+.3)*30)?.captions.filter(c=>c.start*30<=f).at(-1)?.text??'');
  const flow=(points:number[][],start:number,end:number,color=purple,enabled=true)=><Wire points={points} frame={f} active={enabled&&f>=start&&f<end} progress={Math.max(0,Math.min(1,(f-start)/(end-start)))} color={color}/>;
  return <AbsoluteFill style={{background:paper,fontFamily:'Quorum Noto, sans-serif'}}>
    <svg viewBox='0 0 1920 1080' width='100%' height='100%' role='img' aria-label='Virtqueue 内部机制：发布、取用、完成与回收'>
      <defs>{[green,blue,amber,purple,muted].map(color=><marker key={color} id={`ha-${color.slice(1)}`} markerWidth={7} markerHeight={7} refX={6} refY={3.5} orient='auto'><path d='M1 1 L6 3.5 L1 6' fill='none' stroke={color} strokeWidth={1.5}/></marker>)}</defs>
      <Text x={60} y={48} size={20} bold color={green}>PVE 05 / VIRTQUEUE · FOLLOW THE BUFFER</Text>
      <Text x={60} y={110} size={42} bold>{title??(poll?'轮询对照：完成依据仍然是 used 记录':['先写描述符，再发布可用环索引','后端按描述符访问数据，提交 TAP','先发布 used，再通知驱动回收','通知不是数据，回收不是远端收包'][s.chapter])}</Text>
      <Text x={60} y={158} size={23} color={muted}>VirtIO-net TX · split ring · vhost-net → TAP · 单请求、复制路径 · 无错误</Text>
      <Text x={60} y={202} size={22} bold color={blue}>队列与数据位于 Guest RAM；Host 后端通过已配置的映射访问，不是另一份网络队列</Text>
      <g opacity={dim?.12:1}>
      {[[60,360,'Guest · 驱动'],[460,780,'Guest RAM · 共享访问'],[1280,580,'Host · 宿主']].map(([x,w,title])=><g key={String(title)}><rect x={Number(x)} y={245} width={Number(w)} height={685} rx={20} fill={Number(x)===460?'#f1eae2':'#e6eee7'} stroke='#c7d7ce'/><Text x={Number(x)+25} y={286} size={26} bold>{String(title)}</Text></g>)}
      <Card x={90} y={365} w={300} title='virtio-net · TX 驱动' value={s.reclaimed?'缓冲区已回收':s.available?'请求已发布':'准备请求 P1'} color={s.reclaimed?green:purple} small/>
      <Card x={500} y={350} w={310} title='描述符表 · addr / len' value={s.descriptor?'#0 hdr → #1 data':'等待填写描述符'} color={s.descriptor?purple:muted} small/>
      <Text x={510} y={472} size={19} color={muted}>flags / next：链头与下一项</Text>
      <Card x={870} y={350} w={320} title='发送缓冲区 · Guest RAM' value={s.reclaimed?'P1 缓冲可复用':'hdr + P1 数据'} color={s.reclaimed?green:blue} small/>
      <Card x={500} y={560} w={310} title='available · 驱动写' value={s.availableEntry?'ring[0] = 链头 #0':'ring[0] 尚未发布'} color={s.available?purple:muted} small/>
      <Text x={655} y={692} size={29} center bold color={s.available?purple:muted}>avail.idx = {s.available?1:0}</Text>
      <Text x={655} y={726} size={18} center color={muted}>先写内容 → 内存屏障 → 更新 idx</Text>
      <Card x={890} y={740} w={300} title='used · 后端写' value={s.usedEntry?'ring[0].id = 0':'等待后端写回'} color={s.used?green:muted} small/>
      <Text x={1040} y={869} size={29} center bold color={s.used?green:muted}>used.idx = {s.used?1:0}</Text>
      <Text x={655} y={855} size={22} center color={muted}>used 记录链头，不复制包</Text>
      <Card x={1330} y={320} w={500} title='QEMU · 用户态（另一个边界）' value='已配置设备、队列、后端与通知' color={muted} small/>
      <Text x={1580} y={448} size={20} center color={muted}>本例数据面交给内核 vhost-net</Text>
      <Card x={1330} y={480} w={500} title='vhost-net · 内核 TX 处理' value={s.used?'已发布 used':s.tapAccepted?'TAP 提交成功':s.consumed?'已取得链头 #0':'等待可用请求'} color={s.used?green:s.consumed?purple:muted} small/>
      <Card x={1330} y={655} w={500} title='TAP · 宿主网络入口' value={s.tapAccepted?'本例发送数据已提交':'尚未接收本次提交'} color={s.tapAccepted?blue:muted} small/>
      <Text x={1580} y={802} size={27} center bold color={amber}>远端收包：未证明</Text>
      <Text x={1580} y={843} size={21} center color={muted}>不演示桥接、物理网卡与远端 ACK</Text>
      <Card x={90} y={740} w={300} title={poll?'驱动轮询 used':'驱动完成处理'} value={s.reclaimed?'链与缓冲已回收':s.readUsed?'已读取 used #0':s.interrupted?'收到完成通知':'等待检查 used'} color={s.reclaimed?green:s.interrupted||s.readUsed?amber:muted} small/>
      {flow([[390,405],[500,405]],b.desc-24,b.desc)}
      <Wire points={[[810,395],[870,395]]} frame={f} color={purple} dashed/>
      <Text x={1030} y={472} size={19} center color={purple}>addr 引用缓冲区；描述符不是包</Text>
      {flow([[655,440],[655,560]],b.availableEntry-24,b.availableEntry)}
      {flow([[390,430],[430,430],[430,510],[1270,510],[1330,510]],b.kick-36,b.kick,amber)}
      <Text x={960} y={497} size={19} center color={amber}>kick：通知后端检查队列</Text>
      {flow([[810,605],[1250,605],[1250,550],[1330,550]],b.consume-36,b.consume)}
      {flow([[1190,395],[1250,395],[1250,525],[1330,525]],b.data-30,b.data,blue)}
      {flow([[1580,570],[1580,655]],b.tap-36,b.tap,blue)}
      {flow([[1330,555],[1265,555],[1265,785],[1190,785]],b.usedEntry-36,b.usedEntry,green)}
      {flow([[1330,565],[1280,565],[1280,908],[420,908],[420,810],[390,810]],b.irq-36,b.irq,amber,!poll)}
      {flow([[890,775],[390,775]],b.read-30,b.read,green)}
      <Text x={690} y={890} size={18} center color={poll?muted:amber}>{poll?'本例完成通知被抑制；驱动主动检查':'完成通知：提醒检查，不携带结果内容'}</Text>
      </g>
      {children}
      <Text x={60} y={963} size={20} color={muted}>教学选定路径：无 packed / indirect / EVENT_IDX；不推断每包必有中断，不承诺零拷贝。</Text>
      <Text x={60} y={995} size={18} color={muted}>紫：队列元数据 · 蓝：缓冲数据 · 琥珀：通知 · 绿：完成记录 / 回收 · 时间非实测</Text>
      <Text x={1800} y={995} size={18} center color={green}>{poll?'轮询对照':`${s.chapter+1} / ${duration===VIRTQUEUE_DURATION?4:10}`}</Text>
      <rect y={1010} width={1920} height={70} fill='#ecefe8'/><Text x={960} y={1055} size={29} center bold>{caption}</Text>
      <rect y={1075} width={1920*(f+1)/duration} height={5} fill={green}/>
    </svg>
    {duration===VIRTQUEUE_DURATION&&!poll&&audio.map(c=><Sequence key={c.file} from={Math.round(c.start*30)} durationInFrames={Math.round((c.end-c.start)*30)} layout='none'><Html5Audio src={staticFile(c.file)}/></Sequence>)}
  </AbsoluteFill>;
}
