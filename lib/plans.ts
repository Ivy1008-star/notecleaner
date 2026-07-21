// 套餐配置（面向大众的最优三档）
// 说明：这里的 price 仅用于页面展示；真正收费的金额以 Stripe 后台的 Price 为准。
// 每个付费档对应一个 Stripe Price ID，存在环境变量里（见 .env.local.example）。

export type TierId = 'free' | 'pro' | 'ultra'

export interface Plan {
  id: TierId
  name: string
  priceMonthly: number // 0 = 免费
  priceIdEnv?: string // 对应 Stripe Price ID 的环境变量名
  wordsLimit: number // 周期内可用词数
  period: 'day' | 'month'
  highlight?: boolean
  features: string[]
}

export const PLANS: Record<TierId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    wordsLimit: 500,
    period: 'day',
    features: [
      '500 words / day',
      'All 5 writing modes',
      'All 5 strength levels',
      'No credit card required',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 9,
    priceIdEnv: 'STRIPE_PRICE_PRO',
    wordsLimit: 50000,
    period: 'month',
    highlight: true,
    features: [
      '50,000 words / month',
      'Priority processing',
      'Batch paste support',
      'Rewrite history',
      'Early new features',
    ],
  },
  ultra: {
    id: 'ultra',
    name: 'Ultra',
    priceMonthly: 29,
    priceIdEnv: 'STRIPE_PRICE_ULTRA',
    wordsLimit: 500000,
    period: 'month',
    features: [
      '500,000 words / month',
      'Batch / file upload',
      'API access (soon)',
      'Priority support',
      'Up to 3 team seats',
    ],
  },
}

// 把 Stripe Price ID 反查回档位（用于校验/订阅查询）
export function tierFromPriceId(priceId: string | undefined): TierId {
  if (!priceId) return 'free'
  for (const plan of Object.values(PLANS)) {
    if (plan.priceIdEnv) {
      const envVal = process.env[plan.priceIdEnv]
      if (envVal && envVal === priceId) return plan.id
    }
  }
  return 'free'
}

export function getPlan(tier: TierId): Plan {
  return PLANS[tier]
}
