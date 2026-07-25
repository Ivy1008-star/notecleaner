# 🚀 NoteCleaner Cloudflare Pages 部署指南

本指南将引导你完成从本地开发到Cloudflare Pages正式上线的完整流程。

---

## 📋 部署前准备

### 1. 注册账号
- ✅ Cloudflare 账号: https://dash.cloudflare.com/sign-up
- ✅ DeepSeek API Key: https://platform.deepseek.com/ (用于AI模式)
- ✅ Stripe 账号 (用于支付功能): https://dashboard.stripe.com/register
- ✅ PayPal Business 账号 (可选): https://developer.paypal.com/

### 2. 购买域名（可选但推荐）
你可以在以下平台购买域名：
- Cloudflare Registrar (推荐，与Pages集成最好)
- Namecheap
- GoDaddy
- 阿里云 / 腾讯云

**推荐使用 Cloudflare Registrar**：域名免费隐私保护，自动配置DNS。

---

## 🔧 第一步：本地环境搭建

### 1.1 安装依赖
```powershell
cd E:\波哥知识库\notecleaner-next
npm install
```

如果遇到权限问题：
```powershell
# 清理后重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 1.2 配置环境变量
复制 `.env.example` 为 `.env.local`，填入你的配置：
```powershell
copy .env.example .env.local
# 然后编辑 .env.local 填入真实值
```

### 1.3 本地测试
```powershell
# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 验证：
- ✅ 首页加载正常
- ✅ 导航链接工作正常
- ✅ 进入 `/app` 工具页面
- ✅ 测试文本重写功能
- ✅ Clean/Diff视图切换

---

## ☁️ 第二步：Cloudflare Pages 部署

### 方式一：通过 GitHub 自动部署（推荐）

#### 2.1 上传代码到 GitHub
1. 创建一个新的 GitHub 私有仓库
2. 推送代码：
```powershell
git init
git add .
git commit -m "Initial commit - NoteCleaner v1.0"
git branch -M main
git remote add origin https://github.com/yourusername/notecleaner-next.git
git push -u origin main
```

#### 2.2 在 Cloudflare 中配置 Pages
1. 登录 Cloudflare Dashboard
2. 进入 **Workers & Pages** → **Create** → **Pages**
3. 点击 **Connect Git**
4. 选择你的 GitHub 账号和 `notecleaner-next` 仓库
5. 点击 **Begin Setup**

#### 2.3 构建设置
在 **Set up builds and deployments** 页面配置：

| 设置项 | 值 |
|--------|-----|
| **Project name** | notecleaner (或你喜欢的名称) |
| **Production branch** | main |
| **Framework preset** | Next.js |
| **Build command** | `npx @cloudflare/next-on-pages@1` |
| **Build output directory** | `.vercel/output/static` |

**Environment Variables (环境变量)**：
点击 **Add variable** 添加：
```
NODE_VERSION=18
NEXT_TELEMETRY_DISABLED=1
```

#### 2.4 开始部署
点击 **Save and Deploy**

等待部署完成（通常需要 3-5 分钟）

部署成功后，你会获得一个测试域名：
`https://notecleaner-xxx.pages.dev`

### 方式二：通过 Wrangler CLI 部署（手动）

```powershell
# 1. 构建
npm run pages:build

# 2. 登录 Cloudflare
npx wrangler login

# 3. 部署
npx wrangler pages deploy .vercel/output/static --project-name=notecleaner
```

---

## 🔑 第三步：配置生产环境变量

在 Cloudflare Pages Dashboard 中：
1. 进入你的项目 → **Settings** → **Environment Variables**
2. 添加以下变量（选择 **Encrypt** 加密敏感值）：

```env
# 必填
DEEPSEEK_API_KEY=sk-your_real_api_key_here
NEXTAUTH_SECRET=your_secure_random_secret_here

# Stripe 支付（可选，上线后再配置）
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# PayPal 支付（可选）
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
```

**注意**：添加环境变量后需要重新触发部署才能生效。

---

## 🌐 第四步：绑定自定义域名

### 4.1 购买域名
如果你还没有域名：
1. 进入 Cloudflare Dashboard → **Domain Registration** → **Register a new domain**
2. 搜索你想要的域名（例如：`notecleaner.ai`、`notecleaner.app`）
3. 完成购买

### 4.2 绑定到 Pages
1. 进入 Pages 项目 → **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名（例如：`notecleaner.ai`）
4. 点击 **Continue**
5. Cloudflare 会自动配置 DNS 记录

### 4.3 启用 HTTPS
Cloudflare Pages 默认提供免费的 SSL 证书：
- 进入 **SSL/TLS** → **Edge Certificates**
- 确保 **Always Use HTTPS** 已开启
- 等待证书签发（通常需要几分钟）

---

## ✅ 第五步：上线前最终检查清单

### 功能测试
- [ ] 首页所有链接正常工作
- [ ] FAQ 折叠/展开正常
- [ ] 工具页面文本输入正常
- [ ] 本地重写功能正常
- [ ] Clean/Diff 视图切换正常
- [ ] 文件上传/拖拽正常
- [ ] AI 模式 API 调用正常（需配置 DeepSeek Key）

### SEO 检查
- [ ] 页面 Title 和 Description 正确
- [ ] Open Graph 标签正常
- [ ] Twitter Card 标签正常
- [ ] robots.txt 可访问
- [ ] sitemap.xml 可访问（可选）

### 性能检查
- [ ] 页面加载时间 < 3 秒
- [ ] 无控制台错误
- [ ] Lighthouse 性能分数 > 90
- [ ] 移动端显示正常

### 支付测试（沙盒环境）
- [ ] Stripe Checkout 流程正常
- [ ] PayPal 按钮显示正常
- [ ] Webhook 回调处理正常
- [ ] 支付成功后用户配额正确更新

---

## 📱 域名购买推荐

| 域名后缀 | 价格（年） | 推荐度 | 说明 |
|---------|-----------|--------|------|
| `.ai` | ~$100 | ⭐⭐⭐⭐⭐ | AI 产品首选，辨识度高 |
| `.app` | ~$15 | ⭐⭐⭐⭐⭐ | Google 官方推荐的应用域名 |
| `.io` | ~$40 | ⭐⭐⭐⭐ | 科技产品常用 |
| `.dev` | ~$12 | ⭐⭐⭐⭐ | 开发者产品专用 |
| `.com` | ~$15 | ⭐⭐⭐⭐ | 通用，信任度高 |

**推荐组合**：
- 首选：`notecleaner.app`（性价比最高）
- 备选：`notecleaner.ai`（AI 领域最匹配）

---

## 🔄 常见部署问题

### Q1: 构建失败，提示找不到依赖
```
# 解决方案：
1. 确保 package.json 中的依赖版本正确
2. 删除 node_modules 和 package-lock.json
3. 重新运行 npm install
```

### Q2: API 路由 500 错误
```
# 解决方案：
1. 检查环境变量是否正确配置
2. 确保在 Cloudflare Pages 中添加了 DEEPSEEK_API_KEY
3. 重新触发部署
```

### Q3: 静态资源 404
```
# 解决方案：
1. 确认使用了正确的构建命令：npx @cloudflare/next-on-pages@1
2. 检查 wrangler.toml 配置
3. 确保 public 目录下的资源已正确复制
```

### Q4: 域名访问显示 "Not Secure"
```
# 解决方案：
1. 等待 SSL 证书签发（最长可能需要 24 小时）
2. 确认 Cloudflare SSL/TLS 设置为 "Full" 模式
3. 启用 "Always Use HTTPS"
```

---

## 📊 上线后推荐配置

### 1. 分析工具
- Cloudflare Analytics（免费，内置）
- Plausible Analytics（隐私友好）
- Google Analytics 4（可选）

### 2. 性能优化
- 开启 Cloudflare Auto Minify（HTML/CSS/JS）
- 启用 Brotli 压缩
- 配置缓存规则
- 开启 Rocket Loader™

### 3. 安全配置
- 开启 Web Application Firewall (WAF)
- 配置 DDoS 防护
- 设置速率限制
- 启用 Bot Management

---

## 🎉 上线清单完成！

当你完成以下步骤，网站就正式上线了：

✅ 代码推送到 GitHub  
✅ Cloudflare Pages 部署成功  
✅ 环境变量配置完成  
✅ 所有功能本地测试通过  
✅ 自定义域名绑定完成  
✅ SSL 证书签发  
✅ 生产环境最终测试  
✅ 搜索引擎提交（可选）

---

## 📞 需要帮助？

如果在部署过程中遇到问题：
1. 查看 Cloudflare Pages 构建日志
2. 检查浏览器控制台错误
3. 参考 Cloudflare Pages 官方文档：https://developers.cloudflare.com/pages/

---

**祝你上线顺利！🚀**
