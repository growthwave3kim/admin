import { cn, formatCurrency } from '@/lib/utils'

type Props = {
  value: number
  className?: string
}

export const ProfitAmount = ({ value, className }: Props) => (
  <span
    className={cn(
      'font-semibold tabular-nums',
      value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
      className,
    )}
  >
    {formatCurrency(value)}
  </span>
)
