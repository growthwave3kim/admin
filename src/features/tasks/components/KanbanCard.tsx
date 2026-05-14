import { Draggable } from '@hello-pangea/dnd'
import { Link } from '@tanstack/react-router'
import { Pencil, Trash2 } from 'lucide-react'
import { ProfitAmount } from '@/features/tasks/components/ProfitAmount'
import type { Task } from '@/features/tasks/types'
import { formatMarketingSummary } from '@/features/tasks/utils'
import { cn, formatDate } from '@/lib/utils'

export const KanbanCard = ({
  task,
  index,
  onEdit,
  onDelete,
}: {
  task: Task
  index: number
  onEdit: () => void
  onDelete: () => void
}) => (
  <Draggable draggableId={task.id} index={index}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        style={{
          ...provided.draggableProps.style,
          ...(snapshot.isDropAnimating && { transitionDuration: '0.001s' }),
        }}
        className={cn(
          'group cursor-grab rounded-md border border-gray-200 bg-white transition-[box-shadow,border-color] active:cursor-grabbing dark:border-gray-700 dark:bg-gray-800',
          snapshot.isDragging
            ? 'border-gray-400 shadow-lg ring-2 ring-gray-200 dark:border-gray-400 dark:ring-gray-600'
            : 'hover:border-gray-300 hover:shadow-sm dark:hover:border-gray-600',
        )}
      >
        <Link
          to="/tasks/$taskId"
          params={{ taskId: task.id }}
          className="block space-y-3 p-3.5"
          onClick={(e) => {
            if (snapshot.isDragging) e.preventDefault()
          }}
        >
          <div className="flex items-start justify-between gap-1">
            <p className="flex-1 truncate font-semibold text-[13px] text-gray-900 leading-tight dark:text-gray-50">
              {task.company_name}
            </p>
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
          <ProfitAmount value={task.profit || 0} className="font-bold text-sm" />
          <div className="space-y-1.5 border-gray-100 border-t pt-2.5 dark:border-gray-700/50">
            <p className="truncate text-[11px] text-gray-600 dark:text-gray-300">{formatMarketingSummary(task)}</p>
            <p className="text-[11px] text-gray-500 tabular-nums dark:text-gray-400">{formatDate(task.start_date)}</p>
          </div>
        </Link>
      </div>
    )}
  </Draggable>
)
