# 第六集：备份与应用一致性

2026-09-14。用户确认 F3，难度 9 / 架构师优先级 9。承接第四集的持久化边界与第五集的 Guest/Host 协作，先交付 [30 秒机制样片](backup-consistency-30s.md)，之后再扩展完整课件。

## 核心问题与固定路径

**备份还没复制完，为什么可以解冻？它是否说明应用数据已经一致？**

选定正常运行的 Linux VM、一个虚拟磁盘、本地可冻结文件系统、QGA 已运行且冻结选项开启，使用 snapshot 备份模式写入 VMA 归档目标。不启用 fleecing；排除错误、Windows VSS、应用专用 hook、PBS、存储后端快照与恢复操作。QGA 成功冻结至少一个选定文件系统，thaw 也成功；不从内部清理标记推测成功。

用 X、Y 和其他块表示同一磁盘上的不同逻辑范围，非精确扇区大小或物理布局。备份保护建立时 X=v1；先示意后台复制 Y，再让 Guest 写 X=v2。因为 X 尚未备份，新写入等待旧 X=v1 复制完成后才放行。片尾运行盘 X=v2，备份中的 X=v1，仍有其他块未复制。旧块“已保护”表示本例备份复制条件满足，不额外承诺掉电持久化或恢复成功。

## 控制、数据与观察点

| 时间 | 触发 / 来源 → 目标 | 动作与状态 | 画面要避免的误解 |
| --- | --- | --- | --- |
| 0–7.5 秒 | vzdump → QGA → Guest FS | 请求同步和冻结，QGA 成功后返回响应；编排随后收到响应 | 不把 Guest CPU、整个应用或虚拟机画成停止 |
| 7.5–14.2 秒 | vzdump → QEMU；vzdump → QGA | 建立备份保护与任务，启动响应返回后尝试 thaw；FS 解冻后仍有备份复制 | 任务标识不是备份完成；thaw 不等待整份磁盘复制结束 |
| 14.2–23.2 秒 | Guest FS → QEMU 写前复制机制 → 备份目标 | X=v2 等待；先复制旧 X=v1，再放行运行盘覆盖 | 不能先把运行盘改成 v2，再拿 v2 当原时间点的备份 |
| 23.2–30 秒 | 保留三个状态 | FS 已解冻 / 备份进行中 / 应用协调未验证 | 不用“冻结成功”替代业务恢复验证，也不宣称没有 hook 就必然无法恢复 |

QEMU CBW、共享块复制机制和备份任务是职责展开，图中间节点不代表额外持久缓存或两个独立的数据副本。蓝色方块表示旧数据流，紫色表示新写请求，琥珀色表示控制命令，绿色表示响应或已满足的保护条件；各动作时间为教学编排。

## 固定源码与资料

- 本地 `qemu-server` commit `6c0127e612f6c576888a13f9bfb30874911b804d`（changelog 9.2.7），`pve-docs` commit `1e5d5ec701776acc2d8ab3dca996a27c7a60aee8`。不声称已在某台 PVE 验证相同软件组合。
- `qemu-server/src/PVE/VZDump/QemuServer.pm:1026–1053`：归档路径尝试 freeze、执行 QMP 启动命令、尝试 thaw、检查结果和任务标识，随后进入备份状态查询。PBS 路径 810–862 有类似编排，但本片不混入其格式、网络和去重实现。
- 同文件 1094–1116：`qga_fs_freeze` 即使捕获错误，也返回 1 以安排后续 thaw。动画不把 `$fs_frozen` 变量名当作已冻结的事实。
- `qemu-server/src/PVE/QemuServer/Agent.pm:309–332`：检查配置、QGA 运行及已有冻结状态；当前 `freeze-fs-on-backup` 为 `freeze-fs` 的旧别名。
- [PVE vzdump 文档固定快照](https://github.com/proxmox/pve-docs/blob/1e5d5ec701776acc2d8ab3dca996a27c7a60aee8/vzdump.adoc)：79–86 的 snapshot 模式与 QGA 协作；146–154 明确 QEMU CBW 先将仍需备份的旧数据送到目标，Guest 覆盖写需等待，fleecing 则是另一条缓存路径。
- [QEMU v10.1.0 commands-posix.c](https://github.com/qemu/qemu/blob/v10.1.0/qga/commands-posix.c#L758)：freeze-list 的 hook、挂载列表与冻结调用，错误时 thaw；本片未配置 hook。Linux 实现在 [commands-linux.c](https://github.com/qemu/qemu/blob/v10.1.0/qga/commands-linux.c#L219) 调用 FIFREEZE，thaw 路径调用 FITHAW。
- [QEMU v10.1.0 copy-before-write.c](https://github.com/qemu/qemu/blob/v10.1.0/block/copy-before-write.c#L178)：`cbw_co_pwritev` 先调用 `cbw_do_copy_before_write`，成功后才转发覆盖写；该 helper 106–151 调用共享 block_copy。只展示无错误路径，不忽略源码中的错误策略分支。
- [QEMU v10.1.0 backup.c](https://github.com/qemu/qemu/blob/v10.1.0/block/backup.c#L461)：备份任务建立 CBW 过滤器并使用共享块复制状态。上游源码用于说明内部机制，不等同于 Proxmox 扩展 QMP `backup` 命令的全部补丁；PVE 集成结论以上述本地编排及固定 PVE 文档为依据。

上游快照下载到忽略目录 `out/backup-sources/`。图工具本轮仍返回 Transport closed，使用定点源码读取；未修改本地 PVE 仓库。

```text
backup.c            9D5BAA402C1D4FD09EF666EAC23989E9348CD5CB2B035AA0C7B08C8BC2817FB0
commands-linux.c    77C94E734A3EF5C661F4A2AD4F952C82209B20026259F587168BDA7AEDC99CC0
commands-posix.c    1071892A99EF1F3348A81ABDF1FBBADC2DD0FA70853D1B86B578194D653A35EF
copy-before-write.c 9F5B970CBBCA3CE5D730E6B0D433EDB7C91C4E9513AC08B10B22B2EE2AD5A7AA
```

## 完整课件结构（7 分钟）

2026-09-14：用户认可 30 秒样片后要求继续。已实现八章完整课件、独立配音和交互入口 `?sample=backup-lesson`；沿用样片组件，正常数据流保持约 0.6–0.8 秒的消息运动，不整体慢放。

| 时间预算 | 问题 / 展示重点 |
| --- | --- |
| 0–35 秒 | 冻结、备份和应用一致性分别承诺什么 |
| 35–80 秒 | 原位展开 vzdump、QGA、Guest FS、QEMU 块层与归档目标；控制命令不是磁盘数据 |
| 80–130 秒 | QGA 的可用性、冻结范围、成功响应；冻结错误留给第七章独立对照 |
| 130–185 秒 | 备份任务启动、保护建立与 thaw；snapshot 模式不等于存储后端快照 |
| 185–250 秒 | 正常后台复制与覆盖写竞争：旧块尚未复制和已经复制两种情况 |
| 250–305 秒 | PostgreSQL 干净停库对照：完整集群同盘，停库维持到备份结束，再由操作方重启 |
| 305–365 秒 | 冻结报错 → 安排后续 thaw，不推断实际最终状态；随后逐层展开恢复验收证据 |
| 365–420 秒 | 三问检验与完整因果回放 |

### 完整课件新增事实与简化

- **已保护的 Y**：同一次备份中，后台先成功复制 Y=v1，再让运行盘覆盖 Y=v2。QEMU v10.1.0 [block-copy.c:189–210](https://github.com/qemu/qemu/blob/v10.1.0/block/block-copy.c#L189) 选择仍需复制的区域并登记进行中的请求；[task_end](https://github.com/qemu/qemu/blob/v10.1.0/block/block-copy.c#L249) 处理完成与错误重标，[后续等待](https://github.com/qemu/qemu/blob/v10.1.0/block/block-copy.c#L879) 核对冲突请求与位图。不能把“位图清零”单独画成复制成功：清零可能发生在请求完成之前。动画只展示复制已成功的区域，无并发失败，不模拟精确 cluster 大小。新增快照 SHA256：`2A461C6E4BA05014BF6AFE2F1F187B21CB1A170901E550CC2ED2ED184FC42603`。
- **应用对照**：依据 [PostgreSQL 18 文件级备份](https://www.postgresql.org/docs/18/backup-file.html)，使用完整数据库集群，数据、WAL、事务状态与所有必需文件均在同一被备份磁盘，没有外部表空间或业务系统。干净停库方案属于本课选定的保守协调方案，不是 PVE 内置 PostgreSQL hook，也不声称停库到整份备份结束是所有方案的必要条件。该文档同样支持完整一致快照后的 WAL 恢复，因此不能推断没有应用 hook 就必然损坏。
- **停库语义**：参考 [PG 18 shutdown](https://www.postgresql.org/docs/18/server-shutdown.html)。本例假定正常停库已确认完成；不把发出命令、阻止新连接或立即终止进程当作干净退出。画面中操作方负责停库和重启；QEMU 只处理备份。示意备份成功分支用于说明何时重启，不是实测结果。
- **QGA 范围**：[协议参考](https://www.qemu.org/docs/master/interop/qemu-ga-ref.html#command-guest-fsfreeze-freeze) 的冻结命令面向可冻结的本地文件系统，返回已冻结的数量；返回零不能说明全部数据受保护。实际状态也不能只凭代理在线推断。运行平台与版本限制以上述固定 QEMU 代码为准，在线文档作为解释补充。
- **错误清理**：本地 `QemuServer.pm:1094–1116` 已确认：冻结调用报错后记录错误，仍返回清理标记以安排 thaw。第七章只展示该失败分支的清理责任，未建模完整失败备份是否继续、取消、重试或成功；对 thaw 结果、Guest 最终状态保持未知。正常主线的绿色状态不会沿用到错误分支。
- **归档完成**：同文件 `333–479` 的查询循环检查任务标识和 `status`，只有 `done` 走完成分支，`error` 或意外状态报错；`1026–1080` 在启动后查询并检查归档输出子进程结果。产物检查、隔离恢复、业务校验为建议的验收层次，不是上述循环自动执行的检查，也不是本课已完成的实机实验。

### 实现与维护

- `BackupPilot.tsx` 提取 `BackupScene`，样片默认布局、状态和配音入口保留；完整课采用独立时间轴、字幕和旁白。
- `backup-lesson-timeline.ts` 的状态由帧号直接计算；正常路径、应用对照、清理对照和结尾新备份回放分别标识。
- `BackupLesson.tsx` 原位展示主线，冻结范围、应用协调、错误与验收使用局部展开面板并保留淡化拓扑参照。
- 旁白：`backup-lesson-narration.json`；实际词边界与时长：`backup-lesson-audio.json`；八段 MP3：`public/audio/quorum-backup-lesson/`。
- [完整课件制作记录](backup-consistency-7min.md) 包含导出、验证与版本信息。样片文件和提交 `5fab737` 可回退，未覆盖 30 秒 MP4。

## 已落实的专业修订

协议：区分 QGA 实际状态与 Host 收到响应的时间；任务启动后 thaw，复制继续。存储：运行盘 v2 与备份 v1 并存，旧块保护先于覆盖。教学：应用协调始终独立标注；不把无 hook 推断成应用必然损坏。动效：控制线绕过卡片正文，数据在旧块与新写的两条路径上运动。验证：逐帧不变量和倒退一致性检查，另做浏览器与实际 MP4 验收；没有真实 VM 备份或恢复实验。
