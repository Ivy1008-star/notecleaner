'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    paypal: any
  }
}

// 全局共享的 PayPal SDK 加载 Promise，防止多个组件重复加载脚本
let paypalSdkPromise: Promise<void> | null = null

function loadPayPalSdk(): Promise<void> {
  if (paypalSdkPromise) return paypalSdkPromise
  if (window.paypal) {
    paypalSdkPromise = Promise.resolve()
    return paypalSdkPromise
  }
  paypalSdkPromise = new Promise((resolve) => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb'
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`
    script.async = true
    script.onload = () => resolve()
    document.body.appendChild(script)
  })
  return paypalSdkPromise
}

interface PayPalButtonProps {
  tier: 'pro' | 'ultra'
  className?: string
}

export function PayPalButton({ tier, className }: PayPalButtonProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    loadPayPalSdk().then(() => setIsLoaded(true))
  }, [])

  useEffect(() => {
    if (!isLoaded || !window.paypal) return

    const container = document.getElementById(`paypal-button-${tier}`)
    if (!container || container.hasChildNodes()) return

    const planId = tier === 'pro' 
      ? (process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID || '')
      : (process.env.NEXT_PUBLIC_PAYPAL_ULTRA_PLAN_ID || '')

    if (!planId) {
      console.error(`PayPal plan ID not configured for tier: ${tier}`)
      return
    }

    window.paypal.Buttons({
      style: { shape: 'pill', color: 'blue', layout: 'vertical', label: 'subscribe' },
      createSubscription: function(data: any, actions: any) {
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
  }, [isLoaded, tier])

  if (!isLoaded) {
    return (
      <div className={`btn btn-primary ${className || ''}`} style={{ opacity: 0.7, pointerEvents: 'none' }}>
        Loading PayPal...
      </div>
    )
  }

  return <div id={`paypal-button-${tier}`} className={className} />
}
