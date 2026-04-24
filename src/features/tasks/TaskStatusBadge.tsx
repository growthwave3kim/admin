import { cn } from '@/lib/utils'
import {
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from './types'

type TaskStatusBadgeProps = {
  status: TaskStatus
}

export const TaskStatusBadge = ({ status }: TaskStatusBadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium',
      TASK_STATUS_COLORS[status],
    )}
  >
    {TASK_STATUS_LABELS[status]}
  </span>
)
