import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// 回跳后校验付款。当前 Stripe 未接入，统一返回 free。
export async function POST(req: NextRequest) {
  return NextResponse.json({
    tier: 'free',
    status: 'stripe_not_connected',
    message: 'Stripe payment is not connected yet.',
  })
}
