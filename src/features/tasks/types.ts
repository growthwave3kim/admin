export type TaskStatus = 'not_started' | 'in_progress' | 'done_settled' | 'done_unsettled'

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: '시작 전',
  in_progress: '진행 중',
  done_settled: '완료 (정산완료)',
  done_unsettled: '완료 (정산미완료)',
}

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done_settled: 'bg-green-100 text-green-700',
  done_unsettled: 'bg-amber-100 text-amber-700',
}

export interface MarketingType {
  id: string
  name: string
  sort_order: number
  created_at: string
}

export interface TaskMarketing {
  id: string
  task_id: string
  marketing_type_id: string
  count: number
  marketing_types?: MarketingType
}

export interface Task {
  id: string
  company_name: string
  received_amount: number
  execution_cost: number
  profit: number
  status: TaskStatus
  start_date: string
  end_date: string | null
  note: string | null
  created_at: string
  updated_at: string
  task_marketings?: TaskMarketing[]
}

export interface TaskFormData {
  company_name: string
  received_amount: number
  execution_cost: number
  status: TaskStatus
  start_date: Date
  end_date?: Date | null
  note?: string
  marketings: { marketing_type_id: string; count: number }[]
}
