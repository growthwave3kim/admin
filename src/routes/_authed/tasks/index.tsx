import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { z } from 'zod'
import { Link } from '@tanstack/react-router'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, List, Columns, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { fetchTasks, deleteTask, updateTaskStatus } from '@/features/tasks/queries'
import { TaskStatusBadge } from '@/features/tasks/TaskStatusBadge'
import { TASK_STATUS_LABELS, type Task, type TaskStatus } from '@/features/tasks/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const searchSchema = z.object({
  mode: z.enum(['list', 'board']).optional().default('list'),
  page: z.coerce.number().optional().default(1),
})

export const Route = createFileRoute('/_authed/tasks/')({
  validateSearch: searchSchema,
  component: TasksPage,
})

const STATUS_ORDER: TaskStatus[] = ['not_started', 'in_progress', 'done_settled', 'done_unsettled']
const PAGE_SIZE = 15

function formatMarketingSummary(task: Task): string {
  if (!task.task_marketings?.length) return '-'
  return task.task_marketings
    .map((m) => `${m.marketing_types?.name ?? '?'} ${m.count}건`)
    .join(', ')
}

// Kanban Card
function KanbanCard({ task }: { task: Task }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
      onClick={() => router.navigate({ to: '/tasks/$taskId', params: { taskId: task.id } })}
    >
      <p className="font-medium text-sm text-gray-900 truncate">{task.company_name}</p>
      <p className="text-xs text-green-600 font-medium mt-1">{formatCurrency(task.profit || 0)}</p>
      <p className="text-xs text-gray-400 mt-1 truncate">{formatMarketingSummary(task)}</p>
      <p className="text-xs text-gray-400 mt-1">{formatDate(task.start_date)}</p>
    </div>
  )
}

// Kanban Column
function KanbanColumn({
  status,
  tasks,
}: {
  status: TaskStatus
  tasks: Task[]
}) {
  const { setNodeRef } = useSortable({ id: `col-${status}` })

  return (
    <div ref={setNodeRef} className="flex flex-col bg-gray-50 rounded-xl border border-gray-200 min-h-[600px]">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{TASK_STATUS_LABELS[status]}</span>
        <Badge variant="secondary" className="text-xs">{tasks.length}</Badge>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">업무 없음</p>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

function TasksPage() {
  const { mode, page } = Route.useSearch()
  const router = useRouter()
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
    mutationFn: ({ id, status }: { id: string; status: string }) => updateTaskStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError: () => toast.error('상태 변경에 실패했습니다'),
  })

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

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

    // over could be a column sentinel or another task card
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

  // Pagination (list mode)
  const totalPages = Math.ceil(tasks.length / PAGE_SIZE)
  const paginatedTasks = tasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Board grouped tasks
  const tasksByStatus = STATUS_ORDER.reduce(
    (acc, s) => {
      acc[s] = tasks.filter((t) => t.status === s)
      return acc
    },
    {} as Record<TaskStatus, Task[]>,
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">업무 목록</h1>
          <p className="text-sm text-gray-500 mt-1">총 {tasks.length}건</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => router.navigate({ search: { mode: 'list', page: 1 } })}
              className={cn(
                'px-3 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors',
                mode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              <List className="w-4 h-4" />
              목록
            </button>
            <button
              onClick={() => router.navigate({ search: { mode: 'board', page: 1 } })}
              className={cn(
                'px-3 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors border-l border-gray-200',
                mode === 'board'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              <Columns className="w-4 h-4" />
              칸반
            </button>
          </div>
          <Link to="/tasks/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              새 업무
            </Button>
          </Link>
        </div>
      </div>

      {/* List Mode */}
      {mode === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">업체명</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">마케팅</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">받은금액</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">실행비</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">수익</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">상태</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">시작일</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">종료일</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">액션</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTasks.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-400">
                      등록된 업무가 없습니다
                    </td>
                  </tr>
                )}
                {paginatedTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors"
                    onClick={() =>
                      router.navigate({ to: '/tasks/$taskId', params: { taskId: task.id } })
                    }
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{task.company_name}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                      {formatMarketingSummary(task)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatCurrency(task.received_amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatCurrency(task.execution_cost)}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 text-right font-medium',
                        (task.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600',
                      )}
                    >
                      {formatCurrency(task.profit || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      {formatDate(task.start_date)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      {formatDate(task.end_date)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div
                        className="flex items-center justify-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link to="/tasks/$taskId/edit" params={{ taskId: task.id }}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-600"
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
            <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => router.navigate({ search: { mode, page: page - 1 } })}
              >
                이전
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => router.navigate({ search: { mode, page: p } })}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => router.navigate({ search: { mode, page: page + 1 } })}
              >
                다음
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Board Mode */}
      {mode === 'board' && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-4 gap-4">
            {STATUS_ORDER.map((status) => (
              <KanbanColumn key={status} status={status} tasks={tasksByStatus[status]} />
            ))}
          </div>
          <DragOverlay>
            {activeTask && (
              <div className="bg-white rounded-lg border border-blue-300 p-3 shadow-xl rotate-2">
                <p className="font-medium text-sm text-gray-900">{activeTask.company_name}</p>
                <p className="text-xs text-green-600 mt-1">{formatCurrency(activeTask.profit || 0)}</p>
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
