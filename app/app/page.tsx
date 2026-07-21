'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function HumanizeTool() {
  const [text, setText] = useState('')
  const [mode, setMode] = useState('notes')
  const [strength, setStrength] = useState('standard')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!text.trim()) return
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
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  return (
    <>
      <header className="nav">
        <div className="container toolbar">
          <Link href="/" className="logo"><span className="logo-dot" />NoteCleaner</Link>
          <Link href="/" className="back-link">← Back home</Link>
        </div>
      </header>

      <div className="tool-wrap">
        <h1>Humanize your text</h1>
        <p className="lead">Paste AI-generated text, pick a mode and strength, and get natural writing back.</p>

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
          Free tier: 500 words / day · We never store your text
        </p>
      </div>
    </>
  )
}
