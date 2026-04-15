import { supabase } from '@/lib/supabase'
import type { Task, TaskFormData } from './types'

export async function fetchTasks() {
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
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Task[]
}

export async function fetchTask(id: string) {
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

export async function createTask(formData: TaskFormData) {
  const { marketings, start_date, end_date, ...taskData } = formData

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      ...taskData,
      start_date: start_date.toISOString().split('T')[0],
      end_date: end_date ? end_date.toISOString().split('T')[0] : null,
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

export async function updateTask(id: string, formData: Partial<TaskFormData>) {
  const { marketings, start_date, end_date, ...taskData } = formData

  const updatePayload: Record<string, unknown> = { ...taskData }
  if (start_date) updatePayload.start_date = start_date.toISOString().split('T')[0]
  if (end_date !== undefined)
    updatePayload.end_date = end_date ? end_date.toISOString().split('T')[0] : null

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

export async function updateTaskStatus(id: string, status: string) {
  const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}
