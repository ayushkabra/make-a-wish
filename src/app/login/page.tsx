'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import styles from './page.module.css'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const supabase = createClient()

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setSuccessMsg('')
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
    }

    setLoading(true)

    try {
      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) {
          setError(signInError.message)
          return
        }
        // Check if user has a profile
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single()
          if (!profile) {
            router.push('/join')
            return
          }
        }
        router.push('/feed')
      } else {
        // sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })
        if (signUpError) {
          setError(signUpError.message)
          return
        }
        
        if (data.session) {
          // Instant sign-in (email confirmation off)
          router.push('/join')
        } else {
          // Email confirmation pending (email confirmation on)
          setSuccessMsg('Account created! Please check your email inbox to verify your account before logging in.')
          setEmail('')
          setPassword('')
          setConfirmPassword('')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link href="/feed" className={styles.backLink}>
          ← Back to feed
        </Link>

        {/* Logo */}
        <div className={styles.logo}>
          make a<em>wish</em>
        </div>

        {/* Heading */}
        <h1 className={styles.heading}>Every birthday deserves a wish.</h1>
        <p className={styles.sub}>
          {mode === 'signin'
            ? 'Sign in to your account to continue.'
            : 'Create a free account to get started.'}
        </p>

        {/* Tab switcher */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'signin' ? styles.tabActive : ''}`}
            onClick={() => switchMode('signin')}
            type="button"
          >
            Sign in
          </button>
          <button
            className={`${styles.tab} ${mode === 'signup' ? styles.tabActive : ''}`}
            onClick={() => switchMode('signup')}
            type="button"
          >
            Create account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className={styles.input}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className={styles.input}
            type="password"
            placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
          />

          {mode === 'signup' && (
            <>
              <label className={styles.label} htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                className={styles.input}
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </>
          )}

          {error && <p className={styles.error}>{error}</p>}
          {successMsg && <p className={styles.success}>{successMsg}</p>}

          <button
            type="submit"
            className={styles.btn}
            disabled={loading}
          >
            {loading
              ? mode === 'signin'
                ? 'Signing in…'
                : 'Creating account…'
              : mode === 'signin'
              ? 'Sign in →'
              : 'Create account →'}
          </button>
        </form>

        <p className={styles.footer}>
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                className={styles.footerLink}
                onClick={() => switchMode('signup')}
                type="button"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                className={styles.footerLink}
                onClick={() => switchMode('signin')}
                type="button"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
