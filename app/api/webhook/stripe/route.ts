import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// Stripe Webhook 接收端点。
// 当前 Stripe 未接入，无 STRIPE_WEBHOOK_SECRET。仍返回 200 让 Stripe 不重试，
// 待接入后恢复签名校验 + 订阅状态同步逻辑。
export async function POST(req: NextRequest) {
  return NextResponse.json({
    received: true,
    note: 'Stripe is not connected yet. Webhook events are ignored.',
  })
}
