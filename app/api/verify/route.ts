import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { tierFromPriceId } from '@/lib/plans'

export const runtime = 'nodejs'

// 用户从 Stripe 回跳后，用 session_id 校验付款是否成功，
// 并返回真实的 subscriptionId + 档位（服务端校验，防前端伪造）。
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 })
  }

  let body: { sessionId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const sessionId = (body.sessionId || '').trim()
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id.' }, { status: 400 })
  }

  const stripe = getStripe()
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const paid = session.payment_status === 'paid' || session.status === 'complete'
    if (!paid) {
      return NextResponse.json({ tier: 'free', status: session.status })
    }

    const subId = typeof session.subscription === 'string' ? session.subscription : null
    if (!subId) {
      return NextResponse.json({ tier: 'free', status: session.status })
    }

    const sub = await stripe.subscriptions.retrieve(subId)
    const tier = tierFromPriceId(sub.items.data[0]?.price?.id)
    const active = sub.status === 'active' || sub.status === 'trialing'

    return NextResponse.json({
      tier: active ? tier : 'free',
      subscriptionId: subId,
      status: sub.status,
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Failed to verify session.' },
      { status: 500 }
    )
  }
}
