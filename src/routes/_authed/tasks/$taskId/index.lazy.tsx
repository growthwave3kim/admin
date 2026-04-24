import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  StatusChangeDialog,
  requiresNote,
} from '@/features/tasks/StatusChangeDialog'
import { ProfitAmount } from '@/features/tasks/components/ProfitAmount'
import {
  fetchTask,
  softDeleteTask,
  updateTask,
  updateTaskStatus,
} from '@/features/tasks/queries'
import { TASK_STATUS_LABELS, type TaskStatus } from '@/features/tasks/types'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Link,
  createLazyFileRoute,
  getRouteApi,
  useRouter,
} from '@tanstack/react-router'
import { ko } from 'date-fns/locale'
import { ArrowLeft, CalendarIcon, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createLazyFileRoute('/_authed/tasks/$taskId/')({
  component: TaskDetailPage,
})

const routeApi = getRouteApi('/_authed/tasks/$taskId/')

function TaskDetailPage() {
  const { taskId } = routeApi.useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<TaskStatus | null>(null)

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTask(taskId),
  })

  const statusMutation = useMutation({
    mutationFn: ({ status, note }: { status: TaskStatus; note?: string }) =>
      updateTaskStatus(taskId, status, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', taskId] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('상태가 변경되었습니다')
    },
    onError: () => toast.error('상태 변경에 실패했습니다'),
  })

  const endDateMutation = useMutation({
    mutationFn: (end_date: Date | null) =>
      updateTask(taskId, { end_date: end_date ?? null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', taskId] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('종료일이 변경되었습니다')
    },
    onError: () => toast.error('변경에 실패했습니다'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => softDeleteTask(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('업무가 삭제되었습니다')
      router.navigate({ to: '/tasks' })
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-gray-800 dark:border-t-gray-200 rounded-full animate-spin" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-400 dark:text-gray-400">
          업무를 찾을 수 없습니다
        </p>
      </div>
    )
  }

  const profit = task.profit || 0

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => router.navigate({ to: '/tasks' })}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {task.company_name}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Link to="/tasks/$taskId/edit" params={{ taskId }}>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Pencil className="w-3.5 h-3.5" />
                수정
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              삭제
            </Button>
          </div>
        </div>

        {/* Revenue summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3.5">
            <p className="text-xs text-gray-400 dark:text-gray-400">
              받은 금액
            </p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1.5 tabular-nums">
              {formatCurrency(task.received_amount)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3.5">
            <p className="text-xs text-gray-400 dark:text-gray-400">실행비</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1.5 tabular-nums">
              {formatCurrency(task.execution_cost)}
            </p>
          </div>
          <div
            className={cn(
              'rounded-xl border px-4 py-3.5',
              profit >= 0
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40',
            )}
          >
            <p
              className={cn(
                'text-xs',
                profit >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-500 dark:text-red-400',
              )}
            >
              수익
            </p>
            <ProfitAmount value={profit} className="text-sm mt-1.5 block" />
          </div>
        </div>

        {/* Detail rows */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Status */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400 dark:text-gray-400 w-24 shrink-0">
              진행 상태
            </span>
            <Select
              value={task.status}
              onValueChange={(v) => {
                if (!v) return
                const s = v as TaskStatus
                if (requiresNote(s)) {
                  setPendingStatus(s)
                } else {
                  statusMutation.mutate({ status: s })
                }
              }}
            >
              <SelectTrigger className="w-44 h-8 text-xs border-gray-300 dark:border-gray-600 bg-transparent text-gray-800 dark:text-gray-100">
                <SelectValue>{TASK_STATUS_LABELS[task.status]}</SelectValue>
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={4}>
                {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 담당자 */}
          {task.members && (
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-400 dark:text-gray-400 w-24 shrink-0">
                담당자
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-200">
                {task.members.name}
              </span>
            </div>
          )}

          {/* Start date */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400 dark:text-gray-400 w-24 shrink-0">
              시작일
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-200 tabular-nums">
              {formatDate(task.start_date)}
            </span>
          </div>

          {/* End date */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400 dark:text-gray-400 w-24 shrink-0">
              종료일
            </span>
            <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
              <PopoverTrigger>
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors',
                    task.end_date
                      ? 'border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                      : 'border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                  )}
                >
                  <CalendarIcon className="w-3 h-3" />
                  {task.end_date ? formatDate(task.end_date) : '날짜 선택'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={task.end_date ? new Date(task.end_date) : undefined}
                  onSelect={(d) => {
                    endDateMutation.mutate(d ?? null)
                    setIsEndDateOpen(false)
                  }}
                  locale={ko}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Marketing */}
          <div className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400 dark:text-gray-400 w-24 shrink-0">
              마케팅 유형
            </span>
            <div className="flex flex-wrap gap-1.5">
              {task.task_marketings?.length ? (
                task.task_marketings.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                  >
                    {m.marketing_types?.name}
                    <span className="text-gray-500 dark:text-gray-400">
                      {m.count}건
                    </span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-400">
                  -
                </span>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="flex items-start gap-4 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400 dark:text-gray-400 w-24 shrink-0 pt-0.5">
              비고
            </span>
            <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap flex-1">
              {task.note || '-'}
            </p>
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between px-5 py-3 text-xs text-gray-400 dark:text-gray-400">
            <span>등록 {formatDateTime(task.created_at)}</span>
            <span>수정 {formatDateTime(task.updated_at)}</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="업무 삭제"
        description={`"${task.company_name}" 업무를 삭제하면 복구할 수 없습니다. 삭제하시겠습니까?`}
        confirmLabel="삭제"
        tone="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />

      <StatusChangeDialog
        open={!!pendingStatus}
        newStatus={pendingStatus}
        onConfirm={(note) => {
          if (pendingStatus)
            statusMutation.mutate({ status: pendingStatus, note })
          setPendingStatus(null)
        }}
        onCancel={() => setPendingStatus(null)}
      />
    </div>
  )
}
