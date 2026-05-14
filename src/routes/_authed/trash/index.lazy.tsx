import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'
import { Building2, ClipboardList, Receipt, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { fetchTrashedClients, permanentDeleteClient, restoreClient } from '@/features/clients/queries'
import { fetchTrashedExpenses, permanentDeleteExpense, restoreExpense } from '@/features/expenses/queries'
import { fetchTrashedTasks, permanentDeleteTask, restoreTask } from '@/features/tasks/queries'
import { TASK_STATUS_LABELS } from '@/features/tasks/types'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

export const Route = createLazyFileRoute('/_authed/trash/')({
  component: TrashPage,
})

type Tab = 'tasks' | 'clients' | 'expenses'

function TrashPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('tasks')
  const [permanentTarget, setPermanentTarget] = useState<{
    id: string
    label: string
    type: Tab
  } | null>(null)

  const { data: trashedTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['trashed-tasks'],
    queryFn: fetchTrashedTasks,
  })

  const { data: trashedClients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['trashed-clients'],
    queryFn: fetchTrashedClients,
  })

  const { data: trashedExpenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['trashed-expenses'],
    queryFn: fetchTrashedExpenses,
  })

  const restoreTaskMutation = useMutation({
    mutationFn: (id: string) => restoreTask(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['trashed-tasks'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['task', id] })
      toast.success('복원되었습니다')
    },
    onError: () => toast.error('복원에 실패했습니다'),
  })

  const restoreClientMutation = useMutation({
    mutationFn: (id: string) => restoreClient(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['trashed-clients'] })
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['client', id] })
      toast.success('복원되었습니다')
    },
    onError: () => toast.error('복원에 실패했습니다'),
  })

  const restoreExpenseMutation = useMutation({
    mutationFn: (id: string) => restoreExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trashed-expenses'] })
      qc.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('복원되었습니다')
    },
    onError: () => toast.error('복원에 실패했습니다'),
  })

  const permanentDeleteMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: Tab }) => {
      if (type === 'tasks') return permanentDeleteTask(id)
      if (type === 'clients') return permanentDeleteClient(id)
      return permanentDeleteExpense(id)
    },
    onSuccess: (_, { type }) => {
      if (type === 'tasks') qc.invalidateQueries({ queryKey: ['trashed-tasks'] })
      if (type === 'clients') qc.invalidateQueries({ queryKey: ['trashed-clients'] })
      if (type === 'expenses') qc.invalidateQueries({ queryKey: ['trashed-expenses'] })
      toast.success('영구 삭제되었습니다')
      setPermanentTarget(null)
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const tabs: {
    key: Tab
    label: string
    icon: typeof ClipboardList
    count: number
  }[] = [
    {
      key: 'tasks',
      label: '업무',
      icon: ClipboardList,
      count: trashedTasks.length,
    },
    {
      key: 'clients',
      label: '거래처',
      icon: Building2,
      count: trashedClients.length,
    },
    {
      key: 'expenses',
      label: '지출내역',
      icon: Receipt,
      count: trashedExpenses.length,
    },
  ]

  const isLoading = tasksLoading || clientsLoading || expensesLoading

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Header */}
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-base text-gray-800 dark:text-gray-200">휴지통</span>
          <span className="text-gray-400 text-xs dark:text-gray-400">
            삭제된 항목은 이곳에서 복원하거나 영구 삭제할 수 있습니다
          </span>
        </div>

        {/* Tabs */}
        <div className="flex w-fit items-center gap-0.5 rounded-md bg-gray-100 p-0.5 dark:bg-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 rounded px-3 py-1.5 font-medium text-xs transition-all',
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={cn(
                    'rounded-sm px-1.5 py-0.5 font-semibold text-[10px]',
                    activeTab === tab.key
                      ? 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800 dark:border-gray-700 dark:border-t-gray-200" />
            </div>
          ) : activeTab === 'tasks' ? (
            trashedTasks.length === 0 ? (
              <EmptyState label="삭제된 업무가 없습니다" />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {trashedTasks.map((task) => (
                  <div key={task.id} className="flex items-start justify-between gap-2 px-4 py-3.5 md:px-5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-gray-800 text-sm dark:text-gray-200">{task.company_name}</span>
                      <div className="flex items-center gap-2 text-gray-400 text-xs dark:text-gray-400">
                        <span>{TASK_STATUS_LABELS[task.status]}</span>
                        <span>·</span>
                        <span>{formatDate(task.start_date)}</span>
                        <span>·</span>
                        <span className="text-red-400 dark:text-red-400">
                          삭제일 {formatDate(task.deleted_at ?? '')}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-emerald-600 text-xs hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                        onClick={() => restoreTaskMutation.mutate(task.id)}
                        disabled={restoreTaskMutation.isPending}
                      >
                        <RotateCcw className="h-3 w-3" />
                        복원
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-red-400 text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        onClick={() =>
                          setPermanentTarget({
                            id: task.id,
                            label: task.company_name,
                            type: 'tasks',
                          })
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                        영구삭제
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'clients' ? (
            trashedClients.length === 0 ? (
              <EmptyState label="삭제된 거래처가 없습니다" />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {trashedClients.map((client) => (
                  <div key={client.id} className="flex items-start justify-between gap-2 px-4 py-3.5 md:px-5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-gray-800 text-sm dark:text-gray-200">{client.name}</span>
                      <div className="flex items-center gap-2 text-gray-400 text-xs dark:text-gray-400">
                        {client.contact_name && <span>{client.contact_name}</span>}
                        {client.contact_name && <span>·</span>}
                        <span className="text-red-400 dark:text-red-400">
                          삭제일 {formatDate(client.deleted_at ?? '')}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-emerald-600 text-xs hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                        onClick={() => restoreClientMutation.mutate(client.id)}
                        disabled={restoreClientMutation.isPending}
                      >
                        <RotateCcw className="h-3 w-3" />
                        복원
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-red-400 text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        onClick={() =>
                          setPermanentTarget({
                            id: client.id,
                            label: client.name,
                            type: 'clients',
                          })
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                        영구삭제
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : trashedExpenses.length === 0 ? (
            <EmptyState label="삭제된 지출내역이 없습니다" />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {trashedExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-gray-800 text-sm dark:text-gray-200">{expense.description}</span>
                    <div className="flex items-center gap-2 text-gray-400 text-xs dark:text-gray-400">
                      <span
                        className={
                          expense.entry_type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-500 dark:text-red-400'
                        }
                      >
                        {expense.entry_type === 'income' ? '+' : '-'}
                        {formatCurrency(expense.amount)}
                      </span>
                      <span>·</span>
                      <span>{formatDate(expense.expense_date)}</span>
                      <span>·</span>
                      <span className="text-red-400 dark:text-red-400">
                        삭제일 {formatDate(expense.deleted_at ?? '')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-emerald-600 text-xs hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                      onClick={() => restoreExpenseMutation.mutate(expense.id)}
                      disabled={restoreExpenseMutation.isPending}
                    >
                      <RotateCcw className="h-3 w-3" />
                      복원
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-red-400 text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      onClick={() =>
                        setPermanentTarget({
                          id: expense.id,
                          label: expense.description,
                          type: 'expenses',
                        })
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                      영구삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!permanentTarget}
        onOpenChange={(open) => !open && setPermanentTarget(null)}
        title="영구 삭제"
        description={`"${permanentTarget?.label ?? ''}"을(를) 영구 삭제하면 복구할 수 없습니다. 계속하시겠습니까?`}
        confirmLabel="영구 삭제"
        tone="destructive"
        isPending={permanentDeleteMutation.isPending}
        onConfirm={() =>
          permanentTarget &&
          permanentDeleteMutation.mutate({
            id: permanentTarget.id,
            type: permanentTarget.type,
          })
        }
      />
    </div>
  )
}

const EmptyState = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center gap-3 py-14 text-gray-300 dark:text-gray-600">
    <Trash2 className="h-8 w-8" />
    <p className="text-sm">{label}</p>
  </div>
)
