import type { Task } from './types'

export const formatMarketingSummary = (task: Task): string => {
  if (!task.task_marketings?.length) return '-'
  return task.task_marketings.map((m) => `${m.marketing_types?.name ?? '?'} ${m.count}건`).join(', ')
}

/**
 * Returns the number of days until the end_date.
 * Positive = days remaining, negative = overdue, null = no end_date.
 */
export const getDeadlineDays = (endDate: string | null): number | null => {
  if (!endDate) return null
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}
