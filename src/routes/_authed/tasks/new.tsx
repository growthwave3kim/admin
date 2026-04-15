import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskForm } from '@/features/tasks/TaskForm'
import { createTask } from '@/features/tasks/queries'
import { fetchMarketingTypes } from '@/features/marketing-types/queries'
import type { TaskFormValues } from '@/features/tasks/TaskForm'

export const Route = createFileRoute('/_authed/tasks/new')({
  component: NewTaskPage,
})

function NewTaskPage() {
  const router = useRouter()
  const qc = useQueryClient()

  const { data: marketingTypes = [] } = useQuery({
    queryKey: ['marketing-types'],
    queryFn: fetchMarketingTypes,
  })

  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('업무가 등록되었습니다')
      router.navigate({ to: '/tasks' })
    },
    onError: () => {
      toast.error('업무 등록에 실패했습니다')
    },
  })

  async function handleSubmit(data: TaskFormValues) {
    await mutation.mutateAsync({
      ...data,
      note: data.note ?? undefined,
      end_date: data.end_date ?? null,
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.navigate({ to: '/tasks' })}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">새 업무 등록</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>업무 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm
            marketingTypes={marketingTypes}
            onSubmit={handleSubmit}
            onCancel={() => router.navigate({ to: '/tasks' })}
            showEndDate={false}
            isLoading={mutation.isPending}
            submitLabel="등록"
          />
        </CardContent>
      </Card>
    </div>
  )
}
