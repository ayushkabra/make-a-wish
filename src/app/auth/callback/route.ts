import { NextResponse } from 'next/server'

/**
 * Auth callback route — kept for future OAuth / magic-link support.
 * Email+password auth does not use this route.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  // Default: send to feed. OAuth flows can pass ?next= to override.
  const { searchParams } = new URL(request.url)
  const next = searchParams.get('next') ?? '/feed'
  return NextResponse.redirect(`${origin}${next}`)
}
