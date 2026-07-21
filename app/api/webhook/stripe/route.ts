import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { tierFromPriceId } from '@/lib/plans'
import { saveSub } from '@/lib/subscriptions'

export const runtime = 'nodejs'

// Stripe Webhook：签名验证 + 订阅状态实时同步。
// 这是「订阅状态下发」的标准做法——Stripe 在付款成功/续费/取消时主动通知我们，
// 我们把最新状态落库（本地 .data，生产换 KV/DB）。
// 注意：真正的权限判断以 /api/subscription 实时查 Stripe 为准，webhook 用于
// 及时同步状态、触发副作用（发邮件、开权限、风控）。
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'Webhook secret not set (STRIPE_WEBHOOK_SECRET).' },
      { status: 500 }
    )
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: any
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (e: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${e?.message}` },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const subId = typeof session.subscription === 'string' ? session.subscription : null
        if (subId) {
          const stripe = getStripe()
          const sub = await stripe.subscriptions.retrieve(subId)
          const tier = tierFromPriceId(sub.items.data[0]?.price?.id)
          saveSub({
            subscriptionId: subId,
            customerId: typeof sub.customer === 'string' ? sub.customer : '',
            tier,
            status: sub.status,
            updatedAt: Date.now(),
          })
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const tier = tierFromPriceId(sub.items?.data?.[0]?.price?.id)
        saveSub({
          subscriptionId: sub.id,
          customerId: typeof sub.customer === 'string' ? sub.customer : '',
          tier,
          status: sub.status,
          updatedAt: Date.now(),
        })
        break
      }
      default:
        // 其他事件忽略，但正常返回 200 让 Stripe 不再重试
        break
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Webhook handler failed.' }, { status: 500 })
  }
}
