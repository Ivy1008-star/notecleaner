import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NoteCleaner - Make AI text sound human',
  description: 'NoteCleaner rewrites your ChatGPT, Gemini or Claude drafts into natural, undetectable writing. Bypass AI detectors. Keep your voice.',
  keywords: 'ai humanizer, humanize ai text, bypass ai detector, chatgpt to human, undetectable writing',
  metadataBase: new URL('https://notecleaner.vercel.app'),
  openGraph: {
    title: 'NoteCleaner - Make AI text sound human',
    description: 'Rewrite AI drafts into natural, undetectable writing. Bypass AI detectors. Keep your voice.',
    type: 'website',
    siteName: 'NoteCleaner',
    locale: 'en_US',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'NoteCleaner - Make AI text sound human' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NoteCleaner - Make AI text sound human',
    description: 'Rewrite AI drafts into natural, undetectable writing. Bypass AI detectors. Keep your voice.',
    images: ['/og.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
