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

  // Prepare promises for all 8 days (today = 0, tomorrow = 1, week = 2..7)
  const dayPromises = Array.from({ length: 8 }).map((_, i) => {
    const d = addDays(today, i)
    return fetchByDate(supabase, d.getMonth() + 1, d.getDate())
  })

  // Prepare wish count promise concurrently if currentUser exists
  const wishCountPromise = currentUser
    ? supabase
        .from('wishes')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', currentUser.id)
    : Promise.resolve({ count: 0 })

  // Resolve all concurrently
  const [allDaysPeople, wishCountResult] = await Promise.all([
    Promise.all(dayPromises),
    wishCountPromise,
  ])

  const todayPeople = allDaysPeople[0]
  const tomorrowPeople = allDaysPeople[1]

  // Construct weekPeople list from days 2–7 (deduplicated)
  const weekSet = new Map<string, PersonWithCount>()
  for (let i = 2; i <= 7; i++) {
    const people = allDaysPeople[i]
    people.forEach((p) => weekSet.set(p.id, p))
  }
  const weekPeople = Array.from(weekSet.values())

  const wishCount = wishCountResult.count ?? 0

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
