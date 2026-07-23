import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const MODE_LABEL: Record<string, string> = {
  notes: 'study notes',
  essay: 'essay',
  email: 'email',
  report: 'report',
  social: 'social media post',
}

const STRENGTH_RULE: Record<string, string> = {
  polish: 'Make minor polish edits; keep the original structure mostly intact.',
  light: 'Lightly humanize with subtle, natural changes.',
  standard: 'Standard humanization: natural, varied sentence rhythm.',
  aggressive: 'Aggressively rewrite so it reads fully like a human wrote it.',
  deep: 'Deep rewrite: restructure for maximum naturalness and flow.',
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Server is missing DEEPSEEK_API_KEY environment variable.' },
      { status: 500 }
    )
  }

  let body: { text?: string; mode?: string; strength?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const text = (body.text || '').trim()
  if (!text) {
    return NextResponse.json({ error: 'No text provided.' }, { status: 400 })
  }

  const mode = MODE_LABEL[body.mode || 'notes'] || MODE_LABEL.notes
  const strength = STRENGTH_RULE[body.strength || 'standard'] || STRENGTH_RULE.standard

  const systemPrompt =
    `You are a human writing expert. Rewrite the following ${mode} to sound natural, human, ` +
    `and undetectable by AI detectors. ${strength} Vary sentence length. Use contractions where ` +
    `natural. Preserve all facts exactly. Return only the rewritten text, with no preamble.`

  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.85,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return NextResponse.json(
        { error: `DeepSeek API error (${res.status}): ${detail.slice(0, 300)}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    const result = data?.choices?.[0]?.message?.content || ''
    return NextResponse.json({ result })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to reach DeepSeek API.' }, { status: 502 })
  }
}
