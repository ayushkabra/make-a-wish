import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Nav from '@/components/Nav'
import PublicProfileClient from '@/components/PublicProfileClient'
import { adminAuth, adminDb } from '@/lib/firebase/server'
import { getInitials, getAvatarColor, formatBirthday, timeAgo } from '@/lib/utils'
import { getZodiac } from '@/lib/zodiac'
import styles from './page.module.css'
import Link from 'next/link'
import type { User, Wish } from '@/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

function serializeDoc<T>(doc: any): T {
  const data = doc.data()
  const serialized = { ...data, id: doc.id }
  if (serialized.created_at && typeof serialized.created_at.toDate === 'function') {
    serialized.created_at = serialized.created_at.toDate().toISOString()
  }
  return serialized as T
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params

  // Fetch the target profile person
  const personQuery = await adminDb.collection('users')
    .where('slug', '==', slug)
    .limit(1)
    .get()

  if (personQuery.empty) {
    notFound()
  }

  const personDoc = personQuery.docs[0]
  const person = serializeDoc<User>(personDoc)

  // Fetch auth user session from cookie
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value

  let currentUser: User | null = null
  if (session) {
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(session, true)
      const userDoc = await adminDb.collection('users').doc(decodedClaims.uid).get()
      if (userDoc.exists) {
        currentUser = serializeDoc<User>(userDoc)
      }
    } catch (e) {
      console.error('Session verification error:', e)
    }
  }

  // Fetch wishes for the person
  const wishesSnap = await adminDb.collection('wishes')
    .where('recipient_id', '==', person.id)
    .orderBy('created_at', 'desc')
    .get()

  const wishes: Wish[] = wishesSnap.docs.map((doc) => serializeDoc<Wish>(doc))

  const initials = getInitials(person.name)
  const avatarColor = getAvatarColor(0)
  const birthdayLabel = formatBirthday(person.birth_month, person.birth_day)
  const zodiac = getZodiac(person.birth_month, person.birth_day)

  return (
    <>
      <Nav user={currentUser} />
      <div className={styles.wrap}>
        {/* Back link */}
        <Link href="/feed" className={styles.back}>
          ← Back
        </Link>

        {/* Profile header */}
        <div className={styles.header}>
          <div className={`${styles.avatar} ${avatarColor}`}>{initials}</div>
          <div className={styles.headerInfo}>
            <div className={styles.name}>{person.name}</div>
            {person.city && <div className={styles.meta}>{person.city}</div>}
            <div className={styles.badges}>
              <span className={styles.badge}>🎂 {birthdayLabel}</span>
              {zodiac && (
                <span className={styles.badgeGray}>{zodiac.emoji} {zodiac.sign}</span>
              )}
              {person.vibe && (
                <span className={styles.badgeGray}>✦ {person.vibe}</span>
              )}
            </div>
          </div>
        </div>

        {person.bio && (
          <p style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 22, lineHeight: 1.6 }}>
            {person.bio}
          </p>
        )}

        {/* Wish button — handled by client wrapper */}
        <PublicProfileClient
          person={person}
          currentUserId={currentUser?.id}
          initialWishCount={wishes.length}
        />

        {/* Wishes section */}
        <div className={styles.sectionLabel}>
          {wishes.length} {wishes.length === 1 ? 'wish' : 'wishes'} received
        </div>

        {wishes.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>✉️</div>
            <p>No wishes yet — be the first!</p>
          </div>
        ) : (
          wishes.map((wish, i) => {
            const fromInitials = wish.is_anonymous
              ? '?'
              : getInitials(wish.sender_name ?? 'A')
            const fromColor = getAvatarColor((i + 1) % 5)

            return (
              <div key={wish.id} className={styles.wishCard}>
                <div className={styles.wishFrom}>
                  <div className={`${styles.fromAvatar} ${fromColor}`}>
                    {fromInitials}
                  </div>
                  {wish.is_anonymous ? (
                    <span className={styles.fromAnon}>Anonymous stranger</span>
                  ) : (
                    <span className={styles.fromName}>
                      {wish.sender_name ?? 'Someone'}
                    </span>
                  )}
                  <span className={styles.fromTime}>
                    {timeAgo(wish.created_at)}
                  </span>
                </div>
                <div className={styles.wishText}>{wish.text}</div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
