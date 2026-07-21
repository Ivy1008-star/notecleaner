import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

// Verifies a Stripe Checkout Session after the user is redirected back from
// Stripe. Returns whether the Pro subscription was paid so the client can
// unlock unlimited usage. Server-side check prevents trivial client spoofing.
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 })
  }

  let body: { sessionId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const sessionId = (body.sessionId || '').trim()
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id.' }, { status: 400 })
  }

  const stripe = new Stripe(secretKey)
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const paid =
      session.payment_status === 'paid' || session.status === 'complete'
    return NextResponse.json({
      pro: paid,
      status: session.status,
      paymentStatus: session.payment_status,
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Failed to verify session.' },
      { status: 500 }
    )
  }
}
