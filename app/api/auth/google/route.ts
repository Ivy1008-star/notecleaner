import { NextRequest, NextResponse } from 'next/server'
import { randomToken, pkceChallenge, setCookie, COOKIE_STATE, COOKIE_VERIFIER } from '@/lib/auth'

export const runtime = 'edge'

// 发起 Google OAuth（含 PKCE + state，防 CSRF / 拦截）。
// 把 state 与 PKCE verifier 存进 httpOnly cookie，回调时校验。
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID.' },
      { status: 500 }
    )
  }

  const state = randomToken(32)
  const verifier = randomToken(64)
  const challenge = await pkceChallenge(verifier)
  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'select_account',
  })
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  const secure = req.nextUrl.protocol === 'https:'
  const res = NextResponse.redirect(authUrl)
  const opts = { httpOnly: true, secure, sameSite: 'lax' as const, path: '/', maxAge: 600 }
  setCookie(res, COOKIE_STATE, state, opts)
  setCookie(res, COOKIE_VERIFIER, verifier, opts)
  return res
}
