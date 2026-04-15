import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TaskStatusBadge } from '@/features/tasks/TaskStatusBadge'
import {
  deleteTask,
  fetchTasks,
  updateTaskStatus,
} from '@/features/tasks/queries'
import {
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from '@/features/tasks/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { Columns, List, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

const searchSchema = z.object({
  mode: z.enum(['list', 'board']).optional().default('list'),
  page: z.coerce.number().optional().default(1),
})

export const Route = createFileRoute('/_authed/tasks/')({
  validateSearch: searchSchema,
  component: TasksPage,
})

const STATUS_ORDER: TaskStatus[] = [
  'not_started',
  'in_progress',
  'done_settled',
  'done_unsettled',
]
const PAGE_SIZE = 15

const COLUMN_STYLES: Record<TaskStatus, { dot: string; header: string }> = {
  not_started: {
    dot: 'bg-slate-400',
    header: 'text-slate-600 dark:text-slate-400',
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
}

const formatMarketingSummary = (task: Task): string => {
  if (!task.task_marketings?.length) return '-'
  return task.task_marketings
    .map((m) => `${m.marketing_types?.name ?? '?'} ${m.count}건`)
    .join(', ')
}

// Kanban Card
const KanbanCard = ({ task }: { task: Task }) => {
  const router = useRouter()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3.5 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md dark:hover:shadow-gray-900 transition-all"
      onClick={() =>
        router.navigate({ to: '/tasks/$taskId', params: { taskId: task.id } })
      }
    >
      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate leading-snug">
        {task.company_name}
      </p>
      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5">
        {formatCurrency(task.profit || 0)}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
        {formatMarketingSummary(task)}
      </p>
      <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
        {formatDate(task.start_date)}
      </p>
    </div>
  )
}

// Kanban Column
const KanbanColumn = ({
  status,
  tasks,
}: { status: TaskStatus; tasks: Task[] }) => {
  const { setNodeRef } = useSortable({ id: `col-${status}` })
  const style = COLUMN_STYLES[status]

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 min-h-[600px]"
    >
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />
          <span className={cn('text-xs font-semibold', style.header)}>
            {TASK_STATUS_LABELS[status]}
          </span>
        </div>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 p-2.5 space-y-2 overflow-y-auto">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <p className="text-xs text-gray-300 dark:text-gray-600 text-center py-10">
              업무 없음
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

function TasksPage() {
  const { mode, page } = Route.useSearch()
  const router = useRouter()
  const navigate = useNavigate({ from: Route.fullPath })
  const qc = useQueryClient()

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('업무가 삭제되었습니다')
      setDeleteId(null)
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateTaskStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError: () => toast.error('상태 변경에 실패했습니다'),
  })

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    let targetStatus: TaskStatus | null = null

    const overId = String(over.id)
    if (overId.startsWith('col-')) {
      targetStatus = overId.replace('col-', '') as TaskStatus
    } else {
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) targetStatus = overTask.status
    }

    if (!targetStatus) return
    const task = tasks.find((t) => t.id === taskId)
    if (task && task.status !== targetStatus) {
      statusMutation.mutate({ id: taskId, status: targetStatus })
    }
  }

  const totalPages = Math.ceil(tasks.length / PAGE_SIZE)
  const paginatedTasks = tasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const tasksByStatus = STATUS_ORDER.reduce(
    (acc, s) => {
      acc[s] = tasks.filter((t) => t.status === s)
      return acc
    },
    {} as Record<TaskStatus, Task[]>,
  )

  return (
    <div className="space-y-4 px-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
            업무 목록
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            총 {tasks.length}건
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => navigate({ search: { mode: 'list', page: 1 } })}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                mode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
              )}
            >
              <List className="w-3.5 h-3.5" />
              목록
            </button>
            <button
              type="button"
              onClick={() => navigate({ search: { mode: 'board', page: 1 } })}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                mode === 'board'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
              )}
            >
              <Columns className="w-3.5 h-3.5" />
              칸반
            </button>
          </div>

          <Link to="/tasks/new">
            <Button
              size="sm"
              className="gap-1.5 h-8 text-xs text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 shadow-sm shadow-purple-200 dark:shadow-none"
            >
              <Plus className="w-3.5 h-3.5" />새 업무
            </Button>
          </Link>
        </div>
      </div>

      {/* List Mode */}
      {mode === 'list' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    업체명
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    마케팅
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    받은금액
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    실행비
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    수익
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    상태
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    시작일
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    종료일
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedTasks.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-16 text-xs text-gray-300 dark:text-gray-600"
                    >
                      등록된 업무가 없습니다
                    </td>
                  </tr>
                )}
                {paginatedTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-800/60 cursor-pointer transition-colors group"
                    onClick={() =>
                      router.navigate({
                        to: '/tasks/$taskId',
                        params: { taskId: task.id },
                      })
                    }
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      router.navigate({
                        to: '/tasks/$taskId',
                        params: { taskId: task.id },
                      })
                    }
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {task.company_name}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 max-w-[180px] truncate">
                      {formatMarketingSummary(task)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600 dark:text-gray-400 tabular-nums">
                      {formatCurrency(task.received_amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600 dark:text-gray-400 tabular-nums">
                      {formatCurrency(task.execution_cost)}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 text-right text-xs font-semibold tabular-nums',
                        (task.profit || 0) >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-500 dark:text-red-400',
                      )}
                    >
                      {formatCurrency(task.profit || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                      {formatDate(task.start_date)}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                      {formatDate(task.end_date)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div
                        className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <Link
                          to="/tasks/$taskId/edit"
                          params={{ taskId: task.id }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-500"
                          onClick={() => setDeleteId(task.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 py-3 border-t border-gray-200 dark:border-gray-800">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                className="h-7 px-2.5 text-xs text-gray-500 dark:text-gray-400"
                onClick={() => navigate({ search: { mode, page: page - 1 } })}
              >
                이전
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 w-7 text-xs rounded-lg',
                    p === page
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'text-gray-500 dark:text-gray-400',
                  )}
                  onClick={() => navigate({ search: { mode, page: p } })}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                className="h-7 px-2.5 text-xs text-gray-500 dark:text-gray-400"
                onClick={() => navigate({ search: { mode, page: page + 1 } })}
              >
                다음
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Board Mode */}
      {mode === 'board' && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-4 gap-3">
            {STATUS_ORDER.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-purple-700 p-3.5 shadow-xl rotate-1 opacity-95">
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {activeTask.company_name}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(activeTask.profit || 0)}
                </p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>업무 삭제</DialogTitle>
            <DialogDescription>
              이 업무를 삭제하면 복구할 수 없습니다. 삭제하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
