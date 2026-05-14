import {
  endOfMonth,
  endOfYear,
  getMonth,
  isAfter,
  isBefore,
  parseISO,
  setMonth,
  startOfMonth,
  startOfYear,
  subMonths,
  subYears,
} from 'date-fns'
import type { Expense } from '@/features/expenses/types'
import type { Task } from '@/features/tasks/types'

export type Period = 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'all'

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'this_month', label: '이번달' },
  { value: 'last_month', label: '지난달' },
  { value: 'this_quarter', label: '이번분기' },
  { value: 'this_year', label: '올해' },
  { value: 'all', label: '전체' },
]

export const getPeriodRange = (period: Period): { start: Date | null; end: Date | null } => {
  const now = new Date()
  switch (period) {
    case 'this_month':
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'last_month':
      return {
        start: startOfMonth(subMonths(now, 1)),
        end: endOfMonth(subMonths(now, 1)),
      }
    case 'this_quarter': {
      const q = Math.floor(getMonth(now) / 3)
      return {
        start: startOfMonth(setMonth(now, q * 3)),
        end: endOfMonth(setMonth(now, q * 3 + 2)),
      }
    }
    case 'this_year':
      return { start: startOfYear(now), end: endOfYear(now) }
    case 'all':
      return { start: null, end: null }
  }
}

export const getPrevPeriodRange = (period: Period): { start: Date | null; end: Date | null } => {
  const now = new Date()
  switch (period) {
    case 'this_month':
      return {
        start: startOfMonth(subMonths(now, 1)),
        end: endOfMonth(subMonths(now, 1)),
      }
    case 'last_month':
      return {
        start: startOfMonth(subMonths(now, 2)),
        end: endOfMonth(subMonths(now, 2)),
      }
    case 'this_quarter': {
      const q = Math.floor(getMonth(now) / 3) - 1
      if (q < 0) {
        return {
          start: startOfMonth(setMonth(subYears(now, 1), 9)),
          end: endOfMonth(setMonth(subYears(now, 1), 11)),
        }
      }
      return {
        start: startOfMonth(setMonth(now, q * 3)),
        end: endOfMonth(setMonth(now, q * 3 + 2)),
      }
    }
    case 'this_year':
      return {
        start: startOfYear(subYears(now, 1)),
        end: endOfYear(subYears(now, 1)),
      }
    case 'all':
      return { start: null, end: null }
  }
}

export const filterByRange = (tasks: Task[], start: Date | null, end: Date | null): Task[] => {
  if (!start || !end) return tasks
  return tasks.filter((t) => {
    const d = parseISO(t.start_date)
    return !isBefore(d, start) && !isAfter(d, end)
  })
}

export const filterExpensesByRange = (expenses: Expense[], start: Date | null, end: Date | null): Expense[] => {
  if (!start || !end) return expenses
  return expenses.filter((e) => {
    const d = parseISO(e.expense_date)
    return !isBefore(d, start) && !isAfter(d, end)
  })
}

export const calcDelta = (curr: number, prev: number): string | null => {
  if (prev === 0) return null
  const pct = ((curr - prev) / Math.abs(prev)) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}
