# NoteCleaner 迭代记录

## v0.2 - 2026-07-17
- Landing SEO 重写：H1 + 副标承接 humanizer 意图，补 keywords / og / twitter meta
- 新增 Pricing 区块（`#pricing`）：Free / Pro 双卡，Pro 特色卡带 badge 与 CTA
- FAQ 补 ZeroGPT、Originality、Essay/Turnitin、cover letter 三条问答
- Pro 弹窗支持 `quota` 场景，标题/文案随触发源切换
- Free 每日 1500 词配额（本地 `nc.quota`，`localStorage` 存），run 前拦，超额弹 Pro
- 顶部 run-row 加 quota chip，低于 100 词高亮，Pro 显示金色 "unlimited"
- Output 面板加 Clean / Diff 切换，Diff 走 LCS 词级对比，红删绿增
- humanizer.js：`syn` 词表扩到 80+ 条，`fillerTransitions` 覆盖 "needless to say" 等
- 新增 `unpassivize()` 被动改主动，Aggressive/Deep 触发
- Aggressive/Deep 长句尾追加节奏短句（"That's the shape of it." 等）
- `window.NoteCleaner.diff(before, after)` 对外暴露 diff API，4000 词以内 LCS，超长回落粗粒度
- 验证：`_shots/v02_desktop_full.png`、`v02_pricing.png`、`v02_pricing_promodal.png`、`v02_faq.png`、`v02_mobile_*.png`

## v0.1 - 2026-07-17
- MVP 落地：5 模式 + 5 强度
- 上传 txt / md / pdf，拖拽支持
- Pro Gate 拦 Deep，本地 localStorage 解锁
- 长文本 / Report 自动分块，进度条 + 块级 AI 分
- Git 初始化，首个提交
- PRD、CHANGELOG 归档到 `Codex工作区/NoteCleaner/`
