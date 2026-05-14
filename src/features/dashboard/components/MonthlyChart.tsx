import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAxisStyle, getTooltipStyle } from '@/features/dashboard/chartStyles'
import { useTheme } from '@/hooks/useTheme'
import { formatCurrency } from '@/lib/utils'

type MonthlyDataPoint = {
  label: string
  revenue: number
  cost: number
  profit: number
}

export const MonthlyChart = ({
  data,
  highlightStart,
  highlightEnd,
}: {
  data: MonthlyDataPoint[]
  highlightStart?: string
  highlightEnd?: string
}) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const displayData = isMobile ? data.slice(-6) : data

  const tooltipStyle = getTooltipStyle(isDark)
  const axisStyle = getAxisStyle(isDark)
  const gridColor = isDark ? '#1f2937' : '#f3f4f6'

  return (
    <Card className="col-span-2 border-border shadow-none">
      <CardHeader className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
            수입 · 지출 · 순수익 추이 · 최근 {isMobile ? '6' : '12'}개월
          </CardTitle>
          <span className="text-[10px] text-gray-400 dark:text-gray-400">단위: 만원</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={displayData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
            <YAxis
              tick={axisStyle}
              axisLine={false}
              tickLine={false}
              tickCount={5}
              width={28}
              tickFormatter={(v: number) =>
                v === 0 ? '0' : new Intl.NumberFormat('ko-KR').format(Math.round(v / 10_000))
              }
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={((v: number) => formatCurrency(v)) as never}
              labelStyle={{
                color: isDark ? '#e5e7eb' : '#374151',
                fontWeight: 600,
              }}
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
              name="수입"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#2563eb', strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="cost"
              name="지출"
              stroke="#d97706"
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#d97706', strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="profit"
              name="순수익"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#16a34a', strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
