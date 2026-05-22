import Nav from '@/components/Nav'
import FeedClient from '@/components/FeedClient'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types'

interface PersonWithCount extends User {
  wish_count: number
}

// Helper: add N days to a date
function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// Fetch users whose birthday is on a specific month/day
async function fetchByDate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  month: number,
  day: number
): Promise<PersonWithCount[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*, wishes(count)')
    .eq('birth_month', month)
    .eq('birth_day', day)
    .order('name', { ascending: true })

  if (error || !data) return []

  return data.map((u: Record<string, unknown>) => ({
    ...u,
    wish_count:
      Array.isArray(u.wishes) && u.wishes[0]
        ? (u.wishes[0] as { count: number }).count
        : 0,
  })) as PersonWithCount[]
}

export default async function FeedPage() {
  const supabase = await createClient()

  // Get current user (optional)
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let currentUser: User | null = null
  if (authUser) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()
    currentUser = data
  }

  const today = new Date()
  const tomorrow = addDays(today, 1)

  // Fetch today and tomorrow
  const [todayPeople, tomorrowPeople] = await Promise.all([
    fetchByDate(supabase, today.getMonth() + 1, today.getDate()),
    fetchByDate(supabase, tomorrow.getMonth() + 1, tomorrow.getDate()),
  ])

  // Fetch this week (days 2–7, deduped)
  const weekSet = new Map<string, PersonWithCount>()
  for (let i = 2; i <= 7; i++) {
    const d = addDays(today, i)
    const people = await fetchByDate(supabase, d.getMonth() + 1, d.getDate())
    people.forEach((p) => weekSet.set(p.id, p))
  }
  const weekPeople = Array.from(weekSet.values())

  // Wish count for nav badge (unread wishes for the current user's profile)
  let wishCount = 0
  if (currentUser) {
    const { count } = await supabase
      .from('wishes')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', currentUser.id)
    wishCount = count ?? 0
  }

  return (
    <>
      <Nav user={currentUser} wishCount={wishCount} />
      <FeedClient
        todayPeople={todayPeople}
        tomorrowPeople={tomorrowPeople}
        weekPeople={weekPeople}
        currentUser={currentUser}
      />
    </>
  )
}
