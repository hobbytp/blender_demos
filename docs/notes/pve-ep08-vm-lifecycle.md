# 第八集：点击启动 VM 后，PVE 内部发生了什么？

2026-09-15：用户要求优先 PVE specific 内容，延后 G1 NUMA，选择 A2 管理请求与 VM 生命周期（D 7 / P 9）。本轮制作 30 秒正常路径样片，沿用已认可的固定拓扑、内部组件与因果流动；完整课及重复启动、锁冲突和失败分支待样片反馈后扩展。

## 学习目标与范围

区分启动 HTTP 请求的 UPID 响应、后台任务结果、VM 运行状态以及应用就绪证据。目标节点 pve1，VM 100 已停止、非 HA、非模板、普通冷启动；没有挂起恢复、迁移、应用 hook、启动错误或警告。用户权限和 quorum 正常，配置、存储及网络可用。直接访问目标节点，跨节点代理省略。

动画是源码与文档驱动的机制示意，未实际发起 PVE API 请求或启动 VM。秒数是教学节奏，不代表服务延迟。启动参数只画准备步骤，不执行命令。

## 固定事实来源

| 仓库 | 本地提交 |
| --- | --- |
| pve-manager | `614bede5d65599c67e068cbf18d49717ea8ab33b` |
| qemu-server | `6c0127e612f6c576888a13f9bfb30874911b804d` |
| pve-common | `f665029eac78022e81810ab2e44eace57ade13fb` |
| pve-docs | `1e5d5ec701776acc2d8ab3dca996a27c7a60aee8` |

源代码只读自 `D:\github\pve-related`；这些是内容快照，不宣称已验证对应软件包组合或某台 PVE 主机。先用知识图谱定位，覆盖检查发现 metadata_changed 和 QemuServer.pm 的局部解析缺口；随后定点读实际源文件，不以图谱漏边证明不存在调用。

| 画面结论 | 直接依据与边界 |
| --- | --- |
| Start 按钮发送 POST；VM 状态另行读取 | [Config.js](https://github.com/proxmox/pve-manager/blob/614bede5d65599c67e068cbf18d49717ea8ab33b/www/manager6/qemu/Config.js)：`vm_command('start')`、`/status/start`；ObjectStore 读取 `/status/current`。任务查询表示任务详情/API 客户端的观察行为，不承诺该 Start handler 自动打开任务窗口。 |
| 入口与特权服务分离 | [pveproxy](https://github.com/proxmox/pve-docs/blob/1e5d5ec701776acc2d8ab3dca996a27c7a60aee8/pveproxy.adoc) 为 HTTPS 8006 / www-data，特权请求转本机 pvedaemon；[pvedaemon](https://github.com/proxmox/pve-docs/blob/1e5d5ec701776acc2d8ab3dca996a27c7a60aee8/pvedaemon.adoc) 为 root / 127.0.0.1:85。线上官方 master 同步复核这两项；具体画面以固定快照为准。 |
| 启动 API 创建 qmstart 任务并返回 UPID | [API2/Qemu.pm](https://github.com/proxmox/qemu-server/blob/6c0127e612f6c576888a13f9bfb30874911b804d/src/PVE/API2/Qemu.pm)：`vm_start` 声明 protected、proxyto node、VM.PowerMgmt；检查 quorum，正常分支 `fork_worker('qmstart',...)`。HA 分支是 `hastart → ha-manager set`，不混入本样片。 |
| HTTP 返回不等待整个后台启动过程 | [RESTEnvironment.pm](https://github.com/proxmox/pve-common/blob/f665029eac78022e81810ab2e44eace57ade13fb/src/PVE/RESTEnvironment.pm#L520)：fork 子进程、父子初始化握手、登记任务；HTTP 模式不同于同步 CLI。父进程返回 UPID，子进程执行回调。两者并行，动画选择 UPID 先于任务结束到达的合法顺序；不能推广为所有运行中的硬时序。 |
| 配置锁保护启动编排 | [QemuServer.pm](https://github.com/proxmox/qemu-server/blob/6c0127e612f6c576888a13f9bfb30874911b804d/src/PVE/QemuServer.pm#L5502)：`vm_start → lock_config → load_config / check_lock / check_running → vm_start_nolock`。区分互斥锁和配置内的业务 lock 标记；不把锁画成整个 VM 生命周期都持有。 |
| 资源准备后启动 QEMU | 同文件 `vm_start_nolock`：激活卷、`config_to_command`，进入 systemd scope 后运行 QEMU 命令，继续完成后置处理。本片合并这些内部阶段；不是调用 GUI 启动按钮直接生成 VM，也不是等待 Guest 应用就绪后才返回。 |
| TASK OK、任务 stopped、VM running 是不同对象 | RESTEnvironment 子任务正常返回且无警告时写 TASK OK；[Tasks.pm](https://github.com/proxmox/pve-manager/blob/614bede5d65599c67e068cbf18d49717ea8ab33b/PVE/API2/Tasks.pm#L454) 按任务进程与启动时间判断 running/stopped，停止后读取 exitstatus。VM 的 `/status/current` 调用 `vmstatus`，其中 status 依据 VM 进程存在性；不能据此推出 Guest OS 或业务就绪。 |

图中两个状态 API 是同一服务提供的不同查询视图，不是新增守护进程。客户端查询均经 pveproxy/pvedaemon；下方箭头折叠转发细节并显式标注。QEMU 指向状态视图表示读取依据，不是主动推送状态。UPID 卡片是结构缩写，不是可使用的完整 UPID 字符串。

## 30 秒分镜

| 时间 | 旁白重点 | 内部动作与观察 |
| --- | --- | --- |
| 0–7.5 | 点击启动，请求到代理，再交本机特权服务 | POST 进入 pveproxy，再传到 pvedaemon；权限/前置检查通过 |
| 7.5–15 | 创建后台任务并返回任务号；不等于启动成功 | pvedaemon 派生 qmstart 子进程；UPID 经代理回客户端，任务与响应分支并行 |
| 15–22.5 | 锁、状态检查、资源准备与启动 | 展开后台进程内部；配置锁持有、检查通过、卷与启动参数准备；控制消息到达后点亮 QEMU 进程 |
| 22.5–30 | 分别查询任务与 VM，应用仍需验证 | 任务结果进入状态视图，任务锁已释放；两次 GET 分别得到任务结束/OK 与 VM running；应用未验收 |

用真实 TTS 词边界驱动 cue，四段时长 5.376、5.904、5.856、6.144 秒，合计 23.280 秒；余量用于阅读和动作观察。原始词边界、文案与音频分别保存在 `lifecycle-audio.json`、`lifecycle-narration.json`、`public/audio/quorum-lifecycle/`。

## 专业审查与扩展

- 领域：普通启动和 HA 启动分支分开；配置互斥与业务锁不混同；任务状态和 VM 状态不共用“成功”灯。
- 并发：fork/UPID 和任务执行并行，样片的停顿不是后台被浏览器阻塞；后续完整课可加入“任务号已返回，锁却获取失败”的对照。
- 教学：保持 PVE 组件名称可见；旁白用“代理入口/特权服务”降低 30 秒内英文缩写密度。完整课补 UPID 字段、任务日志和权限判定位置。
- 视觉：请求、任务号、启动控制与结果颜色分工，同时配方向与文字；VM 状态读取路径绕开锁说明文字。
- 验证：不把 build、状态测试、媒体解码或自动音频检测当作实机启动验收。产品交互与视频输出分别检查。

## 入口与制作状态

- 交互版：`http://127.0.0.1:5173/?sample=lifecycle`。
- Composition：`LifecyclePilot`，900 帧 / 30 fps / 1920×1080。
- 导出：`npm.cmd run render:lifecycle` → `out/vm-lifecycle-30s-v1.mp4`，独立端口 3317，并发 1。
- 修改入口：`src/LifecyclePilot.tsx`（画面）、`src/lifecycle-timeline.ts`（状态/cue）、上述旁白文件。保留现有播放器 inputProps 稳定修复。
- 构建通过，22 项 Node 测试通过。新测试覆盖 900 帧正反向确定性、逐跳因果、UPID/任务/观察结果分离、锁释放与配音时间槽。
- 连续网页播放采样：墙钟 11.6022 秒，视频 11.6 秒；无音频倒退或重叠。
- 四章跳转、关键状态前后拖动、旁白、静音、暂停、末帧 899 停止与重播通过，页面错误 0；上一集恢复样片的同类交互回归通过。
- 完整成片已完成：H.264 / 1920×1080 / 30 fps / 900 帧，视频轨 30.000000 秒；AAC 48 kHz 音轨及容器 30.058667 秒。文件 2,276,714 字节，SHA256 `75ADF5EE0FB5921B90E00C96A81DDC7C0783B97E2D38F67C36825654884D2388`。
- 音视频全片解码通过；从 MP4 提取 14 个时刻画面，目视复核 11.5、17.5、27 秒的 UPID、锁检查与最终状态；没有文字裁切，状态读取路径已绕开说明文字。没有执行真实 VM 启动，也未将机器检查宣称为人工完整听审。
- 本机验收记录位于忽略目录 `out/`：`lifecycle-build.log`、`lifecycle-tests.log`、`lifecycle-render.log`、`lifecycle-browser-qa.js`、`lifecycle-media-qa.log` 和 `lifecycle-metadata.json`；MP4 不提交 Git。
