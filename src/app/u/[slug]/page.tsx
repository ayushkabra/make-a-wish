import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import PublicProfileClient from '@/components/PublicProfileClient'
import { createClient } from '@/lib/supabase/server'
import { getInitials, getAvatarColor, formatBirthday, timeAgo } from '@/lib/utils'
import { getZodiac } from '@/lib/zodiac'
import styles from './page.module.css'
import Link from 'next/link'
import type { Wish } from '@/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Stage 1: Fetch auth user session and the target profile person concurrently
  const [authUserResult, personResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('users')
      .select('*')
      .eq('slug', slug)
      .single(),
  ])

  const authUser = authUserResult.data?.user
  const person = personResult.data

  if (personResult.error || !person) {
    notFound()
  }

  // Stage 2: Fetch authenticated user's profile details and wishes concurrently
  const currentUserPromise = authUser
    ? supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
    : Promise.resolve({ data: null })

  const wishesPromise = supabase
    .from('wishes')
    .select('*, replies(*)')
    .eq('recipient_id', person.id)
    .order('created_at', { ascending: false })

  const [currentUserResult, wishesResult] = await Promise.all([
    currentUserPromise,
    wishesPromise,
  ])

  const currentUser = currentUserResult.data
  const wishes: Wish[] = wishesResult.data ?? []

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
