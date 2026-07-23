import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// 订阅状态查询。
// 注意：Stripe 支付尚未接入本环境（Pages Edge 运行时不兼容 Stripe Node SDK，
// 且当前未配置 STRIPE_SECRET_KEY）。此处统一返回 free，保证前端不会被报错打断。
// 等接入 Stripe（建议升级到 Next 15 + Node.js 运行时后），再恢复向 Stripe 实时查询的逻辑。
export async function GET(req: NextRequest) {
  const subId = req.nextUrl.searchParams.get('sub')
  return NextResponse.json({
    tier: 'free',
    status: subId ? 'stripe_not_connected' : 'none',
    message: 'Stripe payment is not connected yet. All users are on the free tier.',
  })
}
