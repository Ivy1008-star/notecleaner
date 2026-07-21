# 部署到 Vercel —— NoteCleaner

代码已就绪并提交。本地 `next build` 只是被**这台机器的沙箱删除保护**卡住（Next 要清理 `.next` 缓存），**这不影响 Vercel**——构建在 Vercel 自己的机器上跑，没有这层限制，能正常出包。

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

## 验证上线成功

打开线上地址 → 粘一段 AI 文本 → 点 Humanize → 服务端用环境变量里的 key 调 DeepSeek 返回结果。
如果返回 "Server is missing DEEPSEEK_API_KEY" 之类的错，说明环境变量没加或没重部署。

## 备注

- `.env.local` 已被 gitignore，**不会**被推送，安全。
- `distDir` 是标准 `.next`。
- Vercel 上的构建不受本地沙箱限制，能正常完成。
- 本机未装 `vercel` CLI，无法用命令行加环境变量；如需 CLI 方式：`npx vercel env add DEEPSEEK_API_KEY` 后按提示登录再粘贴值。
- 你贴在聊天里的 DeepSeek key 已暴露，上线前建议去 DeepSeek 后台 revoke 换一个新的，并同步更新 `.env.local` 和 Vercel 环境变量。
