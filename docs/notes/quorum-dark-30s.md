# 30 秒黑底样片

目标：针对上一版“效果一般”的反馈，验证 anything2explainer 的镜头语言、字号和神经网络配音能否改善观看体验。仅制作一段完整因果链，教学效果仍待用户观看反馈。

## 制作方法与来源

采用 [anything2explainer](https://github.com/Vincentwei1021/anything2explainer) 的单镜头主体、字幕节拍、持续动作、黑底白线条与紫色强调规范。参考版本：`5544f599522cc0f7bab6d0dfe823905059641172`。风格致敬该项目及其注明的 @图灵宇宙，画面全部为本项目原创 SVG，没有使用参考视频或示例帧。

这是现有 Remotion 工程内的适配，没有整体复制其模板、多代理编排或安装为全局 skill。沿用已有播放器和经过测试的三节点状态模型。该项目为 PolyForm Noncommercial 许可；本次只取用视觉与制作规范，以及独立 OFL 授权的 Noto Sans SC / Orbitron 字体，字体许可随文件保存在 `public/fonts/LICENSE.md`。

30 秒、中文、黑底方案由用户确认。云希男声沿用前一轮建议，`edge-tts==7.2.8`、`zh-CN-YunxiNeural`、`+8%`，逐段生成，采用 WordBoundary 对齐短句字幕。旁白编辑至自然语速能放入片长，不截断音频。生成后的 MP3 和时间轴随工程保存，观看与导出不需要连接 TTS 服务。

## 旁白与分镜

| 时间 | 旁白 | 主体与持续动作 |
|---|---|---|
| 0–7 秒 | 机器还开着，集群通信却断了。经过检测，成员视图改变。 | 三台带开机灯的立体机箱；通信消息沿连线流动，断开后在边界前淡出；旋转检测标记与缓慢推镜。 |
| 7–14 秒 | A、B只看见彼此；C只看见自己。每个节点，一票。 | 成员分组框包围 A+B 与 C，视觉重点移向 C；连线持续流动，一票标记按旁白出现。 |
| 14–22 秒 | 预期总票数仍是三，门槛仍是两票。两票达到仲裁，一票不够。 | 大数字 3 切换为固定门槛 2，两侧逐步呈现 2 与 1；推进镜头与比较标记，数值不做误导性滚动。 |
| 22–30 秒 | 所以，同一份配置，多数侧可以写入；C侧的集群文件系统，转为只读。 | VM 100 配置文档向两侧移动；多数侧接受并显示新内容，少数侧文档被只读屏障挡住；结尾保留 VM 运行状态提示。 |

所有章节共享一个固定案例；淡入淡出衔接，字幕与顶栏不随镜头缩放。没有 glitch 闪烁。画面以 1280×720 坐标绘制，导出 1920×1080、30 fps、900 帧。

## 事实与比喻边界

- 固定三个节点，每节点一票，预期总票数为 3，仲裁门槛为 2；无 QDevice，不启用特殊仲裁设置。依据 [votequorum(5)](https://github.com/corosync/corosync/blob/main/man/votequorum.5)。A、B、C 是示例节点名。
- 全部有效 Corosync 通信路径断开，单条冗余链路故障不能直接等同本场景。依据 [Proxmox Corosync redundancy](https://github.com/proxmox/pve-docs/blob/master/pvecm.adoc#corosync-redundancy)。移动光点仅为消息流示意，不表示真实报文格式、数量或周期。
- 先检测和成员重组，随后展示 A+B / C 的稳定视图；约 1.67–7 秒是教学过渡，不保证这段时间写入成功，也不表示真实超时或两侧同时完成。沿用 `src/timeline.ts` 的已验证状态，经 `darkStateAt()` 映射到新时间轴。
- pmxcfs 丢失 quorum 后变为只读。依据 [pmxcfs](https://github.com/proxmox/pve-docs/blob/master/pmxcfs.adoc)。文档飞行、屏障和挂锁是文件层允许/拒绝写入的比喻，不是 ACL、安全认证或每次写入触发一次投票。
- VM 100 为示例编号，比较同一 `/etc/pve/nodes/A/qemu-server/100.conf` 的描述修改，图示不代表完整 GUI/API 请求路径。多数侧可写不保证任意操作都成功。
- 配置只读不等于 VM 立即停止；后续状态涉及 HA/watchdog 等条件。依据 [Proxmox HA](https://github.com/proxmox/pve-docs/blob/master/ha-manager.adoc)。

## 复现与验收

```powershell
npm.cmd run dev
# http://127.0.0.1:5173/?sample=dark
npm.cmd test
npm.cmd run build
npm.cmd run render:dark
uv run --with numpy python scripts/check-dark-video.py
```

重新生成旁白：`npm.cmd run voice:dark`，需要 uv 和联网；修改文本后应重新校准镜头动作的节拍。脚本使用本项目 Remotion 附带的 Windows ffprobe/ffmpeg。

输出：`out/quorum-dark-30s.mp4`。原 75 秒版本仍通过主页及原导出命令访问。验收与反馈继续记录到 [Issue #1](https://github.com/hobbytp/blender_demos/issues/1)。

### 本次验证结果

- `npm.cmd test`：4 项通过，包含原版与新版的状态、仲裁边界、倒退复现和音频时间槽检查。
- `npm.cmd run build`：通过；保留现有打包体积提示。
- 成片：H.264，1920×1080，30 fps，900 帧，视频轨精确 30 秒，AAC 音轨。视频和音频都完成全轨解码。
- 按技能的灰度差阈值 0.35、10 Hz 采样检查最终编码画面，排除顶栏与字幕：四段低变化比例分别为 0%、0%、38.0%、17.7%，最长分别为 0、0、0.4、0.3 秒，均通过 ≤40% / ≤1 秒门槛。这是本项目 Windows 适配检查，未冒称运行了上游完整 QC 工具链；指标不能代替观看评价。
- 实际浏览器：字体已载入，初始暂停；播放/暂停、章节跳转、拖动、静音、重播与片尾停止通过；仲裁章节播放的是 `03.mp3`；390 像素宽度无横向溢出，原版仍显示 75 秒。
- 抽查通信检测、成员关系、一票标记、固定总票数、两侧仲裁结果与只读屏障画面，字幕未遮住核心内容。
- 待用户验收：新版的画面、旁白语速、镜头节奏，以及因果链是否更容易理解。
