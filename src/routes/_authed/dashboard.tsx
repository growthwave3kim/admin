import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchMarketingTypes } from '@/features/marketing-types/queries'
import { TaskStatusBadge } from '@/features/tasks/TaskStatusBadge'
import { fetchTasks } from '@/features/tasks/queries'
import {
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from '@/features/tasks/types'
import { useTheme } from '@/hooks/useTheme'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import { useState } from 'react'
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

dayjs.locale('ko')

export const Route = createFileRoute('/_authed/dashboard')({
  component: DashboardPage,
})

type Period = 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'all'

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'this_month', label: '이번달' },
  { value: 'last_month', label: '지난달' },
  { value: 'this_quarter', label: '이번분기' },
  { value: 'this_year', label: '올해' },
  { value: 'all', label: '전체' },
]

const STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: '#6b7280',
  in_progress: '#2563eb',
  done_settled: '#16a34a',
  done_unsettled: '#d97706',
}

const CHART_COLORS = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#d97706',
  '#16a34a',
  '#0891b2',
]

const getPeriodRange = (
  period: Period,
): { start: dayjs.Dayjs | null; end: dayjs.Dayjs | null } => {
  const now = dayjs()
  switch (period) {
    case 'this_month':
      return { start: now.startOf('month'), end: now.endOf('month') }
    case 'last_month':
      return {
        start: now.subtract(1, 'month').startOf('month'),
        end: now.subtract(1, 'month').endOf('month'),
      }
    case 'this_quarter': {
      const q = Math.floor(now.month() / 3)
      return {
        start: now.month(q * 3).startOf('month'),
        end: now.month(q * 3 + 2).endOf('month'),
      }
    }
    case 'this_year':
      return { start: now.startOf('year'), end: now.endOf('year') }
    case 'all':
      return { start: null, end: null }
  }
}

const getPrevPeriodRange = (
  period: Period,
): { start: dayjs.Dayjs | null; end: dayjs.Dayjs | null } => {
  const now = dayjs()
  switch (period) {
    case 'this_month':
      return {
        start: now.subtract(1, 'month').startOf('month'),
        end: now.subtract(1, 'month').endOf('month'),
      }
    case 'last_month':
      return {
        start: now.subtract(2, 'month').startOf('month'),
        end: now.subtract(2, 'month').endOf('month'),
      }
    case 'this_quarter': {
      const q = Math.floor(now.month() / 3) - 1
      if (q < 0) {
        return {
          start: now.subtract(1, 'year').month(9).startOf('month'),
          end: now.subtract(1, 'year').month(11).endOf('month'),
        }
      }
      return {
        start: now.month(q * 3).startOf('month'),
        end: now.month(q * 3 + 2).endOf('month'),
      }
    }
    case 'this_year':
      return {
        start: now.subtract(1, 'year').startOf('year'),
        end: now.subtract(1, 'year').endOf('year'),
      }
    case 'all':
      return { start: null, end: null }
  }
}

const filterByRange = (
  tasks: Task[],
  start: dayjs.Dayjs | null,
  end: dayjs.Dayjs | null,
) => {
  if (!start || !end) return tasks
  return tasks.filter((t) => {
    const d = dayjs(t.start_date)
    return !d.isBefore(start) && !d.isAfter(end)
  })
}

const calcDelta = (curr: number, prev: number): string | null => {
  if (prev === 0) return null
  const pct = ((curr - prev) / Math.abs(prev)) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

function DashboardPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
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

  const periodTasks = filterByRange(tasks, start, end)
  const prevTasks = filterByRange(tasks, prevStart, prevEnd)

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

  // 12-month area chart (fixed, not period-filtered)
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const d = dayjs().subtract(11 - i, 'month')
    const monthStart = d.startOf('month')
    const monthEnd = d.endOf('month')
    const monthTasks = tasks.filter((t) => {
      const td = dayjs(t.start_date)
      return !td.isBefore(monthStart) && !td.isAfter(monthEnd)
    })
    const revenue = monthTasks.reduce((s, t) => s + (t.received_amount || 0), 0)
    const cost = monthTasks.reduce((s, t) => s + (t.execution_cost || 0), 0)
    return { label: d.format('M월'), revenue, cost }
  })

  // Status breakdown (period-filtered)
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

  // Marketing usage (period-filtered)
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

  const recentTasks = [...periodTasks]
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .slice(0, 6)

  // 주의 필요 업무: done_unsettled + in_progress past end_date
  const today = dayjs()
  const attentionTasks = periodTasks
    .filter((t) => {
      if (t.status === 'done_unsettled') return true
      if (
        t.status === 'in_progress' &&
        t.end_date &&
        dayjs(t.end_date).isBefore(today)
      )
        return true
      return false
    })
    .sort((a, b) => {
      // in_progress overdued first, then done_unsettled
      const aOverdue =
        a.status === 'in_progress' &&
        a.end_date &&
        dayjs(a.end_date).isBefore(today)
      const bOverdue =
        b.status === 'in_progress' &&
        b.end_date &&
        dayjs(b.end_date).isBefore(today)
      if (aOverdue && !bOverdue) return -1
      if (!aOverdue && bOverdue) return 1
      return a.end_date && b.end_date ? a.end_date.localeCompare(b.end_date) : 0
    })

  const tooltipStyle = {
    fontSize: 12,
    border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    backgroundColor: isDark ? '#111827' : '#ffffff',
    color: isDark ? '#e5e7eb' : '#374151',
    borderRadius: 4,
  }
  const axisStyle = { fontSize: 11, fill: isDark ? '#6b7280' : '#9ca3af' }
  const gridColor = isDark ? '#1f2937' : '#f3f4f6'

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
                ? `${start.format('YY.MM.DD')} ~ ${end.format('YY.MM.DD')}`
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
          {kpis.map(({ label, display, prevValue, value, color }) => {
            const delta =
              prevValue !== null ? calcDelta(value, prevValue) : null
            const isPos = delta?.startsWith('+')
            return (
              <Card key={label} className="border-border shadow-none">
                <CardContent className="px-5 py-6">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {label}
                  </p>
                  {isLoading ? (
                    <div className="h-6 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mt-6" />
                  ) : (
                    <p
                      className={cn(
                        'text-lg font-semibold leading-none tabular-nums truncate mt-6',
                        color,
                      )}
                    >
                      {display}
                    </p>
                  )}
                  {delta && !isLoading && (
                    <p
                      className={cn(
                        'text-[11px] mt-3 tabular-nums',
                        isPos ? 'text-emerald-500' : 'text-red-400',
                      )}
                    >
                      {delta} vs 이전 기간
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Row 1: Area chart + Status list */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="col-span-2 border-border shadow-none">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  매출 · 비용 추이 · 최근 12개월
                </CardTitle>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  단위: 만원
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ResponsiveContainer
                key={String(isDark)}
                width="100%"
                height={220}
              >
                <LineChart
                  data={monthlyData}
                  margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="0"
                    stroke={gridColor}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    tickCount={5}
                    width={56}
                    domain={[0, 'auto']}
                    tickFormatter={(v: number) =>
                      v === 0
                        ? '0'
                        : new Intl.NumberFormat('ko-KR').format(
                            Math.round(v / 10_000),
                          )
                    }
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={((v: number) => formatCurrency(v)) as never}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Legend
                    iconType="plainline"
                    iconSize={16}
                    wrapperStyle={{
                      fontSize: 11,
                      color: isDark ? '#9ca3af' : '#6b7280',
                      paddingTop: 4,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="받은금액"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#2563eb', strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    name="실행비용"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#d97706', strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                상태별 분포 · 전체
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isLoading ? (
                <div className="space-y-3 mt-2">
                  {[1, 2, 3, 4].map((k) => (
                    <div
                      key={k}
                      className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3 mt-2">
                  {statusBreakdown.map(({ status, label, count, color }) => {
                    const pct =
                      totalTasks > 0
                        ? Math.round((count / totalTasks) * 100)
                        : 0
                    return (
                      <div key={status} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">
                            {label}
                          </span>
                          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                            {count}건
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums w-7 text-right">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Marketing bar + Attention tasks */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                마케팅 유형별 사용량
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {marketingUsage.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-10">
                  데이터 없음
                </p>
              ) : (
                <ResponsiveContainer
                  key={String(isDark)}
                  width="100%"
                  height={220}
                >
                  <PieChart>
                    <Pie
                      data={marketingUsage}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {marketingUsage.map((item, i) => (
                        <Cell
                          key={item.name}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={((v: number) => [`${v}건`]) as never}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{
                        fontSize: 11,
                        color: isDark ? '#9ca3af' : '#6b7280',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-2 border-border shadow-none">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {attentionTasks.length > 0 ? '주의 필요 업무' : '최근 업무'}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((k) => (
                    <div
                      key={k}
                      className="h-9 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                (() => {
                  const displayTasks =
                    attentionTasks.length > 0
                      ? attentionTasks.slice(0, 6)
                      : recentTasks
                  const isAttention = attentionTasks.length > 0
                  if (displayTasks.length === 0)
                    return (
                      <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-10">
                        업무가 없습니다
                      </p>
                    )
                  return (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800/60">
                          <th className="text-left pb-2 text-gray-400 dark:text-gray-500 font-medium">
                            업체명
                          </th>
                          <th className="text-left pb-2 text-gray-400 dark:text-gray-500 font-medium">
                            상태
                          </th>
                          <th className="text-right pb-2 text-gray-400 dark:text-gray-500 font-medium">
                            받은금액
                          </th>
                          <th className="text-right pb-2 text-gray-400 dark:text-gray-500 font-medium">
                            수익
                          </th>
                          <th className="text-center pb-2 text-gray-400 dark:text-gray-500 font-medium">
                            종료일
                          </th>
                          {isAttention && (
                            <th className="text-center pb-2 text-gray-400 dark:text-gray-500 font-medium">
                              사유
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                        {displayTasks.map((task) => {
                          const isOverdue =
                            task.status === 'in_progress' &&
                            task.end_date &&
                            dayjs(task.end_date).isBefore(today)
                          return (
                            <tr
                              key={task.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                            >
                              <td className="py-2.5 font-medium text-gray-800 dark:text-gray-200 truncate max-w-[120px]">
                                <Link
                                  to="/tasks/$taskId"
                                  params={{ taskId: task.id }}
                                  className="hover:underline"
                                >
                                  {task.company_name}
                                </Link>
                              </td>
                              <td className="py-2.5">
                                <TaskStatusBadge status={task.status} />
                              </td>
                              <td className="py-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300">
                                {formatCurrency(task.received_amount)}
                              </td>
                              <td
                                className={cn(
                                  'py-2.5 text-right tabular-nums font-semibold',
                                  (task.profit || 0) >= 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-red-500 dark:text-red-400',
                                )}
                              >
                                {formatCurrency(task.profit || 0)}
                              </td>
                              <td className="py-2.5 text-center tabular-nums text-gray-500 dark:text-gray-400">
                                {formatDate(task.end_date)}
                              </td>
                              {isAttention && (
                                <td className="py-2.5 text-center">
                                  <span
                                    className={cn(
                                      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
                                      isOverdue
                                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                                    )}
                                  >
                                    {isOverdue ? '기간초과' : '정산미완료'}
                                  </span>
                                </td>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )
                })()
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
