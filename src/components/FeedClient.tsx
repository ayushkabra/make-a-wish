'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './FeedClient.module.css'
import PersonCard from './PersonCard'
import WishModal from './WishModal'
import { getAvatarColor, daysUntilBirthday, MONTH_NAMES } from '@/lib/utils'
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
      {/* Dynamic Birthday Countdown for Logged in Users */}
      {currentUser && (
        <div className={styles.countdownCard}>
          <div className={styles.countdownLeft}>
            <div className={styles.countdownTitle}>
              {currentUser.birth_month === (today.getMonth() + 1) && currentUser.birth_day === today.getDate() ? (
                <>Happy Birthday, <span>{currentUser.name}</span>! 🎂</>
              ) : (
                <>Hey <span>{currentUser.name}</span>, your birthday is coming up!</>
              )}
            </div>
            <div className={styles.countdownSub}>
              {currentUser.birth_month === (today.getMonth() + 1) && currentUser.birth_day === today.getDate() ? (
                "Today is your special day! Check your wall to read wishes and reply to them."
              ) : (
                `Mark your calendar: ${MONTH_NAMES[currentUser.birth_month - 1]} ${currentUser.birth_day}. We can't wait to celebrate you!`
              )}
            </div>
            {/* Active resolutions preview */}
            {currentUser.resolutions && currentUser.resolutions.length > 0 && (
              <div className={styles.homeResolutions}>
                <div className={styles.homeResolutionsHeader}>
                  <span className={styles.homeResolutionsTitle}>Active Resolutions</span>
                  <Link href="/me" className={styles.homeResEditLink}>+ Add More</Link>
                </div>
                <div className={styles.homeResolutionsList}>
                  {currentUser.resolutions.filter((r) => !r.completed).slice(0, 3).map((r) => (
                    <div key={r.id} className={styles.homeResolutionItem}>
                      <span className={styles.homeResDot}>✦</span> {r.text}
                    </div>
                  ))}
                  {currentUser.resolutions.filter((r) => !r.completed).length > 3 && (
                    <div className={styles.homeResolutionsMore}>
                      + {currentUser.resolutions.filter((r) => !r.completed).length - 3} more goals on your dashboard
                    </div>
                  )}
                  {currentUser.resolutions.filter((r) => !r.completed).length === 0 && (
                    <div className={styles.homeResolutionsDone}>
                      🎉 All yearly resolutions completed!
                    </div>
                  )}
                </div>
              </div>
            )}

            <Link href="/me" className={styles.countdownLink}>
              View my birthday wall →
            </Link>
          </div>

          {!(currentUser.birth_month === (today.getMonth() + 1) && currentUser.birth_day === today.getDate()) && (
            <div className={styles.countdownRight}>
              <div className={styles.daysCircle}>
                <span className={styles.daysNumber}>
                  {daysUntilBirthday(currentUser.birth_month, currentUser.birth_day)}
                </span>
                <span className={styles.daysLabel}>days left</span>
              </div>
            </div>
          )}
        </div>
      )}

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
