import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase/server'
import Nav from '@/components/Nav'
import MyPageClient from '@/components/MyPageClient'
import type { User, Wish } from '@/types'

function serializeDoc<T>(doc: any): T {
  const data = doc.data()
  const serialized = { ...data, id: doc.id }
  if (serialized.created_at && typeof serialized.created_at.toDate === 'function') {
    serialized.created_at = serialized.created_at.toDate().toISOString()
  }
  return serialized as T
}

export default async function MePage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value

  if (!session) redirect('/login')

  let uid = ''
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(session, true)
    uid = decodedClaims.uid
  } catch (e) {
    redirect('/login')
  }

  const profileDoc = await adminDb.collection('users').doc(uid).get()
  if (!profileDoc.exists) redirect('/join')

  const profile = serializeDoc<User>(profileDoc)

  // Fetch wishes, replies, twins, and sentCount concurrently
  const [wishesSnap, repliesSnap, twinsSnap, sentCountSnap] = await Promise.all([
    adminDb.collection('wishes')
      .where('recipient_id', '==', uid)
      .orderBy('created_at', 'desc')
      .get(),
    adminDb.collection('replies')
      .where('from_id', '==', uid)
      .get(),
    adminDb.collection('users')
      .where('birth_month', '==', profile.birth_month)
      .where('birth_day', '==', profile.birth_day)
      .limit(10)
      .get(),
    adminDb.collection('wishes')
      .where('sender_id', '==', uid)
      .count()
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

  // Process wishes
  const wishes = wishesSnap.docs.map((doc) => {
    const wish = serializeDoc<any>(doc)
    wish.replies = repliesMap.get(wish.id) || []
    return wish as Wish
  })

  // Process twins
  const twins = twinsSnap.docs
    .map((doc) => serializeDoc<User>(doc))
    .filter((u) => u.id !== uid)
    .slice(0, 5)

  const sentCount = sentCountSnap.data().count || 0

  return (
    <>
      <Nav user={profile} />
      <MyPageClient
        profile={profile}
        wishes={wishes}
        twins={twins}
        sentCount={sentCount}
      />
    </>
  )
}
