# 精致技术插画：风格帧 01

用户已确认本风格帧：暖白背景、精致技术插画、少量强调色、充分留白。2026-09-12 完成 10 秒动效测试，待用户评价节奏和表现后再扩展。

## 10 秒动效测试

- 预览：`http://127.0.0.1:5173/?sample=editorial`，支持播放、暂停、回看、静音。
- 成片：`out/quorum-editorial-10s.mp4`；重新生成：`npm.cmd run render:editorial`。
- 旁白：`npm.cmd run voice:editorial`，复用既有 Edge TTS 和逐词对齐脚本。
- 0–1.8 秒正常通信；1.8–4 秒断开、检测；4 秒后成员视图稳定；随后展示固定门槛及两侧配置结果。时间为教学编排。
- 服务器使用 imagegen 插画素材，SVG 负责连线、成员区域、文档与标签；不是全矢量工程。白底素材以 multiply 融合到暖色画面，后续更换深色背景时需重新处理素材。
- 验证：5 项测试通过、TypeScript/Vite 构建通过；桌面播放/暂停/拖动正常；390px 页面无横向溢出；导出为 1920×1080、30fps、300 帧、H.264 + AAC，完整解码无错误。人工检查结尾帧的节点、电源、票数和写入标签。

服务器素材提示词：提取参考帧中一台服务器，保留三分之四视角、金属灰青质感、通风格栅、两层硬盘与绿色电源灯，去除文字和连线。初次生成的棋盘格背景不是真透明，随后通过 imagegen 将背景替换为纯白，保留硬件插画不变；素材保存于 `public/art/editorial/server.png`。

![网络分区之后](../design/quorum-editorial-v1.png)

此 PNG 是使用内置 imagegen 生成的美术参考，不是 SVG 或已完成的动画。后续按选定设计拆分节点素材、连线、成员区域、文字和配置状态；先验证 8–10 秒动效，再扩展样片。

画面示意成员关系稳定后的三节点场景：A+B 两票、C 一票，预期总票数 3、门槛 2。所有节点开机。断开的连线概括全部有效集群通信路径，并不限定真实网络布线。示例是同一 VM 100 的配置写入，两张文档分别表示两侧的文件层写入结果。

人工检查：移除了初稿无关植物；将生成器自行加入的 corosync.conf 标签更正为 VM 100 配置。节点数量、票数、门槛、可写/只读与既有场景一致。

## 生成提示词

```text
Use case: scientific-educational, art-direction concept frame.
Create ONE exquisitely art-directed 16:9 landscape key visual, 1920x1080 or higher, for a Chinese educational motion-graphics film explaining PVE Corosync network partition and quorum. This is a finished editorial technical illustration style frame, not a screenshot, not a web UI, not a slide template. Original artwork. It must look like a skilled human information designer's refined engineering explainer.

ART DIRECTION:
Warm ivory paper background #F8F7F2, mostly flat vector illustration with restrained soft shading, uniform fine dark slate outlines with beautifully rounded corners, muted teal #387D79 and pale mint #E5F0E9 for normal communication, tiny terracotta/amber #C7845E accents for disconnected state. Professional precision, generous negative space, exceptional balanced typography. No purple, no neon, no glow, no dark background, no stars, no gradients for decoration. Subtle dimensional edges on server chassis only, consistent front three-quarter drawing, NOT a large isometric city. Friendly technical clarity with considered details. Different line weights for structural borders and small details; rounded routed cables; attractive server front panels. Typography sober refined Chinese sans serif, mostly normal/medium weight; moderate title. Top text occupies under 15 percent of frame; the illustration is the hero. No sidebar, timeline, pills everywhere, huge bold headline, subtitles or player controls.

COMPOSITION:
Large coherent center illustration, not three disconnected infographics. Exactly THREE identical well-proportioned server nodes named A, B, C, comfortably spread horizontally with A+B on left two thirds and C on right third. Each server has carefully drawn ventilation slots, two or three drive bays, subtle panel details, one illuminated small GREEN power indicator: all three powered on. A and B share a very light mint softly bounded region. C is in a separate very light warm grey region. Regions are quiet background structure, not giant dashboard cards. Connect A and B with a graceful precise teal data path with two small capsule-shaped message marks, integrated with their ports. Show the A/B-to-C communication route interrupted at a clearly visible small gap, cable endpoints facing one another with a tiny restrained terracotta disconnection symbol. No connected communication route to C. A fine short vertical dashed divider marks the partition gap, not a thick wall. Two fine annotation leader lines point to the member groups. Members A+B have a clearly readable small label beneath their region; C has corresponding label.
Below each group, one modest document illustration with configuration lines, visually attached to the respective group: left document has a teal check mark, right document has a small terracotta lock. These are pmxcfs write outcomes, not VM shutdown. Three node power LEDs remain green.

EXACT TEXT TO RENDER, carefully proofread:
Top left title: "网络分区之后"
Small subtitle beneath: "机器仍在运行，集群看到的成员不同。"
Small top right running label: "COROSYNC"
Near small partition gap: "通信中断"
Under the A+B group: "成员视图：A、B"
Under C group: "成员视图：C"
Small neutral shared annotation in available whitespace: "预期总票数 3 · 仲裁门槛 2"
Left document annotation: "2 票 ≥ 2"
Smaller below left: "pmxcfs 可写"
Right document annotation: "1 票 < 2"
Smaller below right: "pmxcfs 只读"
Tiny subtle footer: "三节点 · 每节点一票 · 无 QDevice · 成员关系稳定后的教学示意"

ACCURACY:
Exactly three nodes, labels A B C only once each as server identities. Membership lists clearly correspond. Two votes majority versus one minority, expected total stays THREE, threshold stays TWO. Do not show an election, leader crown, ballot boxes, special controller or central arbitrator. Do not show virtual machines turning off. This is stable post-partition state, no real timing claims. Keep content legible, avoid overloaded labels, oversized arithmetic, or repetitive decorative icons. The result should be visually sophisticated and appealing while reproducible later as vector components.
```

## 修正提示词

```text
Edit this educational style frame precisely. Preserve the warm ivory background, muted teal/terracotta palette, the three server illustrations, their positions, the typography, memberships, arithmetic, power LEDs, cables, and overall composition. Make ONLY these two corrections: (1) Remove both decorative potted plants completely, leaving clean uncluttered background in those places. (2) On BOTH paper document illustrations, replace the existing '/etc/pve/corosync.conf' text with the exact Chinese label 'VM 100 配置'. This is a VM configuration write example, not a Corosync configuration edit. Do not add any other text or decorative objects. Keep all other Chinese labels unchanged and perfectly legible. Preserve the 16:9 aspect ratio and the high-quality technical illustration finish.
```
