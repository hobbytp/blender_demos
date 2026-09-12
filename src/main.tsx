import {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player, type PlayerRef} from '@remotion/player';
import {QuorumPilot} from './QuorumPilot';
import {chapters as originalChapters, DURATION as originalDuration, FPS, stateAt} from './timeline';
import {QuorumDark} from './QuorumDark';
import {darkChapters, DARK_DURATION, darkStateAt} from './dark-timeline';
import './style.css';
import {QuorumEditorial} from './QuorumEditorial';
import {editorialChapters, EDITORIAL_DURATION, editorialStateAt} from './editorial-timeline';
import {QuorumFlow} from './QuorumFlow';
import {flowChapters, FLOW_DURATION, flowStateAt} from './flow-timeline';
const isFlow = new URLSearchParams(location.search).get('sample') === 'flow';
const isEditorial = new URLSearchParams(location.search).get('sample') === 'editorial';

const isDark = new URLSearchParams(location.search).get('sample') === 'dark';
const DURATION = isFlow ? FLOW_DURATION : isEditorial ? EDITORIAL_DURATION : isDark ? DARK_DURATION : originalDuration;
const chapters = isFlow ? flowChapters : isEditorial ? editorialChapters : isDark ? darkChapters : originalChapters;
document.documentElement.dataset.theme = isDark ? 'dark' : 'light';

function App() {
  const player = useRef<PlayerRef>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState('');
  const state = isFlow ? flowStateAt(frame) : isEditorial ? editorialStateAt(frame) : isDark ? darkStateAt(frame) : stateAt(frame);

  useEffect(() => {
    const current = player.current!;
    const onFrame = () => setFrame(current.getCurrentFrame());
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onMute = () => setMuted(current.isMuted());
    const onError = () => setError('播放出现问题，请重新加载页面后重试。');
    current.addEventListener('frameupdate', onFrame);
    current.addEventListener('play', onPlay);
    current.addEventListener('pause', onPause);
    current.addEventListener('ended', onPause);
    current.addEventListener('mutechange', onMute);
    current.addEventListener('error', onError);
    return () => {
      current.removeEventListener('frameupdate', onFrame);
      current.removeEventListener('play', onPlay);
      current.removeEventListener('pause', onPause);
      current.removeEventListener('ended', onPause);
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
      <a className='edition' href={isFlow ? './' : '?sample=flow'}>{isFlow ? '对比：最初 75 秒样片 ↗' : '观看：节点内部动态版 ↗'}</a>
    </header>
    <main>
      <div className='intro'><div><p className='eyebrow'>从一次网络分区，理解集群协作</p><h1>{isDark ? '通信断了，谁还能写？' : '谁还能修改集群配置？'}</h1></div><p className='duration'>{DURATION / FPS} 秒<span>中文讲解 · 可暂停回看</span></p></div>
      <div className='lesson-grid'>
        <section className='player-shell' aria-label='教学动画播放器'>
          <Player ref={player} component={isFlow ? QuorumFlow : isEditorial ? QuorumEditorial : isDark ? QuorumDark : QuorumPilot} durationInFrames={DURATION} fps={FPS} compositionWidth={1920} compositionHeight={1080} style={{width: '100%'}} controls={false} autoPlay={false} loop={false} clickToPlay={false} doubleClickToFullscreen={false} moveToBeginningWhenEnded={false} showVolumeControls={false}/>
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
            <button onClick={() => seek(part.start * FPS)} aria-current={state.chapter === i ? 'step' : undefined}>
              <span className='chapter-index'>{String(i + 1).padStart(2, '0')}</span><span>{part.name}</span><time>{String(Math.floor(part.start / 60)).padStart(2, '0')}:{String(part.start % 60).padStart(2, '0')}</time>
            </button>
          </li>)}</ol>
          <p className='chapter-help'>点击步骤后暂停。<br/>看清状态，再继续播放。</p>
        </aside>
      </div>
      <div className='lesson-foot'>
        <p><span className='small-dot'/>三个节点 · 每节点一票 · 无 QDevice</p>
        <p>时间经过教学编排，非真实故障计时。</p>
      </div>
      <details className='sources'><summary>场景说明与依据</summary><p>画面中的连线代表全部有效集群通信路径。配置修改比较同一 VM 100 的 pmxcfs 文件层写入，不代表某个 GUI 或 API 请求的完整行为。虚拟机运行状态不由票数动画直接推断。</p><p><a href='https://github.com/proxmox/pve-docs/blob/master/pmxcfs.adoc'>Proxmox · pmxcfs</a><a href='https://github.com/corosync/corosync/blob/main/man/votequorum.5'>Corosync · votequorum</a><a href='https://github.com/proxmox/pve-docs/blob/master/ha-manager.adoc'>Proxmox · HA</a></p></details>
    </main>
    <footer><span>PVE 图解课 / 01</span><span>先理解原理，再讨论故障。</span></footer>
  </div>;
}

createRoot(document.getElementById('root')!).render(<App/>);
