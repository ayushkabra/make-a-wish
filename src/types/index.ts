export interface User {
  id: string
  name: string
  slug: string
  city?: string
  birth_month: number
  birth_day: number
  bio?: string
  vibe?: string
  created_at: string
  wish_count?: number
}

export interface Reply {
  id: string
  wish_id: string
  from_id: string
  text: string
  created_at: string
}

export interface Wish {
  id: string
  recipient_id: string
  sender_id?: string
  sender_name?: string
  is_anonymous: boolean
  text: string
  is_loved: boolean
  created_at: string
  replies?: Reply[]
}

/** Zodiac sign data — used by lib/zodiac.ts */
export interface ZodiacSign {
  end: [number, number]
  sign: string
  icon: string
  dates: string
  trait: string
  facts: string[]
}
