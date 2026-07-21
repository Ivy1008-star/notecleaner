import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { PLANS, TierId } from '@/lib/plans'

export const runtime = 'nodejs'

// 按档位创建 Stripe Checkout 订阅会话。
// key 只在服务端读取，返回的 url 让浏览器跳去 Stripe 付款。
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Add STRIPE_SECRET_KEY.' },
      { status: 500 }
    )
  }

  let body: { tier?: string }
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const tier = (body.tier as TierId) || 'pro'
  const plan = PLANS[tier]
  if (!plan || plan.priceMonthly === 0) {
    return NextResponse.json(
      { error: 'Invalid or free tier. Free needs no checkout.' },
      { status: 400 }
    )
  }

  const priceId = plan.priceIdEnv ? process.env[plan.priceIdEnv] : undefined
  if (!priceId) {
    return NextResponse.json(
      {
        error: `Missing Stripe price for ${plan.id}. Set ${plan.priceIdEnv} in environment variables.`,
      },
      { status: 500 }
    )
  }

  const stripe = getStripe()
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.headers.get('origin') ||
    'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/app?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/app?upgrade=cancelled`,
      allow_promotion_codes: true,
      client_reference_id: plan.id, // 记录用户选了哪个档位
      metadata: { tier: plan.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Failed to create checkout session.' },
      { status: 500 }
    )
  }
}
