import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/server'

// POST /api/auth/session — Create session cookie from ID token
export async function POST(req: NextRequest) {
  try {
    let body: { idToken?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const { idToken } = body
    if (!idToken) {
      return NextResponse.json({ error: 'idToken is required.' }, { status: 400 })
    }

    // Expiry set to 14 days
    const expiresIn = 1000 * 60 * 60 * 24 * 14

    // Verify token to ensure authenticity before creating cookie
    await adminAuth.verifyIdToken(idToken)

    // Create session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    })

    const cookieStore = await cookies()
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    )
  }
}

// DELETE /api/auth/session — Destroy session cookie (sign out)
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.set('session', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Session destruction error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    )
  }
}
