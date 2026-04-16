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
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'
import { Check, Pencil, Plus, Tag, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

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
    mutationFn: (data: NameForm) =>
      updateExpenseCategory(category.id, { name: data.name }),
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
          'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0',
          ACCENT_COLORS[index % ACCENT_COLORS.length],
        )}
      >
        {index + 1}
      </span>

      {editId === category.id ? (
        <Form {...editForm}>
          <form
            onSubmit={editForm.handleSubmit((d) => editMutation.mutate(d))}
            className="flex items-start gap-2 flex-1"
          >
            <FormField
              control={editForm.control as never}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <Input
                    className={inputClassSm}
                    placeholder="카테고리명"
                    autoFocus
                    {...field}
                  />
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 shrink-0"
              disabled={editMutation.isPending}
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:text-gray-400 shrink-0"
              onClick={onEditDone}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </form>
        </Form>
      ) : (
        <>
          <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
            {category.name}
          </span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => onEdit(category.id)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              onClick={() => onDelete(category)}
            >
              <Trash2 className="w-3.5 h-3.5" />
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
  })

  const addForm = useForm<NameForm>({
    resolver: zodResolver(nameSchema) as never,
    defaultValues: { name: '' },
  })

  const addMutation = useMutation({
    mutationFn: (data: NameForm) => {
      const nextOrder =
        categories.length > 0
          ? Math.max(...categories.map((c) => c.sort_order)) + 1
          : 1
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
    <div className="h-full overflow-auto p-6">
      <div className="max-w-xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
              지출 카테고리
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-400">
              {categories.length}개
            </span>
          </div>
          {!isAdding && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setIsAdding(true)
                setEditId(null)
              }}
              className="h-8 px-3 text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />새 카테고리
            </Button>
          )}
        </div>

        {/* Add form */}
        {isAdding && (
          <Form {...addForm}>
            <form
              onSubmit={addForm.handleSubmit((d) => addMutation.mutate(d))}
              className="flex gap-2 items-start"
            >
              <FormField
                control={addForm.control as never}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Input
                      className={cn(inputClassSm, 'h-9')}
                      placeholder="새 카테고리명 입력"
                      autoFocus
                      {...field}
                    />
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={addMutation.isPending}
                className="h-9 px-4 text-xs shrink-0"
              >
                {addMutation.isPending ? '추가 중...' : '추가'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-gray-400 hover:text-gray-600 dark:text-gray-400 shrink-0"
                onClick={() => {
                  setIsAdding(false)
                  addForm.reset()
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </form>
          </Form>
        )}

        {/* List */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-gray-800 dark:border-t-gray-200 rounded-full animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-3 text-gray-300 dark:text-gray-500">
              <Tag className="w-8 h-8" />
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
          onConfirm={() =>
            deleteTarget && deleteMutation.mutate(deleteTarget.id)
          }
        />
      </div>
    </div>
  )
}
