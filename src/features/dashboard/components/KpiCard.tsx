import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export const KpiCard = ({
  label,
  display,
  color,
  delta,
  isLoading,
  small,
}: {
  label: string
  display: string
  color: string
  delta?: string | null
  isLoading: boolean
  small?: boolean
}) => (
  <Card className="border-border shadow-none">
    <CardContent className="flex flex-col px-5 py-4">
      <p className="font-medium text-gray-500 text-xs dark:text-gray-400">{label}</p>
      {isLoading ? (
        <div className="mt-4 h-6 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      ) : (
        <div className="mt-2 flex flex-col gap-1">
          <p className={cn('truncate font-semibold tabular-nums leading-none', small ? 'text-base' : 'text-lg', color)}>
            {display}
          </p>
          {delta && (
            <p
              className={cn(
                'font-medium text-xs tabular-nums',
                delta.startsWith('+') ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
              )}
            >
              {delta}
            </p>
          )}
        </div>
      )}
    </CardContent>
  </Card>
)
