import { ProfitAmount } from '@/features/tasks/components/ProfitAmount'
import type { Task } from '@/features/tasks/types'
import { formatMarketingSummary } from '@/features/tasks/utils'
import { cn, formatDate } from '@/lib/utils'
import { Draggable } from '@hello-pangea/dnd'
import { useNavigate } from '@tanstack/react-router'
import { Pencil, Trash2 } from 'lucide-react'

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
}) => {
  const navigate = useNavigate()

  return (
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
            'group bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing transition-[box-shadow,border-color]',
            snapshot.isDragging
              ? 'shadow-lg border-gray-400 dark:border-gray-400 ring-2 ring-gray-200 dark:ring-gray-600'
              : 'hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm',
          )}
          onClick={() =>
            !snapshot.isDragging &&
            navigate({ to: '/tasks/$taskId', params: { taskId: task.id } })
          }
        >
          <div className="p-3.5 space-y-3">
            <div className="flex items-start justify-between gap-1">
              <p className="font-semibold text-[13px] text-gray-900 dark:text-gray-50 truncate leading-tight flex-1">
                {task.company_name}
              </p>
              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <ProfitAmount
              value={task.profit || 0}
              className="text-sm font-bold"
            />
            <div className="pt-2.5 border-t border-gray-100 dark:border-gray-700/50 space-y-1.5">
              <p className="text-[11px] text-gray-600 dark:text-gray-300 truncate">
                {formatMarketingSummary(task)}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
                {formatDate(task.start_date)}
              </p>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}
