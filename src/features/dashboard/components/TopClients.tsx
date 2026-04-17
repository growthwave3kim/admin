import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'

type ClientRow = {
  rank: number
  name: string
  revenue: number
  profit: number
}

export const TopClients = ({
  data,
  isLoading,
}: {
  data: ClientRow[]
  isLoading: boolean
}) => (
  <Card className="border-border shadow-none">
    <CardHeader className="pb-2 pt-4 px-4">
      <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        거래처 Top 5
      </CardTitle>
    </CardHeader>
    <CardContent className="px-4 pb-4">
      {isLoading ? (
        <div className="space-y-2 mt-2">
          {[1, 2, 3, 4, 5].map((k) => (
            <div
              key={k}
              className="h-[38px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
            />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-400 text-center py-8">
          데이터가 없습니다
        </p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
          {data.map((row) => (
            <div
              key={row.rank}
              className="flex items-center gap-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
            >
              <span className="w-5 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 tabular-nums shrink-0">
                {row.rank}
              </span>
              <span className="flex-1 text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                {row.name}
              </span>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatCurrency(row.revenue)}
                </span>
                <span
                  className={cn(
                    'text-xs tabular-nums font-semibold whitespace-nowrap',
                    row.profit >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400',
                  )}
                >
                  {formatCurrency(row.profit)}
                </span>
              </div>
            </div>
          ))}
          {Array.from({ length: Math.max(0, 5 - data.length) }, (_, i) => (
            <div key={`empty-${data.length + i}`} className="h-[42px]" />
          ))}
        </div>
      )}
    </CardContent>
  </Card>
)
