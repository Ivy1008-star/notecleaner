// NoteCleaner 一键部署脚本
// 用途：用 Vercel CLI + Stripe API 全自动完成部署 + 价格创建 + Webhook + 5 个环境变量配置
//
// 需要你提供的凭证（通过环境变量传入，不要写死在文件里）：
//   VERCEL_TOKEN        Vercel 后台 Account → Tokens 生成的 token
//   STRIPE_SECRET_KEY   Stripe 后台 Developers → API keys 的 secret key（sk_test_ 或 sk_live_）
//   DEEPSEEK_API_KEY    可选；不传则自动从项目根目录 .env.local 读取
//
// 运行方式（在项目根目录）：
//   VERCEL_TOKEN=xxx STRIPE_SECRET_KEY=sk_test_xxx node scripts/deploy.mjs
//
// 脚本会：
//   1. 在 Stripe 创建（或复用）Pro $9 / Ultra $29 两个订阅价格，拿到 Price ID
//   2. 用 Vercel CLI 部署到生产环境，拿到线上域名
//   3. 在 Stripe 创建指向 {域名}/api/webhook/stripe 的 Webhook，拿到签名密钥
//   4. 把 5 个环境变量（DEEPSEEK_API_KEY / STRIPE_SECRET_KEY / STRIPE_PRICE_PRO /
//      STRIPE_PRICE_ULTRA / STRIPE_WEBHOOK_SECRET）全部写入 Vercel 并触发重部署

import { spawnSync } from 'node:child_process'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
let DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY

if (!VERCEL_TOKEN || !STRIPE_KEY) {
  console.error('❌ 缺少凭证。请设置 VERCEL_TOKEN 和 STRIPE_SECRET_KEY 后再运行。')
  process.exit(1)
}

// 自动从 .env.local 读取 DeepSeek key（如果没通过环境变量传入）
if (!DEEPSEEK_KEY) {
  const envPath = resolve(ROOT, '.env.local')
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8')
    const m = content.match(/DEEPSEEK_API_KEY\s*=\s*(\S+)/)
    if (m) DEEPSEEK_KEY = m[1].trim()
  }
}
if (!DEEPSEEK_KEY) {
  console.error('❌ 缺少 DEEPSEEK_API_KEY（既没传环境变量，.env.local 也没找到）。')
  process.exit(1)
}

const PROJECT_NAME = 'notecleaner'

// ---------- 工具函数 ----------
function sh(cmd, opts = {}) {
  console.log('\n$ ' + cmd)
  const r = spawnSync('bash', ['-c', cmd], { stdio: 'inherit', ...opts })
  if (r.status !== 0) throw new Error('命令失败（exit ' + r.status + '）：' + cmd)
}

// 把值写入临时文件，再用 stdin 喂给 `vercel env add`，避免 shell 展开特殊字符
function setVercelEnv(name, value) {
  const tmp = resolve(ROOT, `.tmp_env_${name}`)
  writeFileSync(tmp, value, 'utf8')
  try {
    sh(`npx --yes vercel@latest env add ${name} production preview development --token="${VERCEL_TOKEN}" --yes < "${tmp}"`)
  } finally {
    try { unlinkSync(tmp) } catch {}
  }
}
import { unlinkSync } from 'node:fs'

// ---------- 1. Stripe 价格（幂等：已存在则复用）----------
const { default: Stripe } = await import('stripe')
const stripe = new Stripe(STRIPE_KEY)

async function getOrCreatePrice(name, desc, unitAmount) {
  const products = await stripe.products.list({ active: true, limit: 100 })
  let product = products.data.find((p) => p.name === name)
  if (!product) {
    product = await stripe.products.create({ name, description: desc, active: true })
    console.log('  ✓ 创建产品', name, product.id)
  }
  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 })
  let price = prices.data.find(
    (p) => p.unit_amount === unitAmount && p.currency === 'usd' && p.recurring?.interval === 'month'
  )
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: unitAmount,
      currency: 'usd',
      recurring: { interval: 'month' },
      nickname: name,
    })
    console.log('  ✓ 创建价格', name, price.id)
  } else {
    console.log('  ✓ 复用已有价格', name, price.id)
  }
  return price.id
}

console.log('\n=== 1/4 创建 Stripe 价格 ===')
const PRICE_PRO = await getOrCreatePrice('NoteCleaner Pro', '50,000 words/month, priority', 900)
const PRICE_ULTRA = await getOrCreatePrice('NoteCleaner Ultra', '500,000 words/month, API, team', 2900)
console.log('  PRICE_PRO    =', PRICE_PRO)
console.log('  PRICE_ULTRA  =', PRICE_ULTRA)

// ---------- 2. Vercel 部署 ----------
console.log('\n=== 2/4 部署到 Vercel ===')
sh(`npx --yes vercel@latest link --yes --token="${VERCEL_TOKEN}" --project ${PROJECT_NAME}`)
console.log('  写入环境变量...')
setVercelEnv('DEEPSEEK_API_KEY', DEEPSEEK_KEY)
setVercelEnv('STRIPE_SECRET_KEY', STRIPE_KEY)
setVercelEnv('STRIPE_PRICE_PRO', PRICE_PRO)
setVercelEnv('STRIPE_PRICE_ULTRA', PRICE_ULTRA)
const deployOut = spawnSync('bash', ['-c', `npx --yes vercel@latest deploy --prod --token="${VERCEL_TOKEN}" --yes`], {
  encoding: 'utf8',
}).stdout
console.log(deployOut)
const urlMatch = deployOut.match(/https:\/\/[a-z0-9-]+\.vercel\.app/)
const siteUrl = urlMatch ? urlMatch[0] : `https://${PROJECT_NAME}.vercel.app`
console.log('  线上地址:', siteUrl)

// ---------- 3. Stripe Webhook ----------
console.log('\n=== 3/4 创建 Stripe Webhook ===')
const endpoint = await stripe.webhookEndpoints.create({
  url: `${siteUrl}/api/webhook/stripe`,
  enabled_events: [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
  ],
})
console.log('  ✓ Webhook 已创建:', endpoint.url)
console.log('  WEBHOOK_SECRET =', endpoint.secret)

// ---------- 4. 写入 Webhook 密钥并重部署 ----------
console.log('\n=== 4/4 写入 Webhook 密钥并重部署 ===')
setVercelEnv('STRIPE_WEBHOOK_SECRET', endpoint.secret)
sh(`npx --yes vercel@latest deploy --prod --token="${VERCEL_TOKEN}" --yes`)

console.log('\n✅ 部署完成！')
console.log('   站点:', siteUrl)
console.log('   Pro 价格:', PRICE_PRO)
console.log('   Ultra 价格:', PRICE_ULTRA)
console.log('   5 个环境变量已全部写入 Vercel。')
console.log('   去站点 /app 点 Humanize 验证，并用测试卡 4242 4242 4242 4242 测升级流程。')
