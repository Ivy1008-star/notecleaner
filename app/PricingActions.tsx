'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
