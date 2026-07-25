/**
 * NoteCleaner 本地规则重写引擎
 * 从纯JS版本完整移植
 */

export type Mode = 'notes' | 'essay' | 'report' | 'email' | 'social'
export type Strength = 'polish' | 'light' | 'standard' | 'aggressive' | 'deep'

export interface AIScoreResult {
  score: number | null
  avgLen: number
  burstiness: number
  tellHits: number
  label: 'AI' | 'Mixed' | 'Human'
}

const TELLS = [
  'in conclusion', 'furthermore', 'moreover', 'in addition', 'additionally',
  'it is important to note', 'delve into', 'delve', 'certainly!', 'certainly,',
  'as an ai', 'as a language model', 'in summary', 'to summarize', 'overall,',
  'in essence', 'multifaceted', 'comprehensive overview', 'critical role',
  'plays a crucial role', 'in the realm of', 'landscape of', 'leverage',
  'on the other hand', 'notably,', 'significantly,'
]

function sentences(t: string): string[] {
  return t.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-Z0-9(])/).filter(Boolean)
}

function words(t: string): string[] {
  return t.match(/[A-Za-z0-9']+/g) || []
}

function sd(arr: number[]): number {
  if (!arr.length) return 0
  const mean = arr.reduce((x, y) => x + y, 0) / arr.length
  return Math.sqrt(arr.reduce((x, y) => x + (y - mean) * (y - mean), 0) / arr.length)
}

export function scoreAI(text: string): AIScoreResult {
  if (!text || text.trim().length < 40) {
    return { score: null, avgLen: 0, burstiness: 0, tellHits: 0, label: 'Human' }
  }
  const low = text.toLowerCase()
  const lens = sentences(text).map(s => words(s).length).filter(n => n > 0)
  if (!lens.length) {
    return { score: null, avgLen: 0, burstiness: 0, tellHits: 0, label: 'Human' }
  }
  const avg = lens.reduce((a, b) => a + b, 0) / lens.length
  const wc = words(text).length
  const burst = wc > 0 ? sd(lens) / Math.max(1, avg) : 0
  
  let tellHits = 0
  TELLS.forEach(p => { if (low.indexOf(p) !== -1) tellHits++ })
  
  const contrCount = (text.match(/\b(?:don't|doesn't|didn't|won't|can't|couldn't|shouldn't|wouldn't|isn't|aren't|wasn't|weren't|i'm|i've|i'll|you're|you've|we're|they're|it's|that's|there's|let's)\b/gi) || []).length
  const contrDensity = contrCount / Math.max(1, wc / 100)
  
  let score = 40
  score += Math.min(30, tellHits * 6)
  if (avg > 22) score += 15
  else if (avg > 18) score += 8
  score += burst < 0.35 ? 15 : (burst < 0.5 ? 8 : 0)
  score -= Math.min(20, contrDensity * 8)
  score = Math.max(2, Math.min(98, Math.round(score)))
  
  let label: 'AI' | 'Mixed' | 'Human' = 'AI'
  if (score < 34) label = 'Human'
  else if (score < 66) label = 'Mixed'
  
  return { score, avgLen: Number(avg.toFixed(1)), burstiness: Number(burst.toFixed(2)), tellHits, label }
}

const SYNONYMS: [string, string[]][] = [
  ['utilize', ['use', 'rely on']],
  ['utilization', ['use', 'usage']],
  ['utilized', ['used']],
  ['utilizes', ['uses']],
  ['leverage', ['use', 'tap into']],
  ['leverages', ['uses', 'taps into']],
  ['leveraged', ['used', 'tapped into']],
  ['furthermore', ['also', 'plus', 'on top of that']],
  ['moreover', ['also', 'and', 'beyond that']],
  ['additionally', ['also', 'and', 'plus']],
  ['in addition', ['also', 'on top of that']],
  ['however', ['but', 'still', 'that said']],
  ['therefore', ['so', 'which means']],
  ['thus', ['so']],
  ['hence', ['so']],
  ['consequently', ['so', 'as a result']],
  ['in conclusion', ['so to wrap up', 'bottom line']],
  ['in summary', ['to sum up', 'the short version']],
  ['to summarize', ['put simply', 'the short version is']],
  ['it is important to note that', ['worth noting,', 'one thing to keep in mind:']],
  ['commonly known as', ['also called']],
  ['delve into', ['dig into', 'look at']],
  ['multifaceted', ['many-sided', 'layered']],
  ['comprehensive overview', ['full picture', 'big-picture look']],
  ['comprehensive', ['full', 'broad']],
  ['critical role', ['key part']],
  ['plays a crucial role', ['matters a lot']],
  ['numerous', ['many', 'a lot of']],
  ['obtain', ['get']],
  ['assist', ['help']],
  ['demonstrate', ['show']],
  ['demonstrated', ['shown', 'showed']],
  ['demonstrates', ['shows']],
  ['approximately', ['about', 'around']],
  ['individuals', ['people']],
  ['in order to', ['to']],
  ['due to the fact that', ['because']],
  ['a wide range of', ['lots of', 'many kinds of']],
  ['in the realm of', ['in']],
  ['navigate', ['work through', 'handle']],
  ['certainly!', ['', 'sure.']],
  ['certainly,', ['sure,', 'yeah,']],
  ['endeavor', ['try', 'work']],
  ['endeavors', ['tries', 'works']],
  ['facilitate', ['help', 'make easier']],
  ['facilitates', ['helps', 'makes easier']],
  ['facilitated', ['helped', 'made easier']],
  ['encompass', ['cover', 'include']],
  ['encompasses', ['covers', 'includes']],
  ['encompassed', ['covered', 'included']],
  ['exemplify', ['show', 'stand for']],
  ['exemplifies', ['shows', 'stands for']],
  ['exemplified', ['shown', 'stood for']],
  ['myriad', ['many', 'tons of']],
  ['plethora', ['a lot', 'tons']],
  ['subsequently', ['then', 'after that']],
  ['prior to', ['before']],
  ['following', ['after']],
  ['ascertain', ['figure out', 'find out']],
  ['elucidate', ['explain', 'spell out']],
  ['elucidates', ['explains', 'spells out']],
  ['elucidated', ['explained', 'spelled out']],
  ['exhibit', ['show']],
  ['exhibits', ['shows']],
  ['exhibited', ['shown']],
  ['furnish', ['give', 'provide']],
  ['furnishes', ['gives', 'provides']],
  ['furnished', ['gave', 'provided']],
  ['essentially', ['basically', 'at its core']],
  ['ultimately', ['in the end', 'finally']],
  ['notwithstanding', ['still', 'even so']],
  ['albeit', ['though', 'even if']],
  ['as such', ['so', "that's why"]],
  ['in light of', ['given', 'because of']],
  ['with regard to', ['about', 'when it comes to']],
  ['in terms of', ['for', 'when it comes to']],
  ['a myriad of', ['many', 'lots of']],
  ['various', ['a few', 'different']],
  ['substantial', ['big', 'sizable']],
  ['implementation', ['rollout', 'setup']],
  ['implementing', ['putting in place', 'rolling out']],
  ['implemented', ['put in place', 'rolled out']],
  ['significant', ['big', 'notable']],
  ['significantly', ['a lot', 'clearly']],
  ['remarkable', ['striking', 'notable']],
  ['remarkably', ['strikingly', 'notably']],
  ['seamlessly', ['smoothly', 'without a hitch']],
  ['holistic', ['all-around', 'whole-picture']],
  ['robust', ['solid', 'strong']],
  ['intricate', ['tangled', 'layered']],
  ['nuanced', ['subtle', 'layered']],
  ['paradigm', ['model', 'pattern']],
  ['cutting-edge', ['modern', 'state of the art']],
  ['state-of-the-art', ['modern', 'top-shelf']],
  ['game-changer', ['big shift', 'turning point']],
  ['diverse', ['varied', 'mixed']],
  ['realm', ['area', 'world']],
  ['landscape', ['scene', 'field']],
  ['tapestry', ['mix', 'weave']],
  ['furthermore,', ['also,', 'plus,']],
  ['moreover,', ['also,', 'and,']],
  ['additionally,', ['also,', 'plus,']],
  ['notably,', ['one thing:', 'of note,']],
  ['importantly,', ['worth flagging:', 'key point:']],
  ['specifically,', ['put another way:', 'to be exact,']],
  ['overall,', ['all in all,', 'on the whole,']]
]

const OPENERS: Record<Mode, string[]> = {
  notes: ['Basically,', 'So', 'Point is,', 'Put simply,', "Here's the gist:"],
  essay: ['To put it plainly,', 'In practice,', 'What this comes down to is:', 'Consider this:'],
  report: ['In practice,', 'On the ground,', 'From the data,', 'Looking at this,', 'In this section,'],
  email: ['Quick note:', 'Just a heads-up,', 'Wanted to flag that', 'One thing:'],
  social: ['Alright,', 'So basically,', 'Honestly,', 'Real talk,']
}

const RHYTHM_BEATS = [
  "That's the shape of it.",
  'Simple as that.',
  "That's the core.",
  'Nothing fancy.'
]

const FILLER_TRANSITIONS = /\b(certainly[!,.]?|absolutely[!,.]?|of course[!,.]?|in conclusion,?|to summarize,?|in summary,?|to put it simply,?|it is worth noting that|it should be noted that|needless to say,?)\s*/gi

function hash(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function contract(s: string): string {
  return s.replace(/\bdo not\b/g, "don't").replace(/\bDo not\b/g, "Don't")
    .replace(/\bdoes not\b/g, "doesn't").replace(/\bdid not\b/g, "didn't")
    .replace(/\bwill not\b/g, "won't").replace(/\bcannot\b/g, "can't")
    .replace(/\bcould not\b/g, "couldn't").replace(/\bshould not\b/g, "shouldn't")
    .replace(/\bwould not\b/g, "wouldn't").replace(/\bis not\b/g, "isn't")
    .replace(/\bare not\b/g, "aren't").replace(/\bwas not\b/g, "wasn't")
    .replace(/\bwere not\b/g, "weren't").replace(/\bIt is\b/g, "It's")
    .replace(/\bit is\b/g, "it's").replace(/\bThat is\b/g, "That's")
    .replace(/\bthat is\b/g, "that's").replace(/\bWe are\b/g, "We're")
    .replace(/\bwe are\b/g, "we're").replace(/\bThey are\b/g, "They're")
    .replace(/\bthey are\b/g, "they're").replace(/\bYou are\b/g, "You're")
    .replace(/\byou are\b/g, "you're").replace(/\bI am\b/g, "I'm")
}

function unpassivize(s: string): string {
  return s.replace(
    /\b(was|were|is|are|has been|have been)\s+([a-z]+ed|written|taken|given|shown|made|seen|held|known|found|built|driven|thought|caught|brought|bought|sought|taught|paid)\s+by\s+([^,.;:]+?)(?=[,.;:]|$)/gi,
    (_, aux, verb, agent) => agent.trim() + ' ' + verb + ' it'
  )
}

function breakLong(s: string, strength: Strength): string {
  const threshold = strength === 'deep' ? 80 : strength === 'aggressive' ? 120 : 140
  const parts = s.split(/, (?=which|and|but|so|because|although|however|therefore|moreover)/gi)
  if (parts.length >= 2 && s.length > threshold) {
    return parts.map((p, i) => {
      p = p.trim()
      if (i > 0) p = p[0].toUpperCase() + p.slice(1)
      if (!/[.!?]$/.test(p)) p += '.'
      return p
    }).join(' ')
  }
  if (strength === 'deep' && s.length > threshold) {
    const alt = s.split(/, (?=[a-z])/)
    if (alt.length >= 3) {
      return alt.map((p, i) => {
        p = p.trim()
        if (i > 0) p = p[0].toUpperCase() + p.slice(1)
        if (!/[.!?]$/.test(p)) p += '.'
        return p
      }).join(' ')
    }
  }
  return s
}

function swapSynonyms(text: string, strength: Strength, seed: number): string {
  const gate = strength === 'polish' ? 0 : strength === 'light' ? 0.4 : strength === 'aggressive' ? 1 : strength === 'deep' ? 1 : 0.8
  if (gate === 0) return text
  let out = text
  // 按 key 长度降序排列，确保 longer match 优先
  const sorted = [...SYNONYMS].sort((a, b) => b[0].length - a[0].length)
  sorted.forEach((pair, ki) => {
    const [key, opts] = pair
    // 使用单词边界：避免 "demonstrated" 被匹配成 "demonstrate"+"d" → "showd"
    const escaped = key.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')
    const re = new RegExp('(?<![a-zA-Z])' + escaped + '(?![a-zA-Z])', 'gi')
    let occ = 0
    out = out.replace(re, match => {
      occ++
      const r = ((seed ^ (ki * 2654435761) ^ (occ * 40503)) >>> 0) / 0xffffffff
      if (r > gate) return match
      let pick = opts[(seed + ki + occ) % opts.length]
      if (pick === '') return ''
      if (match[0] === match[0].toUpperCase()) pick = pick[0].toUpperCase() + pick.slice(1)
      return pick
    })
  })
  return out.replace(/  +/g, ' ').replace(/ ([,.;:!?])/g, '$1')
}


function rewriteParagraph(par: string, mode: Mode, strength: Strength, seed: number): string {
  const lines = par.split(/\n/)
  return lines.map(line => {
    if (!line.trim()) return line
    const bulletMatch = line.match(/^(\s*(?:[-*+]|\d+\.)\s+)(.*)$/)
    let prefix = '', body = line
    if (bulletMatch) { prefix = bulletMatch[1]; body = bulletMatch[2] }
    
    if (strength === 'polish' || strength === 'deep') {
      body = body.replace(FILLER_TRANSITIONS, '')
    }
    if (strength === 'aggressive' || strength === 'deep') {
      body = unpassivize(body)
    }
    
    const sents = sentences(body)
    const out = sents.map((s, i) => {
      if (strength !== 'polish') s = breakLong(s, strength)
      s = swapSynonyms(s, strength, seed + i * 17)
      if (strength === 'deep') s = swapSynonyms(s, strength, seed + i * 17 + 9973)
      s = contract(s)
      
      const openList = OPENERS[mode] || OPENERS.notes
      const prob = strength === 'deep' ? 0.5 : strength === 'aggressive' ? 0.35 : strength === 'standard' ? 0.2 : strength === 'light' ? 0.08 : 0
      const r = ((seed ^ i * 104729) >>> 0) / 0xffffffff
      
      if (prob > 0 && i > 0 && !bulletMatch && r < prob) {
        const pick = openList[(seed + i) % openList.length]
        s = pick + ' ' + s[0].toLowerCase() + s.slice(1)
      }
      
      if ((strength === 'deep' || strength === 'aggressive') && s.length > 110) {
        const r2 = ((seed ^ i * 2246822519) >>> 0) / 0xffffffff
        if (r2 < (strength === 'deep' ? 0.4 : 0.22)) {
          const beat = RHYTHM_BEATS[(seed + i) % RHYTHM_BEATS.length]
          if (!/[.!?]$/.test(s)) s += '.'
          s = s + ' ' + beat
        }
      }
      
      return s
    }).join(' ')
    
    return prefix + out.replace(/  +/g, ' ').replace(/^\s+/, '')
  }).join('\n')
}

export interface HumanizeOptions {
  mode?: Mode
  strength?: Strength
  nonce?: number
}

export function humanize(text: string, options: HumanizeOptions = {}): string {
  const mode = options.mode || 'notes'
  const strength = options.strength || 'standard'
  const nonce = options.nonce || 0
  const seed = hash(text + '|' + mode + '|' + strength + '|' + nonce)
  const paragraphs = text.split(/\n{2,}/)
  return paragraphs.map(p => rewriteParagraph(p, mode, strength, seed)).join('\n\n')
}
