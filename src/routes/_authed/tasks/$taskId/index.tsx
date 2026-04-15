import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { format } from 'date-fns'
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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">업무를 찾을 수 없습니다</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.navigate({ to: '/tasks' })}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {task.company_name}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link to="/tasks/$taskId/edit" params={{ taskId }}>
            <Button variant="outline" className="gap-2">
              <Pencil className="w-4 h-4" />
              수정
            </Button>
          </Link>
          <Button
            variant="outline"
            className="gap-2 text-red-500 border-red-200 hover:bg-red-50"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
            삭제
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>업무 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status (inline edit) */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500 w-32">진행 상태</span>
            <Select
              value={task.status}
              onValueChange={(v) => v && statusMutation.mutate(v)}
            >
              <SelectTrigger className="w-48">
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

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500 w-32">시작일</span>
            <span className="text-sm font-medium">
              {formatDate(task.start_date)}
            </span>
          </div>

          {/* End date (inline edit) */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500 w-32">종료일</span>
            <Popover>
              <PopoverTrigger>
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-gray-200 hover:bg-gray-50 transition-colors',
                    !task.end_date && 'text-gray-400',
                  )}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
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

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500 w-32">받은 금액</span>
            <span className="text-sm font-medium">
              {formatCurrency(task.received_amount)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500 w-32">실행비</span>
            <span className="text-sm font-medium">
              {formatCurrency(task.execution_cost)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500 w-32">수익</span>
            <span
              className={cn(
                'text-sm font-bold',
                (task.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600',
              )}
            >
              {formatCurrency(task.profit || 0)}
            </span>
          </div>

          {/* Marketing items */}
          <div className="py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">마케팅 항목</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {task.task_marketings?.length ? (
                task.task_marketings.map((m) => (
                  <Badge key={m.id} variant="secondary">
                    {m.marketing_types?.name} {m.count}건
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-400">-</span>
              )}
            </div>
          </div>

          {task.note && (
            <div className="py-2">
              <span className="text-sm text-gray-500">비고</span>
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                {task.note}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between py-2 text-xs text-gray-400">
            <span>
              등록:{' '}
              {format(new Date(task.created_at), 'yyyy-MM-dd HH:mm', {
                locale: ko,
              })}
            </span>
            <span>
              수정:{' '}
              {format(new Date(task.updated_at), 'yyyy-MM-dd HH:mm', {
                locale: ko,
              })}
            </span>
          </div>
        </CardContent>
      </Card>

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
