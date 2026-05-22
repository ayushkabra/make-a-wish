'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './FeedClient.module.css'
import PersonCard from './PersonCard'
import WishModal from './WishModal'
import { getAvatarColor } from '@/lib/utils'
import type { User } from '@/types'

interface PersonWithCount extends User {
  wish_count: number
}

interface FeedClientProps {
  todayPeople: PersonWithCount[]
  tomorrowPeople: PersonWithCount[]
  weekPeople: PersonWithCount[]
  currentUser: User | null
}

type Tab = 'today' | 'tomorrow' | 'week'

export default function FeedClient({
  todayPeople,
  tomorrowPeople,
  weekPeople,
  currentUser,
}: FeedClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [wished, setWished] = useState<Set<string>>(new Set())
  const [modalPerson, setModalPerson] = useState<PersonWithCount | null>(null)
  const [wishCounts, setWishCounts] = useState<Record<string, number>>({})

  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const people =
    activeTab === 'today'
      ? todayPeople
      : activeTab === 'tomorrow'
      ? tomorrowPeople
      : weekPeople

  const handleWish = (person: PersonWithCount) => {
    setModalPerson(person)
  }

  const handleWishSent = () => {
    if (modalPerson) {
      setWished((prev) => new Set([...prev, modalPerson.id]))
      setWishCounts((prev) => ({
        ...prev,
        [modalPerson.id]: (prev[modalPerson.id] ?? modalPerson.wish_count) + 1,
      }))
    }
  }

  const tabCount = (tab: Tab) => {
    if (tab === 'today') return todayPeople.length
    if (tab === 'tomorrow') return tomorrowPeople.length
    return weekPeople.length
  }

  // offset index for avatar colors across tabs
  const getIdx = (person: PersonWithCount, list: PersonWithCount[]) =>
    list.findIndex((p) => p.id === person.id)

  return (
    <div className={styles.wrap}>
      {/* Date header */}
      <div className={styles.dateLine}>{dateLabel}</div>
      <div className={styles.headline}>
        {todayPeople.length === 0
          ? 'No birthdays today'
          : todayPeople.length === 1
          ? '1 person is celebrating today'
          : `${todayPeople.length} people are celebrating today`}
      </div>
      <div className={styles.sub}>
        Send them a wish. It takes 10 seconds and costs nothing.
      </div>

      {/* Add my birthday bar (guests only) */}
      {!currentUser && (
        <Link href="/join" className={styles.addBar}>
          <div className={styles.addDot}>+</div>
          <div>
            <span className={styles.addTitle}>Add your birthday</span>
            <span className={styles.addSub}>
              Let strangers wish you well on your special day
            </span>
          </div>
        </Link>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        {(['today', 'tomorrow', 'week'] as Tab[]).map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'today'
              ? 'Today'
              : tab === 'tomorrow'
              ? 'Tomorrow'
              : 'This week'}{' '}
            · {tabCount(tab)}
          </button>
        ))}
      </div>

      {/* Person list */}
      {people.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            {activeTab === 'today' ? '🎂' : '📅'}
          </div>
          <p>
            {activeTab === 'today'
              ? 'No birthdays today — check back tomorrow!'
              : activeTab === 'tomorrow'
              ? 'No birthdays tomorrow.'
              : 'No birthdays this week.'}
          </p>
        </div>
      ) : (
        people.map((person, i) => (
          <PersonCard
            key={person.id}
            person={{
              ...person,
              wish_count: wishCounts[person.id] ?? person.wish_count,
            }}
            wished={wished.has(person.id)}
            onWish={() => handleWish(person)}
            index={i}
          />
        ))
      )}

      {/* Wish modal */}
      <WishModal
        person={modalPerson}
        isOpen={!!modalPerson}
        onClose={() => setModalPerson(null)}
        onWishSent={handleWishSent}
        currentUserId={currentUser?.id}
      />
    </div>
  )
}
