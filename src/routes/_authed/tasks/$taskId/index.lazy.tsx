import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLazyFileRoute, getRouteApi, Link, useRouter } from '@tanstack/react-router'
import { ko } from 'date-fns/locale'
import { ArrowLeft, CalendarIcon, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProfitAmount } from '@/features/tasks/components/ProfitAmount'
import { fetchTask, softDeleteTask, updateTask, updateTaskStatus } from '@/features/tasks/queries'
import { requiresNote, StatusChangeDialog } from '@/features/tasks/StatusChangeDialog'
import { TASK_STATUS_LABELS, type TaskStatus } from '@/features/tasks/types'
import { cn, formatCurrency, formatDate, formatDateTime } from '@/lib/utils'

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
    mutationFn: ({ status, note }: { status: TaskStatus; note?: string }) => updateTaskStatus(taskId, status, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', taskId] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('상태가 변경되었습니다')
    },
    onError: () => toast.error('상태 변경에 실패했습니다'),
  })

  const endDateMutation = useMutation({
    mutationFn: (end_date: Date | null) => updateTask(taskId, { end_date: end_date ?? null }),
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
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800 dark:border-gray-700 dark:border-t-gray-200" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400 text-sm dark:text-gray-400">업무를 찾을 수 없습니다</p>
      </div>
    )
  }

  const profit = task.profit || 0

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => router.navigate({ to: '/tasks' })}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <p className="font-semibold text-base text-gray-900 dark:text-gray-100">{task.company_name}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Link to="/tasks/$taskId/edit" params={{ taskId }}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-gray-300 text-gray-700 text-xs hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <Pencil className="h-3.5 w-3.5" />
                수정
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-red-200 text-red-500 text-xs hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              삭제
            </Button>
          </div>
        </div>

        {/* Revenue summary */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-gray-400 text-xs dark:text-gray-400">받은 금액</p>
            <p className="mt-1.5 font-semibold text-gray-800 text-sm tabular-nums dark:text-gray-100">
              {formatCurrency(task.received_amount)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-gray-400 text-xs dark:text-gray-400">실행비</p>
            <p className="mt-1.5 font-semibold text-gray-800 text-sm tabular-nums dark:text-gray-100">
              {formatCurrency(task.execution_cost)}
            </p>
          </div>
          <div
            className={cn(
              'rounded-xl border px-4 py-3.5',
              profit >= 0
                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-900/20'
                : 'border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20',
            )}
          >
            <p
              className={cn(
                'text-xs',
                profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
              )}
            >
              수익
            </p>
            <ProfitAmount value={profit} className="mt-1.5 block text-sm" />
          </div>
        </div>

        {/* Detail rows */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {/* Status */}
          <div className="flex items-center justify-between border-gray-100 border-b px-5 py-3.5 dark:border-gray-800">
            <span className="w-24 shrink-0 text-gray-400 text-xs dark:text-gray-400">진행 상태</span>
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
              <SelectTrigger className="h-8 w-44 border-gray-300 bg-transparent text-gray-800 text-xs dark:border-gray-600 dark:text-gray-100">
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
            <div className="flex items-center justify-between border-gray-100 border-b px-5 py-3.5 dark:border-gray-800">
              <span className="w-24 shrink-0 text-gray-400 text-xs dark:text-gray-400">담당자</span>
              <span className="text-gray-700 text-sm dark:text-gray-200">{task.members.name}</span>
            </div>
          )}

          {/* Start date */}
          <div className="flex items-center justify-between border-gray-100 border-b px-5 py-3.5 dark:border-gray-800">
            <span className="w-24 shrink-0 text-gray-400 text-xs dark:text-gray-400">시작일</span>
            <span className="text-gray-700 text-sm tabular-nums dark:text-gray-200">{formatDate(task.start_date)}</span>
          </div>

          {/* End date */}
          <div className="flex items-center justify-between border-gray-100 border-b px-5 py-3.5 dark:border-gray-800">
            <span className="w-24 shrink-0 text-gray-400 text-xs dark:text-gray-400">종료일</span>
            <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
              <PopoverTrigger>
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors',
                    task.end_date
                      ? 'border-gray-300 text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800'
                      : 'border-gray-300 border-dashed text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800',
                  )}
                >
                  <CalendarIcon className="h-3 w-3" />
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
          <div className="flex items-center gap-4 border-gray-100 border-b px-5 py-3.5 dark:border-gray-800">
            <span className="w-24 shrink-0 text-gray-400 text-xs dark:text-gray-400">마케팅 유형</span>
            <div className="flex flex-wrap gap-1.5">
              {task.task_marketings?.length ? (
                task.task_marketings.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-100 px-2.5 py-1 font-medium text-gray-700 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {m.marketing_types?.name}
                    <span className="text-gray-500 dark:text-gray-400">{m.count}건</span>
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-xs dark:text-gray-400">-</span>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="flex items-start gap-4 border-gray-100 border-b px-5 py-3.5 dark:border-gray-800">
            <span className="w-24 shrink-0 pt-0.5 text-gray-400 text-xs dark:text-gray-400">비고</span>
            <p className="flex-1 whitespace-pre-wrap text-gray-700 text-sm dark:text-gray-200">{task.note || '-'}</p>
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between px-5 py-3 text-gray-400 text-xs dark:text-gray-400">
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
          if (pendingStatus) statusMutation.mutate({ status: pendingStatus, note })
          setPendingStatus(null)
        }}
        onCancel={() => setPendingStatus(null)}
      />
    </div>
  )
}
