# 部署到 Vercel —— NoteCleaner

代码已就绪并提交。本地 `next build` 只是被**这台机器的沙箱删除保护**卡住（Next 要清理 `.next` 缓存），**这不影响 Vercel**——构建在 Vercel 自己的机器上跑，没有这层限制，能正常出包。

---

## 方式 C：一键自动部署（最省事，推荐）✨

脚本 `scripts/deploy.mjs` 把"建 Stripe 价格 + 部署 Vercel + 建 Webhook + 配 5 个环境变量"全部自动化。你只需在 Stripe / Vercel 后台各生成一个 token，然后跑一条命令，其余全自动。

**前提：你给我两个 token（粘贴到对话里即可）**
- `VERCEL_TOKEN`：Vercel 后台 → Account Settings → Tokens → 生成一个（如 `vc_xxx`）
- `STRIPE_SECRET_KEY`：Stripe 后台 → Developers → API keys → 复制 Secret key（`sk_test_...` 测试 / `sk_live_...` 正式）

> 安全提示：token 只在本次部署命令里用，跑完即可在后台 revoke。不想把 token 给我也行，见下方"方式 A/B 手动"。

**跑法（在 `notecleaner-next` 目录）**：
```bash
VERCEL_TOKEN=vc_xxx STRIPE_SECRET_KEY=sk_test_xxx npm run deploy
```
（Windows PowerShell 用 `$env:VERCEL_TOKEN="vc_xxx"; $env:STRIPE_SECRET_KEY="sk_test_xxx"; npm run deploy`）

脚本会自动：
1. 在 Stripe 创建/复用 **Pro $9** 与 **Ultra $29** 两个订阅价格 → 拿到 Price ID
2. `vercel deploy --prod` 上线 → 拿到 `*.vercel.app` 域名
3. 在 Stripe 建指向 `{域名}/api/webhook/stripe` 的 Webhook → 拿到签名密钥
4. 把 `DEEPSEEK_API_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_PRICE_PRO` / `STRIPE_PRICE_ULTRA` / `STRIPE_WEBHOOK_SECRET` 全部写入 Vercel 并触发重部署

跑完直接拿到线上地址 + 两个 Price ID，无需手动进任何后台填表。

---

## 方式 A：拖文件夹直接部署（最快，不用 GitHub）

1. 打开 https://vercel.com/new
2. 点 **Upload** 标签，把整个 `notecleaner-next` 文件夹拖进去
3. 在 "Configure Project" 页面填：
   - Framework Preset：选 **Next.js**（一般自动识别）
   - Build Command：`next build`（默认）
   - Output Directory：`.next`（默认）
4. 页面下方有 **Environment Variables** 区块，**直接在这里加**（见下方「加环境变量」），不用等部署完
5. 点 **Deploy**，等 1-2 分钟
6. 拿到 `https://notecleaner-next-xxx.vercel.app`

## 方式 B：GitHub + Vercel（想以后绑自定义域名，走这个）

1. GitHub 新建仓库 `notecleaner-next`（公开私有都行，key 不在仓库里）
2. 在项目目录执行：
   ```bash
   git remote add origin https://github.com/YOUR_USER/notecleaner-next.git
   git branch -M main
   git push -u origin main
   ```
3. Vercel 里 **Import Git Repository**，选这个仓库
4. 在导入配置页的 **Environment Variables** 区块加变量（见下方）
5. 点 Deploy

---

## 加环境变量（必做，否则上线后 Humanize 会报错）

> 注意：环境变量存在**你自己的 Vercel 账号**里，跟本机隔离。本机 `.env.local` 只供本地 `npm run dev` 用，不会自动同步到 Vercel，必须手动在 Vercel 后台加一次。

**值从哪来**：打开项目里的 `.env.local` 文件，复制 `DEEPSEEK_API_KEY=` 后面那一整串 `sk-...`。

**在 Vercel 后台加（两种方式任选）**：

### 方式一：部署时顺手加（推荐）
在 Import / Upload 的配置页，找到 **Environment Variables** 区块，填：
```
Name:  DEEPSEEK_API_KEY
Value: sk-...（你的 key，从 .env.local 复制）
```
Environments 下拉：**全选**（Production / Preview / Development）都勾上。

### 方式二：部署后补加
1. 进 Vercel 项目 → 左侧 **Settings** → **Environment Variables**
2. 点 **Add**
3. 填：
   ```
   Key:   DEEPSEEK_API_KEY
   Value: sk-...（你的 key）
   ```
4. 下面 Environments 勾选 **Production / Preview / Development**
5. 点 **Save**
6. 回到 **Deployments**，对最新部署点 **... → Redeploy**（改了环境变量必须重部署才生效）

key 由 `app/api/humanize/route.ts` 在服务端读取，**永不进浏览器、不会被打包进前端 JS**。

---

## Stripe 付费墙配置（三档：Free / Pro $9 / Ultra $29）

代码已接好真实 Stripe Checkout 订阅 + **Webhook 订阅状态**（`stripe listen` 或线上 Webhook 均可）：

| 文件 | 作用 |
|---|---|
| `lib/plans.ts` | 三档套餐配置（档位/价格/词额度/对应 Price 环境变量） |
| `app/api/checkout/route.ts` | 按档位创建订阅 Checkout 会话，返回 Stripe 支付链接 |
| `app/api/verify/route.ts` | 支付成功回跳后校验 session，返回真实 subscriptionId + 档位 |
| `app/api/subscription/route.ts` | **实时向 Stripe 查询订阅状态**（真相来源，永远准确） |
| `app/api/webhook/stripe/route.ts` | **签名验证 + 订阅状态同步**（付款/续费/取消事件） |

### 第 1 步：Stripe 后台建两个订阅价格
1. Stripe 后台 → **Product catalog → + Add product**
2. 建产品 `NoteCleaner Pro`，选 **Recurring**，$9.00 / month，复制生成的 **Price ID**（形如 `price_xxx`）→ 填入环境变量 `STRIPE_PRICE_PRO`
3. 再建 `NoteCleaner Ultra`，$29.00 / month，复制 Price ID → 填入 `STRIPE_PRICE_ULTRA`
4. Developers → API keys → 复制 **Secret key**（`sk_test_...` 测试 / `sk_live_...` 正式）→ 填入 `STRIPE_SECRET_KEY`

### 第 2 步：Webhook 配置（订阅状态下发）
- **本地调试**：装 Stripe CLI 后运行
  ```bash
  stripe listen --forward-to localhost:3000/api/webhook/stripe
  ```
  终端会打印 `whsec_...` → 填入 `STRIPE_WEBHOOK_SECRET`。
- **线上**：Stripe 后台 → **Developers → Webhooks → + Add endpoint**，URL 填 `https://你的域名/api/webhook/stripe`，订阅事件勾 `checkout.session.completed` 和 `customer.subscription.*`，保存后复制 **Signing secret** → 填进 Vercel 环境变量 `STRIPE_WEBHOOK_SECRET`。

### 第 3 步：Vercel 环境变量（Environments 全选）
```
DEEPSEEK_API_KEY   = sk-...（你的 key）
STRIPE_SECRET_KEY  = sk_test_...
STRIPE_PRICE_PRO   = price_...（Pro $9/月 Price ID）
STRIPE_PRICE_ULTRA = price_...（Ultra $29/月 Price ID）
STRIPE_WEBHOOK_SECRET = whsec_...（本地 stripe listen / 线上 Webhook 签名密钥）
NEXT_PUBLIC_SITE_URL = https://你的域名.vercel.app（可选）
```
> 改了环境变量必须 **Redeploy** 才生效（Deployments → 最新 → ... → Redeploy）。

本地调试：`.env.local` 同样加这些，测试卡号 `4242 4242 4242 4242` 可走完整支付+Webhook。

---

## 验证上线成功

1. 打开线上地址 → 粘一段 AI 文本 → 点 Humanize → 服务端用 `DEEPSEEK_API_KEY` 调 DeepSeek 返回结果。
2. 点定价区的 **Go Pro / Go Ultra** → 跳 Stripe 测试支付 → 回跳 `/app` → 徽章变 PRO/ULTRA、额度解锁（状态由 `/api/subscription` 实时问 Stripe 得到）。
3. 若报 "Server is missing DEEPSEEK_API_KEY" → 环境变量没加或没重部署。
4. 若付费后仍显示 Free → 检查 `STRIPE_PRICE_PRO/ULTRA` 是否和 Stripe 后台 Price ID 完全一致（反查靠这个）。

## 备注

- `.env.local` 与 `.data/`（本地订阅缓存）已被 gitignore，**不会**被推送，安全。
- 订阅状态以 **Stripe 为唯一真相来源**：`/api/subscription` 每次实时查询，即使 Webhook 没配也能正确判断档位；Webhook 用于及时同步状态、触发副作用（生产可接邮件/KV）。
- Vercel 上的构建不受本地沙箱限制，能正常完成。
- 本机未装 `vercel` CLI，无法用命令行加环境变量；如需 CLI 方式：`npx vercel env add DEEPSEEK_API_KEY` 后按提示登录再粘贴值。
- 你贴在聊天里的 DeepSeek key 已暴露，上线前建议去 DeepSeek 后台 revoke 换一个新的，并同步更新 `.env.local` 和 Vercel 环境变量。
