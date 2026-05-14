import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'

type MarketingRow = {
  name: string
  taskCount: number
  revenue: number
  cost: number
  profitRate: number
}

export const MarketingTable = ({ data, isLoading }: { data: MarketingRow[]; isLoading: boolean }) => (
  <Card className="border-border shadow-none">
    <CardHeader className="px-4 pt-4 pb-2">
      <CardTitle className="font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
        마케팅 유형별 실적
      </CardTitle>
    </CardHeader>
    <CardContent className="px-4 pb-4">
      {isLoading ? (
        <div className="mt-2 space-y-2">
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-8 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="py-8 text-center text-gray-400 text-xs dark:text-gray-400">마케팅 데이터가 없습니다</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-gray-100 border-b dark:border-gray-800/60">
              <th className="pb-2 text-left font-medium text-gray-400 dark:text-gray-400">유형명</th>
              <th className="pb-2 text-right font-medium text-gray-400 dark:text-gray-400">건수</th>
              <th className="pb-2 text-right font-medium text-gray-400 dark:text-gray-400">받은금액</th>
              <th className="pb-2 text-right font-medium text-gray-400 dark:text-gray-400">실행비</th>
              <th className="pb-2 text-right font-medium text-gray-400 dark:text-gray-400">수익률</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {data.map((row) => (
              <tr key={row.name} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40">
                <td className="py-2.5 font-medium text-gray-800 dark:text-gray-200">{row.name}</td>
                <td className="py-2.5 text-right text-gray-600 tabular-nums dark:text-gray-300">{row.taskCount}건</td>
                <td className="py-2.5 text-right font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                  +{formatCurrency(row.revenue)}
                </td>
                <td className="py-2.5 text-right font-semibold text-red-500 tabular-nums dark:text-red-400">
                  -{formatCurrency(row.cost)}
                </td>
                <td
                  className={cn(
                    'py-2.5 text-right font-semibold tabular-nums',
                    row.profitRate >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
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
