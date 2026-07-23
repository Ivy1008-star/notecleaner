'use client'

import { useEffect, useState } from 'react'

type User = { sub: string; email: string; name: string; picture: string }

// Google 登录入口：未登录显示「Sign in with Google」，已登录显示头像+退出。
// 纯前端，调用 /api/auth/* 路由（这些路由跑在 Edge，jose+fetch 实现）。
export function GoogleAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  if (loading) {
    return <span className="text-[13px] text-slate-400">…</span>
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.picture && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.picture} alt="" className="h-7 w-7 rounded-full" />
        )}
        <span className="max-w-[140px] truncate text-[13px] text-slate-600">
          {user.name || user.email}
        </span>
        <button
          onClick={logout}
          className="text-[12px] text-slate-400 underline hover:text-slate-600"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <a
      href="/api/auth/google"
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
    >
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.5 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.2 13.4 17.5 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.7-9.9 6.7-17.4z" />
        <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C1 14.5 0 19 0 24s1 9.5 2.6 13.8l7.8-6.1z" />
        <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.3-5.7c-2 1.4-4.7 2.3-7.7 2.3-6.5 0-11.8-3.9-13.6-9.4l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
      </svg>
      Sign in with Google
    </a>
  )
}
