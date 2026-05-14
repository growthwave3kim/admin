import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'
import { Check, Pencil, Plus, Tag, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { inputClassSm } from '@/components/common/FieldLabel'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  createExpenseCategory,
  deleteExpenseCategory,
  fetchExpenseCategories,
  updateExpenseCategory,
} from '@/features/expense-categories/queries'
import type { ExpenseCategory } from '@/features/expense-categories/types'
import { STALE_FOREVER } from '@/lib/queryClient'
import { cn } from '@/lib/utils'

export const Route = createLazyFileRoute('/_authed/expense-categories/')({
  component: ExpenseCategoriesPage,
})

const nameSchema = z.object({
  name: z.string().min(1, '카테고리명을 입력해주세요'),
})
type NameForm = z.infer<typeof nameSchema>

const ACCENT_COLORS = [
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
]

function CategoryRow({
  category,
  index,
  editId,
  onEdit,
  onDelete,
  onEditDone,
}: {
  category: ExpenseCategory
  index: number
  editId: string | null
  onEdit: (id: string) => void
  onDelete: (c: ExpenseCategory) => void
  onEditDone: () => void
}) {
  const qc = useQueryClient()

  const editForm = useForm<NameForm>({
    resolver: zodResolver(nameSchema) as never,
    defaultValues: { name: category.name },
  })

  const editMutation = useMutation({
    mutationFn: (data: NameForm) => updateExpenseCategory(category.id, { name: data.name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expense-categories'] })
      toast.success('수정되었습니다')
      onEditDone()
    },
    onError: () => toast.error('수정에 실패했습니다'),
  })

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-4 py-3 transition-colors',
        editId !== category.id && 'hover:bg-gray-50 dark:hover:bg-gray-800/40',
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-semibold text-xs',
          ACCENT_COLORS[index % ACCENT_COLORS.length],
        )}
      >
        {index + 1}
      </span>

      {editId === category.id ? (
        <Form {...editForm}>
          <form
            onSubmit={editForm.handleSubmit((d) => editMutation.mutate(d))}
            className="flex flex-1 items-start gap-2"
          >
            <FormField
              control={editForm.control as never}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <Input className={inputClassSm} placeholder="카테고리명" autoFocus {...field} />
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/20"
              disabled={editMutation.isPending}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-400"
              onClick={onEditDone}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </form>
        </Form>
      ) : (
        <>
          <span className="flex-1 font-medium text-gray-800 text-sm dark:text-gray-200">{category.name}</span>
          <div className="flex items-center gap-0.5 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => onEdit(category.id)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              onClick={() => onDelete(category)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

function ExpenseCategoriesPage() {
  const qc = useQueryClient()
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ExpenseCategory | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: fetchExpenseCategories,
    staleTime: STALE_FOREVER,
  })

  const addForm = useForm<NameForm>({
    resolver: zodResolver(nameSchema) as never,
    defaultValues: { name: '' },
  })

  const addMutation = useMutation({
    mutationFn: (data: NameForm) => {
      const nextOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 1
      return createExpenseCategory(data.name, nextOrder)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expense-categories'] })
      toast.success('추가되었습니다')
      addForm.reset({ name: '' })
      setIsAdding(false)
    },
    onError: () => toast.error('추가에 실패했습니다'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpenseCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expense-categories'] })
      toast.success('삭제되었습니다')
      setDeleteTarget(null)
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="mx-auto max-w-xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-base text-gray-800 dark:text-gray-200">지출 카테고리</span>
            <span className="text-gray-400 text-xs dark:text-gray-400">{categories.length}개</span>
          </div>
          {!isAdding && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setIsAdding(true)
                setEditId(null)
              }}
              className="h-8 gap-1.5 px-3 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />새 카테고리
            </Button>
          )}
        </div>

        {/* Add form */}
        {isAdding && (
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit((d) => addMutation.mutate(d))} className="flex items-start gap-2">
              <FormField
                control={addForm.control as never}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Input className={cn(inputClassSm, 'h-9')} placeholder="새 카테고리명 입력" autoFocus {...field} />
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={addMutation.isPending} className="h-9 shrink-0 px-4 text-xs">
                {addMutation.isPending ? '추가 중...' : '추가'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                onClick={() => {
                  setIsAdding(false)
                  addForm.reset()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          </Form>
        )}

        {/* List */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800 dark:border-gray-700 dark:border-t-gray-200" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-gray-300 dark:text-gray-500">
              <Tag className="h-8 w-8" />
              <p className="text-sm">등록된 카테고리가 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {categories.map((category, index) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  index={index}
                  editId={editId}
                  onEdit={(id) => {
                    setEditId(id)
                    setIsAdding(false)
                  }}
                  onDelete={setDeleteTarget}
                  onEditDone={() => setEditId(null)}
                />
              ))}
            </div>
          )}
        </div>

        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="카테고리 삭제"
          description={`"${deleteTarget?.name ?? ''}"을(를) 삭제하면 복구할 수 없습니다. 이미 사용 중인 지출에서 카테고리 연결이 끊길 수 있습니다.`}
          confirmLabel="삭제"
          tone="destructive"
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        />
      </div>
    </div>
  )
}
