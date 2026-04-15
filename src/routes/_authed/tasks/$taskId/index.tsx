import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  deleteTask,
  fetchTask,
  updateTask,
  updateTaskStatus,
} from '@/features/tasks/queries'
import { TASK_STATUS_LABELS } from '@/features/tasks/types'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { ko } from 'date-fns/locale'
import { ArrowLeft, CalendarIcon, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authed/tasks/$taskId/')({
  component: TaskDetailPage,
})

function TaskDetailPage() {
  const { taskId } = Route.useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTask(taskId),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateTaskStatus(taskId, status),
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
    mutationFn: () => deleteTask(taskId),
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
        <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-400 dark:text-slate-500">
          업무를 찾을 수 없습니다
        </p>
      </div>
    )
  }

  const profit = task.profit || 0

  return (
    <div className="h-full overflow-auto p-6">
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
            <div>
              <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {task.company_name}
              </h1>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                {formatDateTime(task.created_at)} 등록
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Link to="/tasks/$taskId/edit" params={{ taskId }}>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Pencil className="w-3.5 h-3.5" />
                수정
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              삭제
            </Button>
          </div>
        </div>

        {/* Revenue summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3.5">
            <p className="text-xs text-gray-400 dark:text-slate-500">
              받은 금액
            </p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1.5 tabular-nums">
              {formatCurrency(task.received_amount)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3.5">
            <p className="text-xs text-gray-400 dark:text-slate-500">실행비</p>
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
            <p
              className={cn(
                'text-sm font-semibold mt-1.5 tabular-nums',
                profit >= 0
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-red-600 dark:text-red-400',
              )}
            >
              {formatCurrency(profit)}
            </p>
          </div>
        </div>

        {/* Detail rows */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Status */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400 dark:text-slate-500 w-24 shrink-0">
              진행 상태
            </span>
            <Select
              value={task.status}
              onValueChange={(v) => v && statusMutation.mutate(v)}
            >
              <SelectTrigger className="w-44 h-8 text-xs border-gray-200 dark:border-gray-700 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start date */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400 dark:text-slate-500 w-24 shrink-0">
              시작일
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-200 tabular-nums">
              {formatDate(task.start_date)}
            </span>
          </div>

          {/* End date */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400 dark:text-slate-500 w-24 shrink-0">
              종료일
            </span>
            <Popover>
              <PopoverTrigger>
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors',
                    task.end_date
                      ? 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                      : 'border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-gray-800',
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
                  onSelect={(d) => endDateMutation.mutate(d ?? null)}
                  locale={ko}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Marketing */}
          <div className="flex items-start gap-4 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400 dark:text-slate-500 w-24 shrink-0 pt-0.5">
              마케팅 항목
            </span>
            <div className="flex flex-wrap gap-1.5">
              {task.task_marketings?.length ? (
                task.task_marketings.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/40"
                  >
                    {m.marketing_types?.name}
                    <span className="text-purple-400 dark:text-purple-500">
                      {m.count}건
                    </span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  -
                </span>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="flex items-start gap-4 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400 dark:text-slate-500 w-24 shrink-0 pt-0.5">
              비고
            </span>
            <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap flex-1">
              {task.note || '-'}
            </p>
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between px-5 py-3 text-xs text-gray-400 dark:text-slate-500">
            <span>등록 {formatDateTime(task.created_at)}</span>
            <span>수정 {formatDateTime(task.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>업무 삭제</DialogTitle>
            <DialogDescription>
              "{task.company_name}" 업무를 삭제하면 복구할 수 없습니다.
              삭제하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
