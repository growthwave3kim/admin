import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import type { Expense, ExpenseFormData } from './types'

export const fetchExpenses = async () => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })

  if (error) throw error
  return data as Expense[]
}

export const createExpense = async (formData: ExpenseFormData) => {
  const { expense_date, ...rest } = formData
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      ...rest,
      expense_date: format(expense_date, 'yyyy-MM-dd'),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateExpense = async (
  id: string,
  formData: Partial<ExpenseFormData>,
) => {
  const { expense_date, ...rest } = formData
  const payload: Record<string, unknown> = { ...rest }
  if (expense_date) payload.expense_date = format(expense_date, 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('expenses')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteExpense = async (id: string) => {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}
