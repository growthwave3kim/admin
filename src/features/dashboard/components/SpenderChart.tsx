import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAxisStyle, getTooltipStyle } from '@/features/dashboard/chartStyles'
import { useTheme } from '@/hooks/useTheme'
import { formatCurrency } from '@/lib/utils'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type SpenderDataPoint = {
  name: string
  amount: number
}

const SPENDER_COLORS = ['#2563eb', '#16a34a', '#d97706']

export const SpenderChart = ({
  data,
  isLoading,
}: {
  data: SpenderDataPoint[]
  isLoading: boolean
}) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const tooltipStyle = getTooltipStyle(isDark)
  const axisStyle = getAxisStyle(isDark)
  const total = data.reduce((s, d) => s + d.amount, 0)

  return (
    <Card className="col-span-2 border-border shadow-none">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          팀원별 지출
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3 mt-2">
            {[1, 2, 3].map((k) => (
              <div
                key={k}
                className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
              />
            ))}
          </div>
        ) : total === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-10">
            직접 등록된 지출이 없습니다
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v === 0
                    ? '0'
                    : new Intl.NumberFormat('ko-KR').format(
                        Math.round(v / 10_000),
                      )
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={((v: number) => formatCurrency(v)) as never}
                cursor={{
                  fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                }}
              />
              <Bar dataKey="amount" name="지출" radius={[0, 3, 3, 0]}>
                {data.map((entry, idx) => (
                  <Cell
                    key={entry.name}
                    fill={SPENDER_COLORS[idx % SPENDER_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
