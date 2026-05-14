import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLazyFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { fetchMarketingTypes } from '@/features/marketing-types/queries'
import { fetchMembers } from '@/features/members/queries'
import { createTask } from '@/features/tasks/queries'
import type { TaskFormValues } from '@/features/tasks/TaskForm'
import { TaskForm } from '@/features/tasks/TaskForm'
import { clearDraft } from '@/features/tasks/useFormDraft'
import { STALE_30M, STALE_FOREVER } from '@/lib/queryClient'

export const Route = createLazyFileRoute('/_authed/tasks/new')({
  component: NewTaskPage,
})

function NewTaskPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [pendingData, setPendingData] = useState<TaskFormValues | null>(null)

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
    mutationFn: createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('업무가 등록되었습니다')
      setPendingData(null)
      router.navigate({ to: '/tasks' })
    },
    onError: () => {
      toast.error('업무 등록에 실패했습니다')
    },
  })

  const handleSubmit = async (data: TaskFormValues) => {
    setPendingData(data)
  }

  const handleConfirm = () => {
    if (!pendingData) return
    mutation.mutate({
      ...pendingData,
      note: pendingData.note ?? undefined,
      end_date: pendingData.end_date ?? null,
    })
  }

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            onClick={() => router.navigate({ to: '/tasks' })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-base text-gray-800 dark:text-gray-200">새 업무 등록</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <TaskForm
            marketingTypes={marketingTypes}
            members={members}
            onSubmit={handleSubmit}
            onCancel={() => {
              clearDraft()
              router.navigate({ to: '/tasks' })
            }}
            showEndDate={true}
            isLoading={mutation.isPending}
            submitLabel="등록"
            enableDraft={true}
          />
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingData}
        onOpenChange={(open) => !open && setPendingData(null)}
        title="업무 등록"
        description={`"${pendingData?.company_name ?? ''}" 업무를 등록하시겠습니까?`}
        confirmLabel="등록"
        isPending={mutation.isPending}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
