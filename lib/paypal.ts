// Edge / Cloudflare Workers 安全的 PayPal 校验工具。
//
// 设计约束（与 lib/auth.ts 一致）：
//   - 不能用 fs / Buffer / Node 专属 SDK，否则 Cloudflare Pages(Edge) 构建会挂。
//   - 全部基于 fetch + Web Crypto(crypto.subtle) + jose(importX509)。
import { importX509 } from 'jose'
//
// 这个模块是 PayPal "真实接上" 的核心：
//   1. getPayPalAccessToken   OAuth2 取 token（sandbox/live 跟随 PAYPAL_MODE）
//   2. verifyPayPalSubscription  查订阅状态，ACTIVE/APPROVED 才放行
//   3. verifyPayPalWebhook       Webhook 签名验签，防止伪造事件白嫖
//   4. tierFromPayPalPlan        把 PayPal Plan ID 反查回 pro/ultra 档位

const MODE = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase()
const BASE = MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

// 模块级缓存 token（Worker 同 isolate 内复用，省一次 OAuth 往返）
let _token: { token: string; exp: number } | null = null

export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_SECRET
  if (!clientId || !secret) throw new Error('PayPal credentials not configured (PAYPAL_CLIENT_ID / PAYPAL_SECRET)')

  const now = Date.now()
  if (_token && _token.exp > now + 30_000) return _token.token

  const basic = btoa(`${clientId}:${secret}`)
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`PayPal OAuth failed: ${res.status}`)
  const json: any = await res.json()
  _token = { token: json.access_token, exp: now + (json.expires_in || 3600) * 1000 }
  return json.access_token
}

export interface PayPalSubscription {
  id: string
  status: string
  planId: string
}

export async function getPayPalSubscription(subscriptionId: string): Promise<PayPalSubscription> {
  const token = await getPayPalAccessToken()
  const res = await fetch(`${BASE}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`PayPal subscription lookup failed: ${res.status}`)
  const json: any = await res.json()
  return { id: json.id, status: json.status, planId: json.plan_id }
}

export type TierId = 'free' | 'pro' | 'ultra'

export function tierFromPayPalPlan(planId: string | undefined): TierId {
  if (!planId) return 'free'
  const pro = process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID
  const ultra = process.env.NEXT_PUBLIC_PAYPAL_ULTRA_PLAN_ID
  if (ultra && planId === ultra) return 'ultra'
  if (pro && planId === pro) return 'pro'
  return 'free'
}

// 订阅是否真的有效。出错一律当无效（宁可少放，不可白嫖）。
export async function verifyPayPalSubscription(
  subscriptionId: string
): Promise<{ ok: boolean; tier: TierId; status: string }> {
  try {
    const sub = await getPayPalSubscription(subscriptionId)
    const active = sub.status === 'ACTIVE' || sub.status === 'APPROVED'
    return { ok: active, tier: active ? tierFromPayPalPlan(sub.planId) : 'free', status: sub.status }
  } catch {
    return { ok: false, tier: 'free', status: 'error' }
  }
}

// ---------- Webhook 验签 ----------
// 算法（PayPal REST webhook 官方规范）：
//   message = transmissionId + "|" + transmissionTime + "|" + webhookId + "|" + sha256(rawBody).hex
//   valid   = RSASSA-PKCS1-v1_5.verify(certPubKey, signature, message)
// cert 从 PAYPAL-CERT-URL 拉取（X.509 PEM），用 jose 的 importX509 抽出公钥。
export async function verifyPayPalWebhook(opts: {
  transmissionId: string
  transmissionTime: string
  webhookId: string
  certUrl: string
  signature: string
  rawBody: string
}): Promise<boolean> {
  try {
    const certRes = await fetch(opts.certUrl)
    if (!certRes.ok) return false
    const certPem = await certRes.text()

    // jose 的 importX509 在 Edge 运行时返回的是 CryptoKey（Node 端才是 KeyObject），
    // 这里断言为 CryptoKey 以匹配 crypto.subtle.verify 的类型要求。
    const pubKey = (await importX509(certPem, 'RS256')) as CryptoKey

    const bodyHashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(opts.rawBody))
    const bodyHashHex = Array.from(new Uint8Array(bodyHashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    const message = `${opts.transmissionId}|${opts.transmissionTime}|${opts.webhookId}|${bodyHashHex}`
    const sig = Uint8Array.from(atob(opts.signature), (c) => c.charCodeAt(0))

    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      pubKey,
      sig,
      new TextEncoder().encode(message)
    )
  } catch {
    return false
  }
}
