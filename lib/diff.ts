/**
 * NoteCleaner Diff差异对比算法
 * 从纯JS版本完整移植，基于LCS（最长公共子序列）
 */

export type DiffOp = 'eq' | 'del' | 'ins'
export interface DiffResult {
  op: DiffOp
  text: string
}

function tokenize(t: string): string[] {
  const re = /[A-Za-z0-9']+|[^A-Za-z0-9']+/g
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(t)) !== null) out.push(m[0])
  return out
}

export function diff(before: string, after: string): DiffResult[] {
  const a = tokenize(before)
  const b = tokenize(after)
  
  const aw: number[] = []
  const aidx: number[] = []
  const bw: number[] = []
  const bidx: number[] = []
  
  for (let i = 0; i < a.length; i++) {
    if (/[A-Za-z0-9']/.test(a[i])) {
      aw.push(a[i].toLowerCase().hashCode())
      aidx.push(i)
    }
  }
  for (let i = 0; i < b.length; i++) {
    if (/[A-Za-z0-9']/.test(b[i])) {
      bw.push(b[i].toLowerCase().hashCode())
      bidx.push(i)
    }
  }
  
  if (aw.length > 4000 || bw.length > 4000) {
    return [
      { op: 'del', text: before },
      { op: 'ins', text: after }
    ]
  }
  
  const n = aw.length
  const mLen = bw.length
  const dp: Uint16Array[] = new Array(n + 1)
  for (let i = 0; i <= n; i++) dp[i] = new Uint16Array(mLen + 1)
  
  for (let i = 1; i <= n; i++) {
    const prev = dp[i - 1]
    const curr = dp[i]
    const ai = aw[i - 1]
    for (let j = 1; j <= mLen; j++) {
      if (ai === bw[j - 1]) curr[j] = prev[j - 1] + 1
      else curr[j] = prev[j] >= curr[j - 1] ? prev[j] : curr[j - 1]
    }
  }
  
  const wordOps: Array<{ op: 'eq' | 'del' | 'ins'; ai: number; bi: number }> = []
  let i = n, k = mLen
  while (i > 0 && k > 0) {
    if (aw[i - 1] === bw[k - 1]) {
      wordOps.push({ op: 'eq', ai: i - 1, bi: k - 1 })
      i--; k--
    } else if (dp[i - 1][k] >= dp[i][k - 1]) {
      wordOps.push({ op: 'del', ai: i - 1, bi: -1 })
      i--
    } else {
      wordOps.push({ op: 'ins', ai: -1, bi: k - 1 })
      k--
    }
  }
  while (i > 0) { wordOps.push({ op: 'del', ai: i - 1, bi: -1 }); i-- }
  while (k > 0) { wordOps.push({ op: 'ins', ai: -1, bi: k - 1 }); k-- }
  wordOps.reverse()
  
  const out: DiffResult[] = []
  let pa = 0, pb = 0
  
  function flushSepA(until: number) {
    while (pa < until) {
      if (!/[A-Za-z0-9']/.test(a[pa])) out.push({ op: 'eq', text: a[pa] })
      pa++
    }
  }
  
  function flushSepB(until: number) {
    while (pb < until) {
      if (!/[A-Za-z0-9']/.test(b[pb])) out.push({ op: 'eq', text: b[pb] })
      pb++
    }
  }
  
  for (const wop of wordOps) {
    if (wop.op === 'eq') {
      const aI = aidx[wop.ai]
      const bI = bidx[wop.bi]
      flushSepA(aI)
      pa = aI
      pb = bI
      out.push({ op: 'eq', text: a[aI] })
      pa++; pb++
    } else if (wop.op === 'del') {
      const aI = aidx[wop.ai]
      flushSepA(aI)
      pa = aI
      out.push({ op: 'del', text: a[aI] })
      pa++
    } else {
      const bI = bidx[wop.bi]
      flushSepB(bI)
      pb = bI
      out.push({ op: 'ins', text: b[bI] })
      pb++
    }
  }
  
  flushSepA(a.length)
  flushSepB(b.length)
  
  return out
}

declare global {
  interface String {
    hashCode(): number
  }
}

if (!String.prototype.hashCode) {
  String.prototype.hashCode = function(): number {
    let h = 2166136261 >>> 0
    for (let i = 0; i < this.length; i++) {
      h ^= this.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    return h >>> 0
  }
}

export function renderDiffToHTML(diff: DiffResult[]): string {
  return diff.map(d => {
    if (d.op === 'del') return '<span style="background: #fee; color: #c00; text-decoration: line-through; padding: 0 2px;">' + d.text + '</span>'
    if (d.op === 'ins') return '<span style="background: #efe; color: #080; padding: 0 2px;">' + d.text + '</span>'
    return d.text
  }).join('')
}
