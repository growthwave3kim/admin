import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'

type ClientRow = {
  rank: number
  name: string
  revenue: number
  profit: number
}

export const TopClients = ({ data, isLoading }: { data: ClientRow[]; isLoading: boolean }) => (
  <Card className="border-border shadow-none">
    <CardHeader className="px-4 pt-4 pb-2">
      <CardTitle className="font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
        거래처 Top 5
      </CardTitle>
    </CardHeader>
    <CardContent className="px-4 pb-4">
      {isLoading ? (
        <div className="mt-2 space-y-2">
          {[1, 2, 3, 4, 5].map((k) => (
            <div key={k} className="h-[38px] animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="py-8 text-center text-gray-400 text-xs dark:text-gray-400">데이터가 없습니다</p>
      ) : (
        <div className="min-h-[210px] divide-y divide-gray-100 dark:divide-gray-800/60">
          {data.map((row) => (
            <div
              key={row.rank}
              className="flex items-center gap-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
            >
              <span className="w-5 shrink-0 text-center font-semibold text-gray-400 text-xs tabular-nums dark:text-gray-500">
                {row.rank}
              </span>
              <span className="flex-1 truncate font-medium text-gray-800 text-xs dark:text-gray-200">{row.name}</span>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="whitespace-nowrap text-gray-500 text-xs tabular-nums dark:text-gray-400">
                  {formatCurrency(row.revenue)}
                </span>
                <span
                  className={cn(
                    'whitespace-nowrap font-semibold text-xs tabular-nums',
                    row.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
                  )}
                >
                  {formatCurrency(row.profit)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
)
