import Nav from '@/components/Nav'
import FeedClient from '@/components/FeedClient'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase/server'
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
  month: number,
  day: number
): Promise<PersonWithCount[]> {
  const snapshot = await adminDb.collection('users')
    .where('birth_month', '==', month)
    .where('birth_day', '==', day)
    .get()

  if (snapshot.empty) return []

  const people = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as User[]

  const peopleWithCount = await Promise.all(
    people.map(async (u) => {
      const countSnap = await adminDb.collection('wishes')
        .where('recipient_id', '==', u.id)
        .count()
        .get()
      return {
        ...u,
        wish_count: countSnap.data().count || 0,
      } as PersonWithCount
    })
  )

  return peopleWithCount.sort((a, b) => a.name.localeCompare(b.name))
}

export default async function FeedPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value

  let currentUser: User | null = null
  if (session) {
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(session, true)
      const userDoc = await adminDb.collection('users').doc(decodedClaims.uid).get()
      if (userDoc.exists) {
        currentUser = {
          id: userDoc.id,
          ...userDoc.data(),
        } as User
      }
    } catch (e) {
      console.error('Session verification error:', e)
    }
  }

  const today = new Date()

  // Prepare promises for all 8 days (today = 0, tomorrow = 1, week = 2..7)
  const dayPromises = Array.from({ length: 8 }).map((_, i) => {
    const d = addDays(today, i)
    return fetchByDate(d.getMonth() + 1, d.getDate())
  })

  // Prepare wish count promise concurrently if currentUser exists
  const wishCountPromise = currentUser
    ? adminDb.collection('wishes')
        .where('recipient_id', '==', currentUser.id)
        .count()
        .get()
    : Promise.resolve(null)

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

  const wishCount = wishCountResult ? (wishCountResult.data().count || 0) : 0

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
