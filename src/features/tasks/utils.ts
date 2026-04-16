import type { Task } from './types'

export const formatMarketingSummary = (task: Task): string => {
  if (!task.task_marketings?.length) return '-'
  return task.task_marketings
    .map((m) => `${m.marketing_types?.name ?? '?'} ${m.count}건`)
    .join(', ')
}
