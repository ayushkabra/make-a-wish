'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Nav.module.css'
import type { User } from '@/types'

interface NavProps {
  user: User | null
  wishCount?: number
}

export default function Nav({ user, wishCount }: NavProps) {
  const pathname = usePathname()
  const isFeed = pathname === '/feed' || pathname === '/'

  return (
    <nav className={styles.nav}>
      <Link href="/feed" className={styles.logo}>
        make a<em>wish</em>
      </Link>

      <div className={styles.navRight}>
        {!isFeed && (
          <Link href="/feed" className={styles.btnGhost}>
            ← Feed
          </Link>
        )}

        {user ? (
          <Link href="/me" className={styles.btnGhost}>
            Your page
            {wishCount && wishCount > 0 ? (
              <span className={styles.badge}>{wishCount}</span>
            ) : null}
          </Link>
        ) : (
          <>
            <Link href="/login" className={styles.btnGhost}>
              Sign in
            </Link>
            <Link href="/join" className={styles.btnPrimary}>
              Add my birthday
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
