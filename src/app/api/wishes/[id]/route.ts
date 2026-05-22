import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

function serializeDoc<T>(doc: any): T {
  const data = doc.data()
  const serialized = { ...data, id: doc.id }
  if (serialized.created_at && typeof serialized.created_at.toDate === 'function') {
    serialized.created_at = serialized.created_at.toDate().toISOString()
  }
  return serialized as T
}

// PATCH /api/wishes/[id] — toggle is_loved on a wish
// Only the wish's recipient may love it
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
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

    let body: { is_loved?: boolean }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (typeof body.is_loved !== 'boolean') {
      return NextResponse.json({ error: 'is_loved must be a boolean' }, { status: 400 })
    }

    // Verify the current user is the recipient of this wish
    const wishDoc = await adminDb.collection('wishes').doc(id).get()

    if (!wishDoc.exists) {
      return NextResponse.json({ error: 'Wish not found' }, { status: 404 })
    }

    const wish = wishDoc.data()!

    if (wish.recipient_id !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await adminDb.collection('wishes').doc(id).update({ is_loved: body.is_loved })

    const updatedDoc = await adminDb.collection('wishes').doc(id).get()
    const updated = serializeDoc<any>(updatedDoc)

    return NextResponse.json({ wish: updated })
  } catch (error: any) {
    console.error('PATCH /api/wishes/[id] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
