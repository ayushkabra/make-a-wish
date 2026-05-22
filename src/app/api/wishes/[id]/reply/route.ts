import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/wishes/[id]/reply — add a reply to a wish
// The replier must be the wish's recipient (auth required)
export async function POST(req: NextRequest, context: RouteContext) {
  const { id: wishId } = await context.params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { text?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const text = (body.text ?? '').trim()
  if (!text) {
    return NextResponse.json({ error: 'Reply text is required' }, { status: 400 })
  }
  if (text.length > 1000) {
    return NextResponse.json({ error: 'Reply too long (max 1000 chars)' }, { status: 400 })
  }

  // Verify the current user is the recipient of this wish
  const { data: wish, error: fetchError } = await supabase
    .from('wishes')
    .select('id, recipient_id')
    .eq('id', wishId)
    .single()

  if (fetchError || !wish) {
    return NextResponse.json({ error: 'Wish not found' }, { status: 404 })
  }

  if (wish.recipient_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden — only the recipient can reply' }, { status: 403 })
  }

  // Insert the reply
  const { data: reply, error: insertError } = await supabase
    .from('replies')
    .insert({
      wish_id: wishId,
      from_id: user.id,
      text,
    })
    .select('*')
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ reply }, { status: 201 })
}
