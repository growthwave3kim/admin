import { Droppable } from '@hello-pangea/dnd'
import { KanbanCard } from '@/features/tasks/components/KanbanCard'
import type { Task, TaskStatus } from '@/features/tasks/types'
import { TASK_STATUS_LABELS } from '@/features/tasks/types'
import { cn } from '@/lib/utils'

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
    <div className="flex min-h-[400px] flex-col rounded-lg border border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/40">
      <div className="flex items-center justify-between border-gray-200 border-b px-4 py-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', style.dot)} />
          <span className={cn('font-semibold text-xs', style.header)}>{TASK_STATUS_LABELS[status]}</span>
        </div>
        <span className="min-w-[22px] rounded-sm border border-gray-200 bg-white px-2 py-0.5 text-center font-semibold text-[11px] text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {tasks.length}
        </span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 space-y-2.5 overflow-y-auto rounded-b-lg p-3 transition-colors',
              snapshot.isDraggingOver ? 'bg-gray-200/50 dark:bg-gray-700/30' : '',
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
              <p className="py-10 text-center text-gray-500 text-xs dark:text-gray-400">업무 없음</p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
