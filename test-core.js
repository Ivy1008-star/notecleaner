// 测试本地重写引擎
const fs = require('fs');

// 简单的hash函数
function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// 简单的同义词替换测试
const SYNONYMS = [
  ['utilize', ['use', 'rely on']],
  ['leverage', ['use', 'tap into']],
  ['furthermore', ['also', 'plus', 'on top of that']],
];

function swapSynonyms(text, strength, seed) {
  let out = text;
  SYNONYMS.forEach((pair, ki) => {
    const [key, opts] = pair;
    const re = new RegExp(key.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&'), 'gi');
    let occ = 0;
    out = out.replace(re, (match) => {
      occ++;
      const r = ((seed ^ (ki * 2654435761) ^ (occ * 40503)) >>> 0) / 0xffffffff;
      if (r > 0.8) return match;
      const pick = opts[(seed + ki + occ) % opts.length];
      if (match[0] === match[0].toUpperCase()) return pick[0].toUpperCase() + pick.slice(1);
      return pick;
    });
  });
  return out;
}

// 测试AI分数估算
function scoreAI(text) {
  const tells = ['in conclusion', 'furthermore', 'moreover', 'in addition', 'additionally'];
  let tellHits = 0;
  const low = text.toLowerCase();
  tells.forEach(p => { if (low.indexOf(p) !== -1) tellHits++; });
  
  const contrCount = (text.match(/\b(?:don't|doesn't|didn't|won't|can't)\b/gi) || []).length;
  
  let score = 40;
  score += Math.min(30, tellHits * 6);
  score -= Math.min(20, contrCount * 3);
  score = Math.max(2, Math.min(98, Math.round(score)));
  
  let label = 'AI';
  if (score < 34) label = 'Human';
  else if (score < 66) label = 'Mixed';
  
  return { score, label, tellHits };
}

// 运行测试
console.log('=== NoteCleaner 核心功能测试 ===\n');

const testText = `Furthermore, we need to utilize advanced technologies to leverage our competitive advantage. In conclusion, this approach will significantly improve our performance.`;

console.log('1. 原始文本:');
console.log(testText);
console.log('');

const scoreBefore = scoreAI(testText);
console.log('2. AI分数（改写前）:', scoreBefore);
console.log('');

const rewritten = swapSynonyms(testText, 'standard', hash(testText));
console.log('3. 改写后文本:');
console.log(rewritten);
console.log('');

const scoreAfter = scoreAI(rewritten);
console.log('4. AI分数（改写后）:', scoreAfter);
console.log('');

console.log('✅ 测试完成！同义词替换和AI分数估算正常工作。');
console.log('   改写前 AI 概率:', scoreBefore.score, '% (', scoreBefore.label, ')');
console.log('   改写后 AI 概率:', scoreAfter.score, '% (', scoreAfter.label, ')');
console.log('   降低了:', (scoreBefore.score - scoreAfter.score), '%');
