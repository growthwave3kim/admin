import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTooltipStyle } from '@/features/dashboard/chartStyles'
import { useTheme } from '@/hooks/useTheme'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#65a30d', '#9ca3af']

type CategoryDataPoint = {
  name: string
  amount: number
}

export const ExpenseCategoryChart = ({ data, isLoading }: { data: CategoryDataPoint[]; isLoading: boolean }) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const tooltipStyle = getTooltipStyle(isDark)

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
          지출 카테고리
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="flex h-[180px] items-center justify-center">
            <div className="h-24 w-24 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
          </div>
        ) : data.length === 0 ? (
          <p className="py-16 text-center text-gray-400 text-xs dark:text-gray-400">데이터가 없습니다</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data} dataKey="amount" nameKey="name" cx="50%" cy="45%" outerRadius={60} strokeWidth={0}>
                {data.map((_, i) => (
                  <Cell
                    key={`cell-${
                      // biome-ignore lint/suspicious/noArrayIndexKey: static palette
                      i
                    }`}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: unknown) => formatCurrency(v as number)}
                labelStyle={{
                  color: isDark ? '#e5e7eb' : '#374151',
                  fontWeight: 600,
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: 10,
                  color: isDark ? '#9ca3af' : '#6b7280',
                  paddingTop: 4,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
