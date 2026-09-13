# 写入持久性：30 秒内部机制样片

2026-09-13。第四集 D2 的机制预览，沿用固定组件位置、内部状态和数据流动画。后续已扩展为 [7 分钟完整课件](write-durability-7min.md)，本记录保留原样片交付事实；[讲稿/分镜与源码](pve-ep04-write-durability.md)继续维护。

## 观看与复现

- MP4：`out/write-durability-30s-v1.mp4`。
- 浏览器：`npm.cmd run dev` 后访问 `http://127.0.0.1:5173/?sample=durability`。
- 默认展示 WRITE / FLUSH 完整路径，中文旁白与逐句字幕；另有 WRITE 后模拟断电预设，无旁白。
- `npm.cmd run render:durability` 导出默认路径。音频已随源码保存；需要改词时再运行 `npm.cmd run voice:durability`。

## 时间轴与语义

| 教学时间 | 动作 | 观察点 |
| --- | --- | --- |
| 0–7.6 秒 | Guest WRITE → QEMU VirtIO/块后端 → 宿主页缓存 → WRITE 完成返回 | 新值 v2 在宿主页缓存，介质示例仍为 v1；WRITE OK 不独立保证持久性 |
| 7.6–15.3 秒 | Guest FLUSH → QEMU → 文件后端同步操作 | 控制请求逐层下行，接收后才更新内部状态；FLUSH 不携带新数据 |
| 15.3–23 秒 | 脏数据到设备缓存 → 设备兑现刷新 → 介质 v2 → 结果向上返回 | 相关数据先到设备，再兑现刷新；介质持久化时 Guest 仍可等待完成结果 |
| 23–30 秒 | 回顾两种完成 | 正常路径依赖下层正确兑现语义，缓存保留副本不等于仍为脏数据 |

固定 VirtIO Block、显式 `cache=writeback`、`aio=threads`、本地 raw 普通文件及易失设备写缓存。不说明 PVE 默认配置，不外推应用 write/fsync 或整笔业务事务。选取后台回写未完成的一个可能窗口，实际可以更早写出；无并发新写入、无 I/O 错误。具体来源与固定版本见第四集笔记。

断电预设在 WRITE 返回后、FLUSH 之前模拟失去供电：历史 WRITE OK 保留，易失内容不可依赖，新值可能丢失或不完整，不宣称必然完整恢复到 v1。这是教学推演，未进行实机断电实验。

## 已做验收

- `npm.cmd test`：14 项通过。新增检查覆盖 900 帧正向/倒退确定性、WRITE/数据/FLUSH/逐层完成的先后条件、模拟断电与音频时间槽。
- `npm.cmd run build`：TypeScript 与 Vite 通过；现有大包提示保留，无新增依赖。
- 实际浏览器：四章跳转、倒退拖动、断电预设、预设无旁白、章节重置预设、静音、暂停、899 帧结束、片尾再次播放与重播通过，页面运行错误 0。
- MP4 全片音视频解码通过；抽查 19 秒“介质已持久化、Guest 仍等待”和 22.5 秒 FLUSH 完成返回画面，文字/字幕无遮挡；另检查渲染静帧 WRITE OK 与浏览器断电画面。
- 四段实际旁白 6.960、7.464、7.056、6.000 秒，共 27.480 秒，均完整放入时间槽；关键事件按实际字幕时间派生。
- H.264，1920×1080，30 fps，900 帧，视频轨 30.000 秒；AAC 48 kHz，容器 30.058667 秒；2,307,480 字节。
- SHA256：`D0DF90F81C039767202836FA7695C2A8D7429B3C0E09C5DDC9AFBA0A0CDE2650`。

本地忽略目录保留 `out/durability-render.log`、`out/durability-browser-qa.js`、`out/durability-browser-qa.log`、`out/durability-video-*.png`、`output/playwright/durability-*.png` 与来源快照。MP4 不进入 Git；源码、中文配音和复现命令入库。自动/视觉检查不代表观众教学效果已验收，也不代表真实硬件已验证。

## 小改入口

- `src/DurabilityPilot.tsx`：四层内部布局、消息轨迹和状态文案。
- `src/durability-timeline.ts`：因果事件、章节与断电预设。
- `src/durability-narration.json`、`src/durability-audio.json`、`public/audio/quorum-durability/`：文本、实际字幕时刻与四段配音。
- `src/main.tsx`：交互入口；`tests/durability-timeline.test.ts`：语义边界检查。

按 [explain-tech-video 改稿流程](../../skills/explain-tech-video/SKILL.md)保留已交付 v1。纯画面修改不重做配音；改词才更新受影响音频和派生时间轴。现有语音脚本重建本集全部四段，不具备单段增量能力；小改时保留未受影响的已验收音频/元数据。后续导出另取版本名，例如：

```powershell
npx.cmd remotion render src/remotion.tsx DurabilityPilot out/write-durability-30s-v2.mp4 --codec=h264 --concurrency=2
```
