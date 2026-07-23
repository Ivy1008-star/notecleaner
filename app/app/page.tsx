'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { PlanButton } from '../PricingActions'

type TierId = 'free' | 'pro' | 'ultra'
type ModeId = 'notes' | 'essay' | 'report' | 'email' | 'social'
type StrengthId = 'polish' | 'light' | 'standard' | 'aggressive' | 'deep'

const LIMITS: Record<TierId, number> = { free: 500, pro: 50000, ultra: 500000 }
const LS_SUB = 'nc_sub'
const LS_WINDOW = 'nc_window'
const LS_USED = 'nc_used'

// PRD 约定：Deep 需 Pro，双重拦截（切档拦一次 + Run 前拦一次）
const PRO_STRENGTHS: Partial<Record<StrengthId, boolean>> = { deep: true }

const MODES: { id: ModeId; label: string; desc: string }[] = [
  { id: 'notes', label: 'Notes', desc: '口语、短句' },
  { id: 'essay', label: 'Essay', desc: '学术但不僵' },
  { id: 'report', label: 'Report', desc: '长文档 / PDF' },
  { id: 'email', label: 'Email', desc: '简洁、正式' },
  { id: 'social', label: 'Casual', desc: '松弛、缩写多' },
]

const STRENGTHS: { id: StrengthId; label: string; pro: boolean }[] = [
  { id: 'polish', label: 'Polish', pro: false },
  { id: 'light', label: 'Light', pro: false },
  { id: 'standard', label: 'Standard', pro: false },
  { id: 'aggressive', label: 'Aggressive', pro: false },
  { id: 'deep', label: 'Deep', pro: true },
]

function windowKey(tier: TierId): string {
  const now = new Date()
  return tier === 'free'
    ? 'day:' + now.toISOString().slice(0, 10)
    : 'month:' + now.toISOString().slice(0, 7)
}

function countWords(text: string): number {
  const t = text.trim()
  if (!t) return 0
  return t.split(/\s+/).length
}

function tierLabel(tier: TierId): string {
  if (tier === 'ultra') return 'ULTRA · 500k/mo'
  if (tier === 'pro') return 'PRO · 50k/mo'
  return 'FREE · 500/day'
}

// 分块：按空行切，目标 900、硬顶 1400（PRD 约定）
function splitIntoChunks(text: string, target = 900, hard = 1400): string[] {
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (paras.length <= 1) return splitLong(text, target, hard)
  const chunks: string[] = []
  let cur = ''
  for (const p of paras) {
    if (cur && (cur + '\n\n' + p).length > hard) {
      chunks.push(cur.trim())
      cur = p
    } else {
      cur = cur ? cur + '\n\n' + p : p
    }
  }
  if (cur) chunks.push(cur.trim())
  return chunks
}

// 单段按句子切，目标 900、硬顶 1400
function splitLong(text: string, target: number, hard: number): string[] {
  const t = text.trim()
  if (t.length <= hard) return [t]
  const sentences = t.match(/[^.!?]+[.!?]*/g) || [t]
  const chunks: string[] = []
  let cur = ''
  for (const s of sentences) {
    if (cur && (cur + s).length > hard) {
      chunks.push(cur.trim())
      cur = s
    } else {
      cur += s
    }
  }
  if (cur) chunks.push(cur.trim())
  return chunks
}

// 轻量 AI 味估算（启发式，PRD classifyMini 思路）
function estimateAiScore(text: string): number {
  const t = text.trim()
  if (!t) return 0
  const words = t.split(/\s+/).length
  const sentences = t.split(/[.!?]+/).filter(Boolean)
  const avgLen = words / Math.max(1, sentences.length)
  const longWords = (t.match(/\b\w{12,}\b/g) || []).length
  const connectives =
    t.match(
      /\b(however|therefore|moreover|furthermore|in conclusion|additionally|nevertheless|consequently|thus|hence|utilize|leverage|robust|comprehensive|in order to|it is important to note)\b/gi
    ) || []
  let score = 10
  score += Math.min(40, avgLen * 3)
  score += Math.min(30, (connectives.length / Math.max(1, sentences.length)) * 25)
  score += Math.min(20, (longWords / Math.max(1, words)) * 200)
  return Math.max(0, Math.min(100, Math.round(score)))
}

function classifyMini(sc: number): 'AI' | 'Mixed' | 'Human' {
  if (sc >= 66) return 'AI'
  if (sc >= 34) return 'Mixed'
  return 'Human'
}

function badgeClass(label: 'AI' | 'Mixed' | 'Human'): string {
  if (label === 'AI') return 'bg-red-100 text-red-700'
  if (label === 'Mixed') return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

export default function HumanizeTool() {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<ModeId>('notes')
  const [strength, setStrength] = useState<StrengthId>('standard')
  const [chunks, setChunks] = useState<ChunkResult[]>([])
  const [progress, setProgress] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [tier, setTier] = useState<TierId>('free')
  const [usedWords, setUsedWords] = useState(0)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showProGate, setShowProGate] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const subId = localStorage.getItem(LS_SUB)
    if (subId) {
      setVerifying(true)
      fetch(`/api/subscription?sub=${encodeURIComponent(subId)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.tier && d.tier !== 'free') setTier(d.tier as TierId)
          else localStorage.removeItem(LS_SUB)
        })
        .catch(() => {})
        .finally(() => setVerifying(false))
    }

    const wk = windowKey(tier)
    if (localStorage.getItem(LS_WINDOW) === wk) {
      setUsedWords(Number(localStorage.getItem(LS_USED) || '0'))
    } else {
      localStorage.setItem(LS_WINDOW, wk)
      localStorage.setItem(LS_USED, '0')
      setUsedWords(0)
    }

    const params = new URLSearchParams(window.location.search)
    const sid = params.get('session_id')
    if (sid) {
      setVerifying(true)
      fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.tier && d.tier !== 'free') {
            setTier(d.tier as TierId)
            if (d.subscriptionId) localStorage.setItem(LS_SUB, d.subscriptionId)
          }
        })
        .catch(() => {})
        .finally(() => {
          setVerifying(false)
          window.history.replaceState({}, '', '/app')
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function persistUsed(next: number) {
    setUsedWords(next)
    localStorage.setItem(LS_USED, String(next))
    localStorage.setItem(LS_WINDOW, windowKey(tier))
  }

  async function handleFiles(files: FileList | null) {
    const file = files && files[0]
    if (!file) return
    setUploadName(file.name)
    const name = file.name.toLowerCase()
    try {
      if (name.endsWith('.txt') || name.endsWith('.md')) {
        setText(await file.text())
      } else if (name.endsWith('.pdf')) {
        const t = await extractPdfText(file)
        setText(t)
        setMode('report') // 长 PDF 自动切 Report 模式（PRD 3.1）
      } else {
        setError('仅支持 .txt / .md / .pdf 文件')
      }
    } catch {
      setError('文件读取失败，请重试或粘贴文本')
    }
  }

  async function extractPdfText(file: File): Promise<string> {
    const pdfjs: any = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc =
      'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
    const buf = await file.arrayBuffer()
    const doc = await pdfjs.getDocument({ data: buf }).promise
    let out = ''
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const items = content.items as any[]
      out += items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n\n'
    }
    return out.trim()
  }

  function onStrengthChange(val: StrengthId) {
    // 切档拦截：Deep 需 Pro
    if (PRO_STRENGTHS[val] && tier === 'free') {
      setShowProGate(true)
      return
    }
    setStrength(val)
  }

  async function humanizeChunk(chunk: string): Promise<string> {
    const res = await fetch('/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: chunk, mode, strength }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data.result as string
  }

  async function handleSubmit() {
    if (!text.trim()) return
    const words = countWords(text)
    const limit = LIMITS[tier]
    if (usedWords + words > limit) {
      setShowUpgrade(true)
      return
    }
    // Run 前拦：Deep 需 Pro
    if (PRO_STRENGTHS[strength] && tier === 'free') {
      setShowProGate(true)
      return
    }
    const parts = splitIntoChunks(text)
    setProcessing(true)
    setError('')
    setChunks([])
    setProgress(0)
    const results: ChunkResult[] = []
    try {
      for (let i = 0; i < parts.length; i++) {
        const before = parts[i]
        const after = await humanizeChunk(before)
        results.push({
          before,
          after,
          scoreBefore: estimateAiScore(before),
          scoreAfter: estimateAiScore(after),
        })
        setChunks([...results])
        setProgress(Math.round(((i + 1) / parts.length) * 100))
      }
      persistUsed(usedWords + words)
      setShowUpgrade(false)
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.')
    }
    setProcessing(false)
  }

  const finalText = chunks.map((c) => c.after).join('\n\n')

  function copyResult() {
    if (finalText) navigator.clipboard.writeText(finalText)
  }

  function downloadTxt() {
    if (!finalText) return
    const blob = new Blob([finalText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'notecleaner-output.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const limit = LIMITS[tier]
  const remaining = Math.max(0, limit - usedWords)
  const isUnlimited = tier === 'ultra'
  const usedPct = Math.min(100, (usedWords / limit) * 100)

  return (
    <>
      <header className="nav">
        <div className="container toolbar">
          <Link href="/" className="logo">
            <span className="logo-dot" />
            NoteCleaner
          </Link>
          <div className="flex items-center gap-3">
            {tier !== 'free' ? (
              <span className="pro-badge">{tierLabel(tier)}</span>
            ) : (
              <span className="free-badge">FREE</span>
            )}
            <Link href="/" className="back-link">
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Humanize your text</h1>
        <p className="mt-2 text-slate-500">
          Paste AI-generated text, pick a mode and strength, and get natural writing back.
        </p>

        {/* 配额条 */}
        {tier === 'free' || !isUnlimited ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-blue-400 transition-all duration-300"
                style={{ width: isUnlimited ? '100%' : `${usedPct}%` }}
              />
            </div>
            <p className="mt-2 text-[13px] text-slate-500">
              {isUnlimited
                ? 'Unlimited words · Pro/Ultra plan'
                : `${remaining.toLocaleString()} words left${
                    tier === 'free' ? ' today' : ' this month'
                  } · `}
              {tier === 'free' && (
                <button className="font-semibold text-brand underline" onClick={() => setShowUpgrade(true)}>
                  Upgrade for more
                </button>
              )}
            </p>
          </div>
        ) : null}

        {/* Deep Pro Gate 模态（PRD 3.6） */}
        {showProGate && (
          <div className="mt-6 rounded-2xl border border-blue-200 bg-gradient-to-b from-white to-blue-50 p-6 shadow-lg">
            <h3 className="text-xl font-bold text-ink">Deep mode is a Pro feature</h3>
            <p className="mt-1 text-slate-500">Double-pass rewrite, 80% break-rate, injected openers. Unlock to go further.</p>
            <ul className="mt-4 grid gap-2 text-sm text-slate-600">
              <li>✓ Double-pass rewrite for maximum naturalness</li>
              <li>✓ 80% sentence break-rate, human rhythm</li>
              <li>✓ 50% chance injected opener, filler words stripped</li>
              <li>✓ No daily word cap on Deep mode</li>
            </ul>
            <div className="mt-5 flex items-center gap-3">
              <PlanButton tier="pro" label="Go Pro · $9/mo" />
              <button className="text-sm font-semibold text-brand underline" onClick={() => setShowProGate(false)}>
                Maybe later
              </button>
            </div>
          </div>
        )}

        {/* 配额升级模态 */}
        {showUpgrade && (
          <div className="mt-6 rounded-2xl border border-blue-200 bg-gradient-to-b from-white to-blue-50 p-6 shadow-lg">
            <h3 className="text-xl font-bold text-ink">You&apos;ve hit the {tier === 'free' ? 'daily' : 'monthly'} limit</h3>
            <p className="mt-1 text-slate-500">Pick a plan to keep humanizing. Cancel anytime.</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
                <h4 className="text-lg font-bold text-ink">Pro</h4>
                <div className="text-3xl font-extrabold text-ink">
                  $9<span className="text-sm font-medium text-slate-400">/mo</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">50,000 words / month</p>
                <div className="mt-4">
                  <PlanButton tier="pro" label="Choose Pro" />
                </div>
              </div>
              <div className="rounded-xl border-2 border-violet-400 bg-white p-5 text-center">
                <h4 className="text-lg font-bold text-ink">Ultra</h4>
                <div className="text-3xl font-extrabold text-ink">
                  $29<span className="text-sm font-medium text-slate-400">/mo</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">500,000 words / month + team</p>
                <div className="mt-4">
                  <PlanButton tier="ultra" label="Choose Ultra" variant="ghost" />
                </div>
              </div>
            </div>
            <button className="mt-4 text-sm font-semibold text-brand underline" onClick={() => setShowUpgrade(false)}>
              Maybe later
            </button>
          </div>
        )}

        {/* 文件上传 + 拖拽（PRD 3.1） */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFiles(e.dataTransfer.files)
          }}
          onClick={() => fileRef.current?.click()}
          className={`mt-6 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
            dragOver ? 'border-brand bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-brand'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.pdf"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <p className="text-sm font-medium text-slate-600">
            拖拽文件到此处，或点击上传
          </p>
          <p className="mt-1 text-xs text-slate-400">支持 .txt / .md / .pdf（长 PDF 自动切 Report 模式）</p>
          {uploadName && <p className="mt-2 text-xs font-semibold text-brand">已载入：{uploadName}</p>}
        </div>

        {/* 模式选择 */}
        <div className="mt-6">
          <label className="text-sm font-medium text-slate-600">Mode</label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`rounded-lg border px-3 py-2 text-center transition ${
                  mode === m.id
                    ? 'border-brand bg-brand-soft text-brand-dark'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-brand'
                }`}
              >
                <div className="text-sm font-semibold">{m.label}</div>
                <div className="text-[11px] text-slate-400">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 强度选择 */}
        <div className="mt-4">
          <label className="text-sm font-medium text-slate-600">Strength</label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {STRENGTHS.map((s) => (
              <button
                key={s.id}
                onClick={() => onStrengthChange(s.id)}
                className={`rounded-lg border px-3 py-2 text-center text-sm font-semibold transition ${
                  strength === s.id
                    ? 'border-brand bg-brand-soft text-brand-dark'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-brand'
                }`}
              >
                {s.label}
                {s.pro && <span className="ml-1 text-[10px] text-amber-600">PRO</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 输入文本框 */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your AI-generated text here..."
          className="mt-4 w-full min-h-[224px] resize-y rounded-xl border-2 border-slate-200 p-4 text-base outline-none focus:border-brand"
        />

        {/* Humanize 按钮 + 进度 */}
        <button
          onClick={handleSubmit}
          disabled={processing || !text.trim()}
          className={`mt-4 w-full rounded-xl px-4 py-4 text-lg font-semibold text-white transition ${
            processing || !text.trim() ? 'cursor-not-allowed bg-slate-300' : 'bg-brand hover:bg-brand-dark'
          }`}
        >
          {processing ? `Humanizing ${progress}%...` : 'Humanize Text'}
        </button>

        {processing && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-blue-400 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {verifying && (
          <p className="mt-4 text-center text-sm font-medium text-brand">Verifying your subscription…</p>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-[15px] text-red-700">
            {error}
          </div>
        )}

        {/* 结果区 */}
        {chunks.length > 0 && (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">Result</h3>
              <div className="flex gap-2">
                <button
                  onClick={copyResult}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  📋 Copy
                </button>
                <button
                  onClick={downloadTxt}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  ⬇ Download .txt
                </button>
              </div>
            </div>

            {chunks.map((c, i) => (
              <div key={i} className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">
                    Chunk {i + 1}/{chunks.length}
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    <span className={`rounded px-2 py-0.5 font-semibold ${badgeClass(classifyMini(c.scoreBefore))}`}>
                      {classifyMini(c.scoreBefore)} {c.scoreBefore}%
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className={`rounded px-2 py-0.5 font-semibold ${badgeClass(classifyMini(c.scoreAfter))}`}>
                      {classifyMini(c.scoreAfter)} {c.scoreAfter}%
                    </span>
                  </span>
                </div>
                <p className="mb-2 whitespace-pre-wrap text-sm text-slate-400 line-clamp-2">{c.before}</p>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">{c.after}</p>
              </div>
            ))}

            <p className="mt-4 text-center text-[13px] text-slate-400">
              {tier === 'free'
                ? 'Free tier: 500 words / day · We never store your text'
                : `${tierLabel(tier)} · we never store your text`}
            </p>
          </div>
        )}
      </div>
    </>
  )
}

interface ChunkResult {
  before: string
  after: string
  scoreBefore: number
  scoreAfter: number
}
