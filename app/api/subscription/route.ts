import { NextRequest, NextResponse } from 'next/server'
import { verifyPayPalSubscription } from '@/lib/paypal'

export const runtime = 'edge'

// 订阅状态查询。
//
// 现状：Stripe 支付尚未接入本环境（Pages Edge 运行时不兼容 Stripe Node SDK，
// 且未配置 STRIPE_SECRET_KEY），所以走 Stripe 的订阅一律回 free。
//
// PayPal：若用户带着 PayPal 订阅 ID（前端存在 localStorage.nc_sub）来查，
// 这里会真的去 PayPal 拉订阅状态并反查档位，付费用户才能解锁。
// 这样即使有人篡改 localStorage 里的档位，服务端也会以 PayPal 真值为准。
export async function GET(req: NextRequest) {
  const subId = req.nextUrl.searchParams.get('sub')

  // PayPal 已配置且传入了订阅 ID → 真实验证
  if (subId && process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET) {
    const v = await verifyPayPalSubscription(subId)
    if (v.ok) {
      return NextResponse.json({ tier: v.tier, status: 'active', provider: 'paypal' })
    }
    return NextResponse.json({ tier: 'free', status: v.status || 'inactive', provider: 'paypal' })
  }

  // Stripe 未接入 / 未传入 sub → 维持原有 free 行为，保证前端不被打断
  return NextResponse.json({
    tier: 'free',
    status: subId ? 'stripe_not_connected' : 'none',
    message: 'Stripe payment is not connected yet. All users are on the free tier.',
  })
}
