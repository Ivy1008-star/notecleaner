import { NextRequest, NextResponse } from 'next/server'
import {
  verifyGoogleIdToken,
  signSession,
  setCookie,
  clearCookie,
  COOKIE_STATE,
  COOKIE_VERIFIER,
  COOKIE_SESSION,
} from '@/lib/auth'

export const runtime = 'edge'

// Google 回调：校验 state → 用 code+PKCE verifier 换 token → 验 ID token → 发会话 cookie。
export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const storedState = req.cookies.get(COOKIE_STATE)?.value
  const verifier = req.cookies.get(COOKIE_VERIFIER)?.value
  const secure = req.nextUrl.protocol === 'https:'

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.json({ error: 'Invalid OAuth state. Possible CSRF.' }, { status: 400 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Google OAuth not configured.' }, { status: 500 })
  }

  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`

  // 1) 换取 token（用原生 fetch，Edge 安全）
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: verifier || '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  })
  if (!tokenRes.ok) {
    const detail = await tokenRes.text().catch(() => '')
    return NextResponse.json(
      { error: `Token exchange failed: ${detail.slice(0, 200)}` },
      { status: 502 }
    )
  }
  const tokens: any = await tokenRes.json()
  const idToken = tokens.id_token
  if (!idToken) {
    return NextResponse.json({ error: 'No id_token returned from Google.' }, { status: 502 })
  }

  // 2) 验 ID token（jose + Google JWKS，Edge 安全，不依赖 Node crypto）
  let profile
  try {
    profile = await verifyGoogleIdToken(idToken)
  } catch (e: any) {
    return NextResponse.json(
      { error: `ID token verification failed: ${e?.message || 'unknown'}` },
      { status: 401 }
    )
  }

  // 3) 发会话 cookie（jose HS256 签名，AUTH_SECRET）
  let session: string
  try {
    session = await signSession({
      sub: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Session sign failed.' }, { status: 500 })
  }

  const res = NextResponse.redirect(new URL('/app?login=success', req.nextUrl.origin))
  setCookie(res, COOKIE_SESSION, session, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  clearCookie(res, COOKIE_STATE, secure)
  clearCookie(res, COOKIE_VERIFIER, secure)
  return res
}
