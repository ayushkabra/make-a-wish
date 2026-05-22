'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import styles from './Toast.module.css'

// ─── Toast component ──────────────────────────────────────────────────────────

interface ToastProps {
  message: string
  show: boolean
}

export default function Toast({ message, show }: ToastProps) {
  return (
    <div
      className={`${styles.toast} ${show ? styles.toastVisible : ''}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {message}
    </div>
  )
}

// ─── useToast hook ────────────────────────────────────────────────────────────

const TOAST_DURATION = 2400

export function useToast() {
  const [toast, setToast] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast(message)
    timerRef.current = setTimeout(() => {
      setToast('')
    }, TOAST_DURATION)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { toast, showToast }
}
