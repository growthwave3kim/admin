import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTooltipStyle } from '@/features/dashboard/chartStyles'
import { useTheme } from '@/hooks/useTheme'
import { formatCurrency } from '@/lib/utils'
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const COLORS = [
  '#2563eb',
  '#16a34a',
  '#d97706',
  '#7c3aed',
  '#dc2626',
  '#0891b2',
  '#65a30d',
  '#9ca3af',
]

type CategoryDataPoint = {
  name: string
  amount: number
}

export const ExpenseCategoryChart = ({
  data,
  isLoading,
}: {
  data: CategoryDataPoint[]
  isLoading: boolean
}) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const tooltipStyle = getTooltipStyle(isDark)

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          지출 카테고리
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="h-[180px] flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-400 text-center py-16">
            데이터가 없습니다
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="45%"
                outerRadius={60}
                strokeWidth={0}
              >
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
