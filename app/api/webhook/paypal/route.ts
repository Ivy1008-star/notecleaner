import { NextRequest, NextResponse } from 'next/server'
import { verifyPayPalSubscription, verifyPayPalWebhook } from '@/lib/paypal'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    // 保留原始 body：Webhook 验签需要对「未经改动的原始字节」做 SHA256
    const rawBody = await req.text()
    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // ---------- 分支一：前端订阅成功后的「校验」请求 ----------
    if (body?.action === 'verify-subscription') {
      const { subscriptionID, tier } = body
      if (!subscriptionID) {
        return NextResponse.json({ success: false, error: 'Missing subscriptionID' }, { status: 400 })
      }

      const v = await verifyPayPalSubscription(subscriptionID)
      if (!v.ok) {
        // 订阅不在 ACTIVE/APPROVED 状态：不放行，前端会弹失败提示
        return NextResponse.json(
          { success: false, error: 'Subscription is not active', status: v.status },
          { status: 402 }
        )
      }

      return NextResponse.json({
        success: true,
        subscriptionId: subscriptionID,
        tier: v.tier,
        message: 'Subscription verified successfully',
      })
    }

    // ---------- 分支二：PayPal 服务器推送的 Webhook 事件 ----------
    const transmissionId = req.headers.get('paypal-transmission-id') || ''
    const transmissionTime = req.headers.get('paypal-transmission-time') || ''
    const signature = req.headers.get('paypal-transmission-sig') || ''
    const certUrl = req.headers.get('paypal-cert-url') || ''
    const webhookId = process.env.PAYPAL_WEBHOOK_ID || ''

    if (!webhookId) {
      console.error('[paypal-webhook] PAYPAL_WEBHOOK_ID 未配置')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const sigOk = await verifyPayPalWebhook({
      transmissionId,
      transmissionTime,
      webhookId,
      certUrl,
      signature,
      rawBody,
    })
    if (!sigOk) {
      console.error('[paypal-webhook] 签名验证失败，拒绝事件')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const eventType = body?.event_type
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.CREATED':
        console.log('[paypal-webhook] subscription active:', body?.resource?.id)
        break
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        console.log('[paypal-webhook] subscription cancelled:', body?.resource?.id)
        break
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        console.log('[paypal-webhook] payment failed:', body?.resource?.id)
        break
      default:
        console.log('[paypal-webhook] event:', eventType)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[paypal-webhook] error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// 健康检查
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'paypal-webhook' })
}
