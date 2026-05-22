import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/users?month=5&day=22
// GET /api/users?slug=ayush-k
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const month = searchParams.get('month')
    const day = searchParams.get('day')

    const supabase = await createClient()

    // ── Single user by slug ──
    if (slug) {
      const { data: user, error } = await supabase
        .from('users')
        .select('*, wishes(count)')
        .eq('slug', slug)
        .single()

      if (error || !user) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 })
      }

      const withCount = {
        ...user,
        wish_count:
          Array.isArray(user.wishes) && user.wishes[0]
            ? (user.wishes[0] as { count: number }).count
            : 0,
      }

      return NextResponse.json({ user: withCount })
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

      const { data: users, error } = await supabase
        .from('users')
        .select('*, wishes(count)')
        .eq('birth_month', m)
        .eq('birth_day', d)
        .order('name', { ascending: true })

      if (error) {
        console.error('GET /api/users error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch users.' },
          { status: 500 }
        )
      }

      const withCounts = (users ?? []).map((u: any) => ({
        ...u,
        wish_count:
          Array.isArray(u.wishes) && u.wishes[0]
            ? (u.wishes[0] as { count: number }).count
            : 0,
      }))

      // Compute offset from today for each user
      const today = new Date()
      const todayMonth = today.getMonth() + 1
      const todayDay = today.getDate()

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
