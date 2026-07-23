import { NextRequest, NextResponse } from 'next/server'
import { verifySession, COOKIE_SESSION } from '@/lib/auth'

export const runtime = 'edge'

// 读取当前登录用户（前端轮询 / 初始化用）。
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_SESSION)?.value
  if (!token) return NextResponse.json({ user: null })
  try {
    const p = await verifySession(token)
    return NextResponse.json({
      user: { sub: p.sub, email: p.email, name: p.name, picture: p.picture },
    })
  } catch {
    return NextResponse.json({ user: null })
  }
}
