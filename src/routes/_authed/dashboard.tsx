import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchMarketingTypes } from '@/features/marketing-types/queries'
import { TaskStatusBadge } from '@/features/tasks/TaskStatusBadge'
import { fetchTasks } from '@/features/tasks/queries'
import type { Task } from '@/features/tasks/types'
import { useTheme } from '@/hooks/useTheme'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  AlertCircle,
  ClipboardList,
  DollarSign,
  TrendingUp,
} from 'lucide-react'
import {
  Bar,
  BarChart,
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

export const Route = createFileRoute('/_authed/dashboard')({
  component: DashboardPage,
})

const STATUS_COLORS = {
  not_started: '#94a3b8',
  in_progress: '#3b82f6',
  done_settled: '#22c55e',
  done_unsettled: '#f59e0b',
}

const STATUS_LABELS = {
  not_started: '시작 전',
  in_progress: '진행 중',
  done_settled: '완료(정산완료)',
  done_unsettled: '완료(정산미완료)',
}

const CHART_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#22c55e',
  '#06b6d4',
]

const getMonthlyData = (tasks: Task[]) => {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i)
    return {
      month: format(d, 'yyyy-MM'),
      label: format(d, 'M월', { locale: ko }),
      start: startOfMonth(d),
      end: endOfMonth(d),
    }
  })

  return months.map(({ label, start, end }) => {
    const monthTasks = tasks.filter((t) => {
      const d = new Date(t.start_date)
      return d >= start && d <= end
    })
    const revenue = monthTasks.reduce(
      (sum, t) => sum + (t.received_amount || 0),
      0,
    )
    const cost = monthTasks.reduce((sum, t) => sum + (t.execution_cost || 0), 0)
    return {
      label,
      revenue,
      cost,
      profit: revenue - cost,
      count: monthTasks.length,
    }
  })
}

function DashboardPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const { data: marketingTypes = [] } = useQuery({
    queryKey: ['marketing-types'],
    queryFn: fetchMarketingTypes,
  })

  const thisMonth = format(new Date(), 'yyyy-MM')
  const thisMonthTasks = tasks.filter(
    (t) => t.start_date?.slice(0, 7) === thisMonth,
  )
  const thisMonthRevenue = thisMonthTasks.reduce(
    (s, t) => s + (t.received_amount || 0),
    0,
  )

  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length
  const unsettledCount = tasks.filter(
    (t) => t.status === 'done_unsettled',
  ).length

  const monthlyData = getMonthlyData(tasks)

  const statusData = Object.entries(STATUS_LABELS)
    .map(([status, name]) => ({
      name,
      value: tasks.filter((t) => t.status === status).length,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
    }))
    .filter((d) => d.value > 0)

  const marketingUsage = marketingTypes
    .map((mt) => {
      const total = tasks.reduce((sum, t) => {
        const m = t.task_marketings?.find(
          (tm) => tm.marketing_type_id === mt.id,
        )
        return sum + (m?.count || 0)
      }, 0)
      return { name: mt.name, count: total }
    })
    .filter((d) => d.count > 0)

  const recentTasks = [...tasks].slice(0, 5)

  const tooltipStyle = {
    fontSize: 12,
    borderRadius: 8,
    border: isDark ? '1px solid #374151' : '1px solid #f0f0f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#e5e7eb' : '#374151',
  }

  const axisTickStyle = { fontSize: 11, fill: isDark ? '#6b7280' : '#9ca3af' }
  const gridColor = isDark ? '#1f2937' : '#f5f5f5'

  const kpis = [
    {
      label: '전체 업무',
      display: String(tasks.length),
      icon: ClipboardList,
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-500 dark:text-blue-400',
      valueColor: 'text-gray-900 dark:text-gray-100',
    },
    {
      label: '진행 중',
      display: String(inProgressCount),
      icon: TrendingUp,
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-500 dark:text-blue-400',
      valueColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: '이번달 수익',
      display: formatCurrency(thisMonthRevenue),
      icon: DollarSign,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      valueColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: '정산 미완료',
      display: String(unsettledCount),
      icon: AlertCircle,
      iconBg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-500 dark:text-amber-400',
      valueColor: 'text-amber-600 dark:text-amber-400',
    },
  ]

  return (
    <div className="space-y-5 px-1">
      {/* Header */}
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
          대시보드
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {format(new Date(), 'yyyy년 M월 d일', { locale: ko })}
        </span>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-3">
        {kpis.map(
          ({ label, display, icon: Icon, iconBg, iconColor, valueColor }) => (
            <Card
              key={label}
              className="border-gray-200 dark:border-gray-800 shadow-none hover:shadow-sm transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                      {label}
                    </p>
                    <p
                      className={`text-xl font-semibold ${valueColor} leading-none`}
                    >
                      {display}
                    </p>
                  </div>
                  <div
                    className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ),
        )}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="col-span-2 border-gray-200 dark:border-gray-800 shadow-none">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              월별 수익 추이 · 최근 6개월
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={monthlyData}
                margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                style={{ outline: 'none' }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={axisTickStyle}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={axisTickStyle}
                  axisLine={false}
                  tickLine={false}
                  tickCount={5}
                  domain={[
                    0,
                    (dataMax: number) =>
                      dataMax === 0
                        ? 100000
                        : Math.ceil((dataMax * 1.2) / 10000) * 10000,
                  ]}
                  tickFormatter={(v: number) =>
                    v === 0 ? '0' : `${(v / 10000).toFixed(0)}만`
                  }
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={
                    ((value: number) => formatCurrency(value)) as never
                  }
                  labelStyle={{ fontWeight: 600 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{
                    fontSize: 11,
                    color: isDark ? '#9ca3af' : '#6b7280',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="받은금액"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  dot={{ r: 3, fill: '#3b82f6' }}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="수익"
                  stroke="#22c55e"
                  strokeWidth={1.5}
                  dot={{ r: 3, fill: '#22c55e' }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800 shadow-none">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              상태별 분포
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart style={{ outline: 'none' }}>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={((value: number) => [`${value}건`]) as never}
                />
                <Legend
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{
                    fontSize: 11,
                    color: isDark ? '#9ca3af' : '#6b7280',
                  }}
                  formatter={(value) => (
                    <span style={{ fontSize: 11 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-gray-200 dark:border-gray-800 shadow-none">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              마케팅 유형별 사용량
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={marketingUsage}
                layout="vertical"
                margin={{ top: 0, right: 4, left: 0, bottom: 0 }}
                style={{ outline: 'none' }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={axisTickStyle}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }}
                  width={76}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={((v: number) => [`${v}건`]) as never}
                />
                <Bar
                  dataKey="count"
                  name="건수"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={16}
                >
                  {marketingUsage.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-2 border-gray-200 dark:border-gray-800 shadow-none">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              최근 업무
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-2">
            {recentTasks.length === 0 ? (
              <p className="text-xs text-gray-300 dark:text-gray-600 text-center py-6">
                업무가 없습니다
              </p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {task.company_name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {formatDate(task.start_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(task.profit || 0)}
                      </span>
                      <TaskStatusBadge status={task.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
