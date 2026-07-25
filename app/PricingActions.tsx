'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PayPalButton } from './components/PayPalButton'

// PayPal 是否就绪：配了公开 Client ID 才在付费档旁边显示 PayPal 按钮。
// NEXT_PUBLIC_* 在构建期注入，前端可读。
export const PAYPAL_ENABLED = Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID)

// 通用「选档/升级」按钮：免费档直接进工具页，付费档调 /api/checkout 跳 Stripe。
// 落地页定价区和工具页升级弹窗共用。
export function PlanButton({
  tier,
  label,
  variant = 'primary',
}: {
  tier: 'free' | 'pro' | 'ultra'
  label: string
  variant?: 'primary' | 'ghost'
}) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const router = useRouter()

  async function handleClick() {
    if (tier === 'free') {
      router.push('/app')
      return
    }
    setLoading(true)
    setErr('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (e: any) {
      setErr(e?.message || 'Could not start checkout.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={variant === 'primary' ? 'btn btn-primary' : 'btn btn-ghost'}
        style={{ width: '100%' }}
      >
        {loading ? 'Redirecting…' : label}
      </button>
      {err && (
        <p style={{ color: '#b91c1c', fontSize: '13px', marginTop: '8px', textAlign: 'center' }}>
          {err}
        </p>
      )}
    </>
  )
}

// 付费档的支付区：默认走 Stripe 卡片支付；若 PayPal 已配置，并在下方并排显示
// PayPal 订阅按钮。免费档不会用到本组件。
export function PlanPaymentButtons({
  tier,
  stripeLabel,
}: {
  tier: 'pro' | 'ultra'
  stripeLabel: string
}) {
  if (!PAYPAL_ENABLED) {
    return <PlanButton tier={tier} label={stripeLabel} />
  }
  return (
    <div className="flex flex-col gap-2">
      <PlanButton tier={tier} label={stripeLabel} />
      <div className="text-center text-xs text-slate-400">— or pay with PayPal —</div>
      <PayPalButton tier={tier} />
    </div>
  )
}
