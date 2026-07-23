// ⚠️ Node.js 专用：本模块导入 Stripe Node SDK，包含 node 内置模块依赖，
// 不能在任何 Edge Runtime 路由里被静态/动态 import（会导致 Edge 构建失败）。
// 仅用于未来的 Node.js 运行时路由（建议升级到 Next 15 + Node runtime 后启用）。
//
// 当前 4 个 Stripe 路由（checkout / subscription / verify / webhook）已临时改为 stub，
// 不引用本模块，保证 Cloudflare Pages (Edge) 构建通过。等接入 Stripe 时再恢复引用。

let cached: import('stripe').default | null = null

// 单例：避免每次请求都 new 一个 client。Stripe SDK 在此函数内按需加载，
// 这样即使本模块被 import，也不会在 Edge 构建期把 stripe 打进 bundle。
export async function getStripe(): Promise<import('stripe').default> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
  if (!cached) {
    const Stripe = (await import('stripe')).default
    cached = new Stripe(key, {
      apiVersion: '2024-06-20' as any,
      typescript: true,
    })
  }
  return cached
}
