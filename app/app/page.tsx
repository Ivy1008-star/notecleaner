'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const FREE_DAILY_WORDS = 500
const LS_PRO = 'nc_pro'
const LS_DATE = 'nc_quota_date'
const LS_USED = 'nc_quota_used'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function countWords(text: string) {
  const t = text.trim()
  if (!t) return 0
  return t.split(/\s+/).length
}

export default function HumanizeTool() {
  const [text, setText] = useState('')
  const [mode, setMode] = useState('notes')
  const [strength, setStrength] = useState('standard')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [pro, setPro] = useState(false)
  const [usedWords, setUsedWords] = useState(0)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    setPro(localStorage.getItem(LS_PRO) === '1')

    const d = todayKey()
    if (localStorage.getItem(LS_DATE) === d) {
      setUsedWords(Number(localStorage.getItem(LS_USED) || '0'))
    } else {
      localStorage.setItem(LS_DATE, d)
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
        .then((data) => {
          if (data.pro) {
            localStorage.setItem(LS_PRO, '1')
            setPro(true)
          }
        })
        .catch(() => {})
        .finally(() => {
          setVerifying(false)
          window.history.replaceState({}, '', '/app')
        })
    }
  }, [])

  function persistUsed(next: number) {
    setUsedWords(next)
    localStorage.setItem(LS_USED, String(next))
    localStorage.setItem(LS_DATE, todayKey())
  }

  async function handleSubmit() {
    if (!text.trim()) return
    const words = countWords(text)
    if (!pro && usedWords + words > FREE_DAILY_WORDS) {
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
      if (!pro) persistUsed(usedWords + words)
      setShowUpgrade(false)
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  async function handleUpgrade() {
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      if (data.url) window.location.href = data.url
      else throw new Error('No checkout URL returned')
    } catch (e: any) {
      setError(e?.message || 'Could not start checkout.')
    }
  }

  const remaining = Math.max(0, FREE_DAILY_WORDS - usedWords)

  return (
    <>
      <header className="nav">
        <div className="container toolbar">
          <Link href="/" className="logo"><span className="logo-dot" />NoteCleaner</Link>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {pro ? (
              <span className="pro-badge">PRO · Unlimited</span>
            ) : (
              <button onClick={handleUpgrade} className="upgrade-btn">Upgrade to Pro</button>
            )}
            <Link href="/" className="back-link">← Home</Link>
          </div>
        </div>
      </header>

      <div className="tool-wrap">
        <h1>Humanize your text</h1>
        <p className="lead">Paste AI-generated text, pick a mode and strength, and get natural writing back.</p>

        {!pro && (
          <div className="quota-bar">
            <div className="quota-track">
              <div className="quota-fill" style={{ width: `${Math.min(100, (usedWords / FREE_DAILY_WORDS) * 100)}%` }} />
            </div>
            <span className="quota-text">
              {remaining} words left today ·{' '}
              <button className="link-btn" onClick={handleUpgrade}>Upgrade for unlimited</button>
            </span>
          </div>
        )}

        {showUpgrade && (
          <div className="upgrade-card">
            <h3>You&apos;ve hit the free limit</h3>
            <p>
              The free plan includes {FREE_DAILY_WORDS} words per day. Go Pro for unlimited
              humanizing, faster results, and no daily cap.
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '14px 0' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--ink)' }}>$9</span>
              <span style={{ color: 'var(--slate)' }}>/ month</span>
            </div>
            <button onClick={handleUpgrade} className="upgrade-cta">Upgrade to Pro — $9/mo</button>
            <button className="link-btn" onClick={() => setShowUpgrade(false)} style={{ marginLeft: 12 }}>
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
          {pro ? 'Pro plan · unlimited words · we never store your text' : `Free tier: ${FREE_DAILY_WORDS} words / day · We never store your text`}
        </p>
      </div>
    </>
  )
}
