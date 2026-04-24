import { KanbanCard } from '@/features/tasks/components/KanbanCard'
import { TASK_STATUS_LABELS } from '@/features/tasks/types'
import type { Task, TaskStatus } from '@/features/tasks/types'
import { cn } from '@/lib/utils'
import { Droppable } from '@hello-pangea/dnd'

const COLUMN_STYLES: Record<TaskStatus, { dot: string; header: string }> = {
  proposal: {
    dot: 'bg-purple-400',
    header: 'text-purple-600 dark:text-purple-400',
  },
  not_started: {
    dot: 'bg-slate-400',
    header: 'text-slate-600 dark:text-gray-300',
  },
  in_progress: {
    dot: 'bg-blue-500',
    header: 'text-blue-700 dark:text-blue-400',
  },
  done_settled: {
    dot: 'bg-emerald-500',
    header: 'text-emerald-700 dark:text-emerald-400',
  },
  done_unsettled: {
    dot: 'bg-amber-500',
    header: 'text-amber-700 dark:text-amber-400',
  },
  lost: {
    dot: 'bg-gray-400',
    header: 'text-gray-500 dark:text-gray-500',
  },
}

export const KanbanColumn = ({
  status,
  tasks,
  onEdit,
  onDelete,
}: {
  status: TaskStatus
  tasks: Task[]
  onEdit: (taskId: string) => void
  onDelete: (taskId: string) => void
}) => {
  const style = COLUMN_STYLES[status]

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 min-h-[400px]">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', style.dot)} />
          <span className={cn('text-xs font-semibold', style.header)}>
            {TASK_STATUS_LABELS[status]}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm px-2 py-0.5 min-w-[22px] text-center">
          {tasks.length}
        </span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 p-3 space-y-2.5 overflow-y-auto transition-colors rounded-b-lg',
              snapshot.isDraggingOver
                ? 'bg-gray-200/50 dark:bg-gray-700/30'
                : '',
            )}
          >
            {tasks.map((task, index) => (
              <KanbanCard
                key={task.id}
                task={task}
                index={index}
                onEdit={() => onEdit(task.id)}
                onDelete={() => onDelete(task.id)}
              />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-10">
                업무 없음
              </p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
