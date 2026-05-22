import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MyPageClient from '@/components/MyPageClient'

export default async function MePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/join')

  const { data: wishes } = await supabase
    .from('wishes')
    .select('*, replies(*)')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })

  const { data: twins } = await supabase
    .from('users')
    .select('*')
    .eq('birth_month', profile.birth_month)
    .eq('birth_day', profile.birth_day)
    .neq('id', user.id)
    .limit(5)

  const { count: sentCount } = await supabase
    .from('wishes')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', user.id)

  return (
    <MyPageClient
      profile={profile}
      wishes={wishes ?? []}
      twins={twins ?? []}
      sentCount={sentCount ?? 0}
    />
  )
}
