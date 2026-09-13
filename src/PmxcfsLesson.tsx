import {Html5Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Card,Text,Wire} from './HaPilot';
import {PmxcfsScene} from './PmxcfsPilot';
import audio from './pmxcfs-lesson-audio.json';
import {PMXCFS_LESSON_DURATION,pmxcfsLessonCue as cue,pmxcfsLessonBeats as b,pmxcfsReplayBeats,pmxcfsLessonEvents as e,pmxcfsLessonStateAt} from './pmxcfs-lesson-timeline';

const green='#347d70',blue='#347aa8',amber='#b18635',red='#b96b50',muted='#73847e',paper='#fffefa';
const ramp=(f:number,start:number,n=30)=>Math.max(0,Math.min(1,(f-start)/n));
const titles=['三个入口，比较的是同一个配置对象','展开边界，认清每个组件的职责','有 quorum，才允许操作进入发送路径','一致的是顺序，不是完成时刻','操作交付后，各自更新本地副本','写调用返回，依据本机处理结果','读取走本机，不逐次查询其他节点','稳定分区：拒绝新写入，保留旧配置','有序文件操作，不自动组成业务事务','把观察到的证据，放回对应层次','判断题：数据库、写入资格与返回条件'];
export function PmxcfsLesson(){
  const f=useCurrentFrame(),s=pmxcfsLessonStateAt(f),ch=s.chapter;
  const clip=audio.find(c=>f>=c.start*30&&f<(c.start+c.duration+.3)*30);
  const caption=clip?.captions.filter(c=>c.start*30<=f).at(-1)?.text??'';
  const reveal=(text:string)=>.12+.88*ramp(f,cue(text));
  const panel=(y=310,h=570)=><rect x={120} y={y} width={1680} height={h} rx={18} fill={paper} stroke='#c7d7ce' strokeWidth={2}/>;
  const outline=(x:number,y:number,w:number,h:number,color=blue)=><rect x={x-5} y={y-5} width={w+10} height={h+10} rx={13} fill='none' stroke={color} strokeWidth={4}/>;
  const queueVisible=ch===3&&f>=e.queue;
  const note=ch===8?'独立协作示例 · 回到健康集群 · 两个调用者自愿使用同一个锁':ch===9?'诊断检查点 · 健康路径回看 · 未模拟加入、重同步或 I/O 错误':ch===10?(s.isReplay?'健康路径回放 · 重新开始一项示意写入':f<e.questionTwo?'判断题一：C 已失去 quorum':'判断题二：回看健康路径中的 A'):ch===7?'稍后的分区对照 · A+B / C 已稳定 · 不演示故障检测时延':undefined;
  return <>
    <PmxcfsScene frame={f} state={s} title={s.isReplay?'回放：入口 → 交付 → 本地更新 → 结果':titles[ch]} caption={caption} timing={s.isReplay?pmxcfsReplayBeats:b} duration={PMXCFS_LESSON_DURATION} chapterCount={11} shortMotion dim={ch===0||queueVisible||ch===8||ch===9||ch===10&&!s.isReplay} note={note} objectLabel={ch===8?'独立协作示例：cfs_lock_file 支持的集群配置对象；不是 VM 文件锁调用链':undefined}>
      {ch===0&&<g>
        {panel(315,545)}
        <Text x={960} y={365} size={30} center bold>从 A 访问 B 所属的配置，先固定规范路径</Text>
        {['A · 访问入口','B · 配置所属节点','C · 另一个访问入口'].map((label,i)=><g key={label} opacity={i?reveal('比较前先固定同一个对象，'):1}>
          <Card x={180+i*535} y={435} w={490} title={label} value='nodes/B/qemu-server/100.conf' color={i===1?green:blue} small/>
          <Text x={425+i*535} y={570} size={24} center color={blue}>同一配置对象</Text>
        </g>)}
        <Wire points={[[670,480],[715,480]]} frame={f} color={blue}/><Wire points={[[1250,480],[1295,480]]} frame={f} color={blue}/>
        <g opacity={reveal('不能把各节点的本地别名，')}><Text x={960} y={660} size={28} center bold color={amber}>本地别名：在不同节点上可能指向不同对象</Text></g>
        <g opacity={reveal('虚拟磁盘不走这条复制路径。')}><Text x={960} y={755} size={28} center bold color={green}>配置复制与虚拟磁盘 I/O 分属不同路径</Text></g>
      </g>}
      {ch===1&&<g>
        {f<cue('进程里有内存配置树，')?outline(110,285,460,70):f<cue('也有访问本地数据库的代码。')?outline(110,532,460,90):f<cue('下方单独画出集群通信进程。')?outline(110,652,460,90):outline(110,790,460,90)}
        {f>=cue('进入配置文件系统进程。')&&f<cue('下方单独画出集群通信进程。')&&outline(78,372,524,378,green)}
        {f>=cue('数据库文件保存在本机。')&&<g><rect x={720} y={690} width={485} height={46} rx={6} fill={paper}/><Text x={735} y={720} size={18} bold color={blue}>/var/lib/pve-cluster/config.db</Text></g>}
      </g>}
      {ch===2&&f>=b.send+83&&<Text x={345} y={776} size={19} center color={blue}>W1 已发送 · 等待本机交付结果</Text>}
      {queueVisible&&<g>
        {panel(305,590)}
        <Text x={960} y={355} size={29} center bold>独立顺序示例：两条已提交操作 Q1 → Q2</Text>
        <Text x={960} y={402} size={22} center color={muted}>不是给主线 W1 增加第二次修改；只观察交付队列</Text>
        {['A','B','C'].map((name,i)=>{
          const x=205+i*545,count=s.queue[i];
          return <g key={name}>
            <Card x={x} y={440} w={420} title={`节点 ${name} · CPG`} value={count===0?'等待交付':`已交付 ${count} 条`} color={blue}/>
            <Wire points={[[x+210,530],[x+210,580],[x+(count?305:115),580],[x+(count?305:115),630]]} frame={f} active={f>=e.queueDeliver+[0,18,42][i]&&f<e.queueDeliver+30+[0,18,42][i]||f>=e.queueDeliver+90+[0,18,42][i]&&count<2} progress={ramp(f,e.queueDeliver+[0,18,42][i]+(count?90:0),30)} color={blue}/>
            {[0,1].map(n=><g key={n}><rect x={x+30+n*190} y={630} width={170} height={85} rx={12} fill={count>n?'#dfede4':'#f0efe7'} stroke={count>n?green:muted}/><Text x={x+115+n*190} y={682} size={30} center bold color={count>n?green:muted}>{count>n?`Q${n+1} 已交付`:`Q${n+1} 等待`}</Text></g>)}
          </g>;
        })}
        <Text x={960} y={805} size={29} center bold color={green}>所有节点：Q1 在 Q2 之前</Text>
        <Text x={960} y={852} size={23} center color={amber}>位置相同表示同一队列次序，动画错开表示完成时刻不同</Text>
      </g>}
      {ch===4&&f>=b.memory&&<g>
        {outline(1350,s.database[2]?652:532,460,90,s.database[2]?green:amber)}
        <Text x={1555} y={776} size={18} center bold color={amber}>{s.memory[2]&&!s.database[2]?'C 持内部锁 · 新读取等待':'交付 → 内存 → 本地数据库'}</Text>
      </g>}
      {ch===5&&<g>
        {outline(110,285,460,70,s.returned?green:amber)}
        <Text x={340} y={776} size={19} center bold color={s.returned?green:amber}>{s.returned?'本机结果已返回':'等待本机处理结果'}</Text>
        {f>=cue('不是逐台收集磁盘回执。')&&<g><rect x={720} y={758} width={480} height={29} rx={5} fill={paper}/><Text x={960} y={779} size={19} center bold color={amber}>返回条件 ≠ 全节点磁盘 ACK</Text></g>}
      </g>}
      {ch===6&&<g>
        <Wire points={[[110,333],[68,333],[68,575],[110,575]]} frame={f} active={s.readRequested&&f<e.readMemory+24} progress={ramp(f,e.readRequest,e.readMemory+24-e.readRequest)} color={blue}/>
        <Wire points={[[110,594],[82,594],[82,347],[110,347]]} frame={f} active={f>=e.readResult-36&&!s.readReturned} progress={ramp(f,e.readResult-36,36)} color={green}/>
        {outline(110,532,460,90,green)}
        <Text x={340} y={776} size={19} center bold color={green}>{s.readReturned?'本地读取返回 v2':s.readRequested?'本地读请求处理中':'本地配置已稳定'}</Text>
        {s.readReturned&&<Text x={965} y={776} size={19} center bold color={muted}>CPG：没有新的逐次读取查询</Text>}
      </g>}
      {ch===8&&<g>
        {panel(300,625)}
        <Text x={960} y={349} size={28} center bold>cfs_lock_file：协作调用者的临界区示意</Text>
        <Text x={960} y={391} size={21} center color={muted}>健康集群 · 正常完成并释放 · 不模拟超时、异常或锁恢复</Text>
        <Card x={185} y={435} w={420} title='调用者 A' value={s.workingA?'执行受保护操作':s.lockOwner==='A'?'已取得锁':f>=e.releaseA?'已完成并释放':'准备争取锁'} color={s.lockOwner==='A'?green:blue}/>
        <Card x={1310} y={435} w={420} title='调用者 B' value={s.workingB?'执行自己的操作':s.lockOwner==='B'?'已取得锁':f>=e.lockRequest?'等待同一把锁':'准备争取锁'} color={s.lockOwner==='B'?green:amber}/>
        <Card x={710} y={435} w={500} title='共享锁目录 · mkdir / rmdir' value={s.lockOwner?`当前持有者：${s.lockOwner}`:'当前无持有者'} color={s.lockOwner?green:muted}/>
        <Wire points={[[605,475],[710,475]]} frame={f} active={f>=e.lockRequest&&f<e.lockA} progress={ramp(f,e.lockRequest,e.lockA-e.lockRequest)} color={blue}/>
        <Wire points={[[1310,475],[1210,475]]} frame={f} active={f>=e.lockB-30&&f<e.lockB} progress={ramp(f,e.lockB-30,30)} color={blue}/>
        <Wire points={[[710,510],[605,510]]} frame={f} active={f>=e.lockA&&f<e.lockA+30} progress={ramp(f,e.lockA)} color={green}/>
        <Wire points={[[1210,510],[1310,510]]} frame={f} active={f>=e.lockB&&f<e.lockB+30} progress={ramp(f,e.lockB)} color={green}/>
        {['A','B'].map((name,i)=>{
          const x=i?1310:185,refreshed=i?s.refreshedB:s.refreshedA,working=i?s.workingB:s.workingA;
          return <g key={name}>
            <Card x={x} y={615} w={420} title='cfs_update → 业务临界区' value={working?'刷新完成 → 业务执行':refreshed?'配置已刷新':'等待取得锁后刷新'} color={refreshed?green:muted} small/>
            <Wire points={[[x+210,525],[x+210,615]]} frame={f} active={f>=(i?e.refreshB:e.refreshA)-24&&f<(i?e.refreshB:e.refreshA)} color={green}/>
          </g>;
        })}
        <Wire points={[[605,660],[960,660],[960,525]]} frame={f} active={f>=e.releaseA-30&&f<e.releaseA} progress={ramp(f,e.releaseA-30)} color={green}/>
        <Text x={960} y={785} size={28} center bold color={amber}>先取得锁 → 刷新 → 业务操作 → 释放</Text>
        <Text x={960} y={845} size={23} center>目录协作锁、memdb 内部互斥锁、具体 VM 操作锁各有边界</Text>
        <Text x={960} y={885} size={20} center color={muted}>这里只展示集群库封装；是否适用要追踪具体业务调用链</Text>
      </g>}
      {ch===9&&<g>
        {panel(300,610)}
        {[
          ['第一层，看请求是否进入文件入口。','文件入口','请求是否已经进入 FUSE？'],
          ['第二层，看本机是否有仲裁。','quorum','是否具备本次写入资格？'],
          ['第三层，看消息能否正常交付。','组通信与状态机','操作是否进入正常交付路径？'],
          ['第四层，看本地处理和返回。','本机处理结果','内存 / 后端 / 调用结果有什么证据？'],
          ['业务还有自己使用的锁。','上层业务','是否在等待自己的协作锁？'],
        ].map(([text,title,value],i)=><g key={text} opacity={reveal(text)}><Text x={180} y={353+i*100} size={26} bold color={green}>{String(i+1).padStart(2,'0')}</Text><Text x={250} y={353+i*100} size={26} bold>{title}</Text><Text x={730} y={353+i*100} size={25} color={blue}>{value}</Text><path d={`M180 ${378+i*100} H1730`} stroke='#d7dfd6'/></g>)}
        <Text x={960} y={860} size={24} center color={amber}>能读 ≠ 能写；调用返回 ≠ 全节点持久化证明</Text>
      </g>}
      {ch===10&&!s.isReplay&&<g>
        {panel(355,470)}
        <Text x={960} y={422} size={28} center bold>{f<e.questionTwo?'判断题 1 · C 失去 quorum':'判断题 2 · A 的写调用已经返回'}</Text>
        <Text x={960} y={515} size={34} center bold>{f<e.questionTwo?'有本地 config.db，就能独立写入吗？':'能否据此断言，收齐了全节点落盘回执？'}</Text>
        <Text x={960} y={611} size={30} center bold color={f<e.questionTwo?s.answerOne?red:muted:s.answerTwo?red:muted}>{f<e.questionTwo?s.answerOne?'不能：C 无 quorum，新写入受阻':'留几秒，沿图寻找写入资格':s.answerTwo?'不能：等待条件是本机交付处理结果':'留几秒，找出实际返回路径'}</Text>
        <Text x={960} y={730} size={25} center color={blue}>{f<e.questionTwo?'配置副本仍可读取，但读取能力不授予写入资格':'组通信交付保证与磁盘持久性保证需要分别说明'}</Text>
      </g>}
    </PmxcfsScene>
    {audio.map(c=><Sequence key={c.file} from={Math.round(c.start*30)} durationInFrames={Math.round((c.end-c.start)*30)} layout='none'><Html5Audio src={staticFile(c.file)}/></Sequence>)}
  </>;
}
