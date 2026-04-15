import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskForm } from '@/features/tasks/TaskForm'
import { fetchTask, updateTask } from '@/features/tasks/queries'
import { fetchMarketingTypes } from '@/features/marketing-types/queries'
import type { TaskFormValues } from '@/features/tasks/TaskForm'

export const Route = createFileRoute('/_authed/tasks/$taskId/edit')({
  component: EditTaskPage,
})

function EditTaskPage() {
  const { taskId } = Route.useParams()
  const router = useRouter()
  const qc = useQueryClient()

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTask(taskId),
  })

  const { data: marketingTypes = [] } = useQuery({
    queryKey: ['marketing-types'],
    queryFn: fetchMarketingTypes,
  })

  const mutation = useMutation({
    mutationFn: (data: Partial<TaskFormValues>) => updateTask(taskId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', taskId] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('업무가 수정되었습니다')
      router.navigate({ to: '/tasks/$taskId', params: { taskId } })
    },
    onError: () => toast.error('수정에 실패했습니다'),
  })

  if (taskLoading || !task) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    )
  }

  const defaultValues: Partial<TaskFormValues> = {
    company_name: task.company_name,
    received_amount: task.received_amount,
    execution_cost: task.execution_cost,
    status: task.status,
    start_date: new Date(task.start_date),
    end_date: task.end_date ? new Date(task.end_date) : null,
    note: task.note ?? '',
    marketings:
      task.task_marketings?.map((m) => ({
        marketing_type_id: m.marketing_type_id,
        count: m.count,
      })) ?? [],
  }

  async function handleSubmit(data: TaskFormValues) {
    await mutation.mutateAsync(data)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.navigate({ to: '/tasks/$taskId', params: { taskId } })}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">업무 수정</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{task.company_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm
            defaultValues={defaultValues}
            marketingTypes={marketingTypes}
            onSubmit={handleSubmit}
            onCancel={() => router.navigate({ to: '/tasks/$taskId', params: { taskId } })}
            showEndDate={true}
            isLoading={mutation.isPending}
            submitLabel="저장"
          />
        </CardContent>
      </Card>
    </div>
  )
}
