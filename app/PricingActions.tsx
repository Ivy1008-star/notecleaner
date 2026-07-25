'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PayPalButton } from './components/PayPalButton'

// PayPal 是否就绪：配了公开 Client ID 才在付费档旁边显示 PayPal 按钮。
// NEXT_PUBLIC_* 在构建期注入，前端可读。
export const PAYPAL_ENABLED = Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID)

// 通用"选购/升级"按钮：免费档直接进工具页，付费档调 /api/checkout 走 Stripe。
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

// 付费档的支付区：
// 当前 Stripe 未接入，只显示 PayPal 按钮（若已配置）。
export function PlanPaymentButtons({
  tier,
  stripeLabel,
}: {
  tier: 'pro' | 'ultra'
  stripeLabel: string
}) {
  // Stripe 未接入，不显示 PlanButton；仅当 PayPal 已配置时才渲染支付按钮
  if (!PAYPAL_ENABLED) return null

  return (
    <div className="flex flex-col gap-2">
      <PayPalButton tier={tier} />
    </div>
  )
}
