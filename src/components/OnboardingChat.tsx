'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase/client'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { getZodiac } from '@/lib/zodiac'
import { formatAuthError } from '@/lib/utils'
import styles from './OnboardingChat.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'app' | 'user'
  text: string
  type?: 'zodiac' | 'finish'
}

interface UserData {
  name: string
  city: string
  month: number
  day: number
  vibe: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getDaysInMonth(month: number): number {
  // month is 1-indexed, use a leap year to be safe
  return new Date(2000, month, 0).getDate()
}

const VIBES = [
  '🌿 Calm and reflective',
  '✨ Creative and expressive',
  '🔥 Energetic and bold',
  '📚 Curious and thoughtful',
  '🌊 Easygoing and warm',
]

const TOTAL_STEPS = 5

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Math.floor(Math.random() * 9000 + 1000)
}

function formatBirthday(month: number, day: number): string {
  return `${MONTHS[month - 1]} ${day}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className={styles.typing}>
      <span className={styles.typingDot} />
      <span className={styles.typingDot} />
      <span className={styles.typingDot} />
    </div>
  )
}

interface ZodiacBubbleProps {
  month: number
  day: number
}

function ZodiacBubble({ month, day }: ZodiacBubbleProps) {
  const zodiac = getZodiac(month, day)
  return (
    <div className={styles.zodiacBubble}>
      <div className={styles.zodiacIcon}>{zodiac.emoji}</div>
      <div className={styles.zodiacSign}>{zodiac.name}</div>
      <div className={styles.zodiacDates}>{zodiac.dates}</div>
      <div className={styles.zodiacTrait}>{zodiac.trait}</div>
      <div className={styles.zodiacFact}>&ldquo;{zodiac.fact}&rdquo;</div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingChat() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [userData, setUserData] = useState<UserData>({
    name: '',
    city: '',
    month: 1,
    day: 1,
    vibe: '',
  })
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showChips, setShowChips] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showFinish, setShowFinish] = useState(false)

  // Auth & Guest flow states
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [showAuthPassword, setShowAuthPassword] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasInit = useRef(false)

  // ── Mount Check for Auth ──
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user)
    })
    return () => unsubscribe()
  }, [])

  // ── Scroll to bottom ──
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 60)
  }, [])

  // ── Add a message to chat ──
  const addMessage = useCallback((msg: Omit<Message, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: uid() }])
  }, [])

  // ── Type delay then add app bubble ──
  const appSay = useCallback(
    (text: string, delay = 800, type?: Message['type']) => {
      return new Promise<void>((resolve) => {
        setIsTyping(true)
        scrollToBottom()
        setTimeout(() => {
          setIsTyping(false)
          addMessage({ role: 'app', text, type })
          scrollToBottom()
          resolve()
        }, delay)
      })
    },
    [addMessage, scrollToBottom]
  )

  // ── Initial greeting ──
  useEffect(() => {
    if (hasInit.current) return
    hasInit.current = true
    setTimeout(() => {
      addMessage({ role: 'app', text: "Hey! 👋 I'm make a wish. What's your name?" })
      scrollToBottom()
    }, 500)
  }, [addMessage, scrollToBottom])

  // ── Handle step 0: name ──
  async function handleNameSubmit() {
    const name = inputValue.trim()
    if (!name) return
    setInputValue('')
    setUserData((d) => ({ ...d, name }))
    addMessage({ role: 'user', text: name })
    scrollToBottom()
    await appSay(`Nice to meet you, ${name}! 🎉 Where are you from?`, 900)
    setStep(1)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // ── Handle step 1: city ──
  async function handleCitySubmit() {
    const city = inputValue.trim()
    setInputValue('')
    setUserData((d) => ({ ...d, city }))
    addMessage({ role: 'user', text: city || 'Prefer not to say' })
    scrollToBottom()
    await appSay(`Love it${city ? ` — ${city} sounds amazing` : ''}! When's your birthday? 🎂`, 900)
    setStep(2)
    setShowDatePicker(true)
  }

  // ── Handle step 2: birthday ──
  async function handleBirthdaySubmit() {
    const { month, day } = userData
    setShowDatePicker(false)
    addMessage({
      role: 'user',
      text: `${MONTHS[month - 1]} ${day}`,
    })
    scrollToBottom()

    // Zodiac reveal sequence
    setStep(3)
    // Show typing
    setIsTyping(true)
    scrollToBottom()
    await new Promise<void>((res) => setTimeout(res, 1200))
    setIsTyping(false)

    // Add zodiac bubble as special message
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: 'app', text: '', type: 'zodiac' },
    ])
    scrollToBottom()

    // Short pause then follow-up text
    await new Promise<void>((res) => setTimeout(res, 600))
    const zodiac = getZodiac(month, day)
    await appSay(
      `You're a ${zodiac.name}. There's something fitting about that. ✨`,
      900
    )

    // Advance to vibe step
    await appSay(
      'Last thing — how would you describe yourself in a vibe?',
      800
    )
    setStep(4)
    setShowChips(true)
    scrollToBottom()
  }

  // ── Handle step 4: vibe chip ──
  async function handleVibeSelect(vibe: string) {
    setShowChips(false)
    setUserData((d) => ({ ...d, vibe }))
    addMessage({ role: 'user', text: vibe })
    scrollToBottom()
    await appSay(
      `${vibe.split(' ').slice(1).join(' ')} — that's perfectly you. 🌟`,
      800
    )
    setStep(5)
    setShowFinish(true)
    scrollToBottom()
  }

  // ── Save to DB and redirect ──
  async function handleFinish(emailToUse?: string, passwordToUse?: string, modeToUse?: 'signin' | 'signup') {
    setIsSaving(true)
    setError('')
    setSuccessMsg('')
    try {
      let activeUser: any = null

      // Guest flow: perform signup or signin in flight
      if (emailToUse && passwordToUse) {
        if (modeToUse === 'signup') {
          const userCredential = await createUserWithEmailAndPassword(auth, emailToUse, passwordToUse)
          activeUser = userCredential.user
        } else {
          // Mode is sign in
          const userCredential = await signInWithEmailAndPassword(auth, emailToUse, passwordToUse)
          activeUser = userCredential.user
        }

        // Establish the Next.js session cookie
        const idToken = await activeUser.getIdToken()
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Failed to establish auth session.')
          setIsSaving(false)
          return
        }
      } else {
        // Authenticated flow
        activeUser = auth.currentUser
        if (activeUser) {
          const idToken = await activeUser.getIdToken()
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          })
        }
      }

      if (!activeUser) {
        setError('A secure account session is required to save your profile.')
        setIsSaving(false)
        return
      }

      const slug = generateSlug(userData.name)
      // Call secure POST /api/me API instead of client-side Firestore/Supabase upsert!
      const profileRes = await fetch('/api/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          slug,
          city: userData.city || null,
          birth_month: userData.month,
          birth_day: userData.day,
          vibe: userData.vibe,
        }),
      })

      if (!profileRes.ok) {
        const data = await profileRes.json()
        console.error('Failed to save profile:', data.error)
        setError(data.error || 'Failed to save profile.')
        setIsSaving(false)
        return
      }

      router.push('/feed')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(formatAuthError(err))
      setIsSaving(false)
    }
  }

  // ── Submit handler for text input ──
  function handleInputSubmit() {
    if (step === 0) handleNameSubmit()
    else if (step === 1) handleCitySubmit()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleInputSubmit()
  }

  // ── Month change ──
  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const month = Number(e.target.value)
    const maxDay = getDaysInMonth(month)
    setUserData((d) => ({
      ...d,
      month,
      day: Math.min(d.day, maxDay),
    }))
  }

  const progress = (step / TOTAL_STEPS) * 100
  const showTextInput = step === 0 || step === 1
  const inputPlaceholder =
    step === 0 ? 'Your first name…' : 'Your city (or skip)…'
  const showSkip = step === 1

  return (
    <div className={styles.wrap}>
      {/* Progress bar */}
      <div className={styles.progress}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* Chat area */}
      <div className={styles.chat}>
        {messages.map((msg) => {
          if (msg.type === 'zodiac') {
            return (
              <div key={msg.id} className={`${styles.bubbleWrap} ${styles.fromApp}`}>
                <span className={styles.bubbleAppLabel}>make a wish</span>
                <ZodiacBubble month={userData.month} day={userData.day} />
              </div>
            )
          }

          return (
            <div
              key={msg.id}
              className={`${styles.bubbleWrap} ${
                msg.role === 'app' ? styles.fromApp : styles.fromUser
              }`}
            >
              {msg.role === 'app' && (
                <span className={styles.bubbleAppLabel}>make a wish</span>
              )}
              <div
                className={`${styles.bubble} ${
                  msg.role === 'app' ? styles.bubbleApp : styles.bubbleUser
                }`}
              >
                {msg.text}
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className={`${styles.bubbleWrap} ${styles.fromApp}`}>
            <span className={styles.bubbleAppLabel}>make a wish</span>
            <TypingIndicator />
          </div>
        )}

        {/* Date picker inline */}
        {showDatePicker && (
          <div className={`${styles.bubbleWrap} ${styles.fromApp}`}>
            <div className={styles.datePair}>
              <select
                className={styles.dateSelect}
                value={userData.month}
                onChange={handleMonthChange}
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                className={styles.dateSelect}
                value={userData.day}
                onChange={(e) =>
                  setUserData((d) => ({ ...d, day: Number(e.target.value) }))
                }
              >
                {Array.from(
                  { length: getDaysInMonth(userData.month) },
                  (_, i) => i + 1
                ).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Vibe chips */}
        {showChips && (
          <div className={`${styles.bubbleWrap} ${styles.fromApp}`}>
            <div className={styles.chips}>
              {VIBES.map((v) => (
                <button
                  key={v}
                  className={`${styles.chip} ${
                    userData.vibe === v ? styles.chipSel : ''
                  }`}
                  onClick={() => handleVibeSelect(v)}
                  type="button"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Finish card */}
        {showFinish && (
          <div className={styles.finishCard}>
            <div className={styles.finishIcon}>🎉</div>
            <div className={styles.finishTitle}>
              You&apos;re all set, {userData.name}!
            </div>
            <p className={styles.finishSub}>
              Your profile is ready. Time to celebrate the people who matter most.
            </p>
            {userData.month > 0 && (
              <div className={styles.finishBday}>
                🎂 {formatBirthday(userData.month, userData.day)}
              </div>
            )}

            {!isLoggedIn ? (
              <div className={styles.authWrapper}>
                <p className={styles.authTip}>
                  Secure your public birthday wall link with an account:
                </p>
                <div className={styles.authTabs}>
                  <button
                    type="button"
                    className={`${styles.authTab} ${authMode === 'signup' ? styles.authTabSel : ''}`}
                    onClick={() => { setAuthMode('signup'); setError(''); setSuccessMsg(''); setAuthPassword(''); setShowAuthPassword(false); }}
                  >
                    Create account
                  </button>
                  <button
                    type="button"
                    className={`${styles.authTab} ${authMode === 'signin' ? styles.authTabSel : ''}`}
                    onClick={() => { setAuthMode('signin'); setError(''); setSuccessMsg(''); setAuthPassword(''); setShowAuthPassword(false); }}
                  >
                    Sign in
                  </button>
                </div>

                <input
                  type="email"
                  placeholder="Email address"
                  className={styles.authInput}
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  autoComplete="email"
                />
                <div className={styles.authInputWrapper}>
                  <input
                    type={showAuthPassword ? 'text' : 'password'}
                    placeholder={authMode === 'signup' ? 'Password (min 6 chars)' : 'Password'}
                    className={`${styles.authInput} ${styles.authInputWithToggle}`}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={styles.authTogglePassword}
                    onClick={() => setShowAuthPassword(!showAuthPassword)}
                    tabIndex={-1}
                  >
                    {showAuthPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                {error && <p className={styles.authError}>{error}</p>}
                {successMsg && <p className={styles.authSuccess}>{successMsg}</p>}

                <button
                  className={styles.finishBtn}
                  onClick={() => handleFinish(authEmail.trim(), authPassword, authMode)}
                  disabled={isSaving || !authEmail.trim() || !authPassword}
                  type="button"
                >
                  {isSaving
                    ? authMode === 'signup'
                      ? 'Creating account & saving…'
                      : 'Signing in & saving…'
                    : authMode === 'signup'
                    ? 'Create account & save →'
                    : 'Sign in & save →'}
                </button>
              </div>
            ) : (
              <button
                className={styles.finishBtn}
                onClick={() => handleFinish()}
                disabled={isSaving}
                type="button"
              >
                {isSaving ? 'Saving…' : 'Go to my feed →'}
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Fixed input area — only shown for text input steps */}
      {showTextInput && (
        <div className={styles.inputArea}>
          <div className={styles.inputInner}>
            <div className={styles.inputBox}>
              <input
                ref={inputRef}
                type="text"
                placeholder={inputPlaceholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus={step === 0}
                autoComplete="off"
              />
            </div>
            <div className={styles.inputFooter}>
              <span className={styles.hint}>
                {showSkip ? 'Press Enter or skip →' : 'Press Enter to continue'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {showSkip && (
                  <button
                    className={styles.skipBtn}
                    onClick={handleCitySubmit}
                    type="button"
                  >
                    Skip
                  </button>
                )}
                <button
                  className={styles.sendBtn}
                  onClick={handleInputSubmit}
                  disabled={!inputValue.trim() && !showSkip}
                  type="button"
                >
                  Send ↑
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date confirm button */}
      {showDatePicker && (
        <div className={styles.inputArea}>
          <div className={styles.inputInner}>
            <div className={styles.inputFooter}>
              <span className={styles.hint}>
                Pick your birth month and day
              </span>
              <button
                className={styles.sendBtn}
                onClick={handleBirthdaySubmit}
                type="button"
              >
                Confirm →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
