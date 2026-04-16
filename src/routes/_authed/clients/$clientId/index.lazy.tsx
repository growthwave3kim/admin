import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { FieldLabel, inputClass } from '@/components/common/FieldLabel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchClient,
  softDeleteClient,
  updateClient,
} from '@/features/clients/queries'
import type { ClientFormData } from '@/features/clients/types'
import { TaskStatusBadge } from '@/features/tasks/TaskStatusBadge'
import { fetchTasks } from '@/features/tasks/queries'
import { formatCurrency, formatDate } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Link,
  createLazyFileRoute,
  getRouteApi,
  useRouter,
} from '@tanstack/react-router'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export const Route = createLazyFileRoute('/_authed/clients/$clientId/')({
  component: ClientDetailPage,
})

const routeApi = getRouteApi('/_authed/clients/$clientId/')

const clientFormSchema = z.object({
  name: z.string().min(1, '거래처명을 입력해주세요'),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  note: z.string().optional(),
})

type ClientFormValues = z.infer<typeof clientFormSchema>

function ClientDetailPage() {
  const { clientId } = routeApi.useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => fetchClient(clientId),
  })

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const linkedTasks = tasks.filter((t) => t.client_id === clientId)

  const deleteMutation = useMutation({
    mutationFn: () => softDeleteClient(clientId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('거래처가 삭제되었습니다')
      router.navigate({ to: '/clients' })
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema) as never,
    values: client
      ? {
          name: client.name,
          contact_name: client.contact_name ?? '',
          contact_phone: client.contact_phone ?? '',
          note: client.note ?? '',
        }
      : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: (data: ClientFormValues) => {
      const payload: ClientFormData = {
        name: data.name,
        contact_name: data.contact_name || null,
        contact_phone: data.contact_phone || null,
        note: data.note || null,
      }
      return updateClient(clientId, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', clientId] })
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('수정되었습니다')
      setEditOpen(false)
    },
    onError: () => toast.error('수정에 실패했습니다'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-gray-800 dark:border-t-gray-200 rounded-full animate-spin" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-400 dark:text-gray-400">
          거래처를 찾을 수 없습니다
        </p>
      </div>
    )
  }

  const totalRevenue = linkedTasks.reduce(
    (s, t) => s + (t.received_amount || 0),
    0,
  )
  const totalProfit = linkedTasks.reduce((s, t) => s + (t.profit || 0), 0)

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
              onClick={() => router.navigate({ to: '/clients' })}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {client.name}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="w-3.5 h-3.5" />
              수정
            </Button>
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3.5">
            <p className="text-xs text-gray-400 dark:text-gray-400">
              연결 업무
            </p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-1.5 tabular-nums">
              {linkedTasks.length}건
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3.5">
            <p className="text-xs text-gray-400 dark:text-gray-400">총 수입</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5 tabular-nums">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3.5">
            <p className="text-xs text-gray-400 dark:text-gray-400">총 수익</p>
            <p
              className={`text-sm font-semibold mt-1.5 tabular-nums ${totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}
            >
              {formatCurrency(totalProfit)}
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400 dark:text-gray-400 w-24 shrink-0">
              담당자
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-200">
              {client.contact_name || '-'}
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400 dark:text-gray-400 w-24 shrink-0">
              연락처
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-200 tabular-nums">
              {client.contact_phone || '-'}
            </span>
          </div>
          <div className="flex items-start gap-4 px-5 py-3.5">
            <span className="text-xs text-gray-400 dark:text-gray-400 w-24 shrink-0 pt-0.5">
              메모
            </span>
            <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap flex-1">
              {client.note || '-'}
            </p>
          </div>
        </div>

        {/* Linked tasks */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            연결된 업무 ({linkedTasks.length})
          </p>
          {linkedTasks.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 py-10 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-400">
                연결된 업무가 없습니다
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
              {linkedTasks.map((task) => (
                <Link
                  key={task.id}
                  to="/tasks/$taskId"
                  params={{ taskId: task.id }}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <TaskStatusBadge status={task.status} />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {task.company_name}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-400 tabular-nums">
                      {formatDate(task.start_date)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(task.received_amount)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          if (!o) form.reset()
          setEditOpen(o)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>거래처 수정</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => updateMutation.mutate(v))}
              className="space-y-4 mt-2"
            >
              <FormField
                control={form.control as never}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>거래처명</FieldLabel>
                    <Input
                      className={inputClass}
                      placeholder="거래처명 입력"
                      {...field}
                    />
                    <FormMessage className="text-xs mt-1" />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control as never}
                  name="contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>담당자명</FieldLabel>
                      <Input
                        className={inputClass}
                        placeholder="담당자명"
                        {...field}
                      />
                      <FormMessage className="text-xs mt-1" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as never}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>연락처</FieldLabel>
                      <Input
                        className={inputClass}
                        placeholder="010-0000-0000"
                        {...field}
                      />
                      <FormMessage className="text-xs mt-1" />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control as never}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>메모</FieldLabel>
                    <Textarea
                      rows={3}
                      placeholder="메모를 입력하세요"
                      className="resize-none text-sm rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-500 focus-visible:ring-gray-400/30 focus-visible:border-gray-400 transition"
                      {...field}
                    />
                    <FormMessage className="text-xs mt-1" />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditOpen(false)}
                  className="h-8 px-4 text-xs text-gray-500 dark:text-gray-400"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="h-8 px-5 text-xs"
                >
                  {updateMutation.isPending ? (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      저장 중...
                    </span>
                  ) : (
                    '저장'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="거래처 삭제"
        description={`"${client.name}" 거래처를 삭제하면 휴지통으로 이동됩니다.`}
        confirmLabel="삭제"
        tone="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  )
}
