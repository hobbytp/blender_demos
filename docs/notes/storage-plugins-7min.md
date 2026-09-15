# 第九集：PVE 如何把存储配置变成可用磁盘？

2026-09-15：30 秒样片获认可后扩展为 7 分钟、8 章。完整课保留样片的固定拓扑和控制 / 数据双路径，新增名称边界、插件分派、NFS 分层准备、后端路径对照、配置与数据共享、独立失败以及能力查询。原样片保留；基础事实见 [第九集样片笔记](pve-ep09-storage-plugins.md)。

## 范围与事实基线

正常主线为单节点 pve1、已有 raw 镜像、NFS 可用、初始未挂载、普通 VM 启动。教学画面没有执行挂载、故障注入、真实 I/O 或 VM 启动。运行时数据段只展示一次需要访问 NFS 服务端的读取；缓存命中可以缩短实际路径。

固定源码与文档：

- [pve-storage Storage.pm](https://github.com/proxmox/pve-storage/blob/7c6a03839920d4939a8ae725a2b0ef91c0cbc6c9/src/PVE/Storage.pm)：解析 `storeid:volname` 后查找配置；`activate_storage` 先检查 disabled / nodes，再选择插件并检查连接；`activate_volumes` 按 Storage ID 汇总激活，再逐卷准备；`path` 与 `volume_has_feature` 都委托给具体插件。
- [Plugin.pm](https://github.com/proxmox/pve-storage/blob/7c6a03839920d4939a8ae725a2b0ef91c0cbc6c9/src/PVE/Storage/Plugin.pm) 与 [NFSPlugin.pm](https://github.com/proxmox/pve-storage/blob/7c6a03839920d4939a8ae725a2b0ef91c0cbc6c9/src/PVE/Storage/NFSPlugin.pm)：文件后端从存储根路径、内容子目录、VMID 和文件名得到路径；卷激活检查对象存在。NFS 插件分别执行连接检查、挂载状态检查、必要的 mount，再进入基类检查。在线不等于镜像可读。
- [LvmThinPlugin.pm](https://github.com/proxmox/pve-storage/blob/7c6a03839920d4939a8ae725a2b0ef91c0cbc6c9/src/PVE/Storage/LvmThinPlugin.pm) 与 [LVMPlugin.pm](https://github.com/proxmox/pve-storage/blob/7c6a03839920d4939a8ae725a2b0ef91c0cbc6c9/src/PVE/Storage/LVMPlugin.pm)：LVM-thin 激活逻辑卷并返回 `/dev/<vg>/<lv>` 形态的块设备路径；QEMU 后端使用 host device。
- [RBDPlugin.pm](https://github.com/proxmox/pve-storage/blob/7c6a03839920d4939a8ae725a2b0ef91c0cbc6c9/src/PVE/Storage/RBDPlugin.pm) 与 [PVE RBD 文档](https://github.com/proxmox/pve-docs/blob/1e5d5ec701776acc2d8ab3dca996a27c7a60aee8/pve-storage-rbd.adoc)：未使用 krbd 时插件提供 RBD 协议描述；使用 krbd 时先映射成本机块设备。画面省略监视器、认证与连接参数，不展示密钥。
- [qemu-server QemuServer.pm](https://github.com/proxmox/qemu-server/blob/6c0127e612f6c576888a13f9bfb30874911b804d/src/PVE/QemuServer.pm) 与 [Drive.pm](https://github.com/proxmox/qemu-server/blob/6c0127e612f6c576888a13f9bfb30874911b804d/src/PVE/QemuServer/Drive.pm)：普通启动先激活引用卷，再生成 QEMU 参数；受管理卷的路径和格式从存储层取得并校验。
- [PVE 存储管理文档](https://github.com/proxmox/pve-docs/blob/1e5d5ec701776acc2d8ab3dca996a27c7a60aee8/pvesm.adoc)：`storage.cfg` 位于分布式 `/etc/pve`；同一份本地存储配置在各节点仍可对应不同物理内容，`shared` 只说明存储已经共享，不会让本地数据自动共享。

## 八章分镜与配音

| 时间 | 机制与画面 | 旁白时长 |
| --- | --- | --- |
| 0–35 秒 | Storage ID、storage type、volume name、image format 四类身份 | 31.032 秒 |
| 35–85 秒 | 卷 ID 解析、配置查找、节点条件与进程内插件分派 | 42.480 秒 |
| 85–140 秒 | NFS 在线检查、挂载复用 / 新建、文件存在与按存储去重 | 44.448 秒 |
| 140–195 秒 | 文件路径交给 QEMU；单独展示一次 NFS 读取和数据返回 | 46.728 秒 |
| 195–250 秒 | NFS 文件、LVM-thin 块设备、RBD 用户态与 krbd 对照 | 40.848 秒 |
| 250–310 秒 | 两节点同配置的本地反例；同一 NFS export 的共享正例 | 51.864 秒 |
| 310–365 秒 | disabled 拒绝、mount 失败、镜像缺失三个独立案例 | 44.952 秒 |
| 365–420 秒 | 清空失败后回放正常链路；展开 `volume_has_feature` 输入 | 49.920 秒 |

中文旁白为 Yunxi +8%，Edge TTS 7.2.8 的 WordBoundary 对齐，总计 352.272 秒；八段均在各自时间槽内。逐跳消息保持最多 24 帧的实际运动窗口，章节停顿不整体慢放消息流。

## 教学边界与专业修订

1. 存储编号定位配置，存储类型选择插件，卷名定位后端对象，镜像格式描述数据组织；画面不让文件名代替配置与节点检查。
2. 插件承担准备与路径解析，运行时读写由 QEMU、宿主内核或后端客户端完成。NFS 主线将控制路径和一次磁盘读取保留在同一拓扑中。
3. 文件路径、块设备路径和 RBD 协议描述是独立对照。画面没有把 NFS 的目录规则推广到所有插件，也没有深入讲 Ceph 内部复制机制。
4. 本地反例与 NFS 正例分别初始化。相同 `storage.cfg` 或 `shared=1` 不复制数据；两节点访问同一后端仍要求各自满足节点权限、网络与本机准备条件。数据共享不代表允许同一 VM 并发运行。
5. 三个失败案例各自从 VM 尚未启动开始：disabled 在后端准备前拒绝，mount 失败不点亮 mounted，镜像缺失在卷级检查停止；都不会继续到 QEMU 打开镜像。结尾重新清空失败结果。
6. 快照或克隆能力按具体插件、卷与状态、操作、格式、配置和代码版本判断，不用“网络存储”一个标签给出统一结论。

## 入口与修改

- 交互课：`http://127.0.0.1:5173/?sample=storage-lesson`；原样片 `?sample=storage`。
- `npm.cmd run render:storage-lesson`：Composition `StorageLesson`，12600 帧 / 30 fps / 1920×1080，输出 `out/storage-plugins-7min-v1.mp4`。端口 3317、并发 1。
- 画面 `src/StorageLesson.tsx`，共用拓扑 `src/StoragePilot.tsx`；状态与 cue 为 `src/storage-lesson-timeline.ts`；旁白、词边界和音频分别为同名前缀 JSON 与 `public/audio/quorum-storage-lesson/`。
- 小改沿用 explain-tech-video 的局部修改流程：定位版本与秒数，只改受影响组件、cue、旁白或事实依据；保留旧 MP4，检查共享样片和时间依赖后输出新版本。

## 验收状态

构建和 25 项 Node 测试通过，覆盖 12600 帧正反向确定性、正常与回放的逐跳因果、三个独立失败状态、回放重置及配音时间槽。源码阶段渲染 18 张代表性静帧；发现并修正双节点折线路径的 SVG 默认填充。最终视频再抽取 25 张关键帧，复查四路对照、共享路径、失败案例、正常回放、能力查询和末帧均无文字裁切或异常填充。共用拓扑改造后的 30 秒样片另取 18 秒、27 秒静帧回归通过。

交互版八章跳转、正反向拖动、静音、暂停、末帧 12599 与重播通过，页面错误 0；连续播放 11.8 秒，墙钟与视频时间一致，无音频倒退或重叠。原 30 秒样片四章、因果状态、旁白、末帧和重播回归通过。

最终 MP4 为 H.264 1920×1080、30 fps、12600 帧，视频轨 420.000 秒；AAC 48 kHz 双声道音频轨及容器为 420.053 秒。音视频完整解码通过；八段成片音频与源旁白的起点偏差为 0.04266–0.04270 秒，相关系数为 0.994239–0.995540。文件大小 28,266,069 字节，SHA256 为 `40D847F344915F8ABD1BD05FCF814F418D6DC1D94B1808E90A66F8588A588456`。

首次渲染完成全部帧后，Remotion 在 C 盘临时目录合并音频时因空间不足退出，未产生 MP4；改用忽略目录 `out/remotion-temp/` 作为 `TEMP` 和 `TMP` 后从头重渲染成功。日志、静帧和 MP4 均位于忽略目录 `out/`，不提交视频到 Git；源码与状态检查不构成实机 PVE 存储验收。
