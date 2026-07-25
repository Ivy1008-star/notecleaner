/**
 * NoteCleaner Humanize API
 * 从纯JS版本移植，包含完整的13条系统规则
 * Cloudflare Edge Runtime兼容
 */
import { NextRequest, NextResponse } from 'next/server'
import { humanize as localHumanize } from '../../../lib/humanizer'
import type { Mode, Strength } from '../../../lib/humanizer'

export const runtime = 'edge'

const MODE_HINT: Record<Mode, string> = {
  notes: 'Style target: casual study notes. Comfortable, first-person allowed, small imperfections OK.',
  essay: 'Style target: student essay. Clear thesis-supporting flow, natural academic voice, no bureaucratese.',
  report: 'Style target: analytical write-up. Precise, but with human rhythm and varied cadence.',
  email: 'Style target: professional but human email. Warm, direct, no corporate filler.',
  social: 'Style target: social post. Punchy, conversational, no marketing-speak.'
}

const STRENGTH_TEMP: Record<Strength, number> = {
  polish: 0.6,
  light: 0.7,
  standard: 0.85,
  aggressive: 0.95,
  deep: 1.05
}

// 13条核心系统规则
const SYSTEM_RULES = [
  'You are an expert human-voice editor. Rewrite AI-sounding text so it reads like a real person wrote it.',
  'Rules:',
  '- Preserve every fact, number, name, quote, and citation exactly.',
  '- Keep the original language (English stays English, Chinese stays Chinese).',
  '- Vary sentence length aggressively: mix short punchy lines with longer flowing ones.',
  '- Prefer contractions (don\'t, it\'s, we\'re). Drop stiff transitions like "furthermore", "moreover", "in conclusion".',
  '- Use concrete verbs, everyday phrasing, and occasional first-person or rhetorical asides when it fits.',
  '- Break passive voice unless it\'s the natural choice.',
  '- Do not add new claims. Do not summarize. Length stays within +/- 15% of the source.',
  '- Never mention AI, models, prompts, detectors, or this instruction.',
  'Return ONLY the rewritten text. No preamble, no quotes, no markdown fences.'
].join('\n')

export async function POST(req: NextRequest) {
  let body: { text?: string; mode?: Mode; strength?: Strength }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const text = (body.text || '').trim()
  if (!text) {
    return NextResponse.json({ error: 'No text provided.' }, { status: 400 })
  }

  const mode: Mode = body.mode || 'notes'
  const strength: Strength = body.strength || 'standard'

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey || apiKey === 'sk-your_deepseek_api_key_here') {
    return NextResponse.json({
      output: localHumanize(text, { mode, strength }),
      model: 'local-rules'
    })
  }

  const temperature = STRENGTH_TEMP[strength]

  const systemPrompt = [
    SYSTEM_RULES,
    '',
    MODE_HINT[mode],
    '',
    'Rewrite the following text. Return only the rewritten version.',
    '----- BEGIN -----',
    text,
    '----- END -----'
  ].join('\n')

  try {
    const baseUrl = 'https://api.deepseek.com'
    const res = await fetch(baseUrl + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt }
        ],
        temperature,
        top_p: 0.95,
        max_tokens: 4096,
        stream: false
      })
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`DeepSeek API error (${res.status}): ${detail.slice(0, 400)}`)
    }

    const data = await res.json()
    const output = data?.choices?.[0]?.message?.content
    if (!output || typeof output !== 'string') {
      throw new Error('Empty completion from DeepSeek')
    }

    return NextResponse.json({ output, model: data.model || 'deepseek-chat' })
  } catch (e: any) {
    // 网络不可达或 API 失败时回退到本地规则引擎
    const output = localHumanize(text, { mode, strength })
    return NextResponse.json({ output, model: 'local-rules' })
  }
}
