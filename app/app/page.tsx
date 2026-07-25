'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { PlanPaymentButtons } from '../PricingActions'
import { GoogleAuth } from '../GoogleAuth'
import { humanize as humanizeLocal } from '../../lib/humanizer'
import { diff, renderDiffToHTML } from '../../lib/diff'

type TierId = 'free' | 'pro' | 'ultra'
type ModeId = 'notes' | 'essay' | 'report' | 'email' | 'social'
type StrengthId = 'polish' | 'light' | 'standard' | 'aggressive' | 'deep'
type ViewMode = 'clean' | 'diff'

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

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'clean', label: 'Clean' },
  { id: 'diff', label: 'Diff' },
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
    if (tier === 'ultra') return 'ULTRA · 500K/mo'
    if (tier === 'pro') return 'PRO · 50K/mo'
    return 'FREE · 1500/day'
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
  const connectives = (t.match(/\b(however|therefore|moreover|furthermore|in conclusion|additionally|nevertheless|consequently|thus|hence|utilize|leverage|robust|comprehensive|in order to|it is important to note)\b/gi) || []).length
  let score = 10
  score += Math.min(40, avgLen * 3)
  score += Math.min(30, (connectives / Math.max(1, sentences.length)) * 25)
  score += Math.min(20, (longWords / Math.max(1, words)) * 200)
  return Math.max(0, Math.min(100, Math.round(score)))
}

function classifyMini(sc: number): 'AI' | 'Mixed' | 'Human' {
  if (sc >= 66) return 'AI'
  if (sc >= 34) return 'Mixed'
  return 'Human'
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
  const [viewMode, setViewMode] = useState<ViewMode>('clean')
  const [useLocalMode, setUseLocalMode] = useState(false)
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

  // API模式改写
  async function humanizeChunk(chunk: string): Promise<string> {
    const res = await fetch('/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: chunk, mode, strength }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data.output as string
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
        let after: string
        try {
          if (useLocalMode) {
            // 本地模式：使用规则重写引擎
            after = humanizeLocal(before, { mode, strength })
          } else {
            // API模式：调用DeepSeek
            after = await humanizeChunk(before)
          }
        } catch (e: any) {
          // P1-1: API失败时自动回退到本地模式
          console.log('API failed, falling back to local mode:', e.message)
          after = humanizeLocal(before, { mode, strength })
          setUseLocalMode(true)
          setError('API temporarily unavailable - using local rewrite engine')
        }
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
  const finalBefore = chunks.map((c) => c.before).join('\n\n')

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
            <GoogleAuth />
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

        {/* 本地模式指示器 */}
        {useLocalMode && (
          <div className="local-mode-banner">
            ⚡ Running in local rewrite mode. Your text never leaves your browser.
          </div>
        )}

        {/* 配额条 */}
        {tier === 'free' || !isUnlimited ? (
          <div className="quota-bar">
            <div className="quota-track">
              <div
                className="quota-fill"
                style={{ width: isUnlimited ? '100%' : `${usedPct}%` }}
              />
            </div>
            <p className="quota-text">
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
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="rounded-xl border border-brand-soft bg-white p-4 text-center">
                  <h4 className="text-lg font-bold text-ink">Pro</h4>
                  <div className="text-2xl font-extrabold text-ink mt-1">
                    $9<span className="text-sm font-medium text-slate-400">/mo</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">50,000 words / month</p>
                  <div className="mt-3">
                    <PlanPaymentButtons tier="pro" stripeLabel="Choose Pro" />
                  </div>
                </div>
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Best value</span>
                  <h4 className="text-lg font-bold text-ink">Ultra</h4>
                  <div className="text-2xl font-extrabold text-ink mt-1">
                    $29<span className="text-sm font-medium text-slate-400">/mo</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">500,000 words / month</p>
                  <div className="mt-3">
                    <PlanPaymentButtons tier="ultra" stripeLabel="Choose Ultra" />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
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
                  <PlanPaymentButtons tier="pro" stripeLabel="Choose Pro" />
                </div>
              </div>
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-center">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Best value</span>
                <h4 className="text-lg font-bold text-ink">Ultra</h4>
                <div className="text-3xl font-extrabold text-ink">
                  $29<span className="text-sm font-medium text-slate-400">/mo</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">500,000 words / month</p>
                <div className="mt-4">
                  <PlanPaymentButtons tier="ultra" stripeLabel="Choose Ultra" />
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <button className="text-sm font-semibold text-brand underline" onClick={() => setShowUpgrade(false)}>
                Maybe later
              </button>
            </div>
          </div>
        )}

        {/* 模式选择 */}
        <div className="mt-6">
          <label className="tool-label">Mode</label>
          <div className="mode-grid">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`mode-btn ${
                  mode === m.id
                    ? 'active'
                    : ''
                }`}
              >
                <div className="mode-btn-label">{m.label}</div>
                <div className="mode-btn-desc">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 强度选择 */}
        <div className="mt-4">
          <label className="tool-label">Strength</label>
          <div className="mode-grid">
            {STRENGTHS.map((s) => (
              <button
                key={s.id}
                onClick={() => onStrengthChange(s.id)}
                className={`mode-btn ${
                  strength === s.id
                    ? 'active'
                    : ''
                }`}
              >
                <span className="mode-btn-label">{s.label}{s.pro && <span className="pro-tag">PRO</span>}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 输入文本框 - 支持拖拽 */}
        <div
          className={`tool-textarea-wrap ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFiles(e.dataTransfer.files)
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your AI-generated text here, or drag and drop a file..."
            className="tool-textarea"
          />
          {dragOver && (
            <div className="drag-overlay">
              📂 Drop your file here
            </div>
          )}
        </div>

        {/* 文件上传按钮 */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.pdf"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm font-medium text-brand hover:underline"
            >
              📁 Upload file
            </button>
            {uploadName && <span className="text-xs text-slate-400">Selected: {uploadName}</span>}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              checked={useLocalMode}
              onChange={(e) => setUseLocalMode(e.target.checked)}
              className="rounded"
            />
            Local mode only (free)
          </label>
        </div>

        {/* Humanize 按钮 + 进度 */}
        <button
          onClick={handleSubmit}
          disabled={processing || !text.trim()}
          className={`humanize-btn ${processing || !text.trim() ? '' : ''}`}
        >
          {processing ? `Humanizing ${progress}%...` : useLocalMode ? 'Humanize Text (Local)' : 'Humanize Text'}
        </button>

        {processing && (
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {verifying && (
          <p className="mt-4 text-center text-sm font-medium text-brand">Verifying your subscription…</p>
        )}

        {error && (
          <div className="tool-error">
            {error}
          </div>
        )}

        {/* 结果区 */}
        {chunks.length > 0 && (
          <div className="mt-8">
            <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-ink">Result</h3>
              <div className="flex items-center gap-2">
                {/* P0-4: Clean/Diff视图切换 */}
                <div className="view-toggle">
                  {VIEW_MODES.map((vm) => (
                    <button
                      key={vm.id}
                      onClick={() => setViewMode(vm.id)}
                      className={`view-toggle-btn ${viewMode === vm.id ? 'active' : ''}`}
                    >
                      {vm.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={copyResult}
                  className="tool-action-btn"
                >
                  📋 Copy
                </button>
                <button
                  onClick={downloadTxt}
                  className="tool-action-btn"
                >
                  ⬇ Download .txt
                </button>
              </div>
            </div>

            {/* 分块结果显示 */}
            {viewMode === 'clean' ? (
              // Clean视图：显示纯文本结果
              chunks.map((c, i) => (
                <div key={i} className="result-card">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">
                      Chunk {i + 1}/{chunks.length}
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <span className={`score-badge ${classifyMini(c.scoreBefore).toLowerCase()}`}>
                        {classifyMini(c.scoreBefore)} {c.scoreBefore}%
                      </span>
                      <span className="text-slate-300">→</span>
                      <span className={`score-badge ${classifyMini(c.scoreAfter).toLowerCase()}`}>
                        {classifyMini(c.scoreAfter)} {c.scoreAfter}%
                      </span>
                    </span>
                  </div>
                  <p className="result-before">{c.before}</p>
                  <p className="result-after">{c.after}</p>
                </div>
              ))
            ) : (
              // Diff视图：显示差异对比
              <div className="result-card">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Full Diff View</span>
                  <span className="flex items-center gap-1 text-xs">
                    <span className={`score-badge ${classifyMini(estimateAiScore(finalBefore)).toLowerCase()}`}>
                      {classifyMini(estimateAiScore(finalBefore))} {estimateAiScore(finalBefore)}%
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className={`score-badge ${classifyMini(estimateAiScore(finalText)).toLowerCase()}`}>
                      {classifyMini(estimateAiScore(finalText))} {estimateAiScore(finalText)}%
                    </span>
                  </span>
                </div>
                <div className="result-after" dangerouslySetInnerHTML={{ __html: renderDiffToHTML(diff(finalBefore, finalText)) }} />
              </div>
            )}

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
