import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import type { Task, TaskFormData } from './types'

export const fetchTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      task_marketings (
        id,
        count,
        marketing_type_id,
        marketing_types (id, name)
      )
    `)
    .order('start_date', { ascending: false })

  if (error) throw error
  return data as Task[]
}

export const fetchTask = async (id: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      task_marketings (
        id,
        count,
        marketing_type_id,
        marketing_types (id, name)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Task
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

  return task
}

export const updateTask = async (
  id: string,
  formData: Partial<TaskFormData>,
) => {
  const { marketings, start_date, end_date, ...taskData } = formData

  const updatePayload: Record<string, unknown> = { ...taskData }
  if (start_date) updatePayload.start_date = format(start_date, 'yyyy-MM-dd')
  if (end_date !== undefined)
    updatePayload.end_date = end_date ? format(end_date, 'yyyy-MM-dd') : null

  const { data: task, error } = await supabase
    .from('tasks')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  if (marketings !== undefined) {
    await supabase.from('task_marketings').delete().eq('task_id', id)
    if (marketings.length > 0) {
      const { error: mError } = await supabase
        .from('task_marketings')
        .insert(marketings.map((m) => ({ ...m, task_id: id })))
      if (mError) throw mError
    }
  }

  return task
}

export const updateTaskStatus = async (id: string, status: string) => {
  const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
  if (error) throw error
}

export const deleteTask = async (id: string) => {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}
