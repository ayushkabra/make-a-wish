'use client'

import { useState } from 'react'
import styles from './InboxCard.module.css'
import { Wish } from '@/types'
import { timeAgo, getAvatarClass } from '@/lib/utils'

interface InboxCardProps {
  wish: Wish
  myInitials: string
  onLove: (wishId: string) => void
  onReply: (wishId: string, text: string) => Promise<void>
}

export default function InboxCard({ wish, myInitials, onLove, onReply }: InboxCardProps) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const isFresh = !wish.is_loved && !(wish.replies?.length)
  const hasReplied = !!(wish.replies?.length)
  const senderName = wish.is_anonymous ? 'Anonymous stranger' : (wish.sender_name ?? 'Someone')
  const senderInitial = wish.is_anonymous ? '?' : (wish.sender_name?.[0]?.toUpperCase() ?? '?')
  const nameToHash = wish.sender_name ?? 'anon'
  const avatarIdx = nameToHash.charCodeAt(0) + (nameToHash.charCodeAt(1) || 0)
  const avatarClass = wish.is_anonymous ? '' : getAvatarClass(avatarIdx)

  async function handleSendReply() {
    if (!replyText.trim() || sending) return
    setSending(true)
    try {
      await onReply(wish.id, replyText.trim())
      setReplyText('')
      setReplyOpen(false)
    } catch {
      // show nothing — could add toast
    } finally {
      setSending(false)
    }
  }

  function handleLove() {
    if (!wish.is_loved) {
      fetch(`/api/wishes/${wish.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_loved: true }),
      })
      onLove(wish.id)
    }
  }

  return (
    <div className={`${styles.card} ${isFresh ? styles.cardFresh : ''}`}>
      {/* ── TOP ── */}
      <div className={styles.top}>
        <div className={`${styles.senderAv} ${wish.is_anonymous ? styles.anonAv : styles[avatarClass]}`}>
          {senderInitial}
        </div>
        <div className={styles.senderMeta}>
          <div className={styles.senderName}>{senderName}</div>
          <div className={styles.senderTime}>{timeAgo(wish.created_at)}</div>
        </div>
        {isFresh && <span className={styles.newPip}>NEW</span>}
      </div>

      {/* ── WISH TEXT ── */}
      <p className={styles.wishText}>&ldquo;{wish.text}&rdquo;</p>

      {/* ── SENT REPLY (if any) ── */}
      {wish.replies?.map((reply) => (
        <div key={reply.id} className={styles.sentReply}>
          <div className={styles.srAvatar}>{myInitials}</div>
          <div>
            <div className={styles.srBubble}>{reply.text}</div>
            <div className={styles.srLabel}>{timeAgo(reply.created_at)}</div>
          </div>
        </div>
      ))}

      {/* ── ACTIONS ── */}
      <div className={styles.actions}>
        <button
          className={`${styles.btnReply} ${hasReplied ? styles.btnReplyDone : ''}`}
          onClick={() => !hasReplied && setReplyOpen((v) => !v)}
          disabled={hasReplied}
        >
          {hasReplied ? 'Replied ✓' : replyOpen ? 'Cancel reply' : 'Reply'}
        </button>
        <button
          className={`${styles.btnLove} ${wish.is_loved ? styles.btnLoveon : ''}`}
          onClick={handleLove}
        >
          {wish.is_loved ? '♥ Loved' : '♡ Love this'}
        </button>
      </div>

      {/* ── INLINE REPLY BOX ── */}
      {replyOpen && !hasReplied && (
        <div className={styles.replyBox}>
          <textarea
            className={styles.replyTextarea}
            placeholder="Write a warm reply…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendReply()
            }}
          />
          <div className={styles.replyActions}>
            <button
              className={styles.btnCancel}
              onClick={() => { setReplyOpen(false); setReplyText('') }}
            >
              Cancel
            </button>
            <button
              className={styles.btnSend}
              onClick={handleSendReply}
              disabled={sending || !replyText.trim()}
            >
              {sending ? 'Sending…' : 'Send reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
