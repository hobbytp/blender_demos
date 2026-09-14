import {Html5Audio,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {Card,Text,Wire} from './HaPilot';
import {VirtqueueScene} from './VirtqueuePilot';
import audio from './virtqueue-lesson-audio.json';
import {VIRTQUEUE_LESSON_DURATION,virtqueueLessonCue as cue,virtqueueLessonBeats as b,virtqueuePollBeats,virtqueueReplayBeats,virtqueueLessonEvents as e,virtqueueLessonStateAt} from './virtqueue-lesson-timeline';
const green='#347d70',blue='#347aa8',amber='#b18635',purple='#7e759c',muted='#73847e';
const titles=['缓冲区回收了，远端就收到包了吗？','原位展开：驱动、共享内存与宿主后端','描述符内部：用地址和链关系描述请求','发布：先写内容，再让新索引可见','后端：从链头找到数据，提交 TAP','完成：发布 used，读取结果，再回收','独立对照：没有中断，仍然可以发现完成','vhost：数据处理进入内核，控制面仍在','完成的证据：每一层回答不同的问题','三问验收：沿着同一份缓冲区回放'];
const ramp=(f:number,start:number,n=30)=>Math.max(0,Math.min(1,(f-start)/n));
export function VirtqueueLesson(){
  const f=useCurrentFrame(),s=virtqueueLessonStateAt(f),ch=s.chapter,race=ch===6&&f>=e.race;
  const clip=audio.find(c=>f>=c.start*30&&f<(c.start+c.duration+.3)*30);
  const caption=clip?.captions.filter(c=>c.start*30<=f).at(-1)?.text??'';
  const reveal=(text:string)=>.12+.88*ramp(f,cue(text));
  const panel=()=> <rect x={105} y={310} width={1710} height={605} rx={18} fill='#fffefa' stroke='#c7d7ce' strokeWidth={2}/>;
  const outline=(x:number,y:number,w:number,color=blue)=><rect x={x-6} y={y-6} width={w+12} height={102} rx={16} fill='none' stroke={color} strokeWidth={4}/>;
  const motion=(points:number[][],end:number,color=purple)=><Wire points={points} frame={f} active={f>=end-30&&f<end} progress={ramp(f,end-30)} color={color}/>;
  const focus=ch===1?(f<cue('中间放大的是来宾内存，')?[90,365,300]:f<cue('右边上方是用户态的模拟器。')?[500,560,310]:f<cue('右边下方是内核后端。')?[1330,320,500]:[1330,480,500]):null;
  return <>
    <VirtqueueScene frame={f} state={s} timing={s.isReplay?virtqueueReplayBeats:ch===6?virtqueuePollBeats:b} duration={VIRTQUEUE_LESSON_DURATION} poll={ch===6} title={s.isReplay?'正常路径回放 · 新的一次示意请求':race?'恢复通知：重新开启以后，为什么还要检查？':titles[ch]} caption={caption} dim={ch===2||race||ch===7||ch===8||ch===9&&!s.isReplay}>
      {ch===0&&<g>{outline(90,740,300,green)}<Text x={960} y={937} size={22} center bold color={amber}>开场观察已经完成的发送；下一章从头追踪</Text></g>}
      {focus&&outline(focus[0],focus[1],focus[2])}
      {ch===1&&f>=cue('虚拟化内核负责来宾执行，')&&<g><rect x={455} y={760} width={780} height={155} rx={12} fill='#fffefa' stroke={muted}/><Text x={845} y={809} size={27} center bold>KVM：来宾执行 / 虚拟化支持</Text><Text x={845} y={856} size={23} center color={muted}>角色说明；不是网络包中转站</Text></g>}
      {ch===2&&<g>
        {panel()}
        <Text x={960} y={365} size={29} center bold>Guest RAM · 描述符表局部展开（编号与地址均为示意）</Text>
        {['条目','addr / len','flags','next'].map((v,i)=><Text key={v} x={[225,520,895,1145][i]} y={425} size={25} center bold>{v}</Text>)}
        {[0,1].map(i=><g key={i} opacity={reveal(i===0?'第一项指向虚拟网卡头部。':'第二项指向网络包数据。')}>
          <rect x={150} y={455+i*150} width={1110} height={95} rx={10} fill='#eee8f0' stroke={purple}/>
          {[`#${i}`,i===0?'H / header 字节数':'D / packet 字节数',i===0?'NEXT · 无 WRITE':'无 NEXT / WRITE',i===0?'1':'—'].map((v,j)=><Text key={j} x={[225,520,895,1145][j]} y={512+i*150} size={24} center bold color={purple}>{v}</Text>)}
          <Card x={1370} y={455+i*150} w={360} title={i===0?'地址 H 指向':'地址 D 指向'} value={i===0?'VirtIO-net header':'P1 网络包数据'} color={blue} small/>
          {motion([[1260,500+i*150],[1370,500+i*150]],cue(i===0?'第一项指向虚拟网卡头部。':'第二项指向网络包数据。')+30)}
        </g>)}
        <Text x={960} y={785} size={27} center bold color={f>=cue('本例发送缓冲由设备读取，')?blue:muted}>方向从设备视角定义：本例 TX 两段均可读，非设备写入</Text>
        <Text x={960} y={860} size={24} center color={muted}>链头 #0 → 描述符 #1 → 原地访问缓冲区；描述符不装载网络包</Text>
      </g>}
      {ch===3&&<g>
        {outline(500,560,310,s.available?purple:amber)}
        <rect x={865} y={545} width={340} height={165} rx={12} fill='#fffefa' stroke={f>=e.barrier?green:muted} strokeWidth={3}/>
        <Text x={1035} y={592} size={25} center bold>发布前屏障</Text>
        <Text x={1035} y={641} size={25} center color={f>=e.barrier?green:muted}>{f>=e.barrier?'保证内容先于索引可见':'等待内容写入'}</Text>
        <Text x={960} y={937} size={22} center bold color={s.available?green:amber}>{s.available?'已发布：后端可以访问；不要求先收到 kick':s.availableEntry?'槽位已写 ≠ 新索引已经发布':'先填写可用环槽位，再发布索引'}</Text>
      </g>}
      {ch===4&&outline(s.tapAccepted?1330:s.dataAccessed?870:s.consumed?500:1330,s.tapAccepted?655:s.dataAccessed||s.consumed?350:480,s.tapAccepted?500:s.dataAccessed?320:s.consumed?310:500,s.dataAccessed?blue:purple)}
      {ch===5&&<g>
        {outline(s.readUsed?90:890,740,300,green)}
        <Text x={960} y={937} size={22} center bold color={amber}>{s.reclaimed?'回收后 idx 仍为 1；这不是队列复位':'TX used.len = 0：未写回 Guest 缓冲，非零字节发送'}</Text>
      </g>}
      {ch===6&&!race&&<Text x={960} y={937} size={22} center bold color={green}>独立请求：已完成数据提交；只观察抑制通知后的回收</Text>}
      {race&&<g>
        {panel()}
        <Text x={960} y={365} size={29} center bold>独立竞态示意 · 一次新的完成落在检查与恢复通知之间</Text>
        <Card x={170} y={420} w={450} title='驱动 · 上一次检查' value='last_used_idx = 0' color={purple}/>
        <Card x={1295} y={420} w={450} title='后端 · 完成记录' value={s.racePublished?'used.idx = 1':'used.idx = 0'} color={s.racePublished?green:muted}/>
        <Card x={170} y={625} w={450} title='驱动 · 通知状态' value={s.notificationsEnabled?'已重新开启通知':'NO_INTERRUPT = 1'} color={s.notificationsEnabled?amber:muted}/>
        <Card x={1295} y={625} w={450} title='驱动 · 再检查 used.idx' value={s.raceRechecked?'1 ≠ 0：继续处理':'等待重新检查'} color={s.raceRechecked?green:muted}/>
        <Text x={960} y={470} size={24} center color={amber}>{s.racePublished?'本次完成无中断提醒':'开始时尚无新完成'}</Text>
        {motion([[620,670],[1295,670]],e.recheck,green)}
        {motion([[1520,510],[1520,625]],e.recheck,green)}
        <Text x={960} y={815} size={27} center bold color={s.raceRechecked?green:amber}>{s.raceRechecked?'发现待处理结果，不能直接进入等待':'开启通知 → 内存屏障 → 再比较推进位置'}</Text>
        <Text x={960} y={870} size={22} center color={muted}>Linux virtqueue_enable_cb：prepare 后调用 poll；通用接口，非固定网卡调度</Text>
      </g>}
      {ch===7&&<g>
        {panel()}
        <Text x={960} y={365} size={29} center bold>同一架构的两个阶段 · 配置在先，数据处理在后</Text>
        <Card x={170} y={425} w={460} title='PVE · 管理配置' value='选择网卡与后端配置' color={muted} small/>
        <Card x={730} y={425} w={460} title='QEMU · 用户态控制' value='设备 / 映射 / 队列 / 通知' color={purple} small/>
        <Card x={1290} y={425} w={460} title='vhost-net · 内核后端' value='接收运行时配置' color={purple} small/>
        {motion([[630,470],[730,470]],cue('但用户态模拟器并没有消失。')+30)}
        {motion([[1190,470],[1290,470]],cue('以及后端与通知通道的连接，')+30)}
        <Card x={170} y={645} w={460} title='Guest RAM · 描述符与数据' value='已发布的发送请求' color={blue}/>
        <Card x={730} y={645} w={460} title='vhost-net · 内核数据处理' value='取用 / 访问 / 提交' color={blue}/>
        <Card x={1290} y={645} w={460} title='TAP · 内核网络路径' value='本例复制发送' color={blue}/>
        {motion([[630,690],[730,690]],cue('队列取用和数据提交，')+30,blue)}
        {motion([[1190,690],[1290,690]],cue('在本例由宿主内核执行。')+30,blue)}
        <Text x={960} y={835} size={27} center bold color={amber}>不自动意味着零拷贝；不保证消除所有 VM exit</Text>
        <Text x={960} y={880} size={22} center color={muted}>PVE 的 vhost 选择有配置与能力条件；本集没有性能测量</Text>
      </g>}
      {ch===8&&<g>
        {panel()}
        {['驱动可回收缓冲区','TAP 成功接收本次提交','远端传输协议确认','远端应用处理成功'].map((v,i)=><g key={v} opacity={reveal(['第一层，驱动已经读到完成，','第二层，在选定的成功分支，','第三层，远端传输协议确认，','第四层，远端应用处理成功，'][i])}>
          <Card x={170} y={355+i*135} w={735} title={`证据层 ${i+1}`} value={v} color={i<2?green:amber}/>
          <Text x={1300} y={412+i*135} size={28} center bold color={i<2?green:amber}>{i<2?'本例选定路径已展示':'未知：需要独立证据'}</Text>
        </g>)}
        <Text x={960} y={890} size={24} center color={muted}>used.id 是链头标识；不是通用网络状态码或应用成功回执</Text>
      </g>}
      {ch===9&&!s.isReplay&&<g>
        {panel()}
        <Text x={960} y={365} size={29} center bold>暂停思考：你依据的是通知、队列，还是远端证据？</Text>
        {['通知携带整个数据包？','看到 used.idx 就直接回收？','回收证明远端应用成功？'].map((v,i)=><g key={v} opacity={reveal(['通知里携带整个数据包吗？','看到已用索引就能直接回收吗？','缓冲回收证明远端应用成功吗？'][i])}>
          <Text x={180} y={480+i*145} size={30} bold>{i+1}. {v}</Text>
          <Text x={1390} y={480+i*145} size={26} center bold color={green}>{f>=[e.answerOne,e.answerTwo,e.answerThree][i]?['不携带，只提醒检查','先读取条目，找到原请求','不能，需更高层证据'][i]:'？'}</Text>
        </g>)}
      </g>}
    </VirtqueueScene>
    {audio.map(c=><Sequence key={c.file} from={Math.round(c.start*30)} durationInFrames={Math.round((c.end-c.start)*30)} layout='none'><Html5Audio src={staticFile(c.file)}/></Sequence>)}
  </>;
}
