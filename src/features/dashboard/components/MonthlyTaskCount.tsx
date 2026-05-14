import { Bar, BarChart, CartesianGrid, Cell, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAxisStyle, getTooltipStyle } from '@/features/dashboard/chartStyles'
import { useTheme } from '@/hooks/useTheme'

type MonthlyTaskDataPoint = {
  label: string
  count: number
  highlighted: boolean
}

export const MonthlyTaskCount = ({
  data,
  highlightStart,
  highlightEnd,
}: {
  data: MonthlyTaskDataPoint[]
  highlightStart?: string
  highlightEnd?: string
}) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const tooltipStyle = getTooltipStyle(isDark)
  const axisStyle = getAxisStyle(isDark)
  const gridColor = isDark ? '#1f2937' : '#f3f4f6'

  return (
    <Card className="col-span-2 flex flex-col border-border shadow-none">
      <CardHeader className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
            월별 업무 건수 · 최근 12개월
          </CardTitle>
          <span className="text-[10px] text-gray-400 dark:text-gray-400">단위: 건</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-4 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            {highlightStart && highlightEnd && (
              <ReferenceArea
                x1={highlightStart}
                x2={highlightEnd}
                fill={isDark ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.05)'}
                strokeOpacity={0}
              />
            )}
            <CartesianGrid strokeDasharray="0" stroke={gridColor} vertical={false} />
            <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={((v: number) => [`${v}건`, '업무 건수']) as never}
              labelStyle={{
                color: isDark ? '#e5e7eb' : '#374151',
                fontWeight: 600,
              }}
              itemStyle={{ color: isDark ? '#d1d5db' : '#374151' }}
              cursor={{
                fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              }}
            />
            <Bar dataKey="count" name="업무 건수" radius={[3, 3, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.highlighted ? '#2563eb' : isDark ? '#374151' : '#e5e7eb'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
