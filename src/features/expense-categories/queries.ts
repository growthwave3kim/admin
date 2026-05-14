import { supabase } from '@/lib/supabase'
import type { ExpenseCategory } from './types'

export const fetchExpenseCategories = async () => {
  const { data, error } = await supabase.from('expense_categories').select('*').order('sort_order')
  if (error) throw error
  return data as ExpenseCategory[]
}

export const createExpenseCategory = async (name: string, sort_order: number) => {
  const { data, error } = await supabase.from('expense_categories').insert({ name, sort_order }).select().single()
  if (error) throw error
  return data as ExpenseCategory
}

export const updateExpenseCategory = async (
  id: string,
  payload: Partial<Pick<ExpenseCategory, 'name' | 'sort_order'>>,
) => {
  const { data, error } = await supabase.from('expense_categories').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data as ExpenseCategory
}

export const deleteExpenseCategory = async (id: string) => {
  const { error } = await supabase.from('expense_categories').delete().eq('id', id)
  if (error) throw error
}

export const reorderExpenseCategories = async (items: { id: string; sort_order: number }[]) => {
  const results = await Promise.all(
    items.map(({ id, sort_order }) => supabase.from('expense_categories').update({ sort_order }).eq('id', id)),
  )
  for (const { error } of results) {
    if (error) throw error
  }
}
