import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'
export const OG_ALT = 'NoteCleaner - Make AI text sound human'

export function renderOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #0b1220 0%, #14264f 55%, #2563eb 120%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top: logo + category pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#60a5fa' }} />
            <div style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '-0.5px' }}>NoteCleaner</div>
          </div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '2px',
              color: '#bfdbfe',
              textTransform: 'uppercase',
              border: '1px solid rgba(191,219,254,0.4)',
              borderRadius: '999px',
              padding: '9px 18px',
            }}
          >
            AI Text Humanizer
          </div>
        </div>

        {/* Center: tagline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '76px', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-1.5px' }}>
            Make AI text sound{' '}
            <span style={{ color: '#93c5fd' }}>human.</span>
          </div>
          <div style={{ fontSize: '76px', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-1.5px', marginTop: '2px' }}>
            In one click.
          </div>
          <div style={{ fontSize: '28px', color: '#cbd5e1', marginTop: '26px', fontWeight: 400 }}>
            Bypass AI detectors. Keep your voice.
          </div>
        </div>

        {/* Bottom: before -> after hint + url */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '20px', color: '#e2e8f0' }}>
            <span style={{ opacity: 0.65 }}>AI draft</span>
            <span style={{ color: '#60a5fa', fontSize: '24px' }}>→</span>
            <span style={{ fontWeight: 600 }}>Natural human writing</span>
          </div>
          <div style={{ fontSize: '20px', color: '#94a3b8' }}>notecleaner.app</div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  )
}
