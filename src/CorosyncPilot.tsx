import {useEffect, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, Html5Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import audio from './corosync-audio.json';
import {COROSYNC_DURATION, corosyncStateAt, type MembershipPhase} from './corosync-timeline';

const ink='#243f4b', blue='#347aa8', green='#347d70', amber='#b18635', red='#b96b50', paper='#f8f7f2';
const ramp=(f:number,start:number,length:number)=>interpolate(f,[start,start+length],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const ease=(f:number,start:number,length=20)=>{const p=ramp(f,start,length);return p*p*(3-2*p);};

function Label({x,y,children,size=22,color=ink,weight=400,anchor='start'}:{x:number;y:number;children:React.ReactNode;size?:number;color?:string;weight?:number;anchor?:'start'|'middle'|'end'}) {
  return <text x={x} y={y} fontSize={size} fill={color} fontWeight={weight} textAnchor={anchor}>{children}</text>;
}

function Pill({x,y,text,color=blue}:{x:number;y:number;text:string;color?:string}) {
  return <g transform={`translate(${x},${y})`}><rect x={-48} y={-17} width={96} height={34} rx={10} fill={color}/><Label x={0} y={8} size={18} color='white' weight={700} anchor='middle'>{text}</Label></g>;
}

const phases:MembershipPhase[]=['OPERATIONAL','GATHER','COMMIT','RECOVERY'];

export function CorosyncPilot() {
  const f=useCurrentFrame(), s=corosyncStateAt(f);
  const [handle]=useState(()=>delayRender('Corosync pilot font'));
  useEffect(()=>{new FontFace('Quorum Noto',`url(${staticFile('fonts/NotoSansSC.ttf')})`,{weight:'100 900'}).load().then(font=>{document.fonts.add(font);continueRender(handle);}).catch(cancelRender);},[handle]);
  const titles=['正常时，token 怎样经过节点？','链路断开后，成员立即改变吗？','Totem 怎样形成新的成员组？','新 membership 怎样驱动 quorum？'];
  const notes=['Knet 传输消息；Totem SRP 维护有序传递与成员关系。','传输层先报告不可达；成员算法仍等待自己的超时。','OPERATIONAL → GATHER → COMMIT → RECOVERY → OPERATIONAL','同步完成后，votequorum 才按新成员视图重算。'];
  const caption=audio.flatMap(clip=>clip.captions).reverse().find(line=>line.start*30<=f)?.text;
  const triangle=[[200,525],[610,525],[405,780],[200,525]] as const;
  const p=((f/105)%1)*3, seg=Math.min(2,Math.floor(p)), t=p-seg;
  const tokenX=triangle[seg][0]+(triangle[seg+1][0]-triangle[seg][0])*t;
  const tokenY=triangle[seg][1]+(triangle[seg+1][1]-triangle[seg][1])*t;
  const majorityT=((f-660)/70)%2, majorityX=200+410*(majorityT<1?majorityT:2-majorityT);
  const Node=({x,y,name,isolated=false}:{x:number;y:number;name:string;isolated?:boolean})=><g>
    <rect x={x} y={y} width={220} height={166} rx={17} fill='#fffefa' stroke={isolated&&s.membershipInstalled?red:'#b9cccf'} strokeWidth={isolated&&s.membershipInstalled?3:1.5}/>
    <Label x={x+18} y={y+34} size={26} weight={750}>pve{name}</Label>
    <rect x={x+16} y={y+49} width={188} height={30} rx={7} fill={s.quorumUpdated?(isolated?'#f4dfd7':'#deeee4'):'#edf1ed'}/><Label x={x+110} y={y+71} size={17} anchor='middle' color={s.quorumUpdated?(isolated?red:green):ink}>votequorum</Label>
    <rect x={x+16} y={y+84} width={188} height={30} rx={7} fill='#e8eef4'/><Label x={x+110} y={y+106} size={17} anchor='middle' color={blue}>Totem SRP</Label>
    <rect x={x+16} y={y+119} width={188} height={30} rx={7} fill={s.linkFailed&&isolated?'#f3dfd7':'#e0ece9'}/><Label x={x+110} y={y+141} size={17} anchor='middle' color={s.linkFailed&&isolated?red:green}>Knet · link0 / link1</Label>
  </g>;
  return <AbsoluteFill style={{background:paper,fontFamily:'Quorum Noto, sans-serif'}}>
    <svg viewBox='0 0 1920 1080' width='100%' height='100%' role='img' aria-label={titles[s.chapter]}>
      <defs><marker id='cor-arrow' markerWidth={8} markerHeight={8} refX={6} refY={4} orient='auto'><path d='M1 1 L6 4 L1 7' fill='none' stroke={amber} strokeWidth={1.4}/></marker></defs>
      <Label x={64} y={48} size={20} color={green} weight={650}>PVE 10 / COROSYNC · MEMBERSHIP INSIDE</Label>
      <Label x={1850} y={48} size={20} anchor='end' color='#74838a'>0{s.chapter+1} / 04</Label>
      <Label x={64} y={112} size={44} weight={780}>{titles[s.chapter]}</Label>
      <Label x={66} y={156} size={24} color='#667a81'>{notes[s.chapter]}</Label>

      <rect x={50} y={205} width={700} height={748} rx={24} fill='#e8f0ec'/>
      <Label x={78} y={246} size={21} color={green} weight={700}>三节点 · 每节点各自运行 Corosync</Label>
      <path d='M310 496 H500' fill='none' stroke={green} strokeWidth={5}/>
      <path d='M300 516 H510' fill='none' stroke={blue} strokeWidth={3}/>
      <path d='M610 540 L485 665 M590 555 L470 675 M310 540 L365 665 M330 550 L380 675' fill='none' stroke={s.linkFailed?red:green} strokeWidth={s.linkFailed?4:3} strokeDasharray={s.linkFailed?'10 9':undefined}/>
      <Node x={90} y={330} name='A'/><Node x={500} y={330} name='B'/><Node x={295} y={665} name='C' isolated/>
      {!s.linkFailed&&<Pill x={tokenX} y={tokenY} text='TOKEN' color={amber}/>}
      {s.linkFailed&&!s.tokenTimedOut&&<g opacity={ease(f,210)}><Pill x={530} y={585} text='TOKEN?' color={amber}/><path d='M556 600 L580 625' stroke={red} strokeWidth={3}/><Label x={405} y={864} size={22} anchor='middle' color={red}>link0 / link1 到 C：不可达</Label></g>}
      {s.membershipInstalled&&<g><Pill x={majorityX} y={525} text='TOKEN' color={amber}/><Label x={405} y={890} size={21} anchor='middle' color={red}>C 形成自己的成员视图</Label></g>}

      <rect x={780} y={205} width={1090} height={748} rx={24} fill='#f2ece6'/>
      <Label x={812} y={246} size={21} color={amber} weight={700}>放大 A / B 侧：传输证据如何变成集群状态</Label>
      <rect x={820} y={272} width={1010} height={112} rx={16} fill='#fffefa' stroke={s.linkFailed?red:'#a8c6c2'} strokeWidth={s.linkFailed?3:1.5}/>
      <Label x={846} y={307} size={24} weight={700}>Knet transport</Label><Label x={846} y={348} size={19} color='#708086'>host status / link status</Label>
      <Label x={1800} y={322} size={25} anchor='end' color={s.linkFailed?red:green} weight={700}>{s.linkFailed?'C unreachable':'A · B · C reachable'}</Label>
      {s.linkFailed&&!s.tokenTimedOut&&<g><rect x={1260} y={347} width={520} height={8} rx={4} fill='#ead9ce'/><rect x={1260} y={347} width={520*ramp(f,210,210)} height={8} rx={4} fill={amber}/><Label x={1518} y={375} size={17} anchor='middle' color={amber}>等待 Totem token timeout</Label></g>}

      <path d='M1325 386 V420' fill='none' stroke={amber} strokeWidth={2.5} markerEnd='url(#cor-arrow)'/>
      <rect x={820} y={426} width={1010} height={135} rx={16} fill='#fffefa' stroke={s.tokenTimedOut?amber:'#ccd7d2'} strokeWidth={s.tokenTimedOut?3:1.5}/>
      <Label x={846} y={461} size={24} weight={700}>Totem SRP membership state</Label>
      {phases.map((phase,i)=>{const active=s.phase===phase;return <g key={phase}><rect x={842+i*238} y={482} width={218} height={53} rx={10} fill={active?(phase==='OPERATIONAL'&&s.membershipInstalled?'#dfeee4':'#eee2c9'):'#edf0eb'} stroke={active?amber:'#d2d9d4'} strokeWidth={active?2.5:1}/><Label x={951+i*238} y={516} size={18} anchor='middle' color={active?ink:'#84908c'} weight={active?750:450}>{phase}</Label>{i<3&&<Label x={1070+i*238} y={516} size={20} color='#9a8b68'>→</Label>}</g>;})}

      <path d='M1325 563 V596' fill='none' stroke={amber} strokeWidth={2.5} markerEnd='url(#cor-arrow)'/>
      <rect x={820} y={602} width={1010} height={99} rx={16} fill='#fffefa' stroke={s.membershipInstalled?blue:'#ccd7d2'} strokeWidth={s.membershipInstalled?3:1.5}/>
      <Label x={846} y={640} size={23} weight={700}>regular membership</Label>
      <Label x={1800} y={642} size={24} anchor='end' color={s.membershipInstalled?blue:'#738086'} weight={700}>{s.membershipInstalled?'A/B: {A,B} · C: {C} · new ring_id':'{A,B,C} · current ring_id'}</Label>
      <Label x={846} y={679} size={18} color='#75837f'>{s.membershipInstalled?'成员组已经安装；接下来同步服务状态':'链路告警期间仍保持旧成员视图'}</Label>

      <path d='M1085 704 V752 H1230' fill='none' stroke={amber} strokeWidth={2.5} markerEnd='url(#cor-arrow)' opacity={s.regularDelivered?1:.22}/>
      {f>=690&&f<750&&<Pill x={1085+145*ramp(f,690,60)} y={752} text='REGULAR' color={blue}/>}
      <rect x={820} y={768} width={460} height={119} rx={16} fill={s.regularDelivered?'#e5edf3':'#fffefa'} stroke={s.regularDelivered?blue:'#ccd7d2'} strokeWidth={s.regularDelivered?2.5:1.5}/>
      <Label x={850} y={807} size={23} weight={700}>service sync</Label><Label x={850} y={844} size={18} color='#637b88'>transitional → regular</Label><Label x={1250} y={851} size={20} anchor='end' color={s.regularDelivered?blue:'#8b9691'}>{s.regularDelivered?'activate':'waiting'}</Label>
      <path d='M1282 828 H1342' fill='none' stroke={amber} strokeWidth={2.5} markerEnd='url(#cor-arrow)' opacity={s.quorumUpdated?1:.22}/>
      <rect x={1350} y={768} width={480} height={119} rx={16} fill={s.quorumUpdated?'#e2eee4':'#fffefa'} stroke={s.quorumUpdated?green:'#ccd7d2'} strokeWidth={s.quorumUpdated?2.5:1.5}/>
      <Label x={1380} y={807} size={23} weight={700}>votequorum</Label>
      <Label x={1800} y={840} size={22} anchor='end' color={s.quorumUpdated?green:'#8b9691'} weight={700}>{s.quorumUpdated?'A/B 2 ≥ 2 · quorum':'waiting membership'}</Label>
      {s.quorumUpdated&&<Label x={1800} y={872} size={19} anchor='end' color={red}>C 1 &lt; 2 · no quorum</Label>}

      <rect x={70} y={973} width={1780} height={35} rx={10} fill='#e9ede7'/><Label x={960} y={997} size={20} anchor='middle' weight={650}>链路状态是传输证据；regular membership 才驱动上层同步与 quorum 重算</Label>
      <rect y={1018} width={1920} height={62} fill='#e1e7df'/><Label x={960} y={1058} size={28} anchor='middle' weight={520}>{caption??'先看清成员组，再判断仲裁结果。'}</Label>
      <rect y={1075} width={1920*(f+1)/COROSYNC_DURATION} height={5} fill={green}/>
    </svg>
    {audio.map(clip=><Sequence key={clip.file} from={Math.round(clip.start*30)} durationInFrames={Math.round((clip.end-clip.start)*30)} layout='none'><Html5Audio src={staticFile(clip.file)}/></Sequence>)}
  </AbsoluteFill>;
}
