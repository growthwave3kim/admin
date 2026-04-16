import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TaskStatus } from '@/features/tasks/types'

type StatusBreakdownItem = {
  status: TaskStatus
  label: string
  count: number
  color: string
}

export const StatusBreakdown = ({
  statusBreakdown,
  totalTasks,
  isLoading,
}: {
  statusBreakdown: StatusBreakdownItem[]
  totalTasks: number
  isLoading: boolean
}) => (
  <Card className="border-border shadow-none">
    <CardHeader className="pb-2 pt-4 px-4">
      <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        상태별 분포 · 전체
      </CardTitle>
    </CardHeader>
    <CardContent className="px-4 pb-4">
      {isLoading ? (
        <div className="space-y-3 mt-2">
          {[1, 2, 3, 4].map((k) => (
            <div
              key={k}
              className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3 mt-2">
          {statusBreakdown.map(({ status, label, count, color }) => {
            const pct =
              totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0
            return (
              <div key={status} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">
                    {label}
                  </span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                    {count}건
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-400 tabular-nums w-7 text-right">
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </CardContent>
  </Card>
)
