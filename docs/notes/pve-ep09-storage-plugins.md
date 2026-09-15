# 第九集：PVE 如何把存储配置变成可用磁盘？

2026-09-15：承接第八集的卷激活步骤，按用户优先 PVE specific 的方向推进 D1 存储插件与卷（难度 8 / 优先级 10）。本轮先交付 30 秒样片，完整课待样片反馈后展开；延后 G1 NUMA 的决定保持不变。

## 核心问题与场景

从 VM 配置中的卷引用，跟到存储配置、插件分派、本机挂载、镜像路径与实际读取。区分管理进程中的编排代码、QEMU 进程、宿主内核和远端 NFS 服务。插件不是磁盘数据转发守护进程，共享 storage.cfg 不会复制或共享本地磁盘数据。

固定 pve1、VM 100、已有 raw 镜像、普通启动无错误；NFS 服务可用，示例开始时本机尚未挂载该 export，随后正常挂载。真实环境可能已被其他操作或状态检查挂载，不能把每次启动画成必然重新挂载。无快照、克隆、自定义 content-dirs 或额外映射。

```text
scsi0: nas:100/vm-100-disk-0.raw

nfs: nas
    server nas.example
    export /vmstore
    path /mnt/pve/nas
    content images
```

以上为教学示例，不是要执行的配置。后端文件已存在，默认路径解析为 `/mnt/pve/nas/images/100/vm-100-disk-0.raw`。读路径只示意一次需要访问服务端的数据读取，省略 Guest 请求来源、缓存命中、RPC 拆分、重试和具体内核函数；不声称每次读都访问网络，也不讨论写入持久性。没有执行 mount、修改 PVE 配置、启动 VM 或发起真实 I/O。

## 固定源码与证据

| 来源 | 快照与结论 |
| --- | --- |
| pve-storage | [Storage.pm](https://github.com/proxmox/pve-storage/blob/7c6a03839920d4939a8ae725a2b0ef91c0cbc6c9/src/PVE/Storage.pm)：`config` 读 storage.cfg；`parse_volume_id` 拆分存储 ID 与卷名；`activate_volumes` 先去重激活存储，再按类型 `lookup` 插件、调用 `activate_volume`；`path` 再按类型分派到插件。 |
| NFSPlugin | [NFSPlugin.pm](https://github.com/proxmox/pve-storage/blob/7c6a03839920d4939a8ae725a2b0ef91c0cbc6c9/src/PVE/Storage/NFSPlugin.pm)：继承 Plugin，`activate_storage` 读取挂载表；未挂载时调用 mount，随后调用基类；`check_connection` 是独立在线检查，不能把它当作镜像读取成功。 |
| Plugin 基类 | [Plugin.pm](https://github.com/proxmox/pve-storage/blob/7c6a03839920d4939a8ae725a2b0ef91c0cbc6c9/src/PVE/Storage/Plugin.pm)：`activate_volume` 调用 `filesystem_path` 并检查文件存在；`path` / `filesystem_path` 按内容目录、VMID 和镜像名构造本机路径。画面把它们合并在同一插件区，未声称全部由 NFSPlugin 重写。 |
| qemu-server | 本地提交 `6c0127e612f6c576888a13f9bfb30874911b804d`。[QemuServer.pm](https://github.com/proxmox/qemu-server/blob/6c0127e612f6c576888a13f9bfb30874911b804d/src/PVE/QemuServer.pm#L5664) 的 `vm_start_nolock` 先激活卷再生成命令；[Drive.pm](https://github.com/proxmox/qemu-server/blob/6c0127e612f6c576888a13f9bfb30874911b804d/src/PVE/QemuServer/Drive.pm#L113) 的 `get_path_and_format` 使用 `PVE::Storage::path` 和存储层报告的格式。画面合并命令生成、QEMU 启动及打开文件，不复刻某个 machine version 的完整参数。 |
| pve-docs | 本地提交 `1e5d5ec701776acc2d8ab3dca996a27c7a60aee8`。[pvesm.adoc](https://github.com/proxmox/pve-docs/blob/1e5d5ec701776acc2d8ab3dca996a27c7a60aee8/pvesm.adoc) 说明 storage.cfg 集群分发、卷 ID、shared 标记不能让本地数据自动共享；[NFS 文档](https://github.com/proxmox/pve-docs/blob/1e5d5ec701776acc2d8ab3dca996a27c7a60aee8/pve-storage-nfs.adoc) 说明自动挂载与本机挂载点。 |

本地未发现 pve-storage clone，故只下载官方只读镜像的上述三个固定提交文件到忽略目录 `out/storage-*.pm`，未修改 `D:\github\pve-related`。图谱用于定位 QEMU 函数；QemuServer.pm 标记 metadata_changed 和局部解析缺口，随后定点读取本地实际源码。官方 current 存储网页本次抓取返回 403，结论采用固定文档源码，不宣称核查了新的发行包组合。

## 四段因果分镜

| 时间 | 旁白 | 内部动作与结果 |
| --- | --- | --- |
| 0–7.5 秒 | 卷引用定位配置，再按类型选择插件 | VM 配置 → PVE::Storage → storage.cfg → NFSPlugin；卷名保持可见 |
| 7.5–15 秒 | 确认挂载，检查文件存在 | 插件 → 宿主内核 → NFS export；挂载返回后才能点亮本机路径；插件区再显示文件检查通过 |
| 15–22.5 秒 | 本机路径交给 QEMU 打开 | 解析路径 → 命令/启动步骤折叠 → QEMU 文件块后端打开；尚无本次数据读取结果 |
| 22.5–30 秒 | 数据经宿主文件系统与存储网络 | QEMU → 宿主 NFS 客户端 → 服务器文件；数据反向返回，标明只证明本次读完成 |

紫色为配置引用，金色为资源准备，蓝/绿为读请求和数据返回，辅以文字和方向。数据阶段降低上方编排区域的强调程度，拓扑位置保持不变。旁白 Yunxi +8%，真实 WordBoundary 对齐；四段 5.592、6.240、6.432、6.984 秒，总计 25.248 秒。

## 专业审查与后续完整课

- PVE 集成：存储 ID 不是路径，storage type 不是镜像格式，插件也不是独立服务。图中分别标注 nas、nfs 和 raw。
- 系统与存储：挂载成功、文件存在、QEMU 打开和本次读取完成分层呈现；这些都不是写入持久化或业务就绪保证。
- 教学与动效：不把六种后端能力表塞进 30 秒。完整课再比较文件路径、块设备和协议地址，展开 Directory / NFS、LVM-thin、ZFS、RBD 的能力来源以及配置共享与数据共享的对照。
- 故障设计：后续分别增加 storage disabled/nodes 限制、连接或挂载失败、卷不存在；每个案例使用独立初态，不沿用正常路径的绿色结果。

## 入口与验收

交互入口 `http://127.0.0.1:5173/?sample=storage`。Composition `StoragePilot`，900 帧 / 30 fps / 1920×1080；`npm.cmd run render:storage` 输出 `out/storage-plugins-30s-v1.mp4`，并发 1、端口 3317。画面、状态、配音分别为 `src/StoragePilot.tsx`、`src/storage-timeline.ts`、`src/storage-{narration,audio}.json` 与 `public/audio/quorum-storage/`。

交付时开发服务重启后页面请求超时，原因尚未定位；同一端口改为已构建版本的 `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5173`，HTTP 200 且完整交互复测通过。此预览服务读取 dist，修改源码后需先运行 `npm.cmd run build`；不把预览可用宣称为开发服务故障已修复。

构建和 24 项测试通过，新增检查覆盖资源准备先于读取、逐跳因果顺序、900 帧正反向确定性、结果边界和旁白时间槽。

- 浏览器四章跳转、关键状态正反向拖动、旁白、静音、暂停、末帧 899 停止及重播通过，页面错误 0。连续播放采样墙钟 11.9639 秒 / 视频 12.0667 秒，无音频倒退或重叠。
- MP4 为 H.264 / 1920×1080 / 30 fps / 900 帧，视频轨 30.000000 秒，AAC 48 kHz 音轨及容器 30.058667 秒；2,352,250 字节，SHA256 `9425DACA76725F480F59C17A9D4506E0486792D612FE86BB7508DA7AD2371D9C`。
- 全片音视频解码通过，抽取 14 个时刻；目视复核成片 13、18、27 秒，检查挂载状态、长文件路径和最终数据返回。静帧检查发现一条返回线穿过路径文字，已绕开，并补充读取中/数据已发回的中间状态。
- 首次静帧浏览器启动超时，关闭额外浏览器后重试通过；成片单并发导出完成。机器繁忙时仅临时提高本次渲染进程优先级。未执行真实 PVE 挂载、启动或 I/O，也未将机器检查宣称为人工完整听审。

日志 `out/storage-{build,tests,render,media-qa}.log`、元数据 `out/storage-metadata.json`；交互检查 `out/storage-browser-qa.js`，连续播放复用 `tests/player-audio.browser.js`，媒体检查 `out/check-storage-media.ps1`。日志、抽帧、下载源码和 MP4 均在忽略目录 out，视频不提交 Git。
