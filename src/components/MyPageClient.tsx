'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/firebase/client'
import { signOut } from 'firebase/auth'
import styles from './MyPageClient.module.css'
import InboxCard from './InboxCard'
import { User, Wish } from '@/types'
import { daysUntilBirthday, getInitials, getAvatarClass, formatBirthday } from '@/lib/utils'
import { getZodiac } from '@/lib/zodiac'

interface MyPageClientProps {
  profile: User
  wishes: Wish[]
  twins: User[]
  sentCount: number
}

type Tab = 'profile' | 'twins' | 'inbox'
type InboxFilter = 'all' | 'new' | 'replied'

export default function MyPageClient({ profile, wishes: initialWishes, twins, sentCount }: MyPageClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all')
  const [wishes, setWishes] = useState<Wish[]>(initialWishes)
  const [copied, setCopied] = useState(false)

  // ── Resolutions Checklist State & Handlers ──
  const [resolutions, setResolutions] = useState<any[]>(profile.resolutions || [])
  const [newResText, setNewResText] = useState('')
  const [savingRes, setSavingRes] = useState(false)

  async function handleAddResolution(e: React.FormEvent) {
    e.preventDefault()
    const text = newResText.trim()
    if (!text) return

    setSavingRes(true)
    const newItem = {
      id: Math.random().toString(36).slice(2, 9),
      text,
      completed: false,
      created_at: new Date().toISOString()
    }

    const updatedList = [...resolutions, newItem]
    setResolutions(updatedList)
    setNewResText('')

    try {
      await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutions: updatedList }),
      })
    } catch (err) {
      console.error('Failed to save resolution:', err)
    } finally {
      setSavingRes(false)
    }
  }

  async function handleToggleResolution(id: string) {
    const updatedList = resolutions.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    )
    setResolutions(updatedList)

    try {
      await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutions: updatedList }),
      })
    } catch (err) {
      console.error('Failed to save resolution toggle:', err)
    }
  }

  async function handleDeleteResolution(id: string) {
    const updatedList = resolutions.filter((item) => item.id !== id)
    setResolutions(updatedList)

    try {
      await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutions: updatedList }),
      })
    } catch (err) {
      console.error('Failed to delete resolution:', err)
    }
  }

  async function handleSignOut() {
    await signOut(auth)
    await fetch('/api/auth/session', { method: 'DELETE' })
    router.push('/feed')
    router.refresh()
  }

  const zodiac = getZodiac(profile.birth_month, profile.birth_day)
  const days = daysUntilBirthday(profile.birth_month, profile.birth_day)
  const initials = getInitials(profile.name)
  // Use a simple string hash for consistent avatar color based on user id
  const avatarIdx = profile.id ? profile.id.charCodeAt(0) + profile.id.charCodeAt(1) : 0
  const avatarClass = getAvatarClass(avatarIdx)
  const freshCount = wishes.filter((w) => !w.is_loved && !(w.replies?.length)).length
  const memberYear = new Date(profile.created_at).getFullYear()

  const filteredWishes = wishes.filter((w) => {
    if (inboxFilter === 'new') return !w.is_loved && !(w.replies?.length)
    if (inboxFilter === 'replied') return !!(w.replies?.length)
    return true
  })

  function handleLove(wishId: string) {
    setWishes((prev) =>
      prev.map((w) => (w.id === wishId ? { ...w, is_loved: true } : w))
    )
  }

  async function handleReply(wishId: string, text: string) {
    const res = await fetch(`/api/wishes/${wishId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error('Failed to send reply')
    const { reply } = await res.json()
    setWishes((prev) =>
      prev.map((w) =>
        w.id === wishId
          ? { ...w, replies: [...(w.replies ?? []), reply] }
          : w
      )
    )
  }

  function copyLink() {
    const url = `makeawish.app/u/${profile.slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const birthdayToday = days === 0 || days === 365

  return (
    <div className={styles.page}>
      {/* ── COVER ── */}
      <div className={styles.cover}>
        <div className={styles.coverGrad} />
        <div className={styles.coverRing1} />
        <div className={styles.coverRing2} />
        <span className={styles.coverZodiac}>{zodiac.emoji}</span>
        <span className={styles.coverQuote}>
          {birthdayToday ? '🎉 Happy birthday!' : `${days} days until your next birthday`}
        </span>
      </div>

      {/* ── IDENTITY ── */}
      <div className={styles.identity}>
        <div className={styles.avatarRow}>
          <div className={`${styles.avatar} ${styles[avatarClass]}`}>
            {initials}
            <span className={styles.zodiacBadge}>{zodiac.emoji}</span>
          </div>
          <div className={styles.avatarActions}>
            <button className={styles.btnEdit} onClick={() => {}}>Edit profile</button>
            <button className={styles.btnSignout} onClick={handleSignOut}>Sign out</button>
          </div>
        </div>

        <div className={styles.myName}>{profile.name}</div>
        {profile.city && <div className={styles.myLoc}>📍 {profile.city}</div>}

        <div className={styles.tags}>
          <span className={styles.tagBday}>🎂 {formatBirthday(profile.birth_month, profile.birth_day)}</span>
          <span className={styles.tagZodiac}>{zodiac.emoji} {zodiac.sign}</span>
          <span className={styles.tagMember}>Member since {memberYear}</span>
        </div>

        {profile.bio && <p className={styles.myBio}>{profile.bio}</p>}
        {profile.vibe && <p className={styles.myBio} style={{ fontStyle: 'italic', opacity: 0.7 }}>&ldquo;{profile.vibe}&rdquo;</p>}
      </div>

      {/* ── COUNTDOWN ── */}
      <div className={styles.countdown}>
        <div>
          <div className={styles.cdDays}>{birthdayToday ? '🎉' : days}</div>
          <div className={styles.cdLabel}>{birthdayToday ? 'It\'s your day!' : 'days to go'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.cdWishes}>{wishes.length}</div>
          <div className={styles.cdWLabel}>wishes received</div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className={styles.stats}>
        <div className={styles.stat} onClick={() => { setActiveTab('inbox'); setInboxFilter('all') }}>
          <div className={styles.statNum}>{wishes.length}</div>
          <div className={styles.statLabel}>Received</div>
        </div>
        <div className={styles.stat} onClick={() => {}}>
          <div className={styles.statNum}>{sentCount}</div>
          <div className={styles.statLabel}>Sent</div>
        </div>
        <div className={styles.stat} onClick={() => { setActiveTab('inbox'); setInboxFilter('new') }}>
          <div className={styles.statNum}>{freshCount}</div>
          <div className={styles.statLabel}>Unread</div>
        </div>
      </div>

      {/* ── STREAK ── */}
      <StreakBar sentCount={sentCount} />

      {/* ── TABS ── */}
      <div className={styles.tabs}>
        {(['profile', 'twins', 'inbox'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t === 'profile' && 'Profile'}
            {t === 'twins' && `Birthday twins${twins.length ? ` (${twins.length})` : ''}`}
            {t === 'inbox' && `Inbox${freshCount ? ` · ${freshCount} new` : ''}`}
          </button>
        ))}
      </div>

      {/* ── PANEL: PROFILE ── */}
      {activeTab === 'profile' && (
        <div className={styles.panel}>
          {/* Zodiac strip */}
          <div className={styles.zodiacStrip}>
            <div className={styles.zodiacIcon}>{zodiac.emoji}</div>
            <div>
              <div className={styles.zodiacName}>{zodiac.sign} · {zodiac.dates}</div>
              <div className={styles.zodiacTrait}>{zodiac.trait}</div>
              <div className={styles.zodiacTrait} style={{ opacity: 0.45, marginTop: 4, fontSize: 12 }}>{zodiac.dates}</div>
            </div>
          </div>

          {/* Share link */}
          <div className={styles.shareBox}>
            <div className={styles.shareLabel}>Your birthday link</div>
            <div className={styles.shareUrl}>makeawish.app/u/{profile.slug}</div>
            <button className={styles.btnCopy} onClick={copyLink}>
              {copied ? '✓ Copied!' : 'Copy link'}
            </button>
          </div>

          {/* Resolutions Checklist Card */}
          <div className={styles.checklistCard}>
            <div className={styles.checklistTitleRow}>
              <div className={styles.checklistTitle}>🎯 Birthday Resolutions Checklist</div>
              <Link href="/feed" className={styles.btnBackToFeed}>← Back to Feed</Link>
            </div>
            <p className={styles.checklistSub}>
              Track private personal goals for your upcoming year of life. Visible only to you.
            </p>

            {/* Progress bar */}
            {resolutions.length > 0 && (
              <div className={styles.progressSection}>
                <div className={styles.progressInfo}>
                  <span>
                    {resolutions.filter((r) => r.completed).length} of {resolutions.length} completed
                  </span>
                  <span>
                    {Math.round(
                      (resolutions.filter((r) => r.completed).length / resolutions.length) * 100
                    )}%
                  </span>
                </div>
                <div className={styles.progressBarBg}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: `${(resolutions.filter((r) => r.completed).length / resolutions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Input field */}
            <form onSubmit={handleAddResolution} className={styles.checklistForm}>
              <input
                type="text"
                placeholder="I want to learn playing guitar..."
                className={styles.checklistInput}
                value={newResText}
                onChange={(e) => setNewResText(e.target.value)}
                maxLength={100}
                disabled={savingRes}
              />
              <button type="submit" className={styles.btnChecklistAdd} disabled={savingRes}>
                Add
              </button>
            </form>

            {/* List */}
            {resolutions.length === 0 ? (
              <div className={styles.checklistEmpty}>
                No resolutions added yet. Add your first yearly goal above!
              </div>
            ) : (
              <div className={styles.checklistList}>
                {resolutions.map((item) => (
                  <div
                    key={item.id}
                    className={`${styles.checklistItem} ${item.completed ? styles.completed : ''}`}
                  >
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleResolution(item.id)}
                        className={styles.checkboxInput}
                      />
                      <span className={styles.customCheckbox} />
                      <span className={styles.itemText}>{item.text}</span>
                    </label>
                    <button
                      type="button"
                      className={styles.btnDelete}
                      onClick={() => handleDeleteResolution(item.id)}
                      title="Delete goal"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PANEL: TWINS ── */}
      {activeTab === 'twins' && (
        <div className={styles.panel}>
          {twins.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🥂</div>
              <div className={styles.emptyTitle}>No birthday twins yet</div>
              <div className={styles.emptySub}>Nobody else has joined with your exact birthday — yet.</div>
            </div>
          ) : (
            <>
              <p className={styles.twinsIntro}>You share your birthday with these people.</p>
              {twins.map((twin) => {
                const ti = getInitials(twin.name)
                const taIdx = twin.id ? twin.id.charCodeAt(0) + twin.id.charCodeAt(1) : 0
                const ta = getAvatarClass(taIdx)
                return (
                  <div key={twin.id} className={styles.twinCard}>
                    <div className={`${styles.twinAvatar} ${styles[ta]}`}>{ti}</div>
                    <div className={styles.twinInfo}>
                      <div className={styles.twinName}>{twin.name}</div>
                      {twin.city && <div className={styles.twinCity}>📍 {twin.city}</div>}
                    </div>
                    <a href={`/u/${twin.slug}`} className={styles.btnWishTwin}>
                      Wish them 🎂
                    </a>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* ── PANEL: INBOX ── */}
      {activeTab === 'inbox' && (
        <div className={styles.panel}>
          <div className={styles.inboxHead}>
            <div>
              <div className={styles.inboxTitle}>Your wishes</div>
              <div className={styles.inboxSub}>{wishes.length} {wishes.length === 1 ? 'person' : 'people'} wished you well</div>
            </div>
          </div>

          {/* Filter pills */}
          <div className={styles.filters}>
            {(['all', 'new', 'replied'] as InboxFilter[]).map((f) => (
              <button
                key={f}
                className={`${styles.filterPill} ${inboxFilter === f ? styles.filterActive : ''}`}
                onClick={() => setInboxFilter(f)}
              >
                {f === 'all' && 'All'}
                {f === 'new' && `New${freshCount ? ` (${freshCount})` : ''}`}
                {f === 'replied' && 'Replied'}
              </button>
            ))}
          </div>

          {filteredWishes.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>💌</div>
              <div className={styles.emptyTitle}>No wishes here</div>
              <div className={styles.emptySub}>
                {inboxFilter === 'new' ? 'You\'re all caught up!' : 'Share your birthday link to start receiving wishes.'}
              </div>
            </div>
          ) : (
            filteredWishes.map((wish) => (
              <InboxCard
                key={wish.id}
                wish={wish}
                myInitials={initials}
                onLove={handleLove}
                onReply={handleReply}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

/* ── Streak bar sub-component ── */
function StreakBar({ sentCount }: { sentCount: number }) {
  const streak = Math.min(sentCount, 7)
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  return (
    <div className={styles.streak}>
      <span className={styles.streakFire}>🔥</span>
      <div className={styles.streakInfo}>
        <div className={styles.streakN}>{streak}-day wishing streak</div>
        <div className={styles.streakS}>Keep spreading birthday joy!</div>
      </div>
      <div className={styles.streakDays}>
        {days.map((d, i) => (
          <div
            key={i}
            className={`${styles.sday} ${i === todayIdx ? styles.sdayToday : i < todayIdx ? styles.sdayDone : ''}`}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  )
}
