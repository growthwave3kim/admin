import type { MarketingType } from '@/features/marketing-types/types'

export type { MarketingType }

export type Member = {
  id: string
  name: string
  created_at: string
}

export type TaskStatus = 'proposal' | 'not_started' | 'in_progress' | 'done_settled' | 'done_unsettled' | 'lost'

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  proposal: '제안',
  not_started: '시작 전',
  in_progress: '진행 중',
  done_settled: '완료 (정산완료)',
  done_unsettled: '완료 (정산미완료)',
  lost: '실패',
}

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  proposal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  not_started: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  done_settled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  done_unsettled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  lost: 'bg-gray-100 text-gray-500 dark:bg-gray-800/60 dark:text-gray-500',
}

export type TaskMarketing = {
  id: string
  task_id: string
  marketing_type_id: string
  count: number
  marketing_types?: MarketingType
}

export type Task = {
  id: string
  company_name: string
  client_id: string | null
  member_id: string | null
  received_amount: number
  execution_cost: number
  profit: number
  status: TaskStatus
  vat_included: boolean
  start_date: string
  end_date: string | null
  note: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  task_marketings?: TaskMarketing[]
  members?: Member | null
}

export const STATUS_ORDER: TaskStatus[] = [
  'proposal',
  'not_started',
  'in_progress',
  'done_settled',
  'done_unsettled',
  'lost',
]

export const PAGE_SIZE = 15

export type SortBy = 'start_date' | 'created_at' | 'received_amount' | 'execution_cost' | 'profit'

export type CalendarTask = {
  id: string
  company_name: string
  status: TaskStatus
  start_date: string
  end_date: string | null
  members: { id: string; name: string } | null
}

export type TaskFormData = {
  company_name: string
  client_id?: string | null
  member_id?: string | null
  received_amount: number
  execution_cost: number
  status: TaskStatus
  vat_included: boolean
  start_date: Date
  end_date?: Date | null
  note?: string
  marketings: { marketing_type_id: string; count: number }[]
}
