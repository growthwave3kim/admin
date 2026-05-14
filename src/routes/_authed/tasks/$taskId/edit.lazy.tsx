import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLazyFileRoute, getRouteApi, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { fetchMarketingTypes } from '@/features/marketing-types/queries'
import { fetchMembers } from '@/features/members/queries'
import { fetchTask, updateTask } from '@/features/tasks/queries'
import type { TaskFormValues } from '@/features/tasks/TaskForm'
import { TaskForm } from '@/features/tasks/TaskForm'
import { STALE_30M, STALE_FOREVER } from '@/lib/queryClient'

export const Route = createLazyFileRoute('/_authed/tasks/$taskId/edit')({
  component: EditTaskPage,
})

const routeApi = getRouteApi('/_authed/tasks/$taskId/edit')

function EditTaskPage() {
  const { taskId } = routeApi.useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const [pendingData, setPendingData] = useState<TaskFormValues | null>(null)

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTask(taskId),
  })

  const { data: marketingTypes = [] } = useQuery({
    queryKey: ['marketing-types'],
    queryFn: fetchMarketingTypes,
    staleTime: STALE_FOREVER,
  })

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: fetchMembers,
    staleTime: STALE_30M,
  })

  const mutation = useMutation({
    mutationFn: (data: Partial<TaskFormValues>) => updateTask(taskId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', taskId] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('업무가 수정되었습니다')
      setPendingData(null)
      router.navigate({ to: '/tasks/$taskId', params: { taskId } })
    },
    onError: () => toast.error('수정에 실패했습니다'),
  })

  if (taskLoading || !task) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800 dark:border-gray-700 dark:border-t-gray-200" />
      </div>
    )
  }

  const defaultValues: Partial<TaskFormValues> = {
    company_name: task.company_name,
    client_id: task.client_id ?? '',
    member_id: task.member_id ?? null,
    received_amount: task.received_amount,
    execution_cost: task.execution_cost,
    status: task.status,
    vat_included: task.vat_included ?? false,
    start_date: new Date(task.start_date),
    end_date: task.end_date ? new Date(task.end_date) : null,
    note: task.note ?? '',
    marketings:
      task.task_marketings?.map((m) => ({
        marketing_type_id: m.marketing_type_id,
        count: m.count,
      })) ?? [],
  }

  const handleSubmit = async (data: TaskFormValues) => {
    setPendingData(data)
  }

  const handleConfirm = () => {
    if (!pendingData) return
    mutation.mutate(pendingData)
  }

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            onClick={() => router.navigate({ to: '/tasks/$taskId', params: { taskId } })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-base text-gray-800 dark:text-gray-200">업무 수정</span>
            <span className="text-gray-400 text-xs dark:text-gray-400">{task.company_name}</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <TaskForm
            defaultValues={defaultValues}
            marketingTypes={marketingTypes}
            members={members}
            onSubmit={handleSubmit}
            onCancel={() => router.navigate({ to: '/tasks/$taskId', params: { taskId } })}
            showEndDate={true}
            isLoading={mutation.isPending}
            submitLabel="저장"
          />
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingData}
        onOpenChange={(open) => !open && setPendingData(null)}
        title="업무 수정"
        description="변경사항을 저장하시겠습니까?"
        confirmLabel="저장"
        isPending={mutation.isPending}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
