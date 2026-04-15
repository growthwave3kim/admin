import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns'
import { ko } from 'date-fns/locale'
import { TrendingUp, ClipboardList, DollarSign, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchTasks } from '@/features/tasks/queries'
import { fetchMarketingTypes } from '@/features/marketing-types/queries'
import { TaskStatusBadge } from '@/features/tasks/TaskStatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Task } from '@/features/tasks/types'

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

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4']

function getMonthlyData(tasks: Task[]) {
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
    const revenue = monthTasks.reduce((sum, t) => sum + (t.received_amount || 0), 0)
    const cost = monthTasks.reduce((sum, t) => sum + (t.execution_cost || 0), 0)
    return { label, revenue, cost, profit: revenue - cost, count: monthTasks.length }
  })
}

function DashboardPage() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const { data: marketingTypes = [] } = useQuery({
    queryKey: ['marketing-types'],
    queryFn: fetchMarketingTypes,
  })

  const thisMonth = format(new Date(), 'yyyy-MM')
  const thisMonthTasks = tasks.filter((t) => t.start_date?.slice(0, 7) === thisMonth)
  const thisMonthRevenue = thisMonthTasks.reduce((s, t) => s + (t.received_amount || 0), 0)

  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length
  const unsettledCount = tasks.filter((t) => t.status === 'done_unsettled').length

  const monthlyData = getMonthlyData(tasks)

  const statusData = Object.entries(STATUS_LABELS).map(([status, name]) => ({
    name,
    value: tasks.filter((t) => t.status === status).length,
    color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
  })).filter((d) => d.value > 0)

  const marketingUsage = marketingTypes.map((mt) => {
    const total = tasks.reduce((sum, t) => {
      const m = t.task_marketings?.find((tm) => tm.marketing_type_id === mt.id)
      return sum + (m?.count || 0)
    }, 0)
    return { name: mt.name, count: total }
  }).filter((d) => d.count > 0)

  const recentTasks = [...tasks].slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">GrowthWave 업무 현황</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">전체 업무</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{tasks.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">진행 중</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{inProgressCount}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">이번달 수익</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(thisMonthRevenue)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">정산 미완료</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{unsettledCount}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base">월별 수익 추이 (최근 6개월)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="받은금액" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="profit" name="수익" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">상태별 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}건`]} />
                <Legend
                  formatter={(value) => <span className="text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 + recent tasks */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">마케팅 유형별 사용량</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={marketingUsage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v: number) => [`${v}건`]} />
                <Bar dataKey="count" name="건수" radius={[0, 4, 4, 0]}>
                  {marketingUsage.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base">최근 업무</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">업무가 없습니다</p>
              )}
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.company_name}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(task.start_date)}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(task.profit || 0)}
                    </span>
                    <TaskStatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
