import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export const KpiCard = ({
  label,
  display,
  color,
  isLoading,
}: {
  label: string
  display: string
  color: string
  value: number
  prevValue: number | null
  isLoading: boolean
}) => {
  return (
    <Card className="border-border shadow-none">
      <CardContent className="px-5 gap-3 flex flex-col py-6">
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
      </CardContent>
    </Card>
  )
}
