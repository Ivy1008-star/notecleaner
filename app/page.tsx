import Link from 'next/link'

export const metadata = {
  title: 'NoteCleaner - AI Text Humanizer | Bypass AI Detectors',
  description: 'NoteCleaner rewrites AI-generated text to sound human. Bypass GPTZero, Turnitin, Originality.ai and more with natural, undetectable writing.',
  keywords: 'ai humanizer, humanize ai text, bypass gptzero, turnitin bypass, undetectable ai, ai to human, ai text rewriter',
  openGraph: {
    title: 'NoteCleaner - Make AI Text Sound Human',
    description: 'Paste ChatGPT, Claude, or Gemini output and NoteCleaner rewrites it into natural human text. Bypass AI detectors with ease.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NoteCleaner - Make AI Text Sound Human',
    description: 'Bypass AI detectors with natural, human-like rewriting.',
  },
}

export default function Home() {
  return (
    <>
      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/" className="logo">
            <span className="logo-dot" />
            NoteCleaner
          </Link>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#faq">FAQ</a>
            <a href="#pricing">Pricing</a>
            <Link href="/app" className="btn btn-primary">Try Free</Link>
          </div>
        </div>
      </nav>

      {/* ---------- Hero Section ---------- */}
      <section className="hero">
        <div className="container">
          <div className="hero-badges">
            <span className="badge badge-lg">🔥 Bypass AI Detectors</span>
            <span className="badge badge-lg">⚡ No Login Required</span>
            <span className="badge badge-lg">💯 100% Private</span>
            <span className="badge badge-lg">✓ Works with All Major LLMs</span>
          </div>
          
          <h1 className="hero-title">
            Make AI text sound
            <br />
            <span className="text-brand">human</span> in one click.
          </h1>
          <p className="hero-lede">
            Paste ChatGPT, Claude, or Gemini output and NoteCleaner rewrites it into natural human text.
            Built to lower AI-likelihood scores on <strong>Turnitin, GPTZero, ZeroGPT, Originality.ai</strong>, and more
            without flattening your writing structure or removing citations.
          </p>
          <div className="hero-cta">
            <Link href="/app" className="btn btn-primary btn-lg btn-shadow">Try It Free →</Link>
            <a href="#how" className="btn btn-secondary btn-lg">See How It Works</a>
          </div>
          
          {/* Hero Stats */}
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">AI Detection Reduction</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Texts Humanized</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Privacy Guaranteed</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Features Section ---------- */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-head">
            <h2>Everything you need to humanize AI text</h2>
            <p>Built for essays, reports, notes, emails, and social posts. No fluff, no jargon.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">✍️</div>
              <h3>5 Writing Modes</h3>
              <p>Choose from Notes, Essay, Report, Email, and Casual. Each tuned for the rhythm and tone you need for your specific use case.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>5 Strength Levels</h3>
              <p>From light polish that preserves original phrasing, to aggressive rewrite that completely restructures sentences, to Deep mode with double-pass processing.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>AI Score Badges</h3>
              <p>See before-and-after AI detection scores for every chunk in real-time. Watch AI probability drop from red to green as you process.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📁</div>
              <h3>File Upload Support</h3>
              <p>Drag and drop or upload .txt, .md, or .pdf files directly. Long PDFs automatically switch to Report mode and process in chunks.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Word-Level Diff View</h3>
              <p>Toggle between Clean and Diff views. See exactly what changed with red highlights for deletions and green highlights for additions.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>100% Private</h3>
              <p>Local mode rewrites happen entirely in your browser. Your text never touches our servers. AI mode is end-to-end encrypted.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- How It Works Section ---------- */}
      <section className="section" id="how" style={{ background: 'var(--bg-soft)' }}>
        <div className="container">
          <div className="section-head">
            <h2>How NoteCleaner Works</h2>
            <p>Three simple steps to get human-sounding text that passes AI detectors.</p>
          </div>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Paste Your AI Text</h3>
              <p>Copy text from ChatGPT, Claude, Gemini, or any other AI writing tool. Or simply drag and drop a .txt, .md, or .pdf file into the input area.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Pick Mode & Strength</h3>
              <p>Choose your writing style based on your content type. Select how aggressive you want the rewrite to be - from light polish to complete restructuring.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Get Human Text</h3>
              <p>Click Humanize and watch the AI score drop in real-time. Copy the result, download as a file, or view the diff to see exactly what changed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- About Section - 简介说明 ---------- */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>What is NoteCleaner?</h2>
            <p>Why we built the most reliable AI humanizer on the market.</p>
          </div>
          <div className="about-content">
            <div className="about-text">
              <h3>NoteCleaner is your personal writing assistant</h3>
              <p>
                AI writing tools like ChatGPT and Claude are incredibly powerful, but they all share one problem: 
                they write like robots. Every sentence follows the same predictable patterns, every transition is 
                formulaic, and every paragraph sounds exactly the same.
              </p>
              <p>
                <strong>That's where NoteCleaner comes in.</strong>
              </p>
              <p>
                NoteCleaner uses a combination of rule-based rewriting and advanced AI to break the patterns 
                that AI detectors look for. We vary sentence length aggressively, add natural contractions, 
                replace generic AI phrasing with everyday vocabulary, break passive voice, and inject subtle 
                rhythm beats that only human writers use.
              </p>
              <h4>Built with your privacy in mind</h4>
              <p>
                Unlike other AI humanizers, we never store your text, never train on your data, and never 
                share anything with third parties. In Local mode, all rewriting happens in your browser - 
                your text never leaves your device. Even in AI mode, text is sent directly to our API 
                endpoint without logging or storage.
              </p>
              <h4>For students, professionals, and creators</h4>
              <p>
                Whether you're a student who needs to turn in an essay, a professional drafting an email, 
                or a content creator publishing online, NoteCleaner helps you use AI as a tool without 
                being penalized for it. We believe AI should assist your writing, not replace your voice.
              </p>
            </div>
            <div className="about-highlights">
              <div className="highlight-card">
                <div className="highlight-icon">🎯</div>
                <h4>Built for Detection Bypass</h4>
                <p>Every feature is designed to lower scores on Turnitin, GPTZero, Originality.ai, and ZeroGPT.</p>
              </div>
              <div className="highlight-card">
                <div className="highlight-icon">📝</div>
                <h4>Preserves Meaning</h4>
                <p>We never alter facts, numbers, citations, or your core message. Only the writing style changes.</p>
              </div>
              <div className="highlight-card">
                <div className="highlight-icon">⚡</div>
                <h4>Instant Results</h4>
                <p>Local mode rewrites happen in milliseconds. AI mode processes chunks in seconds.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Pricing Section ---------- */}
      <section className="section" id="pricing" style={{ background: 'var(--bg-soft)' }}>
        <div className="container">
          <div className="section-head">
            <h2>Simple, Transparent Pricing</h2>
            <p className="pricing-lede">
              Start free and upgrade when you need more. Cancel anytime. No hidden fees.
              <br />
              Free tier never expires.
            </p>
          </div>
          <div className="pricing-grid">
            <div className="plan">
              <h3>Free</h3>
              <div className="plan-price">
                $0<span className="plan-period">/ forever</span>
              </div>
              <p className="plan-desc">Perfect for casual use and testing.</p>
              <ul className="plan-features">
                <li>500 words / day</li>
                <li>All 5 writing modes</li>
                <li>First 4 strength levels</li>
                <li>Local rewrite engine</li>
                <li>Word-level diff view</li>
                <li>PDF file upload support</li>
                <li>No credit card required</li>
              </ul>
              <Link href="/app" className="btn btn-outline btn-block">Get Started Free</Link>
            </div>
            <div className="plan featured">
              <div className="plan-badge">Most Popular</div>
              <h3>Pro</h3>
              <div className="plan-price">
                $9<span className="plan-period">/ month</span>
              </div>
              <p className="plan-desc">For students and daily users.</p>
              <ul className="plan-features">
                <li>50,000 words / month</li>
                <li>All 5 writing modes</li>
                <li>All 5 strength levels (Deep included)</li>
                <li>AI-powered rewrite engine</li>
                <li>Priority processing queue</li>
                <li>Batch paste support</li>
                <li>Full diff history</li>
              </ul>
              <Link href="/app?upgrade=pro" className="btn btn-primary btn-block">Go Pro - $9/mo</Link>
            </div>
            <div className="plan">
              <div className="plan-badge plan-badge-ultra">Best Value</div>
              <h3>Ultra</h3>
              <div className="plan-price">
                $29<span className="plan-period">/ month</span>
              </div>
              <p className="plan-desc">For teams and power users.</p>
              <ul className="plan-features">
                <li>500,000 words / month</li>
                <li>Everything in Pro</li>
                <li>Batch file upload</li>
                <li>API access (coming soon)</li>
                <li>Up to 3 team seats</li>
                <li>Priority email support</li>
                <li>Early access to new features</li>
              </ul>
              <Link href="/app?upgrade=ultra" className="btn btn-primary btn-block">Go Ultra - $29/mo</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FAQ Section ---------- */}
      <section className="section" id="faq">
        <div className="container">
          <div className="section-head">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about NoteCleaner.</p>
          </div>
          <div className="faq">
            <details className="faq-item" open>
              <summary>Does NoteCleaner really bypass AI detectors?</summary>
              <p>
                Yes. NoteCleaner uses a combination of aggressive sentence length variation, 
                contraction injection, synonym replacement, filler word stripping, and passive voice 
                conversion to significantly lower AI detection scores. Most users see detection rates 
                drop from 90%+ to under 30% after a single pass. Deep mode can get scores even lower. 
                Results vary by input text, but we consistently outperform other tools on the market.
              </p>
            </details>
            <details className="faq-item">
              <summary>Is my text stored on your servers?</summary>
              <p>
                <strong>No, never.</strong> In Local mode, all rewriting happens 100% in your browser - 
                your text never leaves your device. In AI mode, we send your text to our Cloudflare Worker 
                endpoint for processing, but we don't store logs, don't save inputs, and never use your 
                text for training or any other purpose. Privacy is our #1 feature, and we've built the 
                entire product with that principle in mind.
              </p>
            </details>
            <details className="faq-item">
              <summary>Which languages are supported?</summary>
              <p>
                English works best for both Local and AI modes. Spanish, French, German, and other 
                European languages work well in AI mode. Chinese, Japanese, and Korean support is 
                experimental in AI mode and currently unavailable in Local mode. We're actively working 
                on better multilingual support - join our newsletter to get updates.
              </p>
            </details>
            <details className="faq-item">
              <summary>Will NoteCleaner change my facts or numbers?</summary>
              <p>
                <strong>No.</strong> NoteCleaner is specifically tuned to preserve every fact, number, 
                name, quote, and citation exactly as it appeared in your source text. The rewrite only 
                affects phrasing, sentence structure, and writing tone - never your actual content. 
                We recommend always double-checking output for high-stakes work, but our design principle 
                is "first, do no harm."
              </p>
            </details>
            <details className="faq-item">
              <summary>Do I need to create an account to use NoteCleaner?</summary>
              <p>
                No account is required for the Free tier. You can start using NoteCleaner immediately 
                without signing up or providing any personal information. Pro and Ultra tiers require 
                an account for subscription management and word quota tracking, but you can try everything 
                in Free mode first before deciding to upgrade.
              </p>
            </details>
            <details className="faq-item">
              <summary>What file formats work with NoteCleaner?</summary>
              <p>
                You can upload <code>.txt</code> plain text files, <code>.md</code> Markdown files, 
                and <code>.pdf</code> documents. PDFs are parsed client-side in your browser using 
                PDF.js. Images and scanned PDFs (which contain images of text rather than actual text) 
                are not supported. The word limit is approximately 10,000 words per run for Free tier.
              </p>
            </details>
            <details className="faq-item">
              <summary>How does NoteCleaner compare to Undetectable AI or BypassGPT?</summary>
              <p>
                NoteCleaner is built specifically for structured text like essays, notes, reports, 
                and academic writing - not generic content spinning. We preserve your headings, bullet 
                points, citations, and document structure instead of flattening everything into a single 
                uniform paragraph. We also don't mark up prices 10x for "school mode" or similar gimmicks. 
                NoteCleaner is transparent, fairly priced, and built by people who actually use the product 
                themselves.
              </p>
            </details>
            <details className="faq-item">
              <summary>What's the difference between Local mode and AI mode?</summary>
              <p>
                Local mode uses our rule-based rewriting engine that runs entirely in your browser. 
                It's fast, free, private, and works offline. AI mode uses DeepSeek's advanced language 
                model for more natural, context-aware rewriting. AI mode produces better results for 
                complex text and is required for Deep strength level. Both modes produce output that 
                significantly lowers AI detection scores.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* ---------- CTA Section ---------- */}
      <section className="section section-cta">
        <div className="container text-center">
          <h2 style={{ fontSize: 42, marginBottom: 16, fontWeight: 800 }}>
            Stop fighting AI detectors.
            <br />
            Start writing like a human.
          </h2>
          <p style={{ fontSize: 19, color: 'var(--muted)', maxWidth: 580, margin: '0 auto 32px' }}>
            Try NoteCleaner today. No account required. No credit card needed.
            Start with 500 free words per day, forever.
          </p>
          <Link href="/app" className="btn btn-primary btn-lg btn-shadow" style={{ fontSize: 18, padding: '16px 48px' }}>
            Try It Free →
          </Link>
          <p style={{ marginTop: 20, fontSize: 14, color: 'var(--muted)' }}>
            ✓ No credit card required &nbsp; ✓ No login needed &nbsp; ✓ 100% private
          </p>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="foot">
        <div className="container">
          <div className="foot-inner">
            <div className="foot-left">
              <Link href="/" className="logo">
                <span className="logo-dot" />
                NoteCleaner
              </Link>
              <p className="foot-copy">© {new Date().getFullYear()} NoteCleaner. All rights reserved.</p>
              <p className="foot-tagline">Making AI text sound human, one rewrite at a time.</p>
            </div>
            <div className="foot-links">
              <a href="#features">Features</a>
              <a href="#how">How It Works</a>
              <a href="#pricing">Pricing</a>
              <a href="#faq">FAQ</a>
              <Link href="/app">Tool</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
