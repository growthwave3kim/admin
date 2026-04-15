import { cn } from '@/lib/utils'
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS, type TaskStatus } from './types'

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        TASK_STATUS_COLORS[status],
      )}
    >
      {TASK_STATUS_LABELS[status]}
    </span>
  )
}
