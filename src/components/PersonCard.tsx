'use client'

import { useRouter } from 'next/navigation'
import styles from './PersonCard.module.css'
import { getInitials, getAvatarColor, formatBirthday, daysUntilBirthday } from '@/lib/utils'
import type { User } from '@/types'

interface PersonCardProps {
  person: User & { wish_count: number }
  wished: boolean
  onWish: () => void
  index?: number
}

export default function PersonCard({ person, wished, onWish, index = 0 }: PersonCardProps) {
  const router = useRouter()
  const initials = getInitials(person.name)
  const avatarColor = getAvatarColor(index)
  const days = daysUntilBirthday(person.birth_month, person.birth_day)

  // Calculate the age they're turning (approximate — just for display)
  const currentYear = new Date().getFullYear()
  const turning = currentYear - (parseInt(person.created_at?.slice(0, 4) ?? String(currentYear)) - 0)

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking the wish button
    const target = e.target as HTMLElement
    if (target.closest('button')) return
    router.push(`/u/${person.slug}`)
  }

  const handleWish = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!wished) onWish()
  }

  const dayLabel =
    days === 0
      ? 'Birthday today 🎂'
      : days === 1
      ? 'Birthday tomorrow'
      : `Birthday in ${days} days`

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <div className={styles.top}>
        <div className={`${styles.avatar} ${avatarColor}`}>
          {initials}
        </div>
        <div className={styles.info}>
          <div className={styles.name}>{person.name}</div>
          <div className={styles.meta}>
            {person.city ? `${person.city} · ` : ''}
            {dayLabel}
          </div>
          {person.bio && (
            <div className={styles.bio}>✦ {person.bio}</div>
          )}
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.wishCount}>
          <span className={styles.heart}>♥</span>
          {person.wish_count ?? 0}{' '}
          {(person.wish_count ?? 0) === 1 ? 'wish' : 'wishes'}
        </div>

        {wished ? (
          <button className={styles.wishBtnDone} disabled>
            ✓ Wished
          </button>
        ) : (
          <button className={styles.wishBtn} onClick={handleWish}>
            Make a wish
          </button>
        )}
      </div>
    </div>
  )
}
