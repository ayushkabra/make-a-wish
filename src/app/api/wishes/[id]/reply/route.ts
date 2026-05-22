import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/wishes/[id]/reply — add a reply to a wish
// The replier must be the wish's recipient (auth required)
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id: wishId } = await context.params
    const cookieStore = await cookies()
    const session = cookieStore.get('session')?.value

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let uid = ''
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(session, true)
      uid = decodedClaims.uid
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { text?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const text = (body.text ?? '').trim()
    if (!text) {
      return NextResponse.json({ error: 'Reply text is required' }, { status: 400 })
    }
    if (text.length > 1000) {
      return NextResponse.json({ error: 'Reply too long (max 1000 chars)' }, { status: 400 })
    }

    // Verify the current user is the recipient of this wish
    const wishDoc = await adminDb.collection('wishes').doc(wishId).get()

    if (!wishDoc.exists) {
      return NextResponse.json({ error: 'Wish not found' }, { status: 404 })
    }

    const wish = wishDoc.data()!

    if (wish.recipient_id !== uid) {
      return NextResponse.json({ error: 'Forbidden — only the recipient can reply' }, { status: 403 })
    }

    // Insert the reply
    const replyData = {
      wish_id: wishId,
      from_id: uid,
      text,
      created_at: new Date(),
    }

    const insertedDoc = await adminDb.collection('replies').add(replyData)

    const reply = {
      id: insertedDoc.id,
      ...replyData,
      created_at: replyData.created_at.toISOString(),
    }

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/wishes/[id]/reply error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
