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
    <CardHeader className="px-4 pt-4 pb-2">
      <CardTitle className="font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
        상태별 분포 · 전체
      </CardTitle>
    </CardHeader>
    <CardContent className="px-4 pb-4">
      {isLoading ? (
        <div className="mt-2 space-y-3">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="h-10 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="mt-2 space-y-3">
          {statusBreakdown.map(({ status, label, count, color }) => {
            const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0
            return (
              <div key={status} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="flex-1 truncate text-gray-600 text-xs dark:text-gray-300">{label}</span>
                  <span className="font-semibold text-gray-900 text-xs tabular-nums dark:text-gray-100">{count}건</span>
                  <span className="w-7 text-right text-gray-400 text-xs tabular-nums dark:text-gray-400">{pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
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
