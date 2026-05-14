import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLazyFileRoute, getRouteApi, Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { FieldLabel, inputClass } from '@/components/common/FieldLabel'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { fetchClient, softDeleteClient, updateClient } from '@/features/clients/queries'
import type { ClientFormData } from '@/features/clients/types'
import { fetchTasks } from '@/features/tasks/queries'
import { TaskStatusBadge } from '@/features/tasks/TaskStatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'

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
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800 dark:border-gray-700 dark:border-t-gray-200" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400 text-sm dark:text-gray-400">거래처를 찾을 수 없습니다</p>
      </div>
    )
  }

  const totalRevenue = linkedTasks.reduce((s, t) => s + (t.received_amount || 0), 0)
  const totalProfit = linkedTasks.reduce((s, t) => s + (t.profit || 0), 0)

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
              onClick={() => router.navigate({ to: '/clients' })}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <p className="font-semibold text-base text-gray-900 dark:text-gray-100">{client.name}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-gray-300 text-gray-700 text-xs hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              수정
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-red-200 text-red-500 text-xs hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              삭제
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-gray-400 text-xs dark:text-gray-400">연결 업무</p>
            <p className="mt-1.5 font-semibold text-gray-800 text-sm tabular-nums dark:text-gray-100">
              {linkedTasks.length}건
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-gray-400 text-xs dark:text-gray-400">총 수입</p>
            <p className="mt-1.5 font-semibold text-emerald-600 text-sm tabular-nums dark:text-emerald-400">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-gray-400 text-xs dark:text-gray-400">총 수익</p>
            <p
              className={`mt-1.5 font-semibold text-sm tabular-nums ${totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}
            >
              {formatCurrency(totalProfit)}
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-gray-100 border-b px-5 py-3.5 dark:border-gray-800">
            <span className="w-24 shrink-0 text-gray-400 text-xs dark:text-gray-400">담당자</span>
            <span className="text-gray-700 text-sm dark:text-gray-200">{client.contact_name || '-'}</span>
          </div>
          <div className="flex items-center justify-between border-gray-100 border-b px-5 py-3.5 dark:border-gray-800">
            <span className="w-24 shrink-0 text-gray-400 text-xs dark:text-gray-400">연락처</span>
            <span className="text-gray-700 text-sm tabular-nums dark:text-gray-200">{client.contact_phone || '-'}</span>
          </div>
          <div className="flex items-start gap-4 px-5 py-3.5">
            <span className="w-24 shrink-0 pt-0.5 text-gray-400 text-xs dark:text-gray-400">메모</span>
            <p className="flex-1 whitespace-pre-wrap text-gray-700 text-sm dark:text-gray-200">{client.note || '-'}</p>
          </div>
        </div>

        {/* Linked tasks */}
        <div className="space-y-2">
          <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
            연결된 업무 ({linkedTasks.length})
          </p>
          {linkedTasks.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white py-10 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-gray-400 text-xs dark:text-gray-400">연결된 업무가 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
              {linkedTasks.map((task) => (
                <Link
                  key={task.id}
                  to="/tasks/$taskId"
                  params={{ taskId: task.id }}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
                >
                  <div className="flex items-center gap-3">
                    <TaskStatusBadge status={task.status} />
                    <span className="font-medium text-gray-800 text-sm dark:text-gray-200">{task.company_name}</span>
                    <span className="text-gray-400 text-xs tabular-nums dark:text-gray-400">
                      {formatDate(task.start_date)}
                    </span>
                  </div>
                  <span className="font-semibold text-emerald-600 text-xs tabular-nums dark:text-emerald-400">
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
            <form onSubmit={form.handleSubmit((v) => updateMutation.mutate(v))} className="mt-2 space-y-4">
              <FormField
                control={form.control as never}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>거래처명</FieldLabel>
                    <Input className={inputClass} placeholder="거래처명 입력" {...field} />
                    <FormMessage className="mt-1 text-xs" />
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
                      <Input className={inputClass} placeholder="담당자명" {...field} />
                      <FormMessage className="mt-1 text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as never}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>연락처</FieldLabel>
                      <Input className={inputClass} placeholder="010-0000-0000" {...field} />
                      <FormMessage className="mt-1 text-xs" />
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
                      className="resize-none rounded-md border-gray-200 bg-white text-gray-900 text-sm transition placeholder:text-gray-300 focus-visible:border-gray-400 focus-visible:ring-gray-400/30 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500"
                      {...field}
                    />
                    <FormMessage className="mt-1 text-xs" />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 border-gray-100 border-t pt-2 dark:border-gray-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditOpen(false)}
                  className="h-8 px-4 text-gray-500 text-xs dark:text-gray-400"
                >
                  취소
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} className="h-8 px-5 text-xs">
                  {updateMutation.isPending ? (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
