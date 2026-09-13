# PVE 04：写入持久性完整讲解 v1

2026-09-13。用户认可 30 秒样片后，扩展为 7 分钟、11 章完整课件。依据 [第四集源码与分镜](pve-ep04-write-durability.md)，继续使用固定四层内部图、状态变化和有向消息流。

## 观看与复现

- `npm.cmd run dev` → `http://127.0.0.1:5173/?sample=durability-lesson`。
- `npm.cmd run render:durability-lesson` → `out/write-durability-7min-v1.mp4`，1920×1080、30 fps、420 秒 / 12600 帧。
- `npm.cmd run voice:durability-lesson` 生成完整课件的 11 段中文旁白，不覆盖原样片配音。
- 播放器右上角切换长短版本；`?sample=durability` 保留独立断电预设。长片内断电反例有专门旁白，下一章明确回到独立的正常供电路径，不是断电后自动恢复。
- 原 `out/write-durability-30s-v1.mp4` 保留，源码基线 `6069b76`；长片独立导出。

## 章节与观察点

| 时间 | 主题 | 内部动作与区别 |
| --- | --- | --- |
| 00:00–00:30 | 成功的含义 | 回看一个已完成的 WRITE，对比页缓存 v2 与介质 v1；下一章从头追踪 |
| 00:30–01:05 | 四层责任边界 | 依旁白聚焦 Guest 队列、VirtIO、块后端、宿主页缓存、设备缓存与介质 |
| 01:05–01:40 | 固定配置 | PVE 配置流一次性进入 QEMU，随后由 QEMU 执行块请求；不把管理服务画进每次 I/O |
| 01:40–02:25 | WRITE 去程与回程 | 请求到达后才更新对应层；宿主页缓存保存 v2 后，完成沿后端/虚拟设备返回 |
| 02:25–03:00 | 断电反例 | 历史 WRITE OK 保留，易失内容不可依赖，新值留存无保证 |
| 03:00–03:50 | FLUSH 下行 | 独立正常路径；刷新控制向下，相关脏数据先到设备，再兑现刷新至非易失存储 |
| 03:50–04:25 | 完成逐层返回 | 下层持久化后，Host → 后端 → VirtIO → Guest；上层并不立即知道 |
| 04:25–05:05 | 缓存模式 | 分别观察虚拟写缓存、绕过宿主页缓存、忽略刷新三个开关；none 不关闭设备缓存 |
| 05:05–05:40 | PREFLUSH / FUA | 独立 Linux 块层语义；此前完成写 A/B 与本次写 C 的持久化条件分别演示 |
| 05:40–06:20 | 应用与事务边界 | 应用同步时机、文件系统/日志、错误处理另需核查；不混同事务、副本与备份 |
| 06:20–07:00 | 三问验收与回放 | 问题依次揭示答案，最后重新回放正常写入与刷新因果链 |

11 段实际配音合计 341.976 秒，其余约 78 秒用于阅读状态、章节衔接与观察停顿。消息采用独立的短时流动，不将原 30 秒整体慢放。正式口语稿位于 `src/durability-lesson-narration.json`，字幕/关键事件按实际语音词边界校准；长分镜中的文字保留为编辑草案。

## 事实边界与专业修订

- 固定 VirtIO Block、显式 writeback、aio=threads、本地 raw 普通文件、设备易失缓存；不宣称是 PVE 默认配置。既有来源固定到 qemu-server commit 与 QEMU v10.1.0；本轮复核 QEMU 缓存模式说明和 Linux PREFLUSH/FUA 文档。
- 正常场景假定下层兑现同步语义，无并发新写入和 I/O 错误；动画选择后台尚未写出的一个可能窗口，实际也可以更早完成后台回写。
- WRITE 与 FLUSH 分开观察；介质已经持久化不等于 Guest 已收到结果，新增各层独立完成事件。缓存仍有副本不表示它仍是脏数据。
- 断电反例不保证干净回滚 v1、不证明原子性。后续正常路径在画面和旁白中显式重置，避免将镜头切换误当恢复过程。
- 缓存模式矩阵为独立对照：底部两个框分别判断，没有把“绕过页缓存”画成数据仍经过页缓存的箭头。
- PREFLUSH/FUA 是内核块层语义比较，不表示 VirtIO 或硬件直接使用同名命令。数据向介质流动保持蓝色；FUA 的绿色完成严格晚于 C 持久化。
- 应用层使用虚线表示尚需分析的边界，不编造未核实的数据库协议；下层保证不自动替代业务事务、副本或备份。

来源：[QEMU 缓存模式](https://www.qemu.org/docs/master/system/invocation.html)、[Linux 易失写缓存控制](https://docs.kernel.org/block/writeback_cache_control.html)，具体固定源码与引用见第四集笔记。没有进行真实 PVE I/O 或断电实验；专业视角核查不是外部专家背书。

## 源码与小改入口

- `src/DurabilityPilot.tsx`：提取共用 `DurabilityScene`，默认参数继续用于短片。
- `src/durability-timeline.ts`：共用状态函数接受时间预算与事件表，保持短片默认结果。
- `src/DurabilityLesson.tsx`：聚焦、配置、缓存模式、FUA、应用边界与判断题覆盖层。
- `src/durability-lesson-timeline.ts`：11 章、旁白事件、独立反例与回放；每帧可倒退复现。
- `src/durability-lesson-narration.json`、`src/durability-lesson-audio.json`、`public/audio/quorum-durability-lesson/`：正式口语稿、字幕时间与配音。
- `tests/durability-lesson-timeline.test.ts`：12600 帧确定性与完成顺序、反例重置、FUA 完成条件。

局部修改沿用 explain-tech-video：只改画面不重做声音，改词才更新关联配音与事件。当前脚本生成整集，没有单段增量参数；保留未受影响的声音和元数据。下一版另存 `write-durability-7min-v2.mp4`，不覆盖已交付 v1。

## 验证记录

- `npm.cmd test`：15 项通过，包含原样片与完整课件的因果/倒退检查。
- TypeScript/Vite 构建通过，无新依赖，保留已有大包提示。
- 实际浏览器：11 章跳转、关键状态与倒退、独立反例重置、模式/FUA 对照、旁白来源、静音、暂停、12599 帧停止与重播通过，页面运行错误 0。
- 原 30 秒版：四章、断电预设及无旁白、章节重置、拖动/暂停/静音/片尾/重播回归通过，页面运行错误 0。
- 浏览器已检查配置流、断电、介质完成、模式比较、FUA 回程、应用边界、问答与回放画面。
- 实际 MP4：H.264，1920×1080，30 fps，12600 帧，视频轨 420.000 秒；AAC 48 kHz，容器 420.053333 秒，29,372,241 字节。
- 完整音视频解码通过，抽取 11 个时刻；已目视检查最终视频的 160、210、285、313、320、415 秒，断电、介质完成与回程、模式/FUA 对照及片尾状态正确，文字与字幕无遮挡。
- SHA256：`2BD35B33C4247E72F81AB7066C21519A825C391E36DA7CA16EFF62160F93DA43`。
- 媒体验收脚本：`out/check-durability-lesson.ps1`；元数据：`out/durability-lesson-metadata.json`；结果：`out/durability-lesson-media-qa.log`；抽帧：`out/durability-lesson-video-*.png`。

本地证据：`out/durability-lesson-render.log`、`out/durability-lesson-browser-qa.js`、`out/durability-lesson-browser-qa.log`、`out/durability-pilot-regression.log`、`output/playwright/durability-lesson-*.png`。生成物不入 Git，源码、配音与复现命令入库。教学节奏仍需观看反馈。
