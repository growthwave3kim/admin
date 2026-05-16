import { supabase } from '@/lib/supabase'
import type { ContactSubmission } from './types'

export const fetchInquiries = async (): Promise<ContactSubmission[]> => {
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export const fetchInquiry = async (id: string): Promise<ContactSubmission> => {
  const { data, error } = await supabase.from('contact_submissions').select('*').eq('id', id).single()
  if (error) throw error
  return data
}
