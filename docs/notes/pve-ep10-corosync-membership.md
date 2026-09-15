# 第十集样片：Corosync 何时真正移除失联节点？

2026-09-15。第九集完成后，选择课程地图中仍未深入展开的 B1 Corosync 通信、故障检测与成员重组（难度 9、优先级 10）。现有 quorum 动画解释了分区后的票数结果，本样片补上 `Knet 传输证据 → Totem token timeout → membership 状态机 → service sync → votequorum` 的内部因果链。

## 固定场景与边界

三节点 PVE、每节点一票、无 QDevice。每个节点配置两条位于不同物理网络的 Knet 链路；画面令 C 的全部有效 Corosync 路径失效，A 与 B 仍互通。动画中的超时和状态停留是教学节奏，不代表默认配置或某台机器的真实毫秒数；没有执行断网或实机集群实验。

样片不讲 QDevice、HA 接管、pmxcfs 写入、Knet 链路优先级算法和 Totem 消息恢复细节。`C unreachable` 是传输层证据，不直接等于成员已删除；只有 Totem 安装新的 regular membership 后，上层同步和 votequorum 才使用新成员视图。

## 30 秒分镜

| 时间 | 旁白与内部动作 |
| --- | --- |
| 0–7 秒 | Token 在 A、B、C 间轮转；节点卡片展开 `votequorum / Totem SRP / Knet` 三层。Knet 负责经过可用链路传递消息。 |
| 7–14 秒 | 到 C 的两条链路变为不可达；旧 regular membership 仍为 `{A,B,C}`，Totem 独立等待 token timeout。 |
| 14–23 秒 | 超时后依次点亮 `GATHER → COMMIT → RECOVERY → OPERATIONAL`；安装 A/B 与 C 各自看到的新成员组和新 ring ID。 |
| 23–30 秒 | regular configuration 进入 service sync；激活后 votequorum 按预期三票重算，A/B 为 `2 ≥ 2`，C 为 `1 < 2`。 |

Yunxi +8% 的四段实测配音分别为 5.544、6.600、7.296、6.624 秒，总计 26.064 秒；全部留在各自时间槽内。第二段初稿实测超时后压缩措辞，没有整体加速动画。

## 固定事实依据

- 本地 Corosync commit `5148bf07dffa61bcfa92ca2c058e7d0f0a981cf3`。`exec/totemsrp.c` 定义 `OPERATIONAL / GATHER / COMMIT / RECOVERY` 四个 membership 状态；`timer_function_orf_token_timeout()` 在 operational token 超时后检查接口并进入 gather，而不是在链路回调时直接产生最终成员组。
- 同文件 `memb_state_gather_enter()` 启动 join 与 consensus 定时器并取消旧 token 定时器；commit 保存新的 ring ID，recovery 完成后 `memb_state_operational_enter()` 安装成员并依次发布 transitional 与 regular configuration。
- `exec/totemknet.c` 读取 Knet host/link 的 reachable、enabled、connected 等传输状态，并注册 host status change 通知；这些状态是 transport 层输入。
- `exec/votequorum.c` 的同步阶段接收 member list 与 ring ID；`votequorum_sync_activate()` 调用 `recalculate_quorum()`，再把 quorate 结果通知上层。样片因此把 votequorum 放在 regular membership 与 service sync 之后。
- 本地 PVE 文档 commit `1e5d5ec701776acc2d8ab3dca996a27c7a60aee8` 的 `pvecm.adoc` 说明 PVE 默认通过集成 Kronosnet 提供 Corosync 冗余链路，并要求冗余链路位于不同物理网络；有优先级时只使用最高优先级的可用链路。因此画面中的 token 是逻辑轮转，不表示两条链路同时承载流量。
- 本地 pve-cluster commit `7091d92e594952dba65c1e57568b3d7cc244e960` 的 `src/pmxcfs/quorum.c` 接收 Corosync quorum 通知并更新 pmxcfs 状态；这是本样片片尾之后的 PVE 集成边界。

## 入口、修改与验收

- 交互版：`http://127.0.0.1:5173/?sample=corosync`。
- `npm.cmd run voice:corosync` 生成旁白和 WordBoundary 字幕；`npm.cmd run render:corosync` 输出 `out/corosync-membership-30s-v1.mp4`。
- 状态与章节在 `src/corosync-timeline.ts`，画面在 `src/CorosyncPilot.tsx`，旁白源与对齐结果为 `src/corosync-narration.json` 和 `src/corosync-audio.json`。

构建和 26 项 Node 测试通过，覆盖链路证据、token timeout、四阶段、regular delivery 与 quorum 更新的严格先后关系及反向拖动。四张源码静帧复查通过；交互版四章跳转、关键状态、反向拖动、静音和重播通过，页面错误 0。连续播放 11.77 秒，墙钟 11.50 秒，无音频倒退或重叠。

最终 MP4 为 H.264 1920×1080、30 fps、900 帧，视频轨 30.000 秒；AAC 48 kHz 双声道音频轨及容器为 30.059 秒。视频和音频完整解码通过，文件大小 2,324,132 字节，SHA256 为 `41D805B1A074D657B69B29706EF15184BA98491CCF885BC1D548C8F91E6FC03D`。MP4、渲染日志和静帧位于忽略目录 `out/`，不提交 Git。
