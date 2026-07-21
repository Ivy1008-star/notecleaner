import fs from 'fs'
import path from 'path'

// 本地订阅状态缓存（仅用于本地开发调试）。
//
// 生产环境注意：Vercel 等 serverless 平台的文件系统是临时只读的，写到这里不会
// 跨实例持久化。因此本项目的「订阅状态」以 Stripe 为唯一真相来源——
// /api/subscription 每次都实时向 Stripe 查询，保证状态永远准确。
// 这个本地缓存只是 webhook 落地时的一个落点，方便你本地看到事件被正确处理。
//
// 生产若需要持久化（比如发欢迎邮件、做风控），把 saveSub/getSub 换成：
//   - Vercel KV / Upstash Redis
//   - 或 Postgres / Supabase
// 即可，其余代码不用动。

const DATA_DIR = path.join(process.cwd(), '.data')
const FILE = path.join(DATA_DIR, 'subscriptions.json')

export interface SubRecord {
  subscriptionId: string
  customerId: string
  tier: string
  status: string
  updatedAt: number
}

function readAll(): Record<string, SubRecord> {
  try {
    if (!fs.existsSync(FILE)) return {}
    return JSON.parse(fs.readFileSync(FILE, 'utf8'))
  } catch {
    return {}
  }
}

function writeAll(data: Record<string, SubRecord>) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
  } catch {
    // serverless 上静默失败：Stripe 是真相来源，不影响功能
  }
}

export function saveSub(rec: SubRecord) {
  const all = readAll()
  all[rec.subscriptionId] = rec
  writeAll(all)
}

export function getSub(subscriptionId: string): SubRecord | null {
  return readAll()[subscriptionId] ?? null
}
