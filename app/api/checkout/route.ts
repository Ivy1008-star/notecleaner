import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

// Creates a Stripe Checkout Session for the Pro monthly subscription.
// Key is read server-side only; the returned URL redirects the browser to Stripe.
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_PRICE_ID

  if (!secretKey || !priceId) {
    return NextResponse.json(
      {
        error:
          'Stripe is not configured. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID environment variables (test mode keys work).',
      },
      { status: 500 }
    )
  }

  const stripe = new Stripe(secretKey)
  const origin =
    req.headers.get('origin') ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/app?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/app`,
      allow_promotion_codes: true,
      // No-signup MVP: we don't create a Customer object. After payment the
      // client verifies the session via /api/verify and stores the Pro flag
      // locally. Production should add a user account + webhook instead.
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Failed to create checkout session.' },
      { status: 500 }
    )
  }
}
