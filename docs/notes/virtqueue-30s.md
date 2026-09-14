# Virtqueue：30 秒内部机制样片

2026-09-14。第五集 C3 的机制预览。[源码依据与范围](pve-ep05-virtqueue.md)已整理，现已扩展为 [7 分钟完整课件](virtqueue-7min.md)，本样片与配音继续保留。

## 观看与复现

- 视频：`out/virtqueue-30s-v1.mp4`。
- `npm.cmd run dev` → `http://127.0.0.1:5173/?sample=virtqueue`。
- `npm.cmd run render:virtqueue` 导出默认通知路径；配音已保存，复现不需要重新生成。
- `npm.cmd run voice:virtqueue` 重建四段中文旁白；仅改画面时不运行。
- 第二个预设“轮询 used（无旁白）”抑制本次完成通知，驱动主动检查 used 后回收；点击章节回到默认场景。

## 时间轴

| 教学时间 | 动作与观察点 |
| --- | --- |
| 0–7.6 秒 | 驱动填写描述符、available slot，内存屏障后发布 idx，再发送 kick；描述符只引用数据 |
| 7.6–15.3 秒 | vhost 取链、按地址访问缓冲，把发送数据提交 TAP；元数据与包数据路径分色 |
| 15.3–23 秒 | used slot → idx → 完成通知 → 驱动读取 → 回收，索引不会随回收归零 |
| 23–30 秒 | 强调通知不搬运数据、回收不证明远端收到；保留组件最终状态 |

固定 Guest Linux / VirtIO-net TX / split ring / vhost-net / TAP，单请求复制发送、无错误；排除 packed、indirect、EVENT_IDX、零拷贝和物理网络路径。队列在 Guest RAM，不是网络中传来传去的结构体。完整事实范围见第五集笔记，未做实机发包或内核跟踪。

## 验收

- 16 项测试通过，新增检查覆盖 900 帧正向/倒退、发布后才能取用、used 读取后才能回收、无中断轮询同样可完成以及远端状态始终未知。
- TypeScript/Vite 构建通过，保留已有大包提示，无新依赖。
- 实际浏览器四章、关键状态倒退、轮询无旁白、章节恢复默认、静音、暂停、899 帧片尾与重播通过，页面运行错误 0。
- 四段旁白 5.736、5.160、7.080、5.568 秒，共 23.544 秒，按实际词边界派生关键事件。
- 浏览器正常完成与轮询画面已检查，地址引用使用静态虚线，数据、队列元数据、通知和完成记录的路径分别标明。
- 最终 MP4：H.264，1920×1080，30 fps，900 帧，视频轨 30.000 秒；AAC 48 kHz，容器 30.058667 秒，2,253,323 字节。
- 完整音视频解码通过，抽取 4、10、17、20、24 秒帧；已目视检查 10、17、24 秒的数据取用、used 发布后尚未读取和回收完成状态，标签与字幕无遮挡。
- SHA256：`E201F6C518D684BD7EBF2FB51205A6D91CE7B94EE397D0A26CB3D1D2987157FB`。

## 小改入口

`src/VirtqueuePilot.tsx` 管理内部布局与路径；`src/virtqueue-timeline.ts` 管理事件与两种预设；`src/virtqueue-narration.json` 和 `src/virtqueue-audio.json` 保存文案及实际字幕时间；配音位于 `public/audio/quorum-virtqueue/`。

按 explain-tech-video 局部改稿方式保留 v1。改词才更新关联配音和时间；现有脚本会生成整集，不支持单段参数，应保留未受影响的音频/元数据。下一版使用独立输出名，例如 `out/virtqueue-30s-v2.mp4`。

本地证据位于 `out/virtqueue-render.log`、`out/virtqueue-browser-qa.js`、`out/virtqueue-browser-qa.log`、`output/playwright/virtqueue-*.png` 与 `out/virtqueue-sources/`。生成物不入 Git；源码、配音与复现命令入库。教学效果仍需观看反馈。
