'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlanButton } from '../PricingActions'

type TierId = 'free' | 'pro' | 'ultra'

const LIMITS: Record<TierId, number> = { free: 500, pro: 50000, ultra: 500000 }
const LS_SUB = 'nc_sub'
const LS_WINDOW = 'nc_window'
const LS_USED = 'nc_used'

function windowKey(tier: TierId): string {
  const now = new Date()
  // 免费按天清零，付费按月清零
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

export default function HumanizeTool() {
  const [text, setText] = useState('')
  const [mode, setMode] = useState('notes')
  const [strength, setStrength] = useState('standard')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [tier, setTier] = useState<TierId>('free')
  const [usedWords, setUsedWords] = useState(0)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    // 1) 本地已有的 subscriptionId → 实时问 Stripe 拿权威档位
    const subId = localStorage.getItem(LS_SUB)
    if (subId) {
      setVerifying(true)
      fetch(`/api/subscription?sub=${encodeURIComponent(subId)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.tier && d.tier !== 'free') {
            setTier(d.tier as TierId)
          } else {
            localStorage.removeItem(LS_SUB)
          }
        })
        .catch(() => {})
        .finally(() => setVerifying(false))
    }

    // 2) 重置周期：窗口变了就清零已用额度
    const wk = windowKey(tier)
    if (localStorage.getItem(LS_WINDOW) === wk) {
      setUsedWords(Number(localStorage.getItem(LS_USED) || '0'))
    } else {
      localStorage.setItem(LS_WINDOW, wk)
      localStorage.setItem(LS_USED, '0')
      setUsedWords(0)
    }

    // 3) 从 Stripe 回跳（带上 session_id）→ 校验并落 subscriptionId
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

  async function handleSubmit() {
    if (!text.trim()) return
    const words = countWords(text)
    const limit = LIMITS[tier]
    if (usedWords + words > limit) {
      setShowUpgrade(true)
      return
    }
    setLoading(true)
    setResult('')
    setError('')
    try {
      const res = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode, strength }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setResult(data.result)
      // 免费档和付费档都计额度（付费档额度大，主要做展示）
      persistUsed(usedWords + words)
      setShowUpgrade(false)
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const limit = LIMITS[tier]
  const remaining = Math.max(0, limit - usedWords)
  const isUnlimited = tier === 'ultra'
  const usedPct = Math.min(100, (usedWords / limit) * 100)

  return (
    <>
      <header className="nav">
        <div className="container toolbar">
          <Link href="/" className="logo"><span className="logo-dot" />NoteCleaner</Link>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {tier !== 'free' ? (
              <span className="pro-badge">{tierLabel(tier)}</span>
            ) : (
              <span className="free-badge">FREE</span>
            )}
            <Link href="/" className="back-link">← Home</Link>
          </div>
        </div>
      </header>

      <div className="tool-wrap">
        <h1>Humanize your text</h1>
        <p className="lead">Paste AI-generated text, pick a mode and strength, and get natural writing back.</p>

        {tier === 'free' || !isUnlimited ? (
          <div className="quota-bar">
            <div className="quota-track">
              <div
                className="quota-fill"
                style={{ width: isUnlimited ? '100%' : `${usedPct}%` }}
              />
            </div>
            <span className="quota-text">
              {isUnlimited
                ? 'Unlimited words · Pro/Ultra plan'
                : `${remaining.toLocaleString()} words left${
                    tier === 'free' ? ' today' : ' this month'
                  } · `}
              {tier === 'free' && (
                <button className="link-btn" onClick={() => setShowUpgrade(true)}>
                  Upgrade for more
                </button>
              )}
            </span>
          </div>
        ) : null}

        {showUpgrade && (
          <div className="upgrade-modal">
            <h3>You&apos;ve hit the {tier === 'free' ? 'daily' : 'monthly'} limit</h3>
            <p>Pick a plan to keep humanizing. Cancel anytime.</p>
            <div className="upgrade-tiers">
              <div className="ut">
                <h4>Pro</h4>
                <div className="ut-price">$9<small>/mo</small></div>
                <p>50,000 words / month</p>
                <PlanButton tier="pro" label="Choose Pro" />
              </div>
              <div className="ut featured">
                <h4>Ultra</h4>
                <div className="ut-price">$29<small>/mo</small></div>
                <p>500,000 words / month + team</p>
                <PlanButton tier="ultra" label="Choose Ultra" variant="ghost" />
              </div>
            </div>
            <button className="link-btn" onClick={() => setShowUpgrade(false)} style={{ marginTop: 12 }}>
              Maybe later
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--slate)' }}>Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', fontSize: '16px' }}
            >
              <option value="notes">Notes</option>
              <option value="essay">Essay</option>
              <option value="email">Email</option>
              <option value="report">Report</option>
              <option value="social">Social</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--slate)' }}>Strength</label>
            <select
              value={strength}
              onChange={(e) => setStrength(e.target.value)}
              style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', fontSize: '16px' }}
            >
              <option value="polish">Polish</option>
              <option value="light">Light</option>
              <option value="standard">Standard</option>
              <option value="aggressive">Aggressive</option>
              <option value="deep">Deep</option>
            </select>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your AI-generated text here..."
          style={{
            width: '100%',
            minHeight: '224px',
            padding: '16px',
            border: '2px solid var(--border)',
            borderRadius: '12px',
            fontSize: '16px',
            fontFamily: 'inherit',
            marginBottom: '24px',
            resize: 'vertical',
            background: 'white'
          }}
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          style={{
            width: '100%',
            padding: '16px',
            background: loading ? 'var(--muted)' : 'var(--blue)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {loading ? '✨ AI rewriting...' : 'Humanize Text'}
        </button>

        {verifying && (
          <p style={{ marginTop: '16px', textAlign: 'center', color: 'var(--blue)', fontSize: '14px', fontWeight: 500 }}>
            Verifying your subscription…
          </p>
        )}

        {error && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#fef2f2',
            color: '#b91c1c',
            borderRadius: '12px',
            border: '1px solid #fecaca',
            fontSize: '15px'
          }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{
            marginTop: '32px',
            padding: '24px',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'var(--ink)' }}>Result</h3>
            <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', color: '#334155' }}>{result}</div>
            <button
              onClick={() => navigator.clipboard.writeText(result)}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                background: 'var(--bg-soft)',
                color: 'var(--slate)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              📋 Copy to clipboard
            </button>
          </div>
        )}

        <p style={{ marginTop: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
          {tier === 'free'
            ? 'Free tier: 500 words / day · We never store your text'
            : `${tierLabel(tier)} · we never store your text`}
        </p>
      </div>
    </>
  )
}
