import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAxisStyle, getTooltipStyle } from '@/features/dashboard/chartStyles'
import { useTheme } from '@/hooks/useTheme'
import { formatCurrency } from '@/lib/utils'

type SpenderDataPoint = {
  name: string
  amount: number
}

const SPENDER_COLORS = ['#2563eb', '#16a34a', '#d97706']

export const SpenderChart = ({ data, isLoading }: { data: SpenderDataPoint[]; isLoading: boolean }) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const tooltipStyle = getTooltipStyle(isDark)
  const axisStyle = getAxisStyle(isDark)
  const total = data.reduce((s, d) => s + d.amount, 0)

  return (
    <Card className="col-span-2 flex flex-col border-border shadow-none">
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
          팀원별 지출
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-4 pb-4">
        {isLoading ? (
          <div className="mt-2 space-y-3">
            {[1, 2, 3].map((k) => (
              <div key={k} className="h-8 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : total === 0 ? (
          <p className="py-10 text-center text-gray-400 text-xs dark:text-gray-400">직접 등록된 지출이 없습니다</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <XAxis
                type="number"
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v === 0 ? '0' : new Intl.NumberFormat('ko-KR').format(Math.round(v / 10_000))
                }
              />
              <YAxis type="category" dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} width={44} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={((v: number) => formatCurrency(v)) as never}
                labelStyle={{
                  color: isDark ? '#e5e7eb' : '#374151',
                  fontWeight: 600,
                }}
                itemStyle={{ color: isDark ? '#d1d5db' : '#374151' }}
                cursor={{
                  fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                }}
              />
              <Bar dataKey="amount" name="지출" radius={[0, 3, 3, 0]}>
                {data.map((entry, idx) => (
                  <Cell key={entry.name} fill={SPENDER_COLORS[idx % SPENDER_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
