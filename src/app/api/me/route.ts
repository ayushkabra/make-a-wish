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

// GET /api/me — returns current user's profile
export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(session, true)
    const uid = decodedClaims.uid

    const profileDoc = await adminDb.collection('users').doc(uid).get()
    if (!profileDoc.exists) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const profile = serializeDoc<any>(profileDoc)
    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error('GET /api/me error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// POST /api/me — create profile during onboarding
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(session, true)
    const uid = decodedClaims.uid
    const email = decodedClaims.email || ''

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { name, slug, city, birth_month, birth_day, vibe } = body

    if (!name || !slug || !birth_month || !birth_day) {
      return NextResponse.json({ error: 'Missing required profile fields.' }, { status: 400 })
    }

    const profileData = {
      name,
      slug,
      city: city || null,
      birth_month: Number(birth_month),
      birth_day: Number(birth_day),
      vibe: vibe || '',
      bio: null,
      notif_pref: 'none',
      email,
      created_at: new Date(),
    }

    await adminDb.collection('users').doc(uid).set(profileData)

    const profile = { id: uid, ...profileData, created_at: profileData.created_at.toISOString() }
    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error('POST /api/me error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/me — update editable profile fields
export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(session, true)
    const uid = decodedClaims.uid

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Whitelist editable fields
    const allowed = ['name', 'city', 'bio', 'vibe', 'notif_pref'] as const
    const updates: Partial<Record<(typeof allowed)[number], unknown>> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    await adminDb.collection('users').doc(uid).update(updates)

    const profileDoc = await adminDb.collection('users').doc(uid).get()
    const profile = serializeDoc<any>(profileDoc)

    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error('PATCH /api/me error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
