import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/wishes/[id] — toggle is_loved on a wish
// Only the wish's recipient may love it
export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { is_loved?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body.is_loved !== 'boolean') {
    return NextResponse.json({ error: 'is_loved must be a boolean' }, { status: 400 })
  }

  // Verify the current user is the recipient of this wish
  const { data: wish, error: fetchError } = await supabase
    .from('wishes')
    .select('id, recipient_id, is_loved')
    .eq('id', id)
    .single()

  if (fetchError || !wish) {
    return NextResponse.json({ error: 'Wish not found' }, { status: 404 })
  }

  if (wish.recipient_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: updated, error: updateError } = await supabase
    .from('wishes')
    .update({ is_loved: body.is_loved })
    .eq('id', id)
    .select('*')
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ wish: updated })
}
