# NoteCleaner MVP 需求文档

版本：v0.2
最后更新：2026-07-17
仓库路径：`D:\ObsidianVaults\codex 工作录\projects\notecleaner`
本地预览：`http://127.0.0.1:5173/`

## 1. 产品定位

一句话：把 AI 生成的文字改写成人类腔调，绕过 GPTZero、Turnitin 等检测。

目标用户：留学生、内容创作者、SEO 写手、跨境电商文案、需要交作业或投稿的 ChatGPT 用户。

核心场景：粘贴一段 AI 文本 → 选模式 + 强度 → 一键改写 → 复制 / 下载。

品牌名：NoteCleaner（种子词经 Google Trends 对比后确定，未被占用，SEO 面向 humanizer 意图）。

## 2. 关键词与 SEO 靶点

- 品牌词：`notecleaner`
- 意图词：`ai humanizer`、`humanize ai text`、`bypass gptzero`、`essay humanizer`、`chatgpt to human text`、`ai to human converter`、`undetectable ai`
- 长尾：`humanize chatgpt essay`、`make ai text undetectable`、`ai text rewriter for turnitin`
- 落地页 H1 用品牌 + 品类，副标承接 humanizer 意图。FAQ 覆盖 GPTZero / Turnitin / ZeroGPT 三个检测器名字。

## 3. 功能清单（MVP 现状）

### 3.1 输入
- 文本框粘贴
- 上传 `.txt` / `.md` / `.pdf`（pdf.js CDN 解析）
- 拖拽上传
- 长 PDF 自动切到 Report 模式

### 3.2 模式（Mode，5 选 1）
| 模式 | 用途 | 语气 |
|---|---|---|
| Notes | 笔记、随手记 | 口语、短句 |
| Essay | 学生作文、议论文 | 学术但不僵 |
| Report | 长文档 / PDF | 学术开场白 + 段落过渡 |
| Email | 商务邮件 | 简洁、正式 |
| Casual | 社媒、朋友聊天 | 松弛、缩写多 |

### 3.3 强度（Strength，5 档）
| 档位 | 门槛 | 行为 |
|---|---|---|
| Polish | Free | 只清理 AI 味 + 加缩写，不换词、不加开场白 |
| Light | Free | 轻改写 |
| Standard | Free | 标准改写 |
| Aggressive | Free | 大幅换词 + 断句 |
| Deep | Pro | 双轮改写、断句阈值 80、50% 概率注入开场白、剔除过渡水词 |

### 3.4 处理
- 长文本或 Report 模式自动分块（目标 900 字，最大 1400 字）
- 每块显示 `Chunk N/M`、in→out AI 分数徽章（AI / Mixed / Human）
- 顶部进度条 + Run 按钮文案 `Humanizing N/M...`
- 全部完成后拼接到主输出框，Copy / Download 走全文

### 3.5 输出
- 复制到剪贴板
- 下载 `.txt`
- 顶部显示改写前后的 AI 分数变化

### 3.6 Pro Gate
- Deep 档需要 Pro
- 点击弹模态框：4 个卖点 + `$9/月` CTA + `Maybe later`
- 当前 CTA 点击后写 `localStorage["nc.pro"] = "1"` 本地解锁，生产环境接 Stripe Checkout + Webhook

## 4. 技术栈

- 纯静态：HTML + CSS + Vanilla JS，无构建
- PDF 解析：pdfjs-dist@3.11.174 CDN
- 部署：Cloudflare Pages（直传或连 GitHub），发布目录 `.`
- 后端：暂无，Pro 未来接 Stripe + Cloudflare Workers 处理 webhook

## 5. 文件结构

```
projects/notecleaner/
├── index.html      # 布局 + 顶部工具栏
├── styles.css      # 主题（#2a6df4 蓝，无紫渐变，无光斑）
├── humanizer.js    # window.NoteCleaner = { scoreAI, humanize }
├── app.js          # UI 绑定 / 分块 / 上传 / Pro Gate
├── _shots/         # 验证截图
├── README.md
└── .gitignore
```

## 6. 关键代码约定（迭代时保留）

- `PRO_STRENGTHS = { deep: true }` 双重拦截：切档时拦一次，Run 前再拦一次
- `state.isPro` 从 `localStorage["nc.pro"] === "1"` 初始化
- `splitIntoChunks()` 按空行切、目标 900、硬顶 1400
- `runChunked()` 用 `setTimeout(step, 30)` 让 UI 有喘息，接 LLM 后改成 async fetch
- 分块渲染 `renderChunkShell()` 返回 `{bar, nodes}`，每个 node 有 `{wrap, body, inEl, outEl}`
- 分块跑完必须把拼接后的全文写回 `#outputEl`，否则 Copy / Download 会拿到空
- `classifyMini(sc)` 决定 AI / Mixed / Human 徽章样式

## 7. 验证记录

已用 Playwright + Edge headless 跑过：
- Deep 未解锁时点击 → Pro 弹窗出现，Maybe later 能关
- Report 模式长文 → 2 chunk，Standard 结果 `Mixed 61%`
- 解锁 Pro 后 Deep + Report 同文本 → `Human 29%`
- `.txt` 上传路径正常
- 截图存于 `projects/notecleaner/_shots/`

## 8. 路线图

### v0.2（下一步）
- [x] Pricing 页 anchor `#pricing` 补内容（Free / Pro 双卡）
- [x] Landing 头部整合 humanizer 关键词（H1 + 副标 + hero badges + meta）
- [x] FAQ 覆盖 GPTZero / Turnitin / ZeroGPT / Originality / Essay
- [x] Free 每日 1500 词本地配额 + quota chip
- [x] Output Clean / Diff 切换（词级 LCS，红删绿增）
- [x] humanizer.js 词表扩容 + 被动改主动 + 节奏短句
- [ ] 接真 Stripe Checkout，webhook 翻转账户 Pro 状态（v0.3 一起做）

### v0.3
- [ ] 服务端 LLM 逐块流式返回，替换本地规则改写
- [ ] 块级 Diff（当前 Diff 只对拼接后的全文；分块面板内也需要行内 diff）
- [ ] 账户体系（邮箱魔法链接登录）
- [ ] Stripe Checkout + Cloudflare Worker webhook，翻转账户 Pro
- [ ] 使用量计费或额度制（服务端接管 quota，替换本地 `nc.quota`）

### v0.4+
- [ ] Chrome 扩展，选中即改写
- [ ] Google Docs Add-on
- [ ] 多语言（先 EN，再 ZH / ES）

## 9. 商业模型

- Free：Polish / Light / Standard / Aggressive，每日字数上限（待定 1500 字/天）
- Pro：$9/月，Deep 档 + 无字数上限 + 优先队列 + 批量上传
- 试算 LTV：假设 3% 免费转付费、月留存 70%，单用户 LTV ≈ $30

## 10. 风险与对策

| 风险 | 对策 |
|---|---|
| 检测器升级识破 | 服务端换 LLM 改写 + 定期回归测试样本 |
| Stripe 拒付高风险类目 | 备选 Paddle、Lemon Squeezy |
| 品牌词被抢注 | 尽早注册 `.com` / `.ai` 域名 + Twitter / GitHub handle |
| 学校层面封禁 | 定位私人写作助手，规避“作弊工具”话术 |

## 11. 部署清单（待你提供密钥）

- [ ] GitHub PAT（`repo` 权限）+ 仓库名 + 公开/私有
- [ ] Cloudflare API Token（Pages Edit）+ Account ID + Pages 项目名
- [ ] 自定义域名（可选）

拿到后：建仓 → push → Cloudflare Pages 连 GitHub → 自动构建（发布目录 `.`）→ 绑域名。
