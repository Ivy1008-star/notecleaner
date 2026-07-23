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
   - **Build command**：`npx @cloudflare/next-on-pages` （本仓库已封装为 `npm run pages:build`，两者等价）
   - **Output directory**：`.vercel/output/static` ⚠️ **必须是 `static` 子目录，不能是 `.vercel/output`**
     - 原因：next-on-pages 把静态资源和 `_worker.js` 都放进 `.vercel/output/static/`。Cloudflare 只有把输出目录指到 `static/`，才会把 `index.html`/`_next/` 提到站点根、并把 `static/_worker.js` 当成 Functions Worker 跑起来。指到 `.vercel/output`（父目录）会导致所有路由 404（`uses_functions: false`）。
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

---

## 第 6 步：启用 Google 登录（出海站标配，纯 Edge 实现）

> NoteCleaner 的 Google 登录**不依赖任何 Node 专属 SDK**：用 `jose`（Web Crypto）验 ID token、用原生 `fetch` 换 token，因此能在 Cloudflare Pages 的 Edge 运行时直接跑，不会把构建搞挂。路由：`/api/auth/google`（发起）、`/api/auth/google/callback`（回调）、`/api/auth/session`（读会话）、`/api/auth/logout`（退出）。

### A. 在 Google Cloud Console 建 OAuth 客户端
1. 打开 https://console.cloud.google.com/apis/credentials
2. 顶部确认已创建 **OAuth 同意屏幕**（User Type 选 External，填产品名即可，先留测试阶段）
3. **创建凭据 → OAuth 客户端 ID** → 应用类型选 **Web 应用**
4. 名称随便（如 `notecleaner-pages`）
5. **已获授权的重定向 URI** 加一条（部署后替换成你的真实域名）：
   ```
   https://notecleaner.<你的子域>.pages.dev/api/auth/google/callback
   ```
   > 本地调试可另加一条 `http://localhost:3000/api/auth/google/callback`
6. 创建完拿到 **客户端 ID** 和 **客户端密钥**

### B. 把变量加进 Cloudflare Pages 环境变量（第 3 步同一处）
在 Production / Preview / Development **全选** 加：

| 变量名 | 值 |
|---|---|
| `GOOGLE_CLIENT_ID` | 上面的客户端 ID（`xxx.apps.googleusercontent.com`） |
| `GOOGLE_CLIENT_SECRET` | 上面的客户端密钥（secret_text） |
| `AUTH_SECRET` | 一段 ≥32 字符的随机串，用于给会话 Cookie 签名（secret_text） |

改完变量后**重新部署**生效。

### C. 验证
- 打开站点 → 点右上角 **Sign in with Google** → 跳 Google 授权页 → 授权后跳回 `/app`，右上角显示头像+邮箱。
- 点 **Sign out** 清会话。
- 未配 `GOOGLE_CLIENT_ID` 时点登录会返回 500 提示「not configured」，属正常。

> 注意：Pages Functions 只有 Edge 运行时，没有 Node.js 运行时。所以 Stripe 这类 Node SDK 不能直接跑（本项目已将其路由暂改为 stub）；但 Google 登录全程用 `jose`+`fetch`，Edge 原生支持。
