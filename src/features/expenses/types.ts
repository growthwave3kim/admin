export type Spender = '김도현' | '김국민' | '김태훈'
export type EntryType = 'income' | 'expense'

export const SPENDERS: Spender[] = ['김도현', '김국민', '김태훈']

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  income: '수입',
  expense: '지출',
}

export type Expense = {
  id: string
  description: string
  amount: number
  expense_date: string
  spender: Spender
  entry_type: EntryType
  category_id: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type ExpenseFormData = {
  description: string
  amount: number
  expense_date: Date
  spender: Spender
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
  category_id: string | null
  editable: boolean
}

export const PAGE_SIZE = 20
