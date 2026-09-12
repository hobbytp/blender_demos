import {useEffect, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, Html5Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {editorialStateAt} from './editorial-timeline';
import audio from './editorial-audio.json';

const ink = '#203e48', teal = '#387d79', rust = '#b66e49';
function enter(f: number, start: number, length = 18) {
  const t = interpolate(f, [start, start + length], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return t*t*(3-2*t);
}
export function QuorumEditorial() {
  const f = useCurrentFrame(), state = editorialStateAt(f);
  const [handle] = useState(() => delayRender('Editorial font'));
  useEffect(() => {new FontFace('Quorum Noto', `url(${staticFile('fonts/NotoSansSC.ttf')})`, {weight:'100 900'}).load().then(font => {document.fonts.add(font); continueRender(handle);}).catch(cancelRender);}, [handle]);
  const split = enter(f,54,14), groups = enter(f,120,20), votes = enter(f,146);
  const caption = audio.flatMap(clip => clip.captions).reverse().find(line => line.start*30 <= f)?.text;
  const centers = [245,680,1190];
  const cable = (d: string) => <><path d={d} fill='none' stroke='#245a60' strokeWidth={7}/><path d={d} fill='none' stroke='#a4cecb' strokeWidth={3}/></>;
  return <AbsoluteFill style={{background:'#f8f7f2',fontFamily:'Quorum Noto, sans-serif'}}>
    <svg viewBox='0 0 1440 810' width='100%' height='100%' fill={ink}>
      <defs><linearGradient id='paper' x2='1' y2='1'><stop stopColor='#fffefb'/><stop offset='1' stopColor='#efeee8'/></linearGradient></defs>
      <text x={48} y={76} fontSize={48} fontWeight={750}>网络分区之后</text>
      <text x={50} y={115} fontSize={23}>电源仍亮着，集群看到的成员却变了。</text>
      <text x={1390} y={59} fontSize={20} textAnchor='end' letterSpacing={3} fill='#60747c'>COROSYNC</text>
      <text x={1390} y={115} fontSize={22} textAnchor='end'>预期总票数 3 · 仲裁门槛 2</text>
      <rect x={40} y={155} width={1360-500*groups} height={310} rx={30} fill='#e5efea'/>
      <rect x={1010} y={155} width={390} height={310} rx={30} fill='#e9e7e2' opacity={groups}/>
      <path d='M955 150 V220 M955 330 V470' fill='none' stroke='#a9aaa5' strokeWidth={2} strokeDasharray='8 8' opacity={split}/>
      {centers.map((x,i) => <g key={x}><text x={x} y={202} fontSize={32} textAnchor='middle' fontWeight={650}>{'ABC'[i]}</text><ellipse cx={x+2} cy={389} rx={132} ry={12} fill='#294e46' opacity={.09}/></g>)}
      {cable('M376 338 C394 334 400 322 430 322 H485 C525 322 526 348 555 348')}
      {cable(`M811 337 C836 340 842 317 880 317 H${955-35*split}`)}
      {cable(`M${955+35*split} 317 H1012 C1040 317 1040 341 1065 345`)}
      {[0,1].map(i => <rect key={i} x={401+((f/65+i/2)%1)*85} y={317} width={21} height={10} rx={5} fill='#f5ffed' stroke={teal} strokeWidth={2}/>)}
      {!state.broken && <rect x={864+(f%45)/45*150} y={312} width={20} height={10} rx={5} fill='#f5ffed' stroke={teal} strokeWidth={2}/>}
      {[-1,1].map(side => <g key={side} transform={`translate(${955+side*35*split},317)`}><rect x={-7} y={-6} width={14} height={12} rx={2} fill='#acb9b8' stroke={ink} strokeWidth={1.5}/><path d='M-2 -5 V5 M2 -5 V5' stroke='#f5f5dc' strokeWidth={2}/></g>)}
      <g opacity={split} fill={rust}><text x={955} y={256} textAnchor='middle' fontSize={21}>通信中断</text><path d='M955 278 V292 M935 286 L942 297 M975 286 L968 297' stroke={rust} strokeWidth={3.5} strokeLinecap='round'/></g>
      {state.detecting && <g><circle cx={915} cy={435} r={6} fill={rust} opacity={.55+.4*Math.sin(f/4)}/><text x={935} y={443} fontSize={21} fill={rust}>检测 · 重组中</text></g>}
      <g opacity={1-split}><path d='M135 412 Q135 423 148 423 H1280 Q1293 423 1293 412' fill='none' stroke={teal}/><text x={720} y={451} textAnchor='middle' fontSize={24}>成员视图：A、B、C</text></g>
      <g opacity={groups}><path d='M133 408 Q133 421 146 421 H782 Q795 421 795 408 M1074 408 Q1074 421 1087 421 H1310 Q1323 421 1323 408' fill='none' stroke={teal} strokeWidth={1.5}/><text x={470} y={451} fontSize={24} textAnchor='middle' fontWeight={600}>成员视图：A、B</text><text x={1190} y={451} fontSize={24} textAnchor='middle' fontWeight={600}>成员视图：C</text></g>
      {[470,1190].map((x,i) => {
        const reveal = enter(f,i===0?162:218,17), badge = enter(f,i===0?181:234,16), color = i===0?teal:rust;
        return <g key={x}>
          <text opacity={votes} x={x} y={508} fontSize={29} textAnchor='middle' fontWeight={650}>{i===0?'2 票 ≥ 2':'1 票 < 2'}</text>
          <g opacity={reveal} transform={`translate(${x},${530+15*(1-reveal)})`}>
            <ellipse cy={139} rx={115} ry={9} fill={color} opacity={.08}/>
            <path d='M-86 0 H56 L86 30 V127 Q86 137 76 137 H-76 Q-86 137 -86 127 Z' fill='url(#paper)' stroke='#39464a' strokeWidth={1.5}/>
            <path d='M56 0 V25 Q56 31 63 31 H86' fill='#e4e5e0' stroke='#39464a'/>
            <text x={-68} y={36} fontSize={21} fontWeight={600}>VM 100 配置</text>
            {[96,72,88,58].map((w,j) => <rect key={j} x={-66} y={53+j*16} width={w} height={5} rx={2.5} fill={j===2&&i===0?color:'#cdcfca'} opacity={j===2&&i===0?badge:1}/>)}
            <g transform={`translate(73,109) scale(${.8+badge*.2})`} opacity={badge}>
              <circle r={33} fill={color} stroke='#fffefb' strokeWidth={3}/>
              {i===0?<path d='M-14 0 L-3 11 L16 -12' fill='none' stroke='white' strokeWidth={6} strokeLinecap='round' strokeLinejoin='round'/>:<><rect x={-13} y={-2} width={26} height={22} rx={4} fill='#fffdf6'/><path d='M-9 -2 V-10 A9 9 0 0 1 9 -10 V-2' fill='none' stroke='#fffdf6' strokeWidth={4}/><circle cy={7} r={3} fill={color}/><path d='M0 7 V14' stroke={color} strokeWidth={2}/></>}
            </g>
            <text y={169} fontSize={24} textAnchor='middle' fill={color} opacity={badge}>{i===0?'pmxcfs 可写':'pmxcfs 只读'}</text>
          </g>
        </g>;
      })}
      <text x={720} y={751} textAnchor='middle' fontSize={25}>{caption??'三个节点，通过 Corosync 保持集群通信。'}</text>
      <path d='M48 774 H330 M1110 774 H1392' stroke='#bfc5c0'/>
      <text x={720} y={781} textAnchor='middle' fontSize={15} fill='#65767a'>每节点一票 · 无 QDevice · 教学时间压缩，非真实计时</text>
    </svg>
    {centers.map((x,i) => <Img key={i} src={staticFile('art/editorial/server.png')} style={{position:'absolute',left:`${(x-140)/14.4}%`,top:'27.2%',width:`${280/14.4}%`,height:'22%',objectFit:'contain',mixBlendMode:'multiply'}}/>)}
    {audio.map(clip => <Sequence key={clip.file} from={Math.round(clip.start*30)} durationInFrames={Math.round((clip.end-clip.start)*30)} layout='none'><Html5Audio src={staticFile(clip.file)}/></Sequence>)}
  </AbsoluteFill>;
}
