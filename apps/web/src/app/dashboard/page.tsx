import { redirect } from 'next/navigation'
import { getGroups } from '@/actions/groups'
import { getLists } from '@/actions/lists'
import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from './dashboard-content'

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

  return <DashboardContent initialGroups={groups} allLists={allLists} />
}
