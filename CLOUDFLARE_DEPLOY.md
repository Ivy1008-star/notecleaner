# 部署到 Cloudflare Pages —— NoteCleaner（原生 GitHub 集成）

代码已按 Cloudflare Pages 改造好：`@cloudflare/next-on-pages` 适配 + `wrangler.toml` + `pages:build` 脚本已就绪。下面是在 Cloudflare 控制台完成「原生 GitHub 集成（push 自动部署）」的精确步骤。

> 前置：你已在 GitHub 上有 `Ivy1008-star/notecleaner` 仓库（已推送）。本机用的默认分支是 `master`（不是 `main`），下面生产分支要选 `master`。

---

## 第 1 步：在 Cloudflare 授权 GitHub（只需做一次，浏览器里点）

1. 登录 https://dash.cloudflare.com （用你要部署的账号）
2. 左侧菜单 → **Workers 和 Pages**
3. 点 **创建** → 选 **Pages** 标签页
4. 点 **连接到 Git**（Connect to Git）
5. 首次会弹授权页 → 点 **Connect GitHub**（或 Authorize Cloudflare）→ 跳 GitHub OAuth
6. 登录 `Ivy1008-star`，授权 Cloudflare 访问仓库。**建议选 "All repositories"**（或至少勾上 `notecleaner`），否则以后换仓库要重授权
7. 授权完自动跳回 Cloudflare，出现你的仓库列表

> 这一步必须你本人操作——OAuth 要登录你自己的 GitHub/Cloudflare，我没法代点。做完告诉我，或继续下面步骤。

## 第 2 步：选仓库并填构建设置

1. 在仓库列表里搜 / 选 **`Ivy1008-star/notecleaner`** → 继续
2. 构建设置（Cloudflare 选 **Next.js** 预设会自动填，确认一下）：
   - **Framework preset**：`Next.js`
   - **Build command**：`npx @cloudflare/next-on-pages`
   - **Output directory**：`.vercel/output` （next-on-pages 产物，勿手改）
   - **Production branch**：`master`
3. **Node 版本**（重要）：构建环境默认 Node 可能偏低，Next 14.2 需要 `>=18.17`。在构建设置里的 **Environment variables（构建时）** 加：
   - `NODE_VERSION` = `20`

## 第 3 步：加运行时环境变量（密钥，必做）

在「环境变量」区块（**Production / Preview / Development 全选**）加下面这些，值从本机 `.env.local` 复制：

| 变量名 | 值来源 |
|---|---|
| `DEEPSEEK_API_KEY` | `.env.local` 里的 `sk-...` |
| `STRIPE_SECRET_KEY` | Stripe 后台 Secret key（`sk_test_` / `sk_live_`） |
| `STRIPE_PRICE_PRO` | Pro $9 的 Price ID（`price_xxx`） |
| `STRIPE_PRICE_ULTRA` | Ultra $29 的 Price ID |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook 签名密钥（`whsec_...`） |
| `NEXT_PUBLIC_SITE_URL` | 部署后拿到的 `https://<sub>.pages.dev`（可后补） |

> 注意：Cloudflare Pages 的环境变量和 Vercel 的是两套，互不相通。这里要单独加一次。改完变量必须 **重新部署** 才生效。

## 第 4 步：保存并部署

1. 点 **保存并部署**（Save and Deploy）
2. 等 1-2 分钟，拿到 `https://notecleaner.<你的子域>.pages.dev`（子域在创建时可自定义）
3. 之后每次 `git push origin master` 自动触发重新部署

## 第 5 步：配 Stripe Webhook（付费墙生效）

1. 拿到 `*.pages.dev` 域名后，去 Stripe 后台 → Developers → Webhooks → + Add endpoint
2. URL 填 `https://<你的域名>.pages.dev/api/webhook/stripe`
3. 订阅事件：`checkout.session.completed` + `customer.subscription.*`
4. 复制 Signing secret → 回填到 Cloudflare 的环境变量 `STRIPE_WEBHOOK_SECRET` → 重新部署
5. 把 `NEXT_PUBLIC_SITE_URL` 也设为 `https://<你的域名>.pages.dev` → 重新部署

---

## 本地手动部署（可选，不用 GitHub）

若以后想不依赖 GitHub、本机直接推：

```bash
# 需要 CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID 两个环境变量（从 Cloudflare 后台拿）
export CLOUDFLARE_API_TOKEN=xxx
export CLOUDFLARE_ACCOUNT_ID=xxx
npm run pages:build      # 等价于 npx @cloudflare/next-on-pages，产物到 .vercel/output
npm run deploy:cf        # wrangler pages deploy
```

> Token 在 Cloudflare → My Profile → API Tokens → Create Token，模板选 **Cloudflare Pages → Edit**；Account ID 在右侧账号首页或 `wrangler whoami` 查看。Token 只存在本机环境变量，**别写进仓库**。

---

## 排错

- 构建报 "Cannot find module @cloudflare/next-on-pages" → 确认已 `npm install` 且 `package.json` 含该依赖（本仓库已加）。
- 构建报 Node 版本过低 → 第 2 步的 `NODE_VERSION=20` 没加。
- 线上 Humanize 报错 "missing DEEPSEEK_API_KEY" → 环境变量没加或没重新部署。
- API 路由（/api/*）报错 → 确认 `wrangler.toml` 有 `compatibility_flags = ["nodejs_compat"]`（本仓库已加）。
- 付费后仍 Free → 检查 `STRIPE_PRICE_PRO/ULTRA` 与 Stripe 后台 Price ID 完全一致。
