import Stripe from 'stripe'

let cached: Stripe | null = null

// 单例：避免每次请求都 new 一个 client
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
  if (!cached) {
    cached = new Stripe(key, {
      apiVersion: '2024-06-20',
      typescript: true,
    })
  }
  return cached
}
