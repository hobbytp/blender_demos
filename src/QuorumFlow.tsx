import {useEffect, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, Html5Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {flowStateAt} from './flow-timeline';
import audio from './flow-audio.json';
import lessonAudio from './lesson-audio.json';
import {lessonFrameAt, lessonStateAt} from './lesson-timeline';

const ink = '#243f4b', blue = '#347aa8', green = '#347d70', amber = '#b18635', red = '#b96b50';
const xs = [70, 720, 1370];
const titles = ['打开节点，看见内部协作', '通信断了，先检测，再重组', '成员变化，怎样变成仲裁结果？', '仲裁状态，传给配置文件系统', '跟随一次配置写入'];
const notes = ['同一套组件，在每个节点各自运行。', '断开的是到 C 的全部有效集群通信路径。', '每节点一票；预期总票数仍是 3，门槛仍是 2。', '状态通知不是配置数据，也不是逐次写入投票。', '同一 VM 100 配置的文件层写入：A 与 C 两侧对照。'];
const ramp = (f: number, start: number, length: number) => interpolate(f, [start,start+length],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const ease = (f: number, start: number, length = 24) => {const p = ramp(f,start,length); return p*p*(3-2*p);};

function Label({x,y,children,size=24,color=ink,weight=400,anchor='start'}: {x:number;y:number;children:React.ReactNode;size?:number;color?:string;weight?:number;anchor?:'start'|'middle'|'end'}) {
  return <text x={x} y={y} fontSize={size} fill={color} fontWeight={weight} textAnchor={anchor}>{children}</text>;
}

// Frame-derived positions keep playback, seeking and exported video identical.
function Token({x,y,color=amber,text}: {x:number;y:number;color?:string;text?:string}) {
  return <g transform={`translate(${x},${y})`}>
    <rect x={text?-44:-7} y={-13} width={text?88:14} height={26} rx={text?7:4} fill={color} stroke='#fffdf8' strokeWidth={2}/>
    {text && <Label x={0} y={7} anchor='middle' size={18} color='white' weight={650}>{text}</Label>}
  </g>;
}

export function QuorumLesson() {return <QuorumFlow lesson/>;}

export function QuorumFlow({lesson=false}: {lesson?:boolean}) {
  const clock = useCurrentFrame(), f = lesson?lessonFrameAt(clock):clock, state = flowStateAt(f);
  const teaching = lessonStateAt(clock), seconds=clock/30;
  const lessonTitles=['机器都开着，为什么不能改配置？','打开节点，看见内部协作','通信断了，先检测，再重组','同一个集群，两个成员视图','门槛仍是两票','跟随一次配置写入','把这条因果链串起来'];
  const lessonNotes=['电源状态，与集群配置写入资格，是两个问题。','Corosync 内部协作；pmxcfs 接收仲裁状态。','全部有效路径中断后，需要检测与成员重组。','A、B 与 C 看到不同成员；预期总票数仍然是 3。','quorum（仲裁状态）：判断是否拥有多数票。','修改同一 VM 100 的描述 · 文件层概念示意。','通信中断 → 成员变化 → 仲裁判断 → 配置写入限制'];
  const title=lesson?lessonTitles[teaching.chapter]:titles[state.chapter];
  const note=lesson?lessonNotes[teaching.chapter]:notes[state.chapter];
  const clips=lesson?lessonAudio:audio;
  const [handle] = useState(() => delayRender('Flow lesson font'));
  useEffect(() => {new FontFace('Quorum Noto',`url(${staticFile('fonts/NotoSansSC.ttf')})`,{weight:'100 900'}).load().then(font=>{document.fonts.add(font);continueRender(handle);}).catch(cancelRender);},[handle]);
  const expand = ease(f,48,42), group = ease(f,420,24);
  const caption = clips.flatMap(clip=>clip.captions).reverse().find(line=>line.start*30<=clock)?.text;
  const networkOpacity = ease(f,96,20);
  const stream = (x1:number,x2:number,y:number,broken:boolean,breakAt=(x1+x2)/2) => <g>
    <path d={`M${x1} ${y} H${x2}`} stroke={broken?'#d5b7a9':'#91b6c5'} strokeWidth={3} strokeDasharray={broken?'7 8':undefined}/>
    {[0,1].map(i=>{
      const p=((clock/66+i/2)%1), mid=breakAt;
      const x=i===0?x1+(x2-x1)*p:x2-(x2-x1)*p;
      if(broken && (i===0?x>mid-16:x<mid+16)) return null;
      return <g key={i}><rect x={x-11} y={y-5} width={22} height={10} rx={5} fill={blue}/><path d={`M${x+(i===0?3:-3)} ${y-3} l${i===0?4:-4} 3 l${i===0?-4:4} 3`} fill='none' stroke='white' strokeWidth={1.3}/></g>;
    })}
    {broken && <g transform={`translate(${breakAt},${y})`}><circle r={18} fill='#f8f7f2'/><path d='M-7 -7 L7 7 M-7 7 L7 -7' stroke={red} strokeWidth={3}/></g>}
  </g>;
  return <AbsoluteFill style={{background:'#f8f7f2',fontFamily:'Quorum Noto, sans-serif'}}>
    <svg viewBox='0 0 1920 1080' width='100%' height='100%' role='img' aria-label={title}>
      <defs><marker id='flow-arrow' markerWidth={8} markerHeight={8} refX={6} refY={4} orient='auto'><path d='M1 1 L6 4 L1 7' fill='none' stroke={amber} strokeWidth={1.4}/></marker></defs>
      <Label x={70} y={49} size={20} color={green} weight={600}>PVE / COROSYNC · INSIDE THE NODE</Label>
      <Label x={1850} y={49} size={20} anchor='end' color='#74838a'>0{(lesson?teaching.chapter:state.chapter)+1} / {lesson?'07':'05'}</Label>
      <Label x={70} y={116} size={46} weight={750}>{title}</Label>
      <Label x={72} y={161} size={25} color='#667a81'>{note}</Label>
      <g opacity={group}><rect x={50} y={250} width={1180} height={603} rx={25} fill='#e5efe8'/><rect x={1350} y={250} width={520} height={603} rx={25} fill='#f1e8e1'/><path d='M1290 252 V849' stroke='#c8aa9b' strokeDasharray='6 9' strokeWidth={2}/></g>
      <g opacity={networkOpacity}>
        <path d='M310 358 V219 H1610 V358' fill='none' stroke={state.broken?'#d5b7a9':'#91b6c5'} strokeWidth={3} strokeDasharray={state.broken?'7 8':undefined}/>
        {stream(310,1610,219,state.broken,1290)}
        <rect x={845} y={199} width={230} height={38} rx={12} fill='#f8f7f2'/><Label x={960} y={224} size={20} anchor='middle' color={blue}>集群通信 · 双向消息</Label>
        {stream(550,720,387,false)}{stream(1200,1370,387,state.broken)}
        {state.broken && <Label x={1290} y={348} anchor='middle' size={20} color={red}>通信中断</Label>}
      </g>
      {xs.map((x,i)=>{
        const minority=i===2, color=minority?red:green;
        const internal=(start:number)=>lesson?ease(clock,start===115?300:start===145?390:465,22):ease(f,start,22);
        const visibleMembers=state.detecting?[]:state.nodes[i].members??[];
        const voteColor=state.votesShown?color:blue;
        const fsColor=state.notified?color:ink;
        const returnStart=minority?759:720, returnEnd=minority?789:738;
        return <g key={x}>
          <rect x={x} y={268} width={480} height={550} rx={18} fill='#fffefa' stroke='#cbd6d1' strokeWidth={1.5}/>
          <Label x={x+24} y={310} size={29} weight={700}>节点 {'ABC'[i]}</Label>
          <circle cx={x+344} cy={300} r={5} fill={green}/><Label x={x+359} y={307} size={19} color={green}>已开机</Label>
          <g opacity={expand}>
            <rect x={x+16} y={332} width={448} height={328} rx={13} fill='#edf3f4' stroke='#abc5ce'/>
            <Label x={x+33} y={360} size={22} color={blue} weight={700}>Corosync</Label>
            <Label x={x+446} y={359} size={17} color='#64818f' anchor='end'>进程内组件</Label>
            <rect x={x+32} y={374} width={416} height={59} rx={9} fill='#e1edf2' stroke={state.detecting?amber:'#bed3de'} strokeWidth={state.detecting?2:1}/>
            <Label x={x+49} y={410} size={23} weight={600} color={blue}>通信与故障检测</Label>
            <Label x={x+430} y={410} anchor='end' size={18} color={state.detecting?amber:blue}>{state.detecting?'检测中':state.partitioned?(minority?'与 A/B 不通':'A ↔ B 正常'):'消息收发'}</Label>
            {state.detecting && <rect x={x+48} y={423} width={384*ramp(f,240,180)} height={3} rx={2} fill={amber}/>}
            <g opacity={internal(115)}>
              <path d={`M${x+240} 434 V459`} stroke={amber} strokeWidth={2} markerEnd='url(#flow-arrow)'/>
              {f>=390&&f<420 && <Token x={x+240} y={436+24*ramp(f,390,30)}/>}
              <rect x={x+32} y={469} width={416} height={64} rx={9} fill='#fffefa' stroke={f>=420&&f<465?amber:'#cedbdc'} strokeWidth={f>=420&&f<465?2:1}/>
              <Label x={x+49} y={508} size={23} weight={600}>成员视图</Label>
              {state.detecting ? <Label x={x+430} y={508} size={20} anchor='end' color={amber}>等待重组</Label> : visibleMembers.map((id,j)=><g key={id} transform={`translate(${x+288+j*48},501)`}>
                <rect x={-18} y={-18} width={36} height={36} rx={8} fill={state.partitioned?(minority?'#f4dfd3':'#e0eee3'):'#e2edf2'}/><Label x={0} y={8} size={23} weight={650} anchor='middle'>{id}</Label>
              </g>)}
            </g>
            <g opacity={internal(145)}>
              <path d={`M${x+240} 534 V566`} stroke={amber} strokeWidth={2} markerEnd='url(#flow-arrow)'/>
              {f>=465&&f<510 && <Token x={x+240} y={539+29*ramp(f,465,45)} text={minority?'C':'A+B'}/>}
              <rect x={x+32} y={577} width={416} height={65} rx={9} fill={state.votesShown?(minority?'#f4e3db':'#e0eee5'):'#fffefa'} stroke={state.votesShown?color:'#cedbdc'} strokeWidth={state.votesShown?2:1}/>
              <Label x={x+49} y={605} size={23} weight={650} color={voteColor}>votequorum</Label>
              <Label x={x+49} y={631} size={17} color='#71828a'>预期 3 · 门槛 2</Label>
              <Label x={x+430} y={607} size={25} weight={700} anchor='end' color={voteColor}>{state.votesShown?(minority?'1 < 2':'2 ≥ 2'):state.broken?'待更新':'3 ≥ 2'}</Label>
              <Label x={x+430} y={632} size={17} anchor='end' color={voteColor}>{state.votesShown?(minority?'无 quorum':'有 quorum'):state.broken?'等待成员信息':'有 quorum'}</Label>
            </g>
            <g opacity={internal(175)}>
              <path d={`M${x+240} 661 V714`} stroke={amber} strokeWidth={2} markerEnd='url(#flow-arrow)'/>
              <Label x={x+300} y={690} size={17} color={amber}>quorum 通知</Label>
              {f>=570&&f<630 && <Token x={x+240} y={665+47*ramp(f,570,60)} text={minority?'false':'true'}/>}
              <rect x={x+32} y={723} width={416} height={75} rx={10} fill={state.notified?(minority?'#f5e5dd':'#e1eee5'):'#f1f2ed'} stroke={state.notified?color:'#ccd5cf'} strokeWidth={state.notified?2:1}/>
              <Label x={x+49} y={752} size={24} weight={700} color={fsColor}>pmxcfs</Label>
              <Label x={x+49} y={780} size={18} color='#75817d'>/etc/pve · 配置文件系统</Label>
              <Label x={x+430} y={758} size={25} anchor='end' weight={650} color={fsColor}>{state.notified?(minority?'只读':'可写'):state.broken?'等待通知':'可写'}</Label>
            </g>
          </g>
          {i!==1 && <g opacity={ease(f,666,18)}>
            <path d={`M${x+160} 889 V803`} stroke='#80a9b3' strokeWidth={2}/>
            <path d={`M${x+326} 803 V889`} stroke={color} strokeWidth={2} strokeDasharray='4 5'/>
            <rect x={x+65} y={895} width={350} height={49} rx={10} fill='#fffefa' stroke='#b7c9ce'/>
            <Label x={x+240} y={927} size={22} anchor='middle' weight={600}>{f>=returnEnd?(minority?'× 写入被拒绝':lesson?'✓ 描述已保存':'✓ 配置已保存'):lesson?'修改 VM 100 描述':'写入 VM 100 配置'}</Label>
            {f>=678&&f<711 && <Token x={x+160} y={878-73*ramp(f,678,33)} color={blue} text='WRITE'/>}
            {f>=711&&f<741 && <rect x={x+37} y={728} width={406} height={65} rx={7} fill='none' stroke={color} strokeWidth={3} opacity={1-ramp(f,711,30)}/>}
            {f>=returnStart&&f<returnEnd && <Token x={x+326} y={809+69*ramp(f,returnStart,returnEnd-returnStart)} color={color} text={minority?'拒绝':'成功'}/>}
          </g>}
          {i===1 && <g opacity={ease(f,675,24)}><Label x={x+240} y={892} anchor='middle' size={21} color={green}>多数侧保持集群协作</Label><Label x={x+240} y={926} anchor='middle' size={18} color='#708179'>此处只对照 A 与 C 的写入</Label></g>}
        </g>;
      })}
      <g opacity={ease(f,195,18)}>
        <rect x={72} y={977} width={14} height={9} rx={4} fill={blue}/><Label x={97} y={989} size={17} color='#607b89'>网络消息 / 写入请求</Label>
        <rect x={350} y={975} width={12} height={12} rx={3} fill={amber}/><Label x={373} y={989} size={17} color='#82734d'>内部状态通知</Label>
        <Label x={1848} y={989} size={17} anchor='end' color='#78847d'>无 QDevice · 教学编排，非真实协议计时</Label>
      </g>
      {lesson && seconds<55 && <g>
        <rect x={70} y={862} width={1780} height={96} rx={14} fill='#eaf0eb'/>
        {seconds<7?<><Label x={960} y={906} size={29} anchor='middle' weight={600}>电源正常 ≠ 配置一定可写</Label><Label x={960} y={940} size={22} anchor='middle' color='#647b79'>先看节点内部，再观察一次网络分区。</Label></>:seconds<20?<>
          {['通信 / 检测','成员管理','votequorum / 仲裁','pmxcfs / 配置'].map((text,i)=>{
            const active=seconds>=[8,10,13,15.5][i] && seconds<[10,13,15.5,20][i];
            return <g key={text}><rect x={94+i*438} y={880} width={405} height={59} rx={10} fill={active?'#d6e7df':'#f8faf5'} stroke={active?green:'#d6dfd8'} strokeWidth={active?2:1}/><Label x={296+i*438} y={918} size={24} weight={active?650:400} anchor='middle' color={active?green:ink}>{text}</Label></g>;
          })}
        </>:seconds<30?<><Label x={960} y={904} size={28} anchor='middle' color={amber}>通信异常 → 故障检测 → 成员重组</Label><Label x={960} y={940} size={22} anchor='middle' color='#6f7e79'>检测过程中，暂不宣布最终写入结果。</Label></>:seconds<43?<><Label x={470} y={908} size={28} anchor='middle' color={green}>多数侧：A + B</Label><Label x={1450} y={908} size={28} anchor='middle' color={red}>少数侧：C</Label><Label x={960} y={942} size={22} anchor='middle'>成员变了；配置的预期总票数仍为 3。</Label></>:<>
          {[0,1].map(i=><g key={i}>{[0,1,2].map(j=><rect key={j} x={280+i*970+j*52} y={883} width={39} height={34} rx={6} fill={j<(i===0?2:1)?(i===0?green:red):'#d3dcd5'}/>)}<path d={`M${374+i*970} 877 V924`} stroke={ink} strokeWidth={2}/><Label x={i===0?510:1480} y={909} size={25} color={i===0?green:red}>{i===0?'2 票：达到门槛':'1 票：不足门槛'}</Label></g>)}
          <Label x={960} y={946} size={21} anchor='middle'>多数门槛：2 / 3 · 仲裁结果通知文件系统</Label>
        </>}
      </g>}
      {lesson && seconds>=67 && <g opacity={ease(clock,2010,18)}>
        <rect x={70} y={856} width={1780} height={145} rx={15} fill='#e3ece5'/>
        {['通信中断','成员变化','quorum 判断','配置写入限制'].map((text,i)=><g key={text} opacity={.35+.65*ease(clock,2010+i*18,18)}><Label x={280+i*440} y={901} size={28} anchor='middle' weight={650} color={green}>{text}</Label>{i<3&&<Label x={500+i*440} y={901} size={27} anchor='middle'>→</Label>}</g>)}
        <Label x={960} y={948} size={26} anchor='middle' weight={600}>配置只读 ≠ 虚拟机立即停止</Label>
        <Label x={960} y={984} size={21} anchor='middle' color='#687b73'>下一章 · 运行、隔离与恢复，还要看 HA / watchdog 等机制</Label>
      </g>}
      <rect y={1010} width={1920} height={70} fill='#ecefe8'/>
      <Label x={960} y={1055} size={30} anchor='middle' weight={500}>{caption??'三个节点，同一套协作机制。'}</Label>
      <rect y={1075} width={1920*(clock+1)/(lesson?2250:900)} height={5} fill={green}/>
    </svg>
    {xs.map((x,i)=><Img key={i} src={staticFile('art/editorial/server.png')} style={{position:'absolute',left:`${(x+70+expand*335)/19.2}%`,top:`${(409-expand*133)/10.8}%`,width:`${(340-expand*290)/19.2}%`,height:`${(250-expand*212)/10.8}%`,objectFit:'contain',mixBlendMode:'multiply',opacity:1-expand}}/>)}
    {clips.map(clip=><Sequence key={clip.file} from={Math.round(clip.start*30)} durationInFrames={Math.round((clip.end-clip.start)*30)} layout='none'><Html5Audio src={staticFile(clip.file)}/></Sequence>)}
  </AbsoluteFill>;
}
