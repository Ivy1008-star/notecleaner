// Edge 安全的 Google OAuth 辅助（不依赖任何 Node 专属 SDK）。
// 全部基于 Web Crypto（crypto.subtle / crypto.getRandomValues）+ fetch + jose。
// 用于 Cloudflare Pages Functions（仅 Edge 运行时）。

import { createRemoteJWKSet, jwtVerify, SignJWT } from 'jose'

// ---------- Cookie 名 ----------
export const COOKIE_STATE = 'nc_oauth_state'
export const COOKIE_VERIFIER = 'nc_oauth_verifier'
export const COOKIE_SESSION = 'nc_session'

// ---------- 随机 / base64url ----------
function randomBytes(n: number): Uint8Array {
  const a = new Uint8Array(n)
  crypto.getRandomValues(a)
  return a
}

function toBase64Url(bytes: Uint8Array): string {
  let str = ''
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function randomToken(byteLen = 32): string {
  return toBase64Url(randomBytes(byteLen))
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return toBase64Url(new Uint8Array(hash))
}

// ---------- Cookie 帮助函数 ----------
export interface CookieOpts {
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax' | 'strict' | 'none'
  path: string
  maxAge: number
}

export function setCookie(
  res: Response,
  name: string,
  value: string,
  opts: CookieOpts
) {
  // NextResponse.cookies 在某些版本对 maxAge 字段名为 maxAge；直接走原生头最稳
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${opts.path}`,
    `Max-Age=${opts.maxAge}`,
    `HttpOnly`,
    `SameSite=${opts.sameSite}`,
  ]
  if (opts.secure) parts.push('Secure')
  res.headers.append('Set-Cookie', parts.join('; '))
}

export function clearCookie(res: Response, name: string, secure: boolean) {
  const parts = [
    `${name}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (secure) parts.push('Secure')
  res.headers.append('Set-Cookie', parts.join('; '))
}

// ---------- Google ID Token 校验（JWKS，Edge 安全） ----------
// 缓存 JWK set，避免每次请求都拉取
let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null
function googleJwks() {
  if (!_jwks) {
    _jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))
  }
  return _jwks
}

export interface GoogleProfile {
  sub: string
  email: string
  name: string
  picture: string
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const { payload } = await jwtVerify(idToken, googleJwks(), {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: clientId,
  })
  return {
    sub: String(payload.sub || ''),
    email: String(payload.email || ''),
    name: String(payload.name || ''),
    picture: String(payload.picture || ''),
  }
}

// ---------- 会话 JWT（HS256，用 AUTH_SECRET 签名） ----------
function sessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('Missing AUTH_SECRET')
  return new TextEncoder().encode(secret)
}

export interface SessionData {
  sub: string
  email: string
  name: string
  picture: string
}

export async function signSession(data: SessionData): Promise<string> {
  return await new SignJWT({ ...data })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(sessionSecret())
}

export async function verifySession(token: string): Promise<SessionData> {
  const { payload } = await jwtVerify(token, sessionSecret())
  return {
    sub: String(payload.sub || ''),
    email: String(payload.email || ''),
    name: String(payload.name || ''),
    picture: String(payload.picture || ''),
  }
}
