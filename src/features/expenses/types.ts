export type EntryType = 'income' | 'expense'

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  income: '수입',
  expense: '지출',
}

export type Expense = {
  id: string
  description: string
  amount: number
  expense_date: string
  spender_member_id: string
  spender_name: string
  entry_type: EntryType
  category_id: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  attachment_count: number
  attachments: {
    id: string
    storage_path: string
    mime_type: string
    file_name: string
  }[]
}

export type ExpenseFormData = {
  description: string
  amount: number
  expense_date: Date
  spender_member_id: string
  entry_type: EntryType
  category_id?: string | null
}

export type ExpenseRow = {
  id: string
  type: EntryType
  source: 'task' | 'manual'
  description: string
  amount: number
  date: string
  spender: string | null
  spender_member_id: string | null
  category_id: string | null
  editable: boolean
  attachment_count: number
  attachments: {
    id: string
    storage_path: string
    mime_type: string
    file_name: string
  }[]
}

export const PAGE_SIZE = 20
