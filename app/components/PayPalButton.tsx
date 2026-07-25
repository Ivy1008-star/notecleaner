'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    paypal: any
  }
}

interface PayPalButtonProps {
  tier: 'pro' | 'ultra'
  className?: string
}

export function PayPalButton({ tier, className }: PayPalButtonProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // 检查PayPal SDK是否已加载
    if (window.paypal) {
      setIsLoaded(true)
      return
    }

    // 动态加载PayPal SDK
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb'
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`
    script.async = true
    script.onload = () => setIsLoaded(true)
    document.body.appendChild(script)

    return () => {
      // 清理：不移除script，因为可能被其他组件复用
    }
  }, [])

  useEffect(() => {
    if (isLoaded && window.paypal) {
      // 渲染PayPal按钮
      const container = document.getElementById(`paypal-button-${tier}`)
      if (container && !container.hasChildNodes()) {
        window.paypal.Buttons({
          style: { shape: 'pill', color: 'blue', layout: 'vertical', label: 'subscribe' },
          createSubscription: function(data: any, actions: any) {
            const planId = tier === 'pro' 
              ? (process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID || '')
              : (process.env.NEXT_PUBLIC_PAYPAL_ULTRA_PLAN_ID || '')
            return actions.subscription.create({ 'plan_id': planId })
          },
          onApprove: async function(data: any) {
            try {
              const response = await fetch('/api/webhook/paypal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'verify-subscription',
                  subscriptionID: data.subscriptionID,
                  tier
                })
              })
              const result = await response.json()
              if (result.success) {
                localStorage.setItem('nc_sub', result.subscriptionId)
                localStorage.setItem('nc_tier', tier)
                window.location.href = '/app?upgrade=success'
              } else {
                alert('Subscription verification failed. Please contact support.')
              }
            } catch (error) {
              console.error('PayPal verification error:', error)
              alert('Payment failed. Please try again or contact support.')
            }
          }
        }).render(`#paypal-button-${tier}`)
      }
    }
  }, [isLoaded, tier])

  if (!isLoaded) {
    return (
      <div className={`btn btn-primary ${className || ''}`} style={{ opacity: 0.7 }}>
        Loading PayPal...
      </div>
    )
  }

  return <div id={`paypal-button-${tier}`} className={className} />
}
