import { format } from 'date-fns'
import { logAudit } from '@/features/audit/logAudit'
import { supabase } from '@/lib/supabase'
import type { Task, TaskFormData, TaskStatus } from './types'

const TASK_SELECT = `
  *,
  members (id, name),
  task_marketings (
    id,
    count,
    marketing_type_id,
    marketing_types (id, name)
  )
`

export const fetchTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .is('deleted_at', null)
    .order('start_date', { ascending: false })

  if (error) throw error
  return data as Task[]
}

export const fetchTask = async (id: string) => {
  const { data, error } = await supabase.from('tasks').select(TASK_SELECT).eq('id', id).is('deleted_at', null).single()

  if (error) throw error
  return data as Task
}

export const fetchTrashedTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, company_name, status, start_date, deleted_at')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  if (error) throw error
  return data as Pick<Task, 'id' | 'company_name' | 'status' | 'start_date' | 'deleted_at'>[]
}

export const createTask = async (formData: TaskFormData) => {
  const { marketings, start_date, end_date, ...taskData } = formData

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      ...taskData,
      start_date: format(start_date, 'yyyy-MM-dd'),
      end_date: end_date ? format(end_date, 'yyyy-MM-dd') : null,
    })
    .select()
    .single()

  if (error) throw error

  if (marketings.length > 0) {
    const { error: mError } = await supabase
      .from('task_marketings')
      .insert(marketings.map((m) => ({ ...m, task_id: task.id })))
    if (mError) throw mError
  }

  void logAudit({
    tableName: 'tasks',
    recordId: task.id,
    action: 'insert',
    snapshot: task,
  }).catch(() => {})

  return task
}

export const updateTask = async (id: string, formData: Partial<TaskFormData>) => {
  const { marketings, start_date, end_date, ...taskData } = formData

  const datePayload: { start_date?: string; end_date?: string | null } = {}
  if (start_date) datePayload.start_date = format(start_date, 'yyyy-MM-dd')
  if (end_date !== undefined) datePayload.end_date = end_date ? format(end_date, 'yyyy-MM-dd') : null

  const { data: task, error } = await supabase
    .from('tasks')
    .update({ ...taskData, ...datePayload })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  if (marketings !== undefined) {
    const { error: dError } = await supabase.from('task_marketings').delete().eq('task_id', id)
    if (dError) throw dError
    if (marketings.length > 0) {
      const { error: mError } = await supabase
        .from('task_marketings')
        .insert(marketings.map((m) => ({ ...m, task_id: id })))
      if (mError) throw mError
    }
  }

  void logAudit({
    tableName: 'tasks',
    recordId: id,
    action: 'update',
    snapshot: task,
  }).catch(() => {})

  return task
}

export const updateTaskStatus = async (id: string, status: TaskStatus, note?: string) => {
  const { data: before } = await supabase.from('tasks').select('status').eq('id', id).single()

  const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
  if (error) throw error

  void logAudit({
    tableName: 'tasks',
    recordId: id,
    action: 'update',
    changedFields: before ? { status: { old: before.status, new: status } } : undefined,
    note,
  }).catch(() => {})
}

export const softDeleteTask = async (id: string) => {
  const { error } = await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error

  void logAudit({ tableName: 'tasks', recordId: id, action: 'delete' }).catch(() => {})
}

export const restoreTask = async (id: string) => {
  const { error } = await supabase.from('tasks').update({ deleted_at: null }).eq('id', id)
  if (error) throw error
}

export const permanentDeleteTask = async (id: string) => {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export const fetchTasksForCalendar = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, company_name, status, start_date, end_date, members(id, name)')
    .is('deleted_at', null)
    .order('start_date')
  if (error) throw error
  return data as unknown as import('./types').CalendarTask[]
}
