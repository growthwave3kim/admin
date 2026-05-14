import { useQuery } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'
import { endOfMonth, format, isAfter, isBefore, parseISO, startOfMonth, subMonths } from 'date-fns'
import { useMemo, useState } from 'react'
import { fetchClients } from '@/features/clients/queries'
import { ExpenseCategoryChart } from '@/features/dashboard/components/ExpenseCategoryChart'
import { KpiCard } from '@/features/dashboard/components/KpiCard'
import { MarketingTable } from '@/features/dashboard/components/MarketingTable'
import { MonthlyChart } from '@/features/dashboard/components/MonthlyChart'
import { MonthlyTaskCount } from '@/features/dashboard/components/MonthlyTaskCount'
import { StatusBreakdown } from '@/features/dashboard/components/StatusBreakdown'
import { TaskTable } from '@/features/dashboard/components/TaskTable'
import { TopClients } from '@/features/dashboard/components/TopClients'
import {
  filterByRange,
  filterExpensesByRange,
  getPeriodRange,
  getPrevPeriodRange,
  PERIOD_OPTIONS,
  type Period,
} from '@/features/dashboard/utils'
import { fetchExpenseCategories } from '@/features/expense-categories/queries'
import { fetchExpenses } from '@/features/expenses/queries'
import { fetchMarketingTypes } from '@/features/marketing-types/queries'
import { fetchTasks } from '@/features/tasks/queries'
import { TASK_STATUS_LABELS, type TaskStatus } from '@/features/tasks/types'
import { STALE_30M, STALE_FOREVER } from '@/lib/queryClient'
import { cn, formatCurrency } from '@/lib/utils'

export const Route = createLazyFileRoute('/_authed/dashboard')({
  component: DashboardPage,
})

const STATUS_COLORS: Record<TaskStatus, string> = {
  proposal: '#7c3aed',
  not_started: '#6b7280',
  in_progress: '#2563eb',
  done_settled: '#16a34a',
  done_unsettled: '#d97706',
  lost: '#9ca3af',
}

function DashboardPage() {
  const [period, setPeriod] = useState<Period>('this_month')

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
  })
  const { data: marketingTypes = [] } = useQuery({
    queryKey: ['marketing-types'],
    queryFn: fetchMarketingTypes,
    staleTime: STALE_FOREVER,
  })
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    staleTime: STALE_30M,
  })
  const { data: expenseCategories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: fetchExpenseCategories,
    staleTime: STALE_FOREVER,
  })

  const anyLoading = isLoading || isLoadingExpenses

  const { start, end } = getPeriodRange(period)
  const { start: prevStart, end: prevEnd } = getPrevPeriodRange(period)

  const periodTasks = useMemo(() => filterByRange(tasks, start, end), [tasks, start, end])
  const prevTasks = useMemo(() => filterByRange(tasks, prevStart, prevEnd), [tasks, prevStart, prevEnd])
  const periodExpenses = useMemo(() => filterExpensesByRange(expenses, start, end), [expenses, start, end])
  const prevExpenses = useMemo(
    () => filterExpensesByRange(expenses, prevStart, prevEnd),
    [expenses, prevStart, prevEnd],
  )

  // KPI calculations
  const taskRevenue = periodTasks.reduce((s, t) => s + (t.received_amount || 0), 0)
  const expenseIncome = periodExpenses.filter((e) => e.entry_type === 'income').reduce((s, e) => s + e.amount, 0)
  const totalRevenue = taskRevenue + expenseIncome

  const taskCost = periodTasks.reduce((s, t) => s + (t.execution_cost || 0), 0)
  const expenseCost = periodExpenses.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + e.amount, 0)
  const totalCost = taskCost + expenseCost

  const totalProfit = totalRevenue - totalCost
  const profitRate = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  // Prev period for delta
  const prevRevenue =
    prevTasks.reduce((s, t) => s + (t.received_amount || 0), 0) +
    prevExpenses.filter((e) => e.entry_type === 'income').reduce((s, e) => s + e.amount, 0)
  const prevCost =
    prevTasks.reduce((s, t) => s + (t.execution_cost || 0), 0) +
    prevExpenses.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + e.amount, 0)
  const prevProfit = prevRevenue - prevCost

  // 미정산: always ALL tasks, no period filter
  const unsettledAmount = tasks
    .filter((t) => t.status === 'done_unsettled')
    .reduce((s, t) => s + (t.received_amount || 0), 0)

  const hasPrev = period !== 'all'
  const calcDeltaStr = (curr: number, prev: number): string | null => {
    if (!hasPrev || prev === 0) return null
    const pct = ((curr - prev) / Math.abs(prev)) * 100
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
  }

  // Monthly chart: 12 months, tasks + expenses combined
  const monthlyData = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const d = subMonths(new Date(), 11 - i)
        const monthStart = startOfMonth(d)
        const monthEnd = endOfMonth(d)

        const monthTasks = tasks.filter((t) => {
          const td = parseISO(t.start_date)
          return !isBefore(td, monthStart) && !isAfter(td, monthEnd)
        })
        const monthExpenses = expenses.filter((e) => {
          const ed = parseISO(e.expense_date)
          return !isBefore(ed, monthStart) && !isAfter(ed, monthEnd)
        })

        const revenue =
          monthTasks.reduce((s, t) => s + (t.received_amount || 0), 0) +
          monthExpenses.filter((e) => e.entry_type === 'income').reduce((s, e) => s + e.amount, 0)
        const cost =
          monthTasks.reduce((s, t) => s + (t.execution_cost || 0), 0) +
          monthExpenses.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + e.amount, 0)
        const profit = revenue - cost

        const highlighted = start && end ? !isAfter(monthStart, end) && !isBefore(monthEnd, start) : false

        return { label: format(d, "M'월'"), revenue, cost, profit, highlighted }
      }),
    [tasks, expenses, start, end],
  )

  const highlightedMonths = monthlyData.filter((d) => d.highlighted)
  const highlightStart = highlightedMonths[0]?.label
  const highlightEnd = highlightedMonths[highlightedMonths.length - 1]?.label

  // Status breakdown
  const statusBreakdown = (['not_started', 'in_progress', 'done_settled', 'done_unsettled'] as TaskStatus[]).map(
    (s) => ({
      status: s,
      label: TASK_STATUS_LABELS[s],
      count: periodTasks.filter((t) => t.status === s).length,
      color: STATUS_COLORS[s],
    }),
  )
  const totalTasks = periodTasks.length

  // Monthly task count (always 12 months, all tasks)
  const monthlyTaskData = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const d = subMonths(new Date(), 11 - i)
        const monthStart = startOfMonth(d)
        const monthEnd = endOfMonth(d)
        const count = tasks.filter((t) => {
          const td = parseISO(t.start_date)
          return !isBefore(td, monthStart) && !isAfter(td, monthEnd)
        }).length
        const highlighted = start && end ? !isAfter(monthStart, end) && !isBefore(monthEnd, start) : false
        return { label: format(d, "M'월'"), count, highlighted }
      }),
    [tasks, start, end],
  )

  // Top clients (period filtered tasks) — grouped by client_id for accuracy
  const topClients = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; profit: number }>()
    for (const t of periodTasks) {
      const key = t.client_id ?? `__name__${t.company_name}`
      const name = t.client_id ? (clients.find((c) => c.id === t.client_id)?.name ?? t.company_name) : t.company_name
      const prev = map.get(key) ?? { name, revenue: 0, profit: 0 }
      map.set(key, {
        name,
        revenue: prev.revenue + (t.received_amount || 0),
        profit: prev.profit + (t.profit || 0),
      })
    }
    return [...map.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([, v], idx) => ({ rank: idx + 1, ...v }))
  }, [periodTasks, clients])

  // Expense category breakdown (period filtered expenses, entry_type=expense only)
  const categoryData = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of periodExpenses.filter((e) => e.entry_type === 'expense')) {
      const key = e.category_id ?? '__none__'
      map.set(key, (map.get(key) ?? 0) + e.amount)
    }
    return [...map.entries()]
      .map(([key, amount]) => ({
        name: key === '__none__' ? '미분류' : (expenseCategories.find((c) => c.id === key)?.name ?? '미분류'),
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [periodExpenses, expenseCategories])

  // Marketing table (period filtered tasks)
  const marketingTableData = useMemo(
    () =>
      marketingTypes
        .map((mt) => {
          const tasksWithThis = periodTasks.filter((t) =>
            t.task_marketings?.some((tm) => tm.marketing_type_id === mt.id),
          )
          const totalCount = tasksWithThis.reduce((sum, t) => {
            const m = t.task_marketings?.find((tm) => tm.marketing_type_id === mt.id)
            return sum + (m?.count || 0)
          }, 0)
          if (totalCount === 0) return null
          const revenue = tasksWithThis.reduce((s, t) => s + (t.received_amount || 0), 0)
          const cost = tasksWithThis.reduce((s, t) => s + (t.execution_cost || 0), 0)
          const profitRate = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0
          return {
            name: mt.name,
            taskCount: totalCount,
            revenue,
            cost,
            profitRate,
          }
        })
        .filter((d): d is NonNullable<typeof d> => d !== null)
        .sort((a, b) => b.profitRate - a.profitRate),
    [marketingTypes, periodTasks],
  )

  // Current tasks: always ALL tasks, no period filter — in_progress + not_started + done_unsettled
  const currentTasks = useMemo(() => {
    const now = new Date()
    return tasks
      .filter((t) => t.status === 'in_progress' || t.status === 'not_started' || t.status === 'done_unsettled')
      .sort((a, b) => {
        const aOverdue = a.status === 'in_progress' && !!a.end_date && isBefore(parseISO(a.end_date), now)
        const bOverdue = b.status === 'in_progress' && !!b.end_date && isBefore(parseISO(b.end_date), now)
        const aAttention = aOverdue || a.status === 'done_unsettled'
        const bAttention = bOverdue || b.status === 'done_unsettled'
        if (aAttention && !bAttention) return -1
        if (!aAttention && bAttention) return 1
        return a.end_date && b.end_date ? a.end_date.localeCompare(b.end_date) : 0
      })
      .slice(0, 8)
  }, [tasks])

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="max-w-screen-xl space-y-5">
        {/* Header + Period filter */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-base text-gray-900 dark:text-gray-100">대시보드</span>
            <span className="text-gray-400 text-xs dark:text-gray-400">
              {start && end ? `${format(start, 'yy.MM.dd')} ~ ${format(end, 'yy.MM.dd')}` : '전체 기간'}
            </span>
          </div>
          <div className="flex items-center gap-0.5 rounded-md bg-gray-100 p-0.5 dark:bg-gray-800">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={cn(
                  'rounded px-3 py-1.5 font-medium text-xs transition-all',
                  period === opt.value
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 1: 3 large KPI cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiCard
            label="총 수입"
            display={`+${formatCurrency(totalRevenue)}`}
            color="text-emerald-600 dark:text-emerald-400"
            delta={calcDeltaStr(totalRevenue, prevRevenue)}
            isLoading={anyLoading}
          />
          <KpiCard
            label="총 지출"
            display={`-${formatCurrency(totalCost)}`}
            color="text-red-500 dark:text-red-400"
            delta={calcDeltaStr(totalCost, prevCost)}
            isLoading={anyLoading}
          />
          <KpiCard
            label="순수익"
            display={formatCurrency(totalProfit)}
            color={totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}
            delta={calcDeltaStr(totalProfit, prevProfit)}
            isLoading={anyLoading}
          />
        </div>

        {/* Row 2: 2 smaller KPI cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <KpiCard
            label="수익률"
            display={`${profitRate.toFixed(1)}%`}
            color={
              profitRate >= 30
                ? 'text-emerald-600 dark:text-emerald-400'
                : profitRate >= 0
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-red-500 dark:text-red-400'
            }
            isLoading={anyLoading}
            small
          />
          <KpiCard
            label="미정산 금액 (전체)"
            display={formatCurrency(unsettledAmount)}
            color={unsettledAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}
            isLoading={isLoading}
            small
          />
        </div>

        {/* Row 3: Monthly chart (2/3) + Status breakdown (1/3) */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <MonthlyChart data={monthlyData} highlightStart={highlightStart} highlightEnd={highlightEnd} />
          <StatusBreakdown statusBreakdown={statusBreakdown} totalTasks={totalTasks} isLoading={isLoading} />
        </div>

        {/* Row 4: Task count (2/4) + Top clients (1/4) + Expense category pie (1/4) */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <MonthlyTaskCount data={monthlyTaskData} highlightStart={highlightStart} highlightEnd={highlightEnd} />
          <div className="grid grid-cols-1 gap-3 lg:col-span-2 lg:grid-cols-2">
            <TopClients data={topClients} isLoading={isLoading} />
            <ExpenseCategoryChart data={categoryData} isLoading={anyLoading} />
          </div>
        </div>

        {/* Row 5: Marketing table (full width) */}
        <MarketingTable data={marketingTableData} isLoading={isLoading} />

        {/* Row 6: Current tasks (full width) */}
        <TaskTable tasks={currentTasks} isLoading={isLoading} />
      </div>
    </div>
  )
}
