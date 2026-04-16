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
    <CardContent
      className={cn('px-5 flex flex-col gap-2', small ? 'py-4' : 'py-6')}
    >
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        {label}
      </p>
      {isLoading ? (
        <div className="h-6 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mt-4" />
      ) : (
        <div className={cn('flex flex-col gap-1', small ? 'mt-2' : 'mt-4')}>
          <p
            className={cn(
              'font-semibold leading-none tabular-nums truncate',
              small ? 'text-base' : 'text-lg',
              color,
            )}
          >
            {display}
          </p>
          {delta && (
            <p
              className={cn(
                'text-xs font-medium tabular-nums',
                delta.startsWith('+')
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : 'text-red-500 dark:text-red-400',
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
