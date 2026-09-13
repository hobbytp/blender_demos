# 网络分区与 quorum：75 秒原型样片

Remotion 驱动的 PVE 图解课件。用于评审画面、节奏和因果解释；教学效果待观看反馈验证。

验收记录：[GitHub Issue #1](https://github.com/hobbytp/blender_demos/issues/1)。原型源码保存在 `prototype/quorum-pilot` 分支。

系列课程入口：第一集 [HA / fencing，7 分钟](docs/notes/ha-fencing-7min.md)（`?sample=ha-lesson`）；第二集 [热迁移，7 分钟](docs/notes/live-migration-7min.md)（`?sample=migration-lesson`）。第二集用 `npm.cmd run render:migration-lesson` 导出，原始 quorum 与各版样片继续保留。

可复用制作方法已整理为 [explain-tech-video skill](skills/explain-tech-video/SKILL.md)，涵盖机制建模、分阶段样片、内部数据流动画和成片验收。安装后可调用：`用 $explain-tech-video 制作缓存命中与回源的教学动画，先验证一段请求与响应完整流动的样片。`

第三集 pmxcfs：[7 分钟完整课件](docs/notes/pmxcfs-7min.md)（`?sample=pmxcfs-lesson`）、[完整讲稿与分镜](docs/notes/pve-ep03-pmxcfs.md)。`npm.cmd run render:pmxcfs-lesson` 导出 `out/pmxcfs-7min-v1.mp4`。原 [30 秒机制样片](docs/notes/pmxcfs-30s.md) 保留在 `?sample=pmxcfs`，支持无 quorum 对照。

当前试讲：沿用已确认的节点内部动态风格，扩展为 75 秒七段讲解。启动后访问 http://127.0.0.1:5173/?sample=lesson ，运行 `npm.cmd run render:lesson` 导出 `out/quorum-lesson-75s.mp4`。包含神经网络中文旁白、逐句字幕、成员/仲裁/写入动态和 HA 引子。见 [75 秒试讲记录](docs/notes/quorum-lesson-75s.md)。已确认的 30 秒版保留在 `?sample=flow`，以下原始命令仍用于最初样片。

新增 30 秒黑底样片：启动后访问 http://127.0.0.1:5173/?sample=dark ，包含云希中文旁白、逐句字幕和四段镜头。`npm.cmd run render:dark` 导出 `out/quorum-dark-30s.mp4`；制作方法、来源和验证命令见 [30 秒样片记录](docs/notes/quorum-dark-30s.md)。

## 播放

需要 Node.js 24 和 npm。

```powershell
npm ci
npm run dev
```

打开 http://127.0.0.1:5173/。首次打开暂停；播放、静音、拖动、重播和七个步骤跳转均可操作。步骤跳转后暂停，由观众手动继续。

## 导出与检查

```powershell
npm test
npm run build
npm run render
```

MP4 输出到 `out/quorum-pilot.mp4`：1920×1080、30 fps、75 秒，包含中文旁白与画面内字幕。首次导出会下载 Remotion 使用的 Chrome Headless Shell。

`npm run studio` 打开动画时间轴编辑器；`npm run still` 导出写入场景的静帧。

## 改稿

- `src/narration.json`：字幕、朗读文本和播放时间。英文组件名在画面显示，旁白使用中文职责名称辅助发音。
- `src/timeline.ts`：教学章节和固定三节点场景状态。状态由帧号决定，倒退和跳转可以复现。
- `src/QuorumPilot.tsx`：网页与 MP4 共用的矢量动画。
- `src/main.tsx`：网页播放器与步骤按钮。

已包含生成的 WAV 文件，运行和导出无需语音账号。改动朗读文本后，在安装 Microsoft Huihui Desktop 中文语音的 Windows 上运行 `npm run voice`。脚本检查每段音频能否完整放入时间槽；过长时会失败，避免导出截断旁白。

## 场景边界

三节点、每节点一票、无 QDevice、固定预期总票数 3，排除特殊仲裁设置。C 与 A+B 的全部有效集群通信路径中断，节点均保持开机。

20–30 秒显示检测阶段，不保证此期间写入成功。随后展示成员关系稳定的结果；状态字段按讲解顺序揭示，不代表真实回调时间或两侧同时变化。75 秒是教学时间。

配置示例比较同一 `/etc/pve/nodes/A/qemu-server/100.conf` 对象的 pmxcfs 文件层写入结果，不推断任意 GUI/API 请求的转发、锁或错误码。失去 quorum 后 pmxcfs 只读，虚拟机后续运行与恢复还涉及 HA/watchdog 等机制。

决定与资料链接见 [访谈记录](docs/notes/quorum-pilot-interview.md)，术语见 [CONTEXT.md](CONTEXT.md)。正式规格和验收任务通过本仓库 GitHub Issues 跟踪。

## 已做验证

- 自动检查三票门槛、检测过渡、少数侧写入受阻、倒退复现，以及所有旁白文件的时长。
- MP4 元数据验证：H.264、1920×1080、30 fps、2250 帧，视频轨 75 秒；AAC 音轨使容器总时长约为 75.05 秒。已抽查视频内写入结果画面。
- 实际浏览器检查播放/暂停、七步入口中的关键跳转、拖动、重播、静音、跳转后音频片段和片尾停止；390 像素宽度无横向溢出，主要面向电脑观看。
- 教学验收仍需观众看完后复述“通信中断 → 成员变化 → quorum 判断 → 配置写入限制”，或指出理解断点。
