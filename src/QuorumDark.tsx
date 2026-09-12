import {useEffect, useState, type ReactNode} from 'react';
import {AbsoluteFill, Html5Audio, Sequence, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {darkChapters, darkStateAt} from './dark-timeline';
import audio from './dark-audio.json';

// Original SVG scenes; direction follows anything2explainer's shot/motion guides.
const P = '#9b75ff', W = '#f5f3ff', G = '#9292a5', O = '#ff976d';
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => {const t = clamp(x); return t * t * (3 - 2 * t);};
const enter = (n: number, at = 0, duration = 18) => ease((n - at) / duration);

function Text({x, y, size = 26, color = W, anchor = 'middle', children, ...props}: {
  x: number; y: number; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; children: ReactNode;
  weight?: number; glow?: boolean; opacity?: number; numeric?: boolean;
}) {
  return <text x={x} y={y} fontSize={size} fill={color} textAnchor={anchor} dominantBaseline='central'
    fontWeight={props.weight ?? 700} opacity={props.opacity} fontFamily={props.numeric ? 'Orbitron, sans-serif' : undefined}
    style={props.glow ? {filter: 'drop-shadow(0 0 18px #8250ff99)'} : undefined}>{children}</text>;
}

function Camera({n, length, children, x = 400, y = 380}: {n: number; length: number; children: ReactNode; x?: number; y?: number}) {
  const zoom = 1 + .065 * clamp(n / length);
  return <g transform={`translate(${x} ${y}) scale(${zoom}) translate(${-x} ${-y})`}>{children}</g>;
}

function Server({x, y, name, scale = 1, active = false, frame}: {x: number; y: number; name: string; scale?: number; active?: boolean; frame: number}) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {active && <ellipse cy={94} rx={115 + 3 * Math.sin(frame / 14)} ry={26} fill='url(#aura)'/>}
    <path d='M-65 -84 L-38 -105 L85 -105 L60 -84 Z M60 -84 L85 -105 L85 63 L60 86 Z' fill='#242131' stroke='#777382' strokeWidth={2}/>
    <rect x={-65} y={-84} width={125} height={170} rx={9} fill='#101016' stroke={active ? P : W} strokeWidth={2.5}/>
    {[0, 1, 2].map(i => <g key={i}>
      <rect x={-50} y={-64 + i * 45} width={94} height={31} rx={4} fill='#1c1a25' stroke='#5c5968'/>
      <path d={`M-38 ${-49 + i * 45} h35`} stroke='#aaa5b6' strokeWidth={3}/>
      <circle cx={29} cy={-49 + i * 45} r={4} fill='#b7e6bd' opacity={.72 + .25 * Math.sin(frame / 8 + i)}/>
    </g>)}
    <Text x={0} y={67} size={25}>{name}</Text>
  </g>;
}

function Network({n, frame}: {n: number; frame: number}) {
  const state = darkStateAt(frame);
  const cut = state.broken;
  const boundary = enter(n, 50, 20);
  return <Camera n={n} length={210}>
    <Text x={84} y={188} size={61} anchor='start' weight={900} glow>{cut ? '断的是通信' : '机器还开着'}</Text>
    <Text x={86} y={247} size={23} anchor='start' color={G}>Corosync · 集群通信与成员关系</Text>
    <path d='M112 477 L187 425 L655 425 L578 477 Z' fill='#15121f' stroke='#484050' strokeWidth={2}/>
    <path d='M879 477 L954 425 L1145 425 L1070 477 Z' fill='#15121f' stroke='#484050' strokeWidth={2}/>
    <path d='M250 379 H500' stroke='#b5a7d4' strokeWidth={3}/>
    <path d='M530 365 H991 M260 330 Q630 238 991 330' fill='none' stroke={cut ? '#46404e' : '#b5a7d4'} strokeWidth={2} strokeDasharray={cut ? '7 10' : undefined}/>
    {[0, 1, 2].map(i => {
      const progress = ((n + i * 24) % 75) / 75;
      const x = cut ? 585 + progress * 200 : 550 + progress * 445;
      const t = cut ? 1 - progress * .26 : 1 - progress;
      return <g key={i}>
        <rect x={265 + progress * 210} y={374} width={20} height={9} rx={4} fill={P}/>
        <rect x={x} y={360} width={24} height={10} rx={5} fill={cut ? O : P} opacity={cut ? 1 - progress * progress : 1}/>
        <circle cx={(1 - t) ** 2 * 260 + 2 * (1 - t) * t * 630 + t * t * 991} cy={330 - 184 * t * (1 - t)} r={5} fill={cut ? O : W} opacity={1 - progress * .8}/>
      </g>;
    })}
    <g opacity={boundary}>
      <rect x={780} y={270} width={45} height={228} fill='#090a10'/>
      <path d='M802 270 v230' stroke={O} strokeWidth={3} strokeDasharray='8 9' strokeDashoffset={-n / 2}/>
      <Text x={800} y={539} size={25} color={O}>网络分区</Text>
      <Text x={800} y={577} size={22} color={G}>全部有效通信路径中断</Text>
    </g>
    <Server x={240} y={387} name='A' frame={frame}/>
    <Server x={500} y={387} name='B' frame={frame}/>
    <Server x={995} y={387} name='C' frame={frame} active/>
    {n >= 98 && <g opacity={enter(n, 98)}>
      <circle cx={1069} cy={254} r={15} fill='none' stroke={P} strokeWidth={3} strokeDasharray='55 40' transform={`rotate(${n * 6} 1069 254)`}/>
      <Text x={1036} y={254} size={23} anchor='end' color={P}>检测 · 重组中</Text>
    </g>}
    <Text x={363} y={535} size={23} color={G}>节点电源始终开启</Text>
  </Camera>;
}

function Members({n, frame}: {n: number; frame: number}) {
  const cFocus = enter(n, 62, 22);
  const ticket = enter(n, 113, 24);
  return <Camera n={n} length={210}>
    <Text x={84} y={186} size={60} anchor='start' weight={900} glow>同一集群，两种视图</Text>
    <Text x={86} y={245} size={23} anchor='start' color={G}>Corosync · 成员关系稳定后</Text>
    <g transform={`translate(${-10 * cFocus} 0)`}>
      <rect x={105} y={298} width={577} height={231} rx={26} fill='#121018' stroke={P} strokeWidth={2.5} opacity={.9 - cFocus * .4}/>
      <path d='M287 414 H503' stroke={P} strokeWidth={3} strokeDasharray='28 14' strokeDashoffset={-n * 2}/>
      <Server x={285} y={408} name='A' scale={.8} frame={frame}/>
      <Server x={503} y={408} name='B' scale={.8} frame={frame}/>
      <Text x={394} y={564} size={30}>A / B 的视图：A、B</Text>
    </g>
    <g opacity={.35 + .65 * cFocus} transform={`translate(${10 * cFocus} 0)`}>
      <rect x={807} y={298} width={331} height={231} rx={26} fill='#121018' stroke={P} strokeWidth={2.5}/>
      <ellipse cx={972} cy={474} rx={105 + 8 * Math.sin(n / 17)} ry={30} fill='url(#aura)'/>
      <Server x={972} y={408} name='C' scale={.8} frame={frame}/>
      <Text x={972} y={564} size={30}>C 的视图：C</Text>
    </g>
    {[285, 503, 982].map((x, i) => <g key={x} opacity={ticket} transform={`translate(0 ${-20 * ticket})`}>
      <rect x={x - 46} y={327} width={92} height={42} rx={21} fill={i === 2 ? '#57402f' : '#54328c'} stroke={i === 2 ? O : P}/>
      <Text x={x} y={348} size={23}>1 票</Text>
    </g>)}
  </Camera>;
}

function Quorum({n}: {n: number}) {
  const threshold = enter(n, 63, 24);
  const majority = enter(n, 119, 20);
  const minority = enter(n, 168, 20);
  return <Camera n={n} length={240}>
    <Text x={84} y={186} size={61} anchor='start' weight={900} glow>门槛，没有跟着变</Text>
    <Text x={87} y={246} size={24} anchor='start' color={G}>votequorum · 仲裁判断</Text>
    <g transform={`translate(${640 - 640 * threshold} 0)`} opacity={1 - threshold}>
      <Text x={0} y={394} size={148} numeric glow>3</Text>
      <Text x={0} y={505} size={29}>预期总票数</Text>
    </g>
    <g opacity={threshold}>
      <rect x={512} y={296} width={256} height={248} rx={28} fill='#171023' stroke={P} strokeWidth={2.5}/>
      <ellipse cx={640} cy={438} rx={144} ry={109} fill='url(#aura)' opacity={.8}/>
      <Text x={640} y={352} size={27} color={P}>仲裁门槛</Text>
      <Text x={640} y={431} size={113} numeric glow>2</Text>
      <Text x={640} y={509} size={23} color={G}>预期总票数仍为 3</Text>
      <g opacity={majority} transform={`translate(${-32 * (1 - majority)} 0)`}>
        <Text x={298} y={326} size={29}>A + B</Text>
        <Text x={298} y={415} size={108} numeric>2</Text>
        <Text x={432} y={416} size={48} color={P}>≥</Text>
        <Text x={298} y={513} size={29} color={P}>达到 quorum</Text>
        <path d='M233 558 h130' stroke={P} strokeWidth={5} strokeDasharray='55 10' strokeDashoffset={-n}/>
      </g>
      <g opacity={minority} transform={`translate(${32 * (1 - minority)} 0)`}>
        <Text x={981} y={326} size={29}>C</Text>
        <Text x={981} y={415} size={108} numeric color={O}>1</Text>
        <Text x={847} y={416} size={48} color={O}>&gt;</Text>
        <Text x={981} y={513} size={29} color={O}>未达到 quorum</Text>
        <path d='M920 558 h125' stroke={O} strokeWidth={4} strokeDasharray='8 7' strokeDashoffset={-n / 2}/>
      </g>
    </g>
  </Camera>;
}

function Document({x, y, frame, accepted = false}: {x: number; y: number; frame: number; accepted?: boolean}) {
  const rows = Math.floor(clamp(frame / 45) * 3);
  return <g transform={`translate(${x} ${y})`}>
    <path d='M-64 -85 H29 L64 -50 V85 H-64 Z M29 -85 V-50 H64' fill='#111019' stroke={accepted ? P : W} strokeWidth={2.5}/>
    <Text x={0} y={-16} size={23}>VM 100</Text>
    {[0, 1, 2].map(i => <path key={i} d={`M-39 ${19 + 17 * i} h${i === 2 ? 43 : 77}`} stroke={accepted && i < rows ? P : '#6a6379'} strokeWidth={4}/>)}
  </g>;
}

function Writes({n}: {n: number}) {
  const left = enter(n, 59, 42), right = enter(n, 101, 39);
  const readonly = enter(n, 153, 20);
  return <Camera n={n} length={240}>
    <Text x={84} y={186} size={61} anchor='start' weight={900} glow>同一份配置，两种结果</Text>
    <Text x={86} y={246} size={23} anchor='start' color={G}>pmxcfs · 集群配置文件系统</Text>
    <Text x={313} y={306} size={25}>A + B · 多数侧</Text>
    <Text x={1004} y={306} size={25}>C · 少数侧</Text>
    <path d='M500 414 H224 M740 414 H1020' stroke='#5c546b' strokeWidth={2} strokeDasharray='5 7'/>
    <g opacity={1 - .3 * Math.max(left, right)}>
      <Document x={640} y={414} frame={n}/>
      <Text x={640} y={534} size={23} color={G}>修改描述</Text>
    </g>
    <g opacity={enter(n, 59, 12)}>
      <Document x={510 - 205 * left} y={414 - 28 * Math.sin(left * Math.PI)} frame={n - 98} accepted={left === 1}/>
      <path d='M211 490 l20 20 42 -48' fill='none' stroke={P} strokeWidth={6} strokeLinecap='round' pathLength={1} strokeDasharray={1} strokeDashoffset={1 - enter(n, 101, 20)}/>
      <Text x={314} y={570} size={31} color={P} opacity={enter(n, 101)}>允许写入</Text>
    </g>
    <g opacity={enter(n, 101, 12)}>
      <Document x={773 + 145 * right - 4 * Math.sin(n) * readonly * (1 - enter(n, 168))} y={414} frame={0}/>
      <rect x={1001} y={338} width={12} height={165} rx={6} fill={O}/>
      <path d={`M1007 337 v166`} stroke={W} strokeWidth={3} strokeDasharray='13 14' strokeDashoffset={-n}/>
      <g opacity={readonly}>
        <rect x={1032} y={397} width={60} height={48} rx={8} fill='#2a1914' stroke={O} strokeWidth={3}/>
        <path d='M1044 397 v-16 a18 18 0 0 1 36 0 v16' fill='none' stroke={O} strokeWidth={4}/>
        <Text x={1001} y={570} size={31} color={O}>只读 · 写入受阻</Text>
      </g>
    </g>
    <g opacity={enter(n, 188, 16)}><Text x={640} y={600} size={22} color={G}>配置只读 ≠ 虚拟机立即停止</Text></g>
  </Camera>;
}

export function QuorumDark() {
  const frame = useCurrentFrame();
  const [fontHandle] = useState(() => delayRender('Load lesson fonts'));
  useEffect(() => {
    Promise.all([
      new FontFace('Quorum Noto', `url(${staticFile('fonts/NotoSansSC.ttf')})`, {weight: '100 900'}).load(),
      new FontFace('Orbitron', `url(${staticFile('fonts/Orbitron.ttf')})`, {weight: '400 900'}).load(),
    ]).then(fonts => {fonts.forEach(font => document.fonts.add(font)); continueRender(fontHandle);})
      .catch(cancelRender);
  }, [fontHandle]);
  const current = darkStateAt(frame).chapter;
  const captions = audio.flatMap(clip => clip.captions);
  const caption = captions.reverse().find(line => line.start * 30 <= frame)?.text;
  const scenes = [Network, Members, Quorum, Writes];
  return <AbsoluteFill style={{background: '#090a10', fontFamily: 'Quorum Noto, Microsoft YaHei, sans-serif'}}>
    <svg viewBox='0 0 1280 720' width='100%' height='100%'>
      <defs>
        <radialGradient id='aura'><stop stopColor='#8144f7' stopOpacity='.35'/><stop offset='1' stopColor='#8144f7' stopOpacity='0'/></radialGradient>
        <linearGradient id='floor' x2='0' y2='1'><stop stopColor='#090a10'/><stop offset='1' stopColor='#1e142d'/></linearGradient>
      </defs>
      <rect width={1280} height={720} fill='url(#floor)'/>
      {Array.from({length: 23 * 12}, (_, i) => {
        const x = 35 + i % 23 * 55, y = 24 + Math.floor(i / 23) * 55;
        return <circle key={i} cx={x} cy={y} r={1.2} fill='#aaa4c7' opacity={.1 + .08 * Math.sin(x / 130 + y / 190 - frame / 65)}/>;
      })}
      <rect x={80} y={37} width={194} height={42} rx={21} fill='#6235bc'/>
      <Text x={177} y={58} size={23}>网络分区与仲裁</Text>
      <Text x={1197} y={58} size={22} anchor='end' color={G}>PVE / COROSYNC</Text>
      {darkChapters.map((chapter, i) => <g key={chapter.name}>
        <Text x={84 + i * 185} y={113} size={22} anchor='start' color={current === i ? P : G}>{`${String(i + 1).padStart(2, '0')}  ${chapter.name}`}</Text>
        {i < 3 && <path d={`M${232 + i * 185} 109 l5 4 -5 4`} fill='none' stroke='#655975' strokeWidth={2}/>}
      </g>)}
      {scenes.map((Scene, i) => {
        const start = darkChapters[i].start * 30, end = darkChapters[i].end * 30;
        if (frame < start - 8 || frame >= end) return null;
        const opacity = (i === 0 ? 1 : enter(frame, start - 8, 8)) * (i === 3 ? 1 : 1 - enter(frame, end - 8, 8));
        return <g key={i} opacity={opacity}><Scene n={Math.max(0, frame - start)} frame={frame}/></g>;
      })}
      <rect x={0} y={632} width={1280} height={55} fill='#090a10' opacity={.94}/>
      <Text x={640} y={659} size={36} weight={800}>{caption ?? '三个节点 · 每节点一票 · 无 QDevice'}</Text>
      <rect y={699} width={1280} height={21} fill='#2e253e'/>
      <rect y={699} width={1280 * (frame + 1) / 900} height={21} fill='#8456d6'/>
      <Text x={1197} y={113} size={20} anchor='end' color={G}>教学示意 · 非真实计时</Text>
    </svg>
    {audio.map(clip => <Sequence key={clip.file} from={Math.round(clip.start * 30)} durationInFrames={Math.round((clip.end - clip.start) * 30)} layout='none'>
      <Html5Audio src={staticFile(clip.file)}/>
    </Sequence>)}
  </AbsoluteFill>;
}
