import { cn } from '@/lib/utils'
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS, type TaskStatus } from './types'

type TaskStatusBadgeProps = {
  status: TaskStatus
}

export const TaskStatusBadge = ({ status }: TaskStatusBadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center whitespace-nowrap rounded-sm px-2.5 py-0.5 font-medium text-xs',
      TASK_STATUS_COLORS[status],
    )}
  >
    {TASK_STATUS_LABELS[status]}
  </span>
)
