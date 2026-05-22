'use client'

import { useState, useCallback } from 'react'
import styles from './WishModal.module.css'
import type { User } from '@/types'

interface WishModalProps {
  person: User | null
  isOpen: boolean
  onClose: () => void
  onWishSent: () => void
  currentUserId?: string
}

const ONE_TAP_WISHES = [
  'Happy birthday, stranger! Hope today feels like it was made for you.',
  'Wishing you one genuinely good thing today.',
  "I don't know you, but I hope this year is kind to you. Happy birthday.",
  "A stranger out there is rooting for you. Have a wonderful day.",
]

const WRITING_PROMPTS = [
  '"What\'s one thing you\'d genuinely wish for a stranger today?"',
  '"If you could give someone a feeling on their birthday — what would it be?"',
  '"What would you want to hear on your own birthday?"',
  '"One small, real wish for someone you\'ll never meet:"',
]

const KARMA_MESSAGES = [
  '"That small act of kindness? That was real."',
  '"You gave someone a stranger\'s warmth today. That matters more than you know."',
  '"The world is a little less lonely because you took 10 seconds."',
  '"You wished a stranger well. That\'s a genuinely good thing."',
]

export default function WishModal({
  person,
  isOpen,
  onClose,
  onWishSent,
  currentUserId,
}: WishModalProps) {
  const [text, setText] = useState('')
  const [pickedOneTap, setPickedOneTap] = useState<number | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [senderName, setSenderName] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [karmaMessage] = useState(
    KARMA_MESSAGES[Math.floor(Math.random() * KARMA_MESSAGES.length)]
  )

  const promptIndex = person
    ? person.name.charCodeAt(0) % WRITING_PROMPTS.length
    : 0
  const writingPrompt = WRITING_PROMPTS[promptIndex]

  const handleOneTap = (idx: number) => {
    setPickedOneTap(idx === pickedOneTap ? null : idx)
    setText(idx === pickedOneTap ? '' : ONE_TAP_WISHES[idx])
  }

  const handleClose = useCallback(() => {
    if (sending) return
    setText('')
    setPickedOneTap(null)
    setIsAnonymous(false)
    setSenderName('')
    setError('')
    setDone(false)
    onClose()
  }, [sending, onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose()
  }

  const handleSend = async () => {
    if (!person) return
    const finalText = text.trim()
    if (!finalText) {
      setError('Please write something or pick a one-tap wish.')
      return
    }
    setError('')
    setSending(true)

    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: person.id,
          text: finalText,
          isAnonymous,
          senderName: isAnonymous ? null : senderName.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Something went wrong.')
      }

      setDone(true)
      onWishSent()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSending(false)
    }
  }

  if (!person) return null

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
      onClick={handleOverlayClick}
    >
      <div className={styles.modal}>
        {done ? (
          // ── Success state ──
          <div className={styles.successWrap}>
            <div className={styles.okRing}>♥</div>
            <div className={styles.okTitle}>Wish sent.</div>
            <div className={styles.okBody}>
              {person.name} will see your wish on their birthday page.
            </div>
            <div className={styles.karmaBox}>{karmaMessage}</div>
            <button className={styles.btnBack} onClick={handleClose}>
              Back to birthdays
            </button>
          </div>
        ) : (
          // ── Form state ──
          <>
            <div className={styles.title}>
              Wish {person.name.split(' ')[0]} a happy birthday
            </div>
            <div className={styles.subtitle}>
              Takes 10 seconds. Means more than you think.
            </div>

            <div className={styles.prompt}>{writingPrompt}</div>

            <div className={styles.onetapLabel}>Quick wishes ↓</div>
            <div className={styles.onetapRow}>
              {ONE_TAP_WISHES.map((w, i) => (
                <button
                  key={i}
                  className={pickedOneTap === i ? styles.onetapPicked : styles.onetap}
                  onClick={() => handleOneTap(i)}
                >
                  {i === 0
                    ? '🎂'
                    : i === 1
                    ? '✨'
                    : i === 2
                    ? '🌱'
                    : '⭐'}{' '}
                  {w.length > 36 ? w.slice(0, 35) + '…' : w}
                </button>
              ))}
            </div>

            <div className={styles.divider}>or write your own</div>

            <textarea
              className={styles.textarea}
              placeholder="Write something kind…"
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setPickedOneTap(null)
              }}
            />

            {error && <div className={styles.errorMsg}>{error}</div>}

            <label className={styles.anonRow}>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              Send anonymously
            </label>

            {!isAnonymous && (
              <input
                className={styles.nameInput}
                type="text"
                placeholder="Your name (optional)"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            )}

            <div className={styles.actions}>
              <button className={styles.btnCancel} onClick={handleClose}>
                Cancel
              </button>
              <button
                className={styles.btnSend}
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? 'Sending…' : 'Send wish ♥'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
