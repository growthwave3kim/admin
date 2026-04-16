import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'

type MarketingRow = {
  name: string
  taskCount: number
  revenue: number
  cost: number
  profitRate: number
}

export const MarketingTable = ({
  data,
  isLoading,
}: {
  data: MarketingRow[]
  isLoading: boolean
}) => (
  <Card className="border-border shadow-none">
    <CardHeader className="pb-2 pt-4 px-4">
      <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        마케팅 유형별 실적
      </CardTitle>
    </CardHeader>
    <CardContent className="px-4 pb-4">
      {isLoading ? (
        <div className="space-y-2 mt-2">
          {[1, 2, 3].map((k) => (
            <div
              key={k}
              className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
            />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-400 text-center py-8">
          마케팅 데이터가 없습니다
        </p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800/60">
              <th className="text-left pb-2 text-gray-400 dark:text-gray-400 font-medium">
                유형명
              </th>
              <th className="text-right pb-2 text-gray-400 dark:text-gray-400 font-medium">
                건수
              </th>
              <th className="text-right pb-2 text-gray-400 dark:text-gray-400 font-medium">
                받은금액
              </th>
              <th className="text-right pb-2 text-gray-400 dark:text-gray-400 font-medium">
                실행비
              </th>
              <th className="text-right pb-2 text-gray-400 dark:text-gray-400 font-medium">
                수익률
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {data.map((row) => (
              <tr
                key={row.name}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <td className="py-2.5 font-medium text-gray-800 dark:text-gray-200">
                  {row.name}
                </td>
                <td className="py-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300">
                  {row.taskCount}건
                </td>
                <td className="py-2.5 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(row.revenue)}
                </td>
                <td className="py-2.5 text-right tabular-nums font-semibold text-red-500 dark:text-red-400">
                  -{formatCurrency(row.cost)}
                </td>
                <td
                  className={cn(
                    'py-2.5 text-right tabular-nums font-semibold',
                    row.profitRate >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400',
                  )}
                >
                  {row.profitRate.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CardContent>
  </Card>
)
