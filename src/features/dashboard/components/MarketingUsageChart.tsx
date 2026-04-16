import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTooltipStyle } from '@/features/dashboard/chartStyles'
import { useTheme } from '@/hooks/useTheme'
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const CHART_COLORS = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#d97706',
  '#16a34a',
  '#0891b2',
]

type MarketingUsageItem = {
  name: string
  count: number
}

export const MarketingUsageChart = ({
  data,
}: {
  data: MarketingUsageItem[]
}) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const tooltipStyle = getTooltipStyle(isDark)

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          마케팅 유형별 사용량
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {data.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-10">
            데이터 없음
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={78}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((item, i) => (
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
  )
}
