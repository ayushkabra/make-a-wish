// ─── makeawish — Utility Functions ───────────────────────────────────────────

// ─── Month name arrays ────────────────────────────────────────────────────────

/** Full month names, 1-indexed. Index 0 = 'January'. */
export const MONTH_NAMES: string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Short month names, 1-indexed. Index 0 = 'Jan'. */
export const MONTH_SHORT: string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// ─── Slug ─────────────────────────────────────────────────────────────────────

/**
 * Converts a display name into a URL-safe slug.
 * e.g. "Ayush Kumar" → "ayush-kumar"
 */
export function generateSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // strip non-alphanumeric (keep spaces & hyphens)
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/-+/g, '-')            // collapse multiple hyphens
    .replace(/^-|-$/g, '')          // trim leading/trailing hyphens
}

// ─── Initials ─────────────────────────────────────────────────────────────────

/**
 * Returns up to 2 uppercase initials from a name.
 * e.g. "Ayush Kumar" → "AK", "Madonna" → "M"
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ─── Avatar colors ────────────────────────────────────────────────────────────

/**
 * CSS class suffixes that map to avatar background colors defined in globals.css.
 * Usage: `<div className={`avatar-${getAvatarColor(index)}`} />`
 */
export const AVATAR_COLORS = ['a1', 'a2', 'a3', 'a4', 'a5'] as const
export type AvatarColor = (typeof AVATAR_COLORS)[number]

/**
 * Cycles through AVATAR_COLORS using modulo arithmetic.
 * @param index — any integer (e.g. array index or numeric user ID hash)
 */
export function getAvatarColor(index: number): AvatarColor {
  return AVATAR_COLORS[Math.abs(index) % AVATAR_COLORS.length]
}

/** Alias for getAvatarColor — returns CSS class string like 'a1'|'a2'... */
export const getAvatarClass = getAvatarColor

// ─── Birthday countdown ───────────────────────────────────────────────────────

/**
 * Returns the number of days until the next occurrence of the given birthday.
 * Returns 0 if the birthday is today.
 * @param month — 1-indexed (1 = January)
 * @param day   — 1-indexed day of the month
 */
export function daysUntilBirthday(month: number, day: number): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let next = new Date(now.getFullYear(), month - 1, day)

  // If the birthday has already passed this year, use next year
  if (next < today) {
    next = new Date(now.getFullYear() + 1, month - 1, day)
  }

  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round((next.getTime() - today.getTime()) / msPerDay)
}

// ─── Relative time ────────────────────────────────────────────────────────────

/**
 * Converts an ISO date string to a human-readable relative time.
 * e.g. "just now", "3 minutes ago", "2 hours ago", "5 days ago"
 */
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds} seconds ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return days === 1 ? '1 day ago' : `${days} days ago`

  const weeks = Math.floor(days / 7)
  if (weeks < 5) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`

  const months = Math.floor(days / 30)
  if (months < 12) return months === 1 ? '1 month ago' : `${months} months ago`

  const years = Math.floor(days / 365)
  return years === 1 ? '1 year ago' : `${years} years ago`
}

// ─── Birthday formatting ──────────────────────────────────────────────────────

/**
 * Formats a birthday month and day into a readable string.
 * e.g. month=5, day=16 → "May 16"
 * @param month — 1-indexed
 * @param day   — 1-indexed
 */
export function formatBirthday(month: number, day: number): string {
  return `${MONTH_NAMES[month - 1]} ${day}`
}

/**
 * Maps technical Firebase Auth error messages/codes into highly readable user-facing strings.
 */
export function formatAuthError(err: any): string {
  const message = err?.message || ''
  const code = err?.code || ''

  if (code === 'auth/email-already-in-use' || message.includes('auth/email-already-in-use')) {
    return 'This email address is already in use. Try switching to the "Sign in" tab instead!'
  }
  if (code === 'auth/invalid-email' || message.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.'
  }
  if (code === 'auth/weak-password' || message.includes('auth/weak-password')) {
    return 'Your password should be at least 6 characters long.'
  }
  if (
    code === 'auth/wrong-password' ||
    message.includes('auth/wrong-password') ||
    code === 'auth/user-not-found' ||
    message.includes('auth/user-not-found') ||
    code === 'auth/invalid-credential' ||
    message.includes('auth/invalid-credential')
  ) {
    return 'Incorrect email or password. Please try again.'
  }
  if (code === 'auth/too-many-requests' || message.includes('auth/too-many-requests')) {
    return 'Too many login attempts. Access has been temporarily disabled. Try again later.'
  }

  return err?.message || 'Authentication failed. Please check your credentials.'
}
