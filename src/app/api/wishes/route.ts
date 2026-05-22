import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/wishes
// Body: { recipientId, text, isAnonymous, senderName? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId, text, isAnonymous, senderName } = body

    if (!recipientId || typeof recipientId !== 'string') {
      return NextResponse.json(
        { error: 'recipientId is required.' },
        { status: 400 }
      )
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'text is required.' },
        { status: 400 }
      )
    }

    if (text.trim().length > 1000) {
      return NextResponse.json(
        { error: 'Wish is too long (max 1000 characters).' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Try to get logged-in user — optional
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    // Confirm the recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id')
      .eq('id', recipientId)
      .single()

    if (recipientError || !recipient) {
      return NextResponse.json(
        { error: 'Recipient not found.' },
        { status: 404 }
      )
    }

    // Build the wish row
    const wishRow: Record<string, unknown> = {
      recipient_id: recipientId,
      text: text.trim(),
      is_anonymous: !!isAnonymous,
      is_loved: false,
    }

    if (authUser) {
      wishRow.sender_id = authUser.id
    }

    if (!isAnonymous && senderName && typeof senderName === 'string') {
      wishRow.sender_name = senderName.trim().slice(0, 100)
    }

    const { data: wish, error: insertError } = await supabase
      .from('wishes')
      .insert(wishRow)
      .select()
      .single()

    if (insertError) {
      console.error('Wish insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save wish. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ wish }, { status: 201 })
  } catch (err) {
    console.error('POST /api/wishes error:', err)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}

// GET /api/wishes?recipientId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recipientId = searchParams.get('recipientId')

    if (!recipientId) {
      return NextResponse.json(
        { error: 'recipientId query param is required.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: wishes, error } = await supabase
      .from('wishes')
      .select('*, replies(*)')
      .eq('recipient_id', recipientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET /api/wishes error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch wishes.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ wishes: wishes ?? [] })
  } catch (err) {
    console.error('GET /api/wishes error:', err)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}
