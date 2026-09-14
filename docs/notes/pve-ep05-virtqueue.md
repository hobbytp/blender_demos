# 第五集：VirtIO、virtqueue 与 vhost 如何协作？

2026-09-14。课程地图 C3，难度 9 / 架构师优先级 9。承接第四集的块设备边界，深入解释驱动与设备后端如何通过共享访问的内存协作。按既定制作方式先交付 [30 秒机制样片](virtqueue-30s.md)，现已扩展为 [7 分钟完整课件](virtqueue-7min.md)。

## 核心问题与固定案例

一次发送请求，什么时候可以回收 Guest 的缓冲区？通知、描述符、真实数据和完成记录分别在哪里？

选定 Linux Guest、VirtIO-net TX、split virtqueue、内核 vhost-net 与 TAP；单个正常发送请求，直接描述符链，无 packed、indirect、EVENT_IDX、零拷贝。选用 `handle_tx_copy` 的非 XDP 批量数据分支，`sock_can_batch=false`，只追踪一次成功的 `sendmsg`。used 发布可能经过批量完成辅助函数，不把辅助函数名误当必须有多个包。不是 PVE 所有部署的默认参数，也不是对某台机器的实测。

队列和缓冲位于 Guest RAM，已建立供后端访问的映射。图中把 RAM 单独展开是空间放大，不是复制出另一份队列或新增一个进程。描述符 #0 对应 VirtIO 网络头、#1 对应包数据；`addr/len/flags/next` 是元数据，链头编号是教学标签，头部与数据的实际布局可随协商与驱动实现变化。无虚拟 IOMMU 地址转换细节，无通知虚拟化的逐级 KVM/irqfd 时序。

默认通知需要发送，后端收到 kick 后检查队列；完成通知触发驱动检查 used。独立轮询预设抑制本次完成通知，由驱动主动检查 used；不是模拟中断丢失，也不把任意实际 Linux 配置都说成会这样轮询。一般实现须处理虚假通知和重新启用通知的竞争，不能从单请求动画推出生产轮询算法。

## 机制链与画面

| 触发 | 来源 → 目标 | 消息 / 记录 | 状态变化与观察点 |
| --- | --- | --- | --- |
| 准备发送 | Guest 驱动 → 描述符表 | 地址、长度、flags/next | 描述符引用预先准备的发送缓冲区，不把包塞入描述符 |
| 发布请求 | 驱动 → available | `ring[0]=0`，屏障后 `idx=1` | 内容先写、索引后发布；写了 slot 不等于已经发布 |
| 通知后端 | 驱动 → vhost 通知路径 | kick | 琥珀色通知只有提醒作用，不携带包或描述符内容 |
| 取用链 | available / descriptor → vhost | 链头及描述符地址 | 后端检查可用索引，取得链并访问对应缓冲 |
| 处理数据 | Guest 缓冲 → vhost → TAP | 发送数据 | 蓝色数据与紫色队列元数据分开；复制路径，不承诺零拷贝 |
| 发布完成 | vhost → used | `ring[0].id=0`，屏障后 `idx=1` | 本例正常 TAP 提交之后发布完成；TX used length 为 0，不表示发送了零字节 |
| 提醒检查 | 后端通知路径 → 驱动 | 完成通知 | 通知不携带 used 内容；一般不保证一个包对应一次中断 |
| 读取与回收 | used → 驱动 | 链头 id 与请求上下文 | 读取完成记录后回收描述符链和缓冲；索引保留 1，不随回收归零 |

used 的含义是设备结束对相关缓冲的使用，驱动可以按协议回收。本样片限定成功复制发送，但一般 used 本身不是远端网络确认，也不是通用成功状态字段。TAP 后的桥接、物理发送、丢包、TCP ACK 与业务收到均未演示，画面始终显示“远端收包：未证明”。

## 固定来源与静态实现核查

- 本地 `D:\github\pve-related\qemu-server` commit `6c0127e612f6c576888a13f9bfb30874911b804d`，changelog 9.2.7。`src/PVE/QemuServer.pm:1440–1476` 的 `print_netdev_full`：bridge 场景构造 TAP；native architecture、有 vhost-net 且 model=virtio 时设置 `vhost=on`。没有 bridge 的 user networking 是另一条分支，不能外推。
- [VirtIO 1.2 规范](https://docs.oasis-open.org/virtio/virtio/v1.2/virtio-v1.2.html)：2.7 split virtqueue，尤其 2.7.13 的描述符/available 写入、内存屏障、idx 发布、通知判断；2.7.7/2.7.14 的 used 通知抑制和读取。规范与实现版本分别固定。
- [Linux Virtio 文档](https://docs.kernel.org/driver-api/virtio/virtio.html)：Guest 分配的缓冲、描述符字段、virtqueue 与 callback 概念。
- Linux 上游 **v6.14** 源码快照下载至忽略目录 `out/virtqueue-sources/`；本地没有该内核源码克隆。不声称与某台 PVE 的完整补丁集、Guest 内核或二进制组合一致。

| 源文件 | 核查位置 / 结论 |
| --- | --- |
| [virtio_ring.c](https://github.com/torvalds/linux/blob/v6.14/drivers/virtio/virtio_ring.c) | 约 676–681 行：`virtio_wmb` 后发布 avail.idx；`virtqueue_kick_prepare_split` 检查是否需要通知；`virtqueue_get_buf_ctx_split` 约 811–868 行：检查 used、读屏障、取 id、detach、增加 last_used_idx。 |
| [virtio_net.c](https://github.com/torvalds/linux/blob/v6.14/drivers/net/virtio_net.c) | 约 565–569 行封装 `virtqueue_add_outbuf`；`__free_old_xmit` 从 583 行开始，通过 `virtqueue_get_buf` 回收发送上下文。Guest 的具体回收可在 NAPI/后续 TX 等路径执行，样片不把中断处理等同于立即直接释放。 |
| [vhost/net.c](https://github.com/torvalds/linux/blob/v6.14/drivers/vhost/net.c) | `handle_tx_copy` 从 741 行开始：get_tx_bufs → 选定分支 sendmsg → 记录 used head → vhost_tx_batch / vhost_net_signal_used。`handle_tx_kick` 从 1236 行进入处理。错误、XDP 批处理与 zerocopy 分支不在案例范围内。 |
| [vhost/vhost.c](https://github.com/torvalds/linux/blob/v6.14/drivers/vhost/vhost.c) | `vhost_get_vq_desc` 从 2576 行取可用链并校验；`vhost_add_used_n` 写 used 内容后通过屏障发布 idx；`vhost_signal` 检查通知条件后 signal eventfd，完成记录与通知是不同动作。 |
| [QEMU v10.1.0 vhost.c](https://github.com/qemu/qemu/blob/v10.1.0/hw/virtio/vhost.c) | vhost 设备/队列启动配置涉及内存表、vring 地址与 kick/call 通知连接。图中 QEMU 保留用户态配置职责，不因 vhost 数据面加速就画成消失或移入内核。 |

下载文件 SHA256：

```text
vhost-net.c  0CB1B2068EB82B073C19A1DEAD1231595EEFB6BEC7E5F80E553D646A5C603155
vhost.c      D3BA3A5DF11975D08CE97E755E1C85CB6AB3AD7F5A2547FEA22B98F1638A076A
virtio_net.c E237916A733A154389DE2822349623589DEA2C5AF92082357BAA356740DA3F4E
virtio_ring.c 4BBB5EAA36E193F0F7550D399EA360C4245A8FA47564504A3915CBA505A02B42
qemu-vhost.c A9C81931710CE536D8EB026E240AC8E7E8CAD49ABB7E14C4AC6EC2411BFE4DAE
```

## 完整课件结构（7 分钟，10 章）

| 时间预算 | 主题 | 要显示的机制 |
| --- | --- | --- |
| 0–30 秒 | 回收是否等于远端收到？ | 提前展示 used 与远端未知两个不同结果，建立核心问题 |
| 30–70 秒 | Guest / QEMU / KVM / vhost 的责任 | 原位展开用户态、内核与 Guest RAM；配置与数据面分开 |
| 70–115 秒 | 描述符如何引用数据 | 地址、长度、方向、next 与链头；网络头和包数据，不复制描述符里的包 |
| 115–160 秒 | available 的发布协议 | slot 内容、内存屏障、idx 与通知判断；为何不能先发布索引 |
| 160–205 秒 | 后端如何取用 | 通知唤起检查、取链、访问映射缓冲、选定复制路径提交 TAP |
| 205–250 秒 | used 与回收 | 后端结束使用、发布完成、通知、驱动读取和回收，索引与生命周期分开 |
| 250–290 秒 | 通知抑制与轮询 | 本次不发完成通知仍可读 used；独立展示重新开启通知、屏障与再检查的竞态 |
| 290–335 秒 | vhost 优化的边界 | 配置仍由 QEMU 组织，数据面位置变化；不推断全程零拷贝或消除所有切换 |
| 335–375 秒 | TX 完成到底保证什么 | Guest 缓冲可回收、TAP 提交、远端 ACK、应用收到各自边界 |
| 375–420 秒 | 三问与回放 | 发布顺序、通知是否承载数据、used 是否表示远端收到；完整链回放 |

不把 packed ring、RX、多队列、vhost-user/DPDK 或零拷贝挤进本集。它们有不同的结构/后端/完成条件，可作为后续专题；实际旁白共 376.752 秒，其余为观察停顿。

## 制作中的专业修订

- 协议：先发布索引再通知；used 后仍需读取，不能收到通知就直接宣称回收。
- 虚拟化：Guest RAM 独立展开不代表复制；QEMU 是用户态配置角色，vhost 是内核数据面，边界分别标明。
- 网络：把 TAP 提交与远端收包分开；不把 TX used.len=0 误讲为零字节发送。
- 动效：描述符到缓冲区使用静态虚线地址引用，真实数据走独立蓝色路径；通知走琥珀色线路，不把通知当作数据包。
- 验证：正常通知与主动轮询都须先读 used 才回收；教学秒数不是实测时延。没有实机发包、抓包或内核跟踪结果。

### 完整课件补充核查：通知恢复竞态

Linux v6.14 [virtio_ring.c:893](https://github.com/torvalds/linux/blob/v6.14/drivers/virtio/virtio_ring.c#L893) 的 `virtqueue_enable_cb_prepare_split` 清除 NO_INTERRUPT 标志（本例无 EVENT_IDX），保存驱动的 last_used_idx；[virtqueue_poll:2603](https://github.com/torvalds/linux/blob/v6.14/drivers/virtio/virtio_ring.c#L2603) 先执行 `virtio_mb` 再比较 used.idx；[virtqueue_enable_cb:2627](https://github.com/torvalds/linux/blob/v6.14/drivers/virtio/virtio_ring.c#L2627) 将两者串联，有待处理结果则返回 false。动画明确标为通用接口竞态示意，不把它当作 virtio-net 全部完成调度路径。
