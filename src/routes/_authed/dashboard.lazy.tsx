import { KpiCard } from '@/features/dashboard/components/KpiCard'
import { MarketingUsageChart } from '@/features/dashboard/components/MarketingUsageChart'
import { MonthlyChart } from '@/features/dashboard/components/MonthlyChart'
import { StatusBreakdown } from '@/features/dashboard/components/StatusBreakdown'
import { TaskTable } from '@/features/dashboard/components/TaskTable'
import {
  PERIOD_OPTIONS,
  type Period,
  filterByRange,
  getPeriodRange,
  getPrevPeriodRange,
} from '@/features/dashboard/utils'
import { fetchMarketingTypes } from '@/features/marketing-types/queries'
import { fetchTasks } from '@/features/tasks/queries'
import { TASK_STATUS_LABELS, type TaskStatus } from '@/features/tasks/types'
import { cn, formatCurrency } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'
import {
  endOfMonth,
  format,
  isAfter,
  isBefore,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { useMemo, useState } from 'react'

export const Route = createLazyFileRoute('/_authed/dashboard')({
  component: DashboardPage,
})

const STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: '#6b7280',
  in_progress: '#2563eb',
  done_settled: '#16a34a',
  done_unsettled: '#d97706',
}

function DashboardPage() {
  const [period, setPeriod] = useState<Period>('this_month')

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })
  const { data: marketingTypes = [] } = useQuery({
    queryKey: ['marketing-types'],
    queryFn: fetchMarketingTypes,
  })

  const { start, end } = getPeriodRange(period)
  const { start: prevStart, end: prevEnd } = getPrevPeriodRange(period)

  const periodTasks = useMemo(
    () => filterByRange(tasks, start, end),
    [tasks, start, end],
  )
  const prevTasks = useMemo(
    () => filterByRange(tasks, prevStart, prevEnd),
    [tasks, prevStart, prevEnd],
  )

  const totalRevenue = periodTasks.reduce(
    (s, t) => s + (t.received_amount || 0),
    0,
  )
  const totalCost = periodTasks.reduce((s, t) => s + (t.execution_cost || 0), 0)
  const totalProfit = totalRevenue - totalCost
  const inProgressCount = periodTasks.filter(
    (t) => t.status === 'in_progress',
  ).length

  const prevRevenue = prevTasks.reduce(
    (s, t) => s + (t.received_amount || 0),
    0,
  )
  const prevCost = prevTasks.reduce((s, t) => s + (t.execution_cost || 0), 0)
  const prevProfit = prevRevenue - prevCost

  const monthlyData = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const d = subMonths(new Date(), 11 - i)
        const monthStart = startOfMonth(d)
        const monthEnd = endOfMonth(d)
        const monthTasks = tasks.filter((t) => {
          const td = new Date(t.start_date)
          return !isBefore(td, monthStart) && !isAfter(td, monthEnd)
        })
        const revenue = monthTasks.reduce(
          (s, t) => s + (t.received_amount || 0),
          0,
        )
        const cost = monthTasks.reduce((s, t) => s + (t.execution_cost || 0), 0)
        return { label: format(d, "M'월'"), revenue, cost }
      }),
    [tasks],
  )

  const statusBreakdown = (
    [
      'not_started',
      'in_progress',
      'done_settled',
      'done_unsettled',
    ] as TaskStatus[]
  ).map((s) => ({
    status: s,
    label: TASK_STATUS_LABELS[s],
    count: periodTasks.filter((t) => t.status === s).length,
    color: STATUS_COLORS[s],
  }))
  const totalTasks = periodTasks.length

  const marketingUsage = marketingTypes
    .map((mt) => ({
      name: mt.name,
      count: periodTasks.reduce((sum, t) => {
        const m = t.task_marketings?.find(
          (tm) => tm.marketing_type_id === mt.id,
        )
        return sum + (m?.count || 0)
      }, 0),
    }))
    .filter((d) => d.count > 0)

  const today = new Date()
  const attentionTasks = periodTasks
    .filter((t) => {
      if (t.status === 'done_unsettled') return true
      if (
        t.status === 'in_progress' &&
        t.end_date &&
        isBefore(new Date(t.end_date), today)
      )
        return true
      return false
    })
    .sort((a, b) => {
      const aOverdue =
        a.status === 'in_progress' &&
        a.end_date &&
        isBefore(new Date(a.end_date), today)
      const bOverdue =
        b.status === 'in_progress' &&
        b.end_date &&
        isBefore(new Date(b.end_date), today)
      if (aOverdue && !bOverdue) return -1
      if (!aOverdue && bOverdue) return 1
      return a.end_date && b.end_date ? a.end_date.localeCompare(b.end_date) : 0
    })

  const recentTasks = [...periodTasks]
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .slice(0, 6)

  const hasPrev = period !== 'all'
  const kpis = [
    {
      label: '총 수익',
      value: totalProfit,
      display: formatCurrency(totalProfit),
      prevValue: hasPrev ? prevProfit : null,
      color:
        totalProfit >= 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-500 dark:text-red-400',
    },
    {
      label: '받은 금액',
      value: totalRevenue,
      display: formatCurrency(totalRevenue),
      prevValue: hasPrev ? prevRevenue : null,
      color: 'text-gray-900 dark:text-gray-100',
    },
    {
      label: '실행 비용',
      value: totalCost,
      display: formatCurrency(totalCost),
      prevValue: hasPrev ? prevCost : null,
      color: 'text-gray-900 dark:text-gray-100',
    },
    {
      label: '진행 중 업무',
      value: inProgressCount,
      display: String(inProgressCount),
      prevValue: null,
      color: 'text-blue-600 dark:text-blue-400',
    },
  ]

  const displayTasks =
    attentionTasks.length > 0 ? attentionTasks.slice(0, 6) : recentTasks

  return (
    <div className="h-full overflow-auto p-6">
      <div className="space-y-5 max-w-screen-xl">
        {/* Header + Period filter */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
              대시보드
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {start && end
                ? `${format(start, 'yy.MM.dd')} ~ ${format(end, 'yy.MM.dd')}`
                : '전체 기간'}
            </span>
          </div>
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-md p-0.5 gap-0.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded transition-all',
                  period === opt.value
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} isLoading={isLoading} />
          ))}
        </div>

        {/* Row 1: Monthly chart + Status breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <MonthlyChart data={monthlyData} />
          <StatusBreakdown
            statusBreakdown={statusBreakdown}
            totalTasks={totalTasks}
            isLoading={isLoading}
          />
        </div>

        {/* Row 2: Marketing chart + Task table */}
        <div className="grid grid-cols-3 gap-3">
          <MarketingUsageChart data={marketingUsage} />
          <TaskTable
            tasks={displayTasks}
            isAttention={attentionTasks.length > 0}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
