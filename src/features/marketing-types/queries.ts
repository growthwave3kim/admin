import { supabase } from '@/lib/supabase'
import type { MarketingType } from '../tasks/types'

export async function fetchMarketingTypes() {
  const { data, error } = await supabase
    .from('marketing_types')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data as MarketingType[]
}

export async function createMarketingType(name: string, sort_order: number) {
  const { data, error } = await supabase
    .from('marketing_types')
    .insert({ name, sort_order })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMarketingType(
  id: string,
  updates: { name?: string; sort_order?: number },
) {
  const { data, error } = await supabase
    .from('marketing_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMarketingType(id: string) {
  const { error } = await supabase.from('marketing_types').delete().eq('id', id)
  if (error) throw error
}
