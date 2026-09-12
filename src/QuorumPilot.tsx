import {AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import narration from './narration.json';
import {chapters, FPS, stateAt} from './timeline';

const ink = '#1b2c39';
const muted = '#63727b';
const blue = '#2465bf';
const green = '#18775b';
const red = '#bf4b3f';
const amber = '#a57521';
const xs = [80, 730, 1380];
const font = '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif';

export function QuorumPilot() {
  const frame = useCurrentFrame();
  const state = stateAt(frame);
  const {seconds: t, chapter} = state;
  const part = chapters[chapter];
  const fade = (start: number, duration = 0.65) => interpolate(t, [start, start + duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const expand = fade(7);
  const caption = narration.find((line) => t >= line.start && t < line.end)?.text ?? '';
  const revealVotes = t >= 43;
  const revealWrite = t >= 55;
  const conclusion = t >= 67;
  const messageProgress = ((t * 0.48) % 1);

  const link = (x1: number, x2: number, broken: boolean, key: string) => (
    <g key={key}>
      <line x1={x1} y1={428} x2={x2} y2={428} stroke={broken ? '#db9b91' : '#8badd6'} strokeWidth={4} strokeDasharray={broken ? '9 9' : undefined}/>
      {!broken && <circle cx={x1 + (x2 - x1) * messageProgress} cy={428} r={8} fill={blue}/>}
      {broken && <g transform={`translate(${(x1 + x2) / 2},428)`}>
        <circle r={20} fill='#fbf0ed'/><path d='M-7-7 7 7 M7-7-7 7' stroke={red} strokeWidth={3}/>
      </g>}
    </g>
  );

  return <AbsoluteFill style={{backgroundColor: '#f8f7f2', fontFamily: font}}>
    <svg viewBox='0 0 1920 1080' width='100%' height='100%' role='img' aria-label={`${part.title}。${part.note}`}>
      <defs>
        <pattern id='dots' width='24' height='24' patternUnits='userSpaceOnUse'><circle cx='1' cy='1' r='1' fill='#e5e7e1'/></pattern>
        <marker id='arrow' markerWidth='7' markerHeight='7' refX='5' refY='3' orient='auto'><path d='M0 0 L6 3 L0 6' fill='none' stroke={blue} strokeWidth='1.5'/></marker>
      </defs>
      <rect width='1920' height='1080' fill='url(#dots)'/>
      <rect x='0' y='0' width='1920' height='10' fill='#e8ece5'/>
      <rect x='0' y='0' width={1920 * frame / (75 * FPS - 1)} height='10' fill={green}/>
      <text x='80' y='64' fontSize='23' letterSpacing='3' fill={green} fontWeight='700'>PVE / CLUSTER NOTES</text>
      <text x='1840' y='64' textAnchor='end' fontSize='23' fill={muted}>0{chapter + 1} / 07</text>
      <g>
        <text x='80' y='145' fontSize={conclusion ? 52 : 58} fontWeight='700' fill={ink}>{part.title}</text>
        <text x='82' y='197' fontSize='28' fill={muted}>{part.note}</text>
      </g>

      <g opacity={expand}>
        <rect x='80' y='226' width='470' height='44' rx='22' fill='#eaf0f7'/>
        <text x='102' y='255' fontSize='23' fill={blue}>每节点 1 票 · 无 QDevice · 固定三票</text>
        <text x='1840' y='255' textAnchor='end' fontSize='25' fill={ink}>预期总票数 <tspan fontWeight='700'>3</tspan>　 /　 多数门槛 <tspan fontWeight='700'>2</tspan></text>
      </g>

      {state.broken && <g opacity={fade(20)}>
        <rect x='60' y='291' width='1150' height='585' rx='27' fill='#edf5ef' stroke='#c3d9cb' strokeWidth='2'/>
        <rect x='1360' y='291' width='500' height='585' rx='27' fill='#fbefea' stroke='#e6c9c1' strokeWidth='2'/>
        <line x1='1285' y1='306' x2='1285' y2='870' stroke='#d4a199' strokeWidth='2' strokeDasharray='8 10'/>
      </g>}

      <g opacity={expand}>
        {link(540, 730, false, 'ab')}
        {link(1190, 1380, state.broken, 'bc')}
        <path d='M310 398 L310 284 L1610 284 L1610 398' fill='none' stroke={state.broken ? '#db9b91' : '#8badd6'} strokeWidth='3' strokeDasharray={state.broken ? '8 8' : undefined}/>
        {!state.broken && <circle cx={310 + 1300 * messageProgress} cy={284} r='6' fill={blue}/>}
        {state.broken && <g transform='translate(1285,284)'><circle r='17' fill='#f8f7f2'/><path d='M-7-7 7 7 M7-7-7 7' stroke={red} strokeWidth='3'/></g>}
      </g>

      {state.nodes.map((node, i) => {
        const x = xs[i];
        const isolated = state.partitioned && i === 2;
        const nodeColor = isolated ? red : green;
        const votesRevealed = revealVotes && (i !== 2 || t >= 48.5);
        const written = revealWrite && t >= (i === 2 ? 62 : 58.5);
        const writeProgress = interpolate(t, [55.5, 58], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return <g key={node.id}>
          <rect x={x} y='312' width='460' height='382' rx='20' fill='#ffffff' stroke={state.broken ? (i === 2 ? '#e4b9af' : '#accaba') : '#d8e0e0'} strokeWidth='2'/>
          <rect x={x + 22} y='335' width='48' height='48' rx='11' fill='#eff2f1'/>
          <text x={x + 46} y='370' textAnchor='middle' fontSize='31' fontWeight='700' fill={ink}>{node.id}</text>
          <text x={x + 88} y='367' fontSize='30' fontWeight='700' fill={ink}>节点 {node.id}</text>
          <circle cx={x + 330} cy='357' r='6' fill={green}/>
          <text x={x + 346} y='366' fontSize='23' fill={green}>已开机</text>

          {t < 7.5 && <g opacity={1 - expand}>
            {[0, 1, 2].map((row) => <g key={row}>
              <rect x={x + 90} y={428 + row * 54} width='280' height='37' rx='7' fill='#f2f5f4' stroke='#dce4e2'/>
              <circle cx={x + 340} cy={446 + row * 54} r='4' fill={green}/>
              <line x1={x + 109} x2={x + 195} y1={446 + row * 54} y2={446 + row * 54} stroke='#b6c2c5' strokeWidth='4'/>
            </g>)}
            <text x={x + 230} y='637' textAnchor='middle' fontSize='25' fill={muted}>电源正常 · 等待揭晓</text>
          </g>}

          <g opacity={expand}>
            <rect x={x + 20} y='398' width='420' height='122' rx='13' fill='#edf3fc' stroke={state.detecting ? '#d5ae5d' : '#b6cde9'} strokeWidth={state.detecting ? 3 : 1}/>
            <text x={x + 38} y='433' fontSize='28' fontWeight='700' fill={blue}>Corosync</text>
            <text x={x + 420} y='433' textAnchor='end' fontSize='21' fill={blue}>通信 / 成员关系</text>
            <g opacity={fade(13)}>
              <rect x={x + 35} y='450' width='390' height='51' rx='9' fill={votesRevealed ? (isolated ? '#fbe8e3' : '#e3f1e8') : '#dfeaf8'}/>
              <text x={x + 50} y='484' fontSize='25' fontWeight='600' fill={votesRevealed ? nodeColor : blue}>votequorum</text>
              <text x={x + 410} y='484' textAnchor='end' fontSize='22' fill={votesRevealed ? nodeColor : blue}>{votesRevealed ? (isolated ? '未满足 quorum' : '满足 quorum') : '票数仲裁'}</text>
            </g>
            <g opacity={fade(15)}>
              <line x1={x + 230} y1='522' x2={x + 230} y2='541' stroke={blue} strokeWidth='2' markerEnd='url(#arrow)'/>
              <rect x={x + 20} y='551' width='420' height='63' rx='13' fill={revealWrite ? (isolated ? '#fbe8e3' : '#e7f3ea') : '#f2f3f0'} stroke={revealWrite ? nodeColor : '#dce1da'} strokeWidth={revealWrite ? 2 : 1}/>
              <text x={x + 38} y='591' fontSize='28' fontWeight='700' fill={revealWrite ? nodeColor : ink}>pmxcfs</text>
              <text x={x + 419} y='590' textAnchor='end' fontSize='22' fill={revealWrite ? nodeColor : muted}>{revealWrite ? (isolated ? '配置只读' : '可写入配置') : '集群文件系统'}</text>
            </g>
            <text x={x + 230} y='659' textAnchor='middle' fontSize='24' fill={state.detecting ? amber : muted}>
              {state.detecting ? '通信异常 · 正在检测' : revealWrite ? (written ? (isolated ? '× 写入受阻' : '✓ 描述已保存') : '尝试保存 VM 100 描述') : state.partitioned ? (isolated ? 'C 所在的一侧' : 'A + B 所在的一侧') : '集群通信正常'}
            </text>
            {revealWrite && !written && <rect x={x + 80} y='674' width={300 * writeProgress} height='3' rx='2' fill={blue}/>}
          </g>

          {t >= 30 && <g opacity={fade(30)}>
            <rect x={x} y='714' width='460' height='142' rx='15' fill={isolated ? '#fff6f2' : '#f6faf6'} stroke={isolated ? '#ead2ca' : '#d0dfd4'}/>
            <text x={x + 22} y='750' fontSize='23' fill={muted}>成员视图</text>
            <text x={x + 438} y='751' textAnchor='end' fontSize='28' fontWeight='700' fill={ink}>{node.members?.join(' + ')}</text>
            <line x1={x + 22} y1='766' x2={x + 438} y2='766' stroke='#e0e5dd'/>
            <text x={x + 22} y='805' fontSize='23' fill={muted}>{votesRevealed ? '可见票数 / 门槛' : '预期总票数'}</text>
            <text x={x + 438} y='814' textAnchor='end' fontSize={votesRevealed ? 41 : 34} fontWeight='700' fill={votesRevealed ? nodeColor : ink}>{votesRevealed ? `${node.votes} / 2` : '3'}</text>
            <text x={x + 22} y='838' fontSize='18' fill={muted}>{votesRevealed ? (isolated ? '1 < 2 · 没有多数票' : '2 ≥ 2 · 达到多数门槛') : '配置的总票数没有减少'}</text>
          </g>}
        </g>;
      })}

      {t < 30 && <g opacity={expand}>
        <rect x='80' y='726' width='1760' height='114' rx='18' fill={state.detecting ? '#faf2de' : '#edf2f4'}/>
        <text x='120' y='771' fontSize='29' fill={state.detecting ? amber : ink} fontWeight='600'>{state.detecting ? '① 通信异常       ② 故障检测       ③ 成员关系重组' : '蓝色消息点：集群通信消息'}</text>
        <text x='120' y='811' fontSize='23' fill={muted}>{state.detecting ? '检测期间不提前断言写入结果；后续展示稳定后的成员视图。' : '连线代表有效集群通信路径；实际网络可以具有多条冗余链路。'}</text>
      </g>}

      {conclusion && <g opacity={fade(67)}>
        <rect x='80' y='718' width='1760' height='145' rx='16' fill='#1b3b38'/>
        <text x='960' y='767' textAnchor='middle' fontSize='30' fontWeight='600' fill='#ffffff'>通信中断　→　成员变化　→　quorum 判断　→　配置写入限制</text>
        <text x='960' y='821' textAnchor='middle' fontSize='28' fill='#c5dfd2'>下一章 · 虚拟机运行与恢复，还要看 HA 等机制</text>
      </g>}

      <text x='80' y='907' fontSize='20' fill={muted}>教学示意 · 非真实故障计时{revealWrite && !conclusion ? ' · 同一 VM 100 的 pmxcfs 配置写入示意' : ''}</text>
      <text x='1840' y='907' textAnchor='end' fontSize='20' fill={muted}>{String(Math.floor(t)).padStart(2, '0')} / 75 s</text>
      <rect x='0' y='938' width='1920' height='142' fill='#eeefe9'/>
      <rect x='80' y='968' width='4' height='65' rx='2' fill={green}/>
      <text x='113' y='1003' fontSize='30' fill={ink}>
        {caption.length > 42 ? <><tspan x='113' dy='-10'>{caption.slice(0, caption.lastIndexOf('，', 42) + 1 || 36)}</tspan><tspan x='113' dy='44'>{caption.slice(caption.lastIndexOf('，', 42) + 1 || 36)}</tspan></> : caption}
      </text>
    </svg>
    {narration.map((line, index) => <Sequence key={index} from={Math.round(line.start * FPS)} durationInFrames={Math.round((line.end - line.start) * FPS)} layout='none'>
      <Html5Audio src={staticFile(`audio/${String(index + 1).padStart(2, '0')}.wav`)} />
    </Sequence>)}
  </AbsoluteFill>;
}
