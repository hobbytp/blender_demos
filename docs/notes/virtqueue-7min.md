# PVE 05：Virtqueue 完整讲解 v1

2026-09-14。由认可的 30 秒样片扩展为 420 秒、10 章课件；固定结构图中展示 Guest 驱动、Guest RAM、QEMU 与内核 vhost-net / TAP。[事实依据与章节表](pve-ep05-virtqueue.md)。

## 观看与复现

- `npm.cmd run dev` → `http://127.0.0.1:5173/?sample=virtqueue-lesson`。
- `npm.cmd run render:virtqueue-lesson` → `out/virtqueue-7min-v1.mp4`，1920×1080、30 fps、12600 帧。
- `npm.cmd run voice:virtqueue-lesson` 重建本集十段中文旁白；画面修改无需重建配音。
- 本机可用内存不足时，四并发超时、双并发报告 Chrome 内存不足；单并发成功通过原失败帧段后用于完整导出，等待超时为 120 秒。系统临时目录还出现过复制错误，本次将 TEMP/TMP 指向工作区 `out/virtqueue-render-temp`；这些是本次进程环境，不更改系统设置。
- 长短版可在播放器右上角切换；原 `?sample=virtqueue` 的无旁白轮询预设保留。
- 原样片源码基线 `cdc1955`，`out/virtqueue-30s-v1.mp4` 与四段配音保留。

## 教学与实现

主线跨章节推进一条请求：描述符引用 → available 槽位 → 屏障 → idx 发布 → kick → 后端取链、访问缓冲、提交 TAP → used 槽位与 idx → 通知 → 驱动读取 → 回收。新索引可见后已经允许后端访问，kick 不是访问前置条件；本例选择后端等待通知。

70–115 秒局部展开 `addr/len/flags/next`，TX 两段都是设备可读缓冲。115–160 秒让观众看到槽位已写而 idx 未发布的窗口。205–250 秒区分 used 发布、驱动读取和回收，明确 TX used.len=0 不是零字节发送，回收不把 idx 归零。

250–290 秒包含两个明确独立的例子：先从已成功提交的新请求观察抑制通知后的主动回收；再展开检查与重新开启通知之间出现完成的竞态。后者只模拟通用 virtqueue 接口的重新开启、内存屏障与再检查，不声称是所有 virtio-net 驱动的固定调度，也不模拟丢中断。

290–335 秒对照配置与数据处理职责，不宣称零拷贝、消除所有 VM exit 或性能提升倍数。335–375 秒按 Guest 缓冲回收、TAP 提交、远端传输确认、远端应用处理分别标注证据。片尾三问后从新请求回放，避免沿用已完成状态。

十段真实配音共 **376.752 秒**，约 43 秒用于阅读、停顿和章节衔接。事件从实际词边界派生；消息保持 24–36 帧局部运动，未整体慢放原样片。

## 检查记录

- TypeScript / Vite 构建通过，17 项测试通过；全片 12600 帧正向与倒退一致，覆盖发布、完成、回收、独立场景复位与恢复通知再检查。保留已有大包警告，无新增依赖。
- 实际浏览器十章跳转、关键状态倒退、静音/开启旁白、暂停、12599 帧停止与重新播放通过，页面运行错误 0；未混入短片旁白。
- 原 30 秒样片四章和无旁白轮询预设回归通过。
- 已检查描述符展开、发布窗口、通知恢复与 vhost 边界的浏览器画面；将靠近底部连线的说明移开。
- 最终 MP4：H.264，1920×1080，30 fps，12600 帧，视频轨 420.000 秒；AAC 48 kHz，容器 420.053333 秒，29,807,386 字节。
- 完整音视频解码通过，抽取 14 个章节/状态帧，并追加 173.9 秒的数据流中间帧；已目视检查描述符、发布屏障、used 发布尚未回收、通知再检查、证据层级与片尾状态。字幕、标签与箭头端点清楚，底部说明已移开连线。
- SHA256：`59971C5FD00592C19B37A78B2AE0EA21C970F0A11AED086CE1220D1C435DB25D`。
- 本地证据：`out/virtqueue-lesson-render.log`、`out/virtqueue-lesson-browser-qa.log`、`out/virtqueue-pilot-regression.log`、`out/virtqueue-lesson-media-qa.log` 与 `out/virtqueue-lesson-video-*.png`。原样片 SHA256 复核未变。

未进行真实 PVE VM 发包、抓包、内核跟踪或性能测量；源码静态核查不等于某台机器的运行证据。教学效果仍需观看反馈。

## 后续小改入口

- `src/VirtqueueLesson.tsx`：长片焦点、局部展开、竞态与证据层级。
- `src/VirtqueuePilot.tsx` 的 `VirtqueueScene`：共享内部布局与有向路径，修改后回归长短版。
- `src/virtqueue-lesson-timeline.ts`：长片事件和独立对照；`src/virtqueue-timeline.ts` 保留短片默认时间。
- `src/virtqueue-lesson-narration.json`、`src/virtqueue-lesson-audio.json`、`public/audio/quorum-virtqueue-lesson/`：口语稿、真实字幕边界、配音。

局部修改按 explain-tech-video 的版本维护流程；保持 v1，导出新版本名。当前配音脚本会生成整集，不支持单段参数；改词时保留未受影响的片段与元数据，不盲目覆盖旧配音。生成物与本地 QA 日志位于忽略目录 `out/`、`output/playwright/`。
