# 第八集：点击启动之后，PVE 如何编排 VM 生命周期？

2026-09-15：30 秒样片获认可后扩展为 7 分钟、8 章。沿用固定拓扑、内部组件、逐跳消息和独立结果；原样片保留。完整事实基线见 [第八集源码与分镜](pve-ep08-vm-lifecycle.md)。

## 范围与新增事实

普通非 HA、非模板、无挂起恢复的冷启动。正常主线初始 VM 100 停止，权限、quorum、存储与网络条件满足。HTTP 返回 UPID 与后台执行是并行路径；图中返回先于任务完成是一个合法示例，不是所有执行的固定时序。任务查询代表任务视图/API 观察，不声称点击 Start 必然自动打开任务窗口。

补充固定源码：

- [pve-guest-common AbstractConfig.pm](https://github.com/proxmox/pve-guest-common/blob/191c23e385e5dbed1938b2d1d322196831ef9331/src/PVE/AbstractConfig.pm)：`lock_config` / `lock_config_full` 包装 `lock_file_full`、刷新配置后执行回调；`check_lock` 检查业务 lock 标记。下载的固定文件 SHA256 为 `70432CCE604F3BC7FF525C2C20028A97173394D5AA2B585C36B50D0761871494`。
- [pve-common Tools.pm](https://github.com/proxmox/pve-common/blob/f665029eac78022e81810ab2e44eace57ade13fb/src/PVE/Tools.pm)：`lock_file_full` 先尝试非阻塞 flock，再在限时内等待；作用域退出释放句柄。配合 [QemuConfig.pm](https://github.com/proxmox/qemu-server/blob/6c0127e612f6c576888a13f9bfb30874911b804d/src/PVE/QemuConfig.pm) 的本机 VM 配置锁路径，不能画成 VM 运行期间一直持锁。
- [pve-common UPID.pm](https://github.com/proxmox/pve-common/blob/f665029eac78022e81810ab2e44eace57ade13fb/src/PVE/UPID.pm)：编码 node、pid、pstart、starttime、type、id、user；日志末行解析区分 OK、ERROR、WARNINGS。任务 PID 不是 QEMU PID。

已有固定快照中的 `vm_start → lock_config → load_config / check_lock / check_running → vm_start_nolock` 继续作为主线。后者先激活引用卷、生成命令，再进入 systemd scope、运行 QEMU 并做后置处理；卷激活不是复制整个磁盘。未实际启动 VM、清锁或注入故障，示意秒数不代表真实执行和锁等待时间。

## 八章分镜与配音

| 时间 | 机制与画面 | 旁白时长 |
| --- | --- | --- |
| 0–35 秒 | HTTP、后台任务、VM 进程、应用服务：四个观察对象 | 27.024 秒 |
| 35–85 秒 | POST → pveproxy → pvedaemon，权限与 quorum；HA 为单独分支 | 45.768 秒 |
| 85–140 秒 | fork 与 UPID 响应并行；展开任务号字段 | 50.520 秒 |
| 140–195 秒 | 本机配置互斥与业务 lock；独立展示持锁、等待、获取超时 | 49.992 秒 |
| 195–255 秒 | 激活卷 → 生成参数 → scope → QEMU → 后置处理 → TASK OK | 57.192 秒 |
| 255–310 秒 | 日志结果分类；分别查询任务与 VM；应用尚未验收 | 52.368 秒 |
| 310–365 秒 | 已运行 VM 再启动、业务锁拒绝、启动前卷激活失败 | 51.624 秒 |
| 365–420 秒 | 清空失败结果，正常路径回放；按观察对象排查 | 52.056 秒 |

中文旁白为 Yunxi +8%，Edge TTS 7.2.8 的真实 WordBoundary 对齐，总计 386.544 秒，八段均在时间槽内。消息采用独立的最多 24 帧移动窗口，解释停顿与传播分开，避免把 30 秒样片整体放慢。

## 失败案例与专业修订

1. 第一项启动任务已完成，原 QEMU 仍运行。第二次普通启动在 already-running 检查抛错；不会创建第二个进程，也不由这个错误推出原进程停止。
2. 配置有 `lock: migrate`，不使用 skiplock，普通启动在资源准备前拒绝。此案例没有查询 VM 实际状态，画面保持未知。
3. 初始 VM 停止，卷激活在执行 QEMU 命令前失败；本次未启动新进程。不推广成“任何启动异常都没有 VM 进程”。

各失败案例使用独立初始状态；回放再次重置。正常主线前提显式标注“初始停止”，避免与第一种失败中的旧进程仍运行冲突。状态卡按对象区分 stopped / running / exitstatus，颜色同时配文字，任务成功不点亮应用就绪。

## 入口与修改

- 交互课：`http://127.0.0.1:5173/?sample=lifecycle-lesson`；原样片 `?sample=lifecycle`。
- `npm.cmd run render:lifecycle-lesson`：Composition `LifecycleLesson`，12600 帧 / 30 fps / 1920×1080，输出 `out/vm-lifecycle-7min-v1.mp4`。端口 3317、并发 1。
- 画面 `src/LifecycleLesson.tsx`，共用拓扑 `src/LifecyclePilot.tsx`；状态与 cue 为 `src/lifecycle-lesson-timeline.ts`；旁白、词边界和音频分别为同名前缀 JSON 与 `public/audio/quorum-lifecycle-lesson/`。
- 小改沿用 explain-tech-video 的局部修改流程：先定位秒数和受影响镜头，保留原版本，改后检查 cue、因果状态、共享样片和最终媒体。

## 验收状态

构建和 23 项 Node 测试通过；覆盖 12600 帧正反向确定性、两条正常路径因果顺序、独立失败状态、回放重置及配音时间槽。八章跳转、反向拖动、静音、暂停、末帧 12599 停止及重播通过；共用拓扑抽取后，原 30 秒样片四章、因果状态、旁白和重播回归也通过，页面错误 0。

- MP4：H.264 / 1920×1080 / 30 fps / 12600 帧，视频轨 420.000000 秒；AAC 48 kHz 音轨及容器 420.053333 秒。文件 29,277,207 字节，SHA256 `8E76488F4E592460B325556B2B260808EB2F2E007E7F39183C7E0EA9221EAF41`。
- 音视频全片解码通过，从最终 MP4 提取 21 张画面；目视检查 145、216、328、365、395 秒，包含配置锁、QEMU 启动、旧 VM 仍运行、回放初始状态和状态响应传播，无文字裁切。另渲染 13 张静帧，检查章节信息层级。
- 渲染同时运行浏览器连续播放时，曾检测一次约 0.65 秒的音频回跳、无重叠；机器 CPU 达到 100%，不能据此排除所有播放问题。导出结束后使用同一脚本复测，墙钟 11.8986 秒、视频 11.9 秒，无回跳、无重叠，没有修改播放器或放宽阈值。此结论是该采样窗口通过，不是所有负载下的保证。
- 导出旁白与八段原音频逐段 PCM 比对通过，整段相关系数 0.994108–0.995643，偏移约 0.0427 秒，在原有 0.98 / 80 ms 门限内。未检测到合成引入的重复或缺段；不把自动比对宣称为人工完整听审或发音质量验收。
- 单并发渲染正常完成；满 CPU 时只临时提高本次渲染及其编码子进程的调度优先级，没有重做已有帧或中止其他程序。八段音频在实际渲染服务预检均为 200 / audio/mpeg。

复现记录：`out/lifecycle-lesson-{build,tests,render,media-qa,audio-qa}.log`、`out/lifecycle-lesson-metadata.json`；媒体检查和音轨比对分别为 `out/check-lifecycle-lesson-media.ps1`、`out/check-lifecycle-audio.py`。连续播放检查复用 `tests/player-audio.browser.js`。

本机日志、静帧和 MP4 位于忽略目录 `out/`，不提交视频到 Git。以上源码、状态测试和媒体检查不构成实机 PVE 启动验收。
