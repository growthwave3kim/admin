import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskStatusBadge } from '@/features/tasks/TaskStatusBadge'
import { ProfitAmount } from '@/features/tasks/components/ProfitAmount'
import type { Task } from '@/features/tasks/types'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { isBefore } from 'date-fns'

export const TaskTable = ({
  tasks,
  isLoading,
}: {
  tasks: Task[]
  isLoading: boolean
}) => {
  const today = new Date()

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          진행중 업무
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((k) => (
              <div
                key={k}
                className="h-9 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
              />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-400 text-center py-10">
            진행중인 업무가 없습니다
          </p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800/60">
                <th className="text-left pb-2 text-gray-400 dark:text-gray-400 font-medium">
                  업체명
                </th>
                <th className="text-left pb-2 text-gray-400 dark:text-gray-400 font-medium">
                  상태
                </th>
                <th className="text-right pb-2 text-gray-400 dark:text-gray-400 font-medium">
                  받은금액
                </th>
                <th className="text-right pb-2 text-gray-400 dark:text-gray-400 font-medium">
                  수익
                </th>
                <th className="text-center pb-2 text-gray-400 dark:text-gray-400 font-medium">
                  종료일
                </th>
                <th className="text-center pb-2 text-gray-400 dark:text-gray-400 font-medium">
                  주의
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {tasks.map((task) => {
                const isOverdue =
                  task.status === 'in_progress' &&
                  task.end_date &&
                  isBefore(new Date(task.end_date), today)
                const isUnsettled = task.status === 'done_unsettled'
                const isAttention = isOverdue || isUnsettled
                return (
                  <tr
                    key={task.id}
                    className={cn(
                      'hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors',
                      isAttention &&
                        'bg-red-50/50 dark:bg-red-900/5 hover:bg-red-50 dark:hover:bg-red-900/10',
                    )}
                  >
                    <td className="py-2.5 font-medium text-gray-800 dark:text-gray-200 truncate max-w-[160px]">
                      <Link
                        to="/tasks/$taskId"
                        params={{ taskId: task.id }}
                        className="hover:underline"
                      >
                        {task.company_name}
                      </Link>
                    </td>
                    <td className="py-2.5">
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300">
                      {formatCurrency(task.received_amount)}
                    </td>
                    <td className="py-2.5 text-right">
                      <ProfitAmount value={task.profit || 0} />
                    </td>
                    <td className="py-2.5 text-center tabular-nums text-gray-500 dark:text-gray-400">
                      {formatDate(task.end_date)}
                    </td>
                    <td className="py-2.5 text-center">
                      {isAttention && (
                        <span
                          className={cn(
                            'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
                            isOverdue
                              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                          )}
                        >
                          {isOverdue ? '기간초과' : '정산미완료'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
