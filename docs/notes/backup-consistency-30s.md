# 备份与应用一致性：30 秒机制样片 v1

2026-09-14。第六集 F3 已获用户确认。本片展示冻结、建立备份保护、解冻和写前复制，[固定案例、源码与长片候选结构](pve-ep06-backup-consistency.md)。

## 观看与复现

- 视频：`out/backup-consistency-30s-v1.mp4`。
- `npm.cmd run dev` → `http://127.0.0.1:5173/?sample=backup`。
- `npm.cmd run render:backup` 导出样片；已保存四段配音，无需再次调用 TTS。
- `npm.cmd run voice:backup` 重建旁白；只改画面时不要运行。
- 本次沿用单并发、120 秒等待超时；TEMP/TMP 在本次渲染进程中指向 `out/backup-render-temp`，不更改系统设置。

## 已完成检查

- TypeScript/Vite 构建和 18 项测试通过。新增 900 帧正向/倒退检查：保护先于启动，启动响应先于 thaw，新写到来时已解冻，旧数据复制成功先于覆盖；片尾不宣称备份完成或应用一致性。
- 四段配音实测 4.560、4.752、4.536、5.280 秒，共 19.128 秒；其余为观察窗口。字幕与关键事件取自实际词边界。
- 浏览器四章跳转、关键状态、倒退、旁白、静音、暂停、899 帧停止与重播通过，页面运行错误 0。
- 已目视检查冻结、写入等待及 v1/v2 对照；修正穿过文字的控制线，保证路径端点位于组件边界。
- MP4 已导出并完整解码通过：H.264、1920×1080、30 fps、900 帧，视频 30.000 秒；AAC 48 kHz，容器 30.058667 秒，2,319,346 字节。抽取 4、8.2、11、15、16.8、19、27 秒七帧，目视复核控制响应、旧块复制与 v1/v2 对照；启动响应到达前明确显示“等待启动响应”。
- SHA256：`77FE9E4C327C466D87BA7995CCC49211E2CF131640F272203245C81B919E5193`。媒体检查记录位于 `out/backup-media-qa.log`，交互检查记录位于 `out/backup-browser-qa.log`。

片尾备份目标仅收到了示意块 X、Y，其他块仍待复制；应用专用协调没有配置，恢复没有验证。本例无错误、无 fleecing，不讨论应用或硬件故障结果。

## 小改入口

`src/BackupPilot.tsx`：布局、卡片状态和消息路径；`src/backup-timeline.ts`：四章事件及共享状态模型；`src/backup-narration.json`、`src/backup-audio.json` 与 `public/audio/quorum-backup/`：配音与字幕。

按 explain-tech-video 局部修改流程保留 v1，新版另取文件名。现有 TTS 脚本按整集生成，改词时保留未受影响的配音及元数据。生成物和本地 QA 位于忽略目录 `out/`、`output/playwright/`，源码和配音入 Git。
