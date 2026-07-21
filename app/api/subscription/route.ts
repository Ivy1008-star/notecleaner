import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { tierFromPriceId } from '@/lib/plans'
import { saveSub } from '@/lib/subscriptions'

export const runtime = 'nodejs'

// 实时向 Stripe 查询订阅状态（Stripe 是真相来源，状态永远准确）。
// 客户端持有 subscriptionId → 这里拿它问 Stripe：还有效吗？是哪个档位？
export async function GET(req: NextRequest) {
  const subId = req.nextUrl.searchParams.get('sub')
  if (!subId) {
    return NextResponse.json({ tier: 'free', status: 'none' })
  }

  try {
    const stripe = getStripe()
    const sub = await stripe.subscriptions.retrieve(subId)
    const priceId = sub.items.data[0]?.price?.id
    const tier = tierFromPriceId(priceId)
    const active = sub.status === 'active' || sub.status === 'trialing'

    // 顺手把最新状态落一份到本地缓存（生产可换成 KV/DB）
    saveSub({
      subscriptionId: subId,
      customerId: typeof sub.customer === 'string' ? sub.customer : '',
      tier,
      status: sub.status,
      updatedAt: Date.now(),
    })

    return NextResponse.json({
      tier: active ? tier : 'free',
      status: sub.status,
      cancelAt: sub.cancel_at ? sub.cancel_at * 1000 : null,
    })
  } catch (e: any) {
    // Stripe 查不到（key 缺失 / 订阅不存在）→ 兜底回免费，不报错阻断页面
    return NextResponse.json({
      tier: 'free',
      status: 'error',
      message: e?.message || 'lookup failed',
    })
  }
}
