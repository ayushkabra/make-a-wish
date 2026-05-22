import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase/server'

function serializeDoc<T>(doc: any): T {
  const data = doc.data()
  const serialized = { ...data, id: doc.id }
  if (serialized.created_at && typeof serialized.created_at.toDate === 'function') {
    serialized.created_at = serialized.created_at.toDate().toISOString()
  }
  return serialized as T
}

// POST /api/wishes
// Body: { recipientId, text, isAnonymous, senderName? }
export async function POST(request: NextRequest) {
  try {
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const { recipientId, text, isAnonymous, senderName } = body

    if (!recipientId || typeof recipientId !== 'string') {
      return NextResponse.json(
        { error: 'recipientId is required.' },
        { status: 400 }
      )
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'text is required.' },
        { status: 400 }
      )
    }

    if (text.trim().length > 1000) {
      return NextResponse.json(
        { error: 'Wish is too long (max 1000 characters).' },
        { status: 400 }
      )
    }

    // Confirm the recipient exists
    const recipientDoc = await adminDb.collection('users').doc(recipientId).get()
    if (!recipientDoc.exists) {
      return NextResponse.json(
        { error: 'Recipient not found.' },
        { status: 404 }
      )
    }

    // Try to get logged-in user — optional
    const cookieStore = await cookies()
    const session = cookieStore.get('session')?.value
    let senderId: string | null = null

    if (session) {
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(session, true)
        senderId = decodedClaims.uid
      } catch (e) {
        // Session invalid, treat as guest
      }
    }

    // Build the wish document
    const wishRow: Record<string, unknown> = {
      recipient_id: recipientId,
      text: text.trim(),
      is_anonymous: !!isAnonymous,
      is_loved: false,
      created_at: new Date(),
    }

    if (senderId) {
      wishRow.sender_id = senderId
    }

    if (!isAnonymous && senderName && typeof senderName === 'string') {
      wishRow.sender_name = senderName.trim().slice(0, 100)
    }

    const insertedDoc = await adminDb.collection('wishes').add(wishRow)

    const wish = {
      id: insertedDoc.id,
      ...wishRow,
      created_at: (wishRow.created_at as Date).toISOString(),
    }

    return NextResponse.json({ wish }, { status: 201 })
  } catch (err) {
    console.error('POST /api/wishes error:', err)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}

// GET /api/wishes?recipientId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recipientId = searchParams.get('recipientId')

    if (!recipientId) {
      return NextResponse.json(
        { error: 'recipientId query param is required.' },
        { status: 400 }
      )
    }

    // Fetch wishes and replies in parallel
    const [wishesSnap, repliesSnap] = await Promise.all([
      adminDb.collection('wishes')
        .where('recipient_id', '==', recipientId)
        .orderBy('created_at', 'desc')
        .get(),
      adminDb.collection('replies')
        .where('from_id', '==', recipientId)
        .get(),
    ])

    // Process replies map
    const repliesMap = new Map<string, any[]>()
    repliesSnap.docs.forEach((doc) => {
      const reply = serializeDoc<any>(doc)
      const wishId = reply.wish_id
      if (!repliesMap.has(wishId)) {
        repliesMap.set(wishId, [])
      }
      repliesMap.get(wishId)!.push(reply)
    })

    // Map replies into their respective wishes
    const wishes = wishesSnap.docs.map((doc) => {
      const wish = serializeDoc<any>(doc)
      wish.replies = repliesMap.get(wish.id) || []
      return wish
    })

    return NextResponse.json({ wishes })
  } catch (err) {
    console.error('GET /api/wishes error:', err)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}
