import { format } from 'date-fns'
import { logAudit } from '@/features/audit/logAudit'
import { supabase } from '@/lib/supabase'
import type { Expense, ExpenseFormData } from './types'

export const fetchExpenses = async () => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, members!spender_member_id(name), expense_attachments(id, storage_path, mime_type, file_name)')
    .is('deleted_at', null)
    .order('expense_date', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    spender_name: (row.members as { name: string } | null)?.name ?? '',
    attachments:
      (row.expense_attachments as
        | {
            id: string
            storage_path: string
            mime_type: string
            file_name: string
          }[]
        | null) ?? [],
    attachment_count: (row.expense_attachments as { id: string }[] | null)?.length ?? 0,
    members: undefined,
    expense_attachments: undefined,
  })) as Expense[]
}

export const fetchTrashedExpenses = async () => {
  const { data, error } = await supabase
    .from('expenses')
    .select('id, description, amount, expense_date, entry_type, deleted_at')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  if (error) throw error
  return data as Pick<Expense, 'id' | 'description' | 'amount' | 'expense_date' | 'entry_type' | 'deleted_at'>[]
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

  void logAudit({
    tableName: 'expenses',
    recordId: data.id,
    action: 'insert',
    snapshot: data,
  }).catch(() => {})

  return data
}

export const updateExpense = async (id: string, formData: Partial<ExpenseFormData>) => {
  const { expense_date, ...rest } = formData
  const payload = {
    ...rest,
    ...(expense_date ? { expense_date: format(expense_date, 'yyyy-MM-dd') } : {}),
  }

  const { data, error } = await supabase.from('expenses').update(payload).eq('id', id).select().single()

  if (error) throw error

  void logAudit({
    tableName: 'expenses',
    recordId: id,
    action: 'update',
    snapshot: data,
  }).catch(() => {})

  return data
}

export const softDeleteExpense = async (id: string) => {
  const { error } = await supabase.from('expenses').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error

  void logAudit({
    tableName: 'expenses',
    recordId: id,
    action: 'delete',
  }).catch(() => {})
}

export const restoreExpense = async (id: string) => {
  const { error } = await supabase.from('expenses').update({ deleted_at: null }).eq('id', id)
  if (error) throw error
}

export const permanentDeleteExpense = async (id: string) => {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error

  void logAudit({
    tableName: 'expenses',
    recordId: id,
    action: 'delete',
  }).catch(() => {})
}
