import type { Member } from '@/features/tasks/types'
import { supabase } from '@/lib/supabase'

export const fetchMembers = async () => {
  const { data, error } = await supabase.from('members').select('*').order('name')
  if (error) throw error
  return data as Member[]
}
