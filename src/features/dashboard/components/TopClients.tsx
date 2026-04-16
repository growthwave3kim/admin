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
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">
          데이터가 없습니다
        </p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800/60">
              <th className="text-center pb-2 text-gray-400 dark:text-gray-500 font-medium w-6">
                순위
              </th>
              <th className="text-left pb-2 pl-2 text-gray-400 dark:text-gray-500 font-medium">
                업체명
              </th>
              <th className="text-right pb-2 text-gray-400 dark:text-gray-500 font-medium">
                받은금액
              </th>
              <th className="text-right pb-2 text-gray-400 dark:text-gray-500 font-medium">
                수익
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {data.map((row) => (
              <tr
                key={row.rank}
                className="h-[42px] hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <td className="text-center font-semibold text-gray-400 dark:text-gray-500 tabular-nums">
                  {row.rank}
                </td>
                <td className="pl-2 font-medium text-gray-800 dark:text-gray-200 truncate max-w-[80px]">
                  {row.name}
                </td>
                <td className="text-right tabular-nums text-gray-600 dark:text-gray-300">
                  {formatCurrency(row.revenue)}
                </td>
                <td
                  className={cn(
                    'text-right tabular-nums font-semibold',
                    row.profit >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400',
                  )}
                >
                  {formatCurrency(row.profit)}
                </td>
              </tr>
            ))}
            {/* 5행 고정 높이 확보 */}
            {Array.from({ length: Math.max(0, 5 - data.length) }, (_, i) => (
              <tr
                key={`empty-${data.length + i}`}
                className="h-[42px] border-t border-gray-100 dark:border-gray-800/60"
              >
                <td colSpan={4} />
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CardContent>
  </Card>
)
