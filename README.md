# NoteCleaner

AI Note Humanizer built with Next.js 14.

Turn AI-generated text into natural human writing. Bypass AI detectors.

## Why this structure is safe

The DeepSeek API key is **never** exposed to the browser. It lives only in:
- a server-side API route (`app/api/humanize/route.ts`)
- your local `.env.local` (gitignored)
- Vercel's Environment Variables (server-side only)

The client (`app/page.tsx`) only talks to `/api/humanize`. The key is never bundled into client JS.

## Features

- Next.js 14 App Router
- DeepSeek AI integration (server-side, key safe)
- Vercel one-click deploy

## Local dev

```bash
cp .env.local.example .env.local   # then paste your key
npm install
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import repo at https://vercel.com/new
3. Add Environment Variable: `DEEPSEEK_API_KEY` = your key
4. Deploy
