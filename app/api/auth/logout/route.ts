import { NextRequest, NextResponse } from 'next/server'
import { clearCookie, COOKIE_SESSION } from '@/lib/auth'

export const runtime = 'edge'

// 退出登录：清会话 cookie。
export async function POST(req: NextRequest) {
  const secure = req.nextUrl.protocol === 'https:'
  const res = NextResponse.json({ ok: true })
  clearCookie(res, COOKIE_SESSION, secure)
  return res
}
