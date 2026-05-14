import { useMemo } from 'react'
import type { Expense, ExpenseRow } from './types'

type Task = {
  id: string
  company_name: string
  received_amount: number
  execution_cost: number
  start_date: string
}

type Filters = {
  searchText: string
  spenderFilter: string
  dateFrom: string | undefined
  dateTo: string | undefined
}

type UseExpenseFiltersResult = {
  allRows: ExpenseRow[]
  filteredRows: ExpenseRow[]
  sortedRows: ExpenseRow[]
  summary: {
    totalIncome: number
    totalExpense: number
    netProfit: number
  }
}

export const useExpenseFilters = (expenses: Expense[], tasks: Task[], filters: Filters): UseExpenseFiltersResult => {
  const { searchText, spenderFilter, dateFrom, dateTo } = filters

  const allRows: ExpenseRow[] = useMemo(() => {
    const rows: ExpenseRow[] = []

    for (const task of tasks) {
      if (task.received_amount > 0) {
        rows.push({
          id: `task-income-${task.id}`,
          type: 'income',
          source: 'task',
          description: `${task.company_name} (받은금액)`,
          amount: task.received_amount,
          date: task.start_date,
          spender: null,
          spender_member_id: null,
          category_id: null,
          editable: false,
          attachment_count: 0,
          attachments: [],
        })
      }
      if (task.execution_cost > 0) {
        rows.push({
          id: `task-expense-${task.id}`,
          type: 'expense',
          source: 'task',
          description: `${task.company_name} (실행비)`,
          amount: task.execution_cost,
          date: task.start_date,
          spender: null,
          spender_member_id: null,
          category_id: null,
          editable: false,
          attachment_count: 0,
          attachments: [],
        })
      }
    }

    for (const expense of expenses) {
      rows.push({
        id: expense.id,
        type: expense.entry_type,
        source: 'manual',
        description: expense.description,
        amount: expense.amount,
        date: expense.expense_date,
        spender: expense.spender_name,
        spender_member_id: expense.spender_member_id,
        category_id: expense.category_id,
        editable: true,
        attachment_count: expense.attachment_count,
        attachments: expense.attachments,
      })
    }

    return rows
  }, [tasks, expenses])

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      const matchSearch = searchText ? row.description.toLowerCase().includes(searchText.toLowerCase()) : true
      const matchSpender =
        spenderFilter && spenderFilter !== 'all'
          ? row.source === 'manual' && row.spender_member_id === spenderFilter
          : true
      const matchDateFrom = dateFrom ? row.date >= dateFrom : true
      const matchDateTo = dateTo ? row.date <= dateTo : true
      return matchSearch && matchSpender && matchDateFrom && matchDateTo
    })
  }, [allRows, searchText, spenderFilter, dateFrom, dateTo])

  const sortedRows = useMemo(
    () => [...filteredRows].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [filteredRows],
  )

  const summary = useMemo(() => {
    const totalIncome = filteredRows.filter((r) => r.type === 'income').reduce((sum, r) => sum + r.amount, 0)
    const totalExpense = filteredRows.filter((r) => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0)
    return { totalIncome, totalExpense, netProfit: totalIncome - totalExpense }
  }, [filteredRows])

  return { allRows, filteredRows, sortedRows, summary }
}
