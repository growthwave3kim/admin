import { Link } from '@tanstack/react-router'
import { isBefore } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfitAmount } from '@/features/tasks/components/ProfitAmount'
import { TaskStatusBadge } from '@/features/tasks/TaskStatusBadge'
import type { Task } from '@/features/tasks/types'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

export const TaskTable = ({ tasks, isLoading }: { tasks: Task[]; isLoading: boolean }) => {
  const today = new Date()

  return (
    <Card className="border-border shadow-none">
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
          진행중 업무
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((k) => (
              <div key={k} className="h-9 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <p className="py-10 text-center text-gray-400 text-xs dark:text-gray-400">진행중인 업무가 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-xs">
              <thead>
                <tr className="border-gray-100 border-b dark:border-gray-800/60">
                  <th className="pb-2 text-left font-medium text-gray-400 dark:text-gray-400">업체명</th>
                  <th className="whitespace-nowrap pb-2 text-center font-medium text-gray-400 dark:text-gray-400">
                    상태
                  </th>
                  <th className="whitespace-nowrap pb-2 text-right font-medium text-gray-400 dark:text-gray-400">
                    받은금액
                  </th>
                  <th className="whitespace-nowrap pb-2 text-right font-medium text-gray-400 dark:text-gray-400">
                    실행비
                  </th>
                  <th className="whitespace-nowrap pb-2 text-right font-medium text-gray-400 dark:text-gray-400">
                    수익
                  </th>
                  <th className="whitespace-nowrap pb-2 text-center font-medium text-gray-400 dark:text-gray-400">
                    종료일
                  </th>
                  <th className="whitespace-nowrap pb-2 text-center font-medium text-gray-400 dark:text-gray-400">
                    주의
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {tasks.map((task) => {
                  const isOverdue =
                    task.status === 'in_progress' && task.end_date && isBefore(new Date(task.end_date), today)
                  const isUnsettled = task.status === 'done_unsettled'
                  const isAttention = isOverdue || isUnsettled
                  return (
                    <tr
                      key={task.id}
                      className={cn(
                        'transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40',
                        isAttention && 'bg-red-50/50 hover:bg-red-50 dark:bg-red-900/5 dark:hover:bg-red-900/10',
                      )}
                    >
                      <td className="max-w-[120px] truncate py-2.5 font-medium text-gray-800 dark:text-gray-200">
                        <Link to="/tasks/$taskId" params={{ taskId: task.id }} className="hover:underline">
                          {task.company_name}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-center">
                        <TaskStatusBadge status={task.status} />
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-right font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                        +{formatCurrency(task.received_amount)}
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-right font-semibold text-red-500 tabular-nums dark:text-red-400">
                        -{formatCurrency(task.execution_cost)}
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-right">
                        <ProfitAmount value={task.profit || 0} />
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-center text-gray-500 tabular-nums dark:text-gray-400">
                        {formatDate(task.end_date)}
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-center">
                        {isAttention && (
                          <span
                            className={cn(
                              'inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 font-medium text-[10px]',
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}
