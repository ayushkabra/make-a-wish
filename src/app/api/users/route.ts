import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/server'

function serializeDoc<T>(doc: any): T {
  const data = doc.data()
  const serialized = { ...data, id: doc.id }
  if (serialized.created_at && typeof serialized.created_at.toDate === 'function') {
    serialized.created_at = serialized.created_at.toDate().toISOString()
  }
  return serialized as T
}

// GET /api/users?month=5&day=22
// GET /api/users?slug=ayush-k
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const month = searchParams.get('month')
    const day = searchParams.get('day')

    // ── Single user by slug ──
    if (slug) {
      const snapshot = await adminDb.collection('users')
        .where('slug', '==', slug)
        .limit(1)
        .get()

      if (snapshot.empty) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 })
      }

      const userDoc = snapshot.docs[0]
      const user = serializeDoc<any>(userDoc)

      const countSnap = await adminDb.collection('wishes')
        .where('recipient_id', '==', user.id)
        .count()
        .get()

      user.wish_count = countSnap.data().count || 0

      return NextResponse.json({ user })
    }

    // ── Users by birthday date ──
    if (month && day) {
      const m = parseInt(month, 10)
      const d = parseInt(day, 10)

      if (isNaN(m) || m < 1 || m > 12 || isNaN(d) || d < 1 || d > 31) {
        return NextResponse.json(
          { error: 'Invalid month or day.' },
          { status: 400 }
        )
      }

      const snapshot = await adminDb.collection('users')
        .where('birth_month', '==', m)
        .where('birth_day', '==', d)
        .get()

      const users = snapshot.docs.map((doc) => serializeDoc<any>(doc))

      const withCounts = await Promise.all(
        users.map(async (u) => {
          const countSnap = await adminDb.collection('wishes')
            .where('recipient_id', '==', u.id)
            .count()
            .get()
          return {
            ...u,
            wish_count: countSnap.data().count || 0,
          }
        })
      )

      // Memory sort alphabetically
      withCounts.sort((a, b) => a.name.localeCompare(b.name))

      // Compute offset from today for each user
      const today = new Date()

      const addDays = (baseDate: Date, n: number) => {
        const nd = new Date(baseDate)
        nd.setDate(nd.getDate() + n)
        return nd
      }

      const getBdayOffset = (bMonth: number, bDay: number): number => {
        for (let i = 0; i <= 365; i++) {
          const d = addDays(today, i)
          if (d.getMonth() + 1 === bMonth && d.getDate() === bDay) return i
        }
        return 366
      }

      const result = withCounts.map((u) => ({
        ...u,
        days_until: getBdayOffset(
          u.birth_month as number,
          u.birth_day as number
        ),
      }))

      return NextResponse.json({ users: result })
    }

    // ── No valid params ──
    return NextResponse.json(
      { error: 'Provide either ?slug= or ?month=&day= params.' },
      { status: 400 }
    )
  } catch (err) {
    console.error('GET /api/users error:', err)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}
