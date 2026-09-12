# 节点内部动态版 · 30 秒

根据用户反馈，以最初 quorum-pilot 的内部机制展示为基础，吸收暖白插画版的配色与节点素材。重点展示组件之间的因果过程；保留此前样片供对比。

用户已确认本版效果可用，作为后续课程视觉基准；同时欢迎主动从领域专家、教学设计与动效可读性角度提出建议。此确认不代表已经展开完整课程制作。

## 观看与生成

- 预览：`http://127.0.0.1:5173/?sample=flow`
- 输出：`out/quorum-flow-30s.mp4`
- 渲染：`npm.cmd run render:flow`
- 旁白：`uv run --with edge-tts==7.2.8 python scripts/dark-narration.py flow`
- 实现：`src/QuorumFlow.tsx`；时间与状态：`src/flow-timeline.ts`。

## 分镜

| 时间 | 画面与动作 |
| --- | --- |
| 0–8 秒 | 三台服务器外壳收起；逐层展开 Corosync 的通信检测、成员视图、votequorum，再展示独立的 pmxcfs。 |
| 8–14 秒 | 到 C 的两条示意路径同时中断，消息在断点前消失；检测条推进，成员结果暂不确定。 |
| 14–19 秒 | 成员视图变成 A+B / C；成员信息沿箭头进入 votequorum；显示 2≥2 与 1<2。 |
| 19–22 秒 | true / false 状态标记传入 pmxcfs；文件系统显示可写 / 只读。 |
| 22–30 秒 | 同一 VM 100 配置的 WRITE 请求进入 A、C 的 pmxcfs，返回成功 / 拒绝；电源始终亮起。 |

蓝色带方向的消息表示网络消息或文件层写入请求；琥珀色矩形表示内部状态信息；绿色和赭色表示成功与拒绝。三节点始终保留在同一画布，时间轴可回拖。旁白按语音词边界生成字幕。

## 准确性与简化

固定三节点、每节点一票、无 QDevice、无特殊 quorum 设置。画中连线概括全部有效路径，非实际拓扑布线；不模拟 Totem token、KNET 包格式或真实超时。成员变化、仲裁和通知故意分步展示，不能用动画时间推断真实回调延迟。votequorum 放在 Corosync 内部，pmxcfs 在其外部；不表示独立仲裁服务器或每次写入重新投票。

只对照同一文件 `/etc/pve/nodes/A/qemu-server/100.conf` 的文件层写入；省略权限、API 路由、锁与配置复制细节。B 保持多数侧可写状态，不伪造一次 B 写入。未将失去 quorum 画成节点关机，也不由此推断 HA 后续行为。

依据：Corosync 的 [votequorum 手册](https://github.com/corosync/corosync/blob/main/man/votequorum.5) 说明多数票判定；Proxmox 的 [pmxcfs 文档](https://github.com/proxmox/pve-docs/blob/master/pmxcfs.adoc) 说明配置文件系统及丢失 quorum 后只读。2026-09-12 核对官方原文。

## 验证

`npm.cmd test` 的 6 项测试通过，包含倒序遍历 900 帧时的成员关系、固定门槛、检测区间、通知与写入顺序及音频时长；TypeScript/Vite 构建通过。检查通知与结果关键帧，修正通知标签遮挡。实际导出 H.264 + AAC、1920×1080、30fps、900 帧，视频 30 秒；完整音视频解码无错误。
