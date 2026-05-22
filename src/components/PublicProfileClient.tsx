'use client'

import { useState } from 'react'
import WishModal from './WishModal'
import styles from '@/app/u/[slug]/page.module.css'
import type { User } from '@/types'

interface PublicProfileClientProps {
  person: User
  currentUserId?: string
  initialWishCount: number
}

export default function PublicProfileClient({
  person,
  currentUserId,
  initialWishCount,
}: PublicProfileClientProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [wished, setWished] = useState(false)
  const [wishCount, setWishCount] = useState(initialWishCount)

  const handleWishSent = () => {
    setWished(true)
    setWishCount((c) => c + 1)
    // Close modal after brief delay
    setTimeout(() => setModalOpen(false), 2800)
  }

  return (
    <>
      {wished ? (
        <button className={styles.wishBtn} disabled style={{ opacity: 0.7, cursor: 'default' }}>
          ✓ Wish sent ♥
        </button>
      ) : (
        <button className={styles.wishBtn} onClick={() => setModalOpen(true)}>
          Make a wish for {person.name.split(' ')[0]} ♥
        </button>
      )}

      <WishModal
        person={person}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onWishSent={handleWishSent}
        currentUserId={currentUserId}
      />
    </>
  )
}
