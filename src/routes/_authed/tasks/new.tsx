import { Button } from '@/components/ui/button'
import { fetchMarketingTypes } from '@/features/marketing-types/queries'
import { TaskForm } from '@/features/tasks/TaskForm'
import type { TaskFormValues } from '@/features/tasks/TaskForm'
import { createTask } from '@/features/tasks/queries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

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
    <div className="max-w-2xl mx-auto space-y-5 px-1">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={() => router.navigate({ to: '/tasks' })}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
            새 업무 등록
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <TaskForm
          marketingTypes={marketingTypes}
          onSubmit={handleSubmit}
          onCancel={() => router.navigate({ to: '/tasks' })}
          showEndDate={false}
          isLoading={mutation.isPending}
          submitLabel="등록"
        />
      </div>
    </div>
  )
}
