import { redirect } from 'next/navigation'
import { getGroups } from '@/actions/groups'
import { getLists } from '@/actions/lists'
import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from './dashboard-content'

export interface UserInfo {
  id: string
  email: string | undefined
  displayName: string | null
  avatarUrl: string | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const groups = await getGroups()
  const allLists = await getLists()

  const userInfo: UserInfo = {
    id: user.id,
    email: user.email,
    displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || null,
    avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
  }

  return <DashboardContent initialGroups={groups} allLists={allLists} userInfo={userInfo} />
}
