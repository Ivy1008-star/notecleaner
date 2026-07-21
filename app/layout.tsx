import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NoteCleaner - AI Note Humanizer',
  description: 'Turn AI-generated notes into natural human writing. Rewrite essays, reports, emails. Bypass AI detectors.',
  keywords: 'ai humanizer, humanize ai text, bypass ai detector, chatgpt to human',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
