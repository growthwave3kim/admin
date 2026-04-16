import { Card, CardContent } from '@/components/ui/card'
import { calcDelta } from '@/features/dashboard/utils'
import { cn } from '@/lib/utils'

export const KpiCard = ({
  label,
  display,
  color,
  value,
  prevValue,
  isLoading,
}: {
  label: string
  display: string
  color: string
  value: number
  prevValue: number | null
  isLoading: boolean
}) => {
  const delta = prevValue !== null ? calcDelta(value, prevValue) : null
  const isPos = prevValue !== null && value >= prevValue

  return (
    <Card className="border-border shadow-none">
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
}
