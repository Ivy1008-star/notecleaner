import Link from 'next/link'
import { PlanButton } from './PricingActions'
import { GoogleAuth } from './GoogleAuth'

export default function Home() {
  return (
    <>
      {/* ---------- Nav ---------- */}
      <header className="nav">
        <div className="container nav-inner">
          <div className="logo"><span className="logo-dot" />NoteCleaner</div>
          <nav className="nav-links">
            <a href="#features" className="hide-sm">Features</a>
            <a href="#pricing" className="hide-sm">Pricing</a>
            <a href="#faq" className="hide-sm">FAQ</a>
            <GoogleAuth />
            <Link href="/app" className="btn btn-primary">Open Tool →</Link>
          </nav>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="container">
          <span className="badge">🔥 Bypass AI detectors. Keep your voice.</span>
          <h1>Make AI text sound human.<br />In one click.</h1>
          <p className="sub">
            NoteCleaner rewrites your ChatGPT, Gemini or Claude drafts into natural,
            undetectable writing. Built for students, writers and professionals who
            don&apos;t want a robot voice giving them away.
          </p>
          <div className="hero-cta">
            <Link href="/app" className="btn btn-primary btn-lg">Try it free →</Link>
            <a href="#demo" className="btn btn-ghost btn-lg">See how it works</a>
          </div>
          <div className="trust-line">
            <span>✓ No sign-up required</span>
            <span>✓ 500 free words / day</span>
            <span>✓ We never store your text</span>
          </div>
        </div>
      </section>

      {/* ---------- Before / After ---------- */}
      <section className="section" id="demo">
        <div className="container">
          <div className="section-head">
            <h2>See the difference</h2>
            <p>Same meaning. Same facts. Zero robot smell.</p>
          </div>
          <div className="ba-grid">
            <div className="ba-card before">
              <span className="ba-tag before">Before · AI-generated</span>
              <p>
                Artificial intelligence has revolutionized the way in which we approach
                the task of writing. It is important to note that these tools utilize
                large language models. Furthermore, they are capable of generating
                content at scale. In conclusion, AI writing tools are beneficial for
                productivity.
              </p>
            </div>
            <div className="ba-card after">
              <span className="ba-tag after">After · NoteCleaner</span>
              <p>
                I&apos;ve been using AI to help me write, and honestly it&apos;s changed
                how I work. These tools run on big language models that can churn out a
                full draft in seconds. For beating writer&apos;s block or getting through
                a busy week, they&apos;re a genuine lifesaver.
              </p>
            </div>
          </div>
          <p className="ba-note">Live example above is static. Paste your own text in the tool to see it rewrite in real time.</p>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="section" id="features" style={{ background: 'var(--bg-soft)' }}>
        <div className="container">
          <div className="section-head">
            <h2>Why NoteCleaner</h2>
            <p>Everything you need to ship text that reads like you wrote it.</p>
          </div>
          <div className="grid-3">
            <div className="feature">
              <div className="ico">🛡️</div>
              <h3>Undetectable</h3>
              <p>Rewrites rhythm, phrasing and contractions so common AI detectors stop flagging your work.</p>
            </div>
            <div className="feature">
              <div className="ico">🎯</div>
              <h3>Keeps your facts</h3>
              <p>Meaning and data stay exactly as you wrote them. We only change how it sounds, never what it says.</p>
            </div>
            <div className="feature">
              <div className="ico">🧭</div>
              <h3>5 writing modes</h3>
              <p>Notes, essay, email, report or social. Each mode tunes the tone to fit where the text goes.</p>
            </div>
            <div className="feature">
              <div className="ico">🌡️</div>
              <h3>5 strength levels</h3>
              <p>From a light polish to a full rewrite. Dial the humanization up or down to match your need.</p>
            </div>
            <div className="feature">
              <div className="ico">⚡</div>
              <h3>One click</h3>
              <p>Paste, pick, humanize. No prompts to engineer, no settings to fight with.</p>
            </div>
            <div className="feature">
              <div className="ico">🔒</div>
              <h3>Private by default</h3>
              <p>Your text is processed on request and never stored or trained on. What you paste stays yours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>How it works</h2>
            <p>Three steps. Under a minute.</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="num">1</div>
              <h3>Paste your text</h3>
              <p>Drop in any AI draft, essay or email you want to sound human.</p>
            </div>
            <div className="step">
              <div className="num">2</div>
              <h3>Pick mode & strength</h3>
              <p>Choose the format and how aggressively to rewrite it.</p>
            </div>
            <div className="step">
              <div className="num">3</div>
              <h3>Get human writing</h3>
              <p>Copy the clean result and use it anywhere. Done.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Pricing ---------- */}
      <section className="section" id="pricing" style={{ background: 'var(--bg-soft)' }}>
        <div className="container">
          <div className="section-head">
            <h2>Simple pricing</h2>
            <p>Start free. Upgrade when you need more. Cancel anytime.</p>
          </div>
          <div className="pricing-grid">
            <div className="plan">
              <h3>Free</h3>
              <div className="price">$0</div>
              <ul>
                <li>500 words / day</li>
                <li>All 5 writing modes</li>
                <li>All 5 strength levels</li>
                <li>No credit card required</li>
              </ul>
              <PlanButton tier="free" label="Start free" variant="ghost" />
            </div>
            <div className="plan pro">
              <span className="ribbon">Most popular</span>
              <h3>Pro</h3>
              <div className="price">$9<small> / month</small></div>
              <ul>
                <li>50,000 words / month</li>
                <li>Priority processing</li>
                <li>Batch paste support</li>
                <li>Rewrite history</li>
                <li>Early new features</li>
              </ul>
              <PlanButton tier="pro" label="Go Pro" />
            </div>
            <div className="plan ultra">
              <h3>Ultra</h3>
              <div className="price">$29<small> / month</small></div>
              <ul>
                <li>500,000 words / month</li>
                <li>Batch / file upload</li>
                <li>API access (soon)</li>
                <li>Priority support</li>
                <li>Up to 3 team seats</li>
              </ul>
              <PlanButton tier="ultra" label="Go Ultra" variant="ghost" />
            </div>
          </div>
          <p className="pricing-note">
            All paid plans are monthly subscriptions billed by Stripe. Prices shown in USD.
          </p>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="section" id="faq">
        <div className="container">
          <div className="section-head">
            <h2>FAQ</h2>
            <p>The questions people ask before they try it.</p>
          </div>
          <div className="faq">
            <div className="faq-item">
              <h4>Does it really beat AI detectors?</h4>
              <p>NoteCleaner is built to reduce detectability against the common detectors (GPTZero, Turnitin AI, ZeroGPT and similar). No tool can guarantee 100%, but rewriting rhythm and phrasing gets most text under the threshold.</p>
            </div>
            <div className="faq-item">
              <h4>Is my text stored?</h4>
              <p>No. Your text is sent to the model only to generate the rewrite, then discarded. We don&apos;t keep logs of your content and we don&apos;t train on it.</p>
            </div>
            <div className="faq-item">
              <h4>Which languages are supported?</h4>
              <p>English works best today. Other Latin-script languages are supported; quality varies by language. More are on the roadmap.</p>
            </div>
            <div className="faq-item">
              <h4>Will it change my facts or numbers?</h4>
              <p>No. The system prompt instructs the model to preserve all facts, names and figures exactly. It only changes how the text reads.</p>
            </div>
            <div className="faq-item">
              <h4>Do I need an account?</h4>
              <p>The Free tier needs no account. Just open the tool and paste. Pro unlocks higher limits and is billed monthly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="footer">
        <div className="container">
          <div className="logo" style={{ justifyContent: 'center', marginBottom: 12 }}>
            <span className="logo-dot" />NoteCleaner
          </div>
          <div>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <Link href="/app">Tool</Link>
          </div>
          <p style={{ marginTop: 16 }}>© {new Date().getFullYear()} NoteCleaner. Powered by DeepSeek AI.</p>
        </div>
      </footer>
    </>
  )
}
