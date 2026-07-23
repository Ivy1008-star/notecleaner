import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// 创建 Stripe Checkout 会话。
// 当前 Stripe 支付尚未接入（Pages Edge 运行时不兼容 Stripe Node SDK，且无 STRIPE_SECRET_KEY）。
// 返回 503 让前端展示「即将上线」，避免前端误以为支付可用。
export async function POST(req: NextRequest) {
  let body: { tier?: string } = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  return NextResponse.json(
    {
      error: 'Stripe payment is not connected yet.',
      code: 'STRIPE_NOT_CONNECTED',
      requestedTier: body.tier || 'pro',
    },
    { status: 503 }
  )
}
