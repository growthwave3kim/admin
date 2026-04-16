import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { inputClassSm } from '@/components/common/FieldLabel'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SortableItem } from '@/features/marketing-types/components/SortableItem'
import {
  createMarketingType,
  deleteMarketingType,
  fetchMarketingTypes,
  reorderMarketingTypes,
} from '@/features/marketing-types/queries'
import { type NameForm, nameSchema } from '@/features/marketing-types/types'
import type { MarketingType } from '@/features/marketing-types/types'
import { cn } from '@/lib/utils'
import { DragDropContext, type DropResult, Droppable } from '@hello-pangea/dnd'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'
import { Plus, Tag, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export const Route = createLazyFileRoute('/_authed/marketing-types/')({
  component: MarketingTypesPage,
})

function MarketingTypesPage() {
  const qc = useQueryClient()
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MarketingType | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['marketing-types'],
    queryFn: fetchMarketingTypes,
  })

  const addForm = useForm<NameForm>({
    resolver: zodResolver(nameSchema) as never,
    defaultValues: { name: '' },
  })

  const addMutation = useMutation({
    mutationFn: (data: NameForm) =>
      createMarketingType(data.name, types.length + 1),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing-types'] })
      toast.success('추가되었습니다')
      addForm.reset({ name: '' })
      setIsAdding(false)
    },
    onError: () => toast.error('추가에 실패했습니다'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMarketingType(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing-types'] })
      toast.success('삭제되었습니다')
      setDeleteTarget(null)
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; sort_order: number }[]) =>
      reorderMarketingTypes(items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing-types'] })
    },
    onError: () => toast.error('순서 저장에 실패했습니다'),
  })

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index)
      return

    const reordered = Array.from(types)
    const [removed] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, removed)

    qc.setQueryData(['marketing-types'], reordered)

    reorderMutation.mutate(
      reordered.map((t, i) => ({ id: t.id, sort_order: i + 1 })),
    )
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
              마케팅 유형
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-400">
              {types.length}개
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
              <Plus className="w-3.5 h-3.5" />새 유형
            </Button>
          )}
        </div>

        {/* Add form */}
        {isAdding && (
          <Form {...addForm}>
            <form
              onSubmit={addForm.handleSubmit((d) =>
                addMutation.mutate(d as NameForm),
              )}
              className="flex gap-2 items-start"
            >
              <FormField
                control={addForm.control as never}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Input
                      className={cn(inputClassSm, 'h-9')}
                      placeholder="새 마케팅 유형명 입력"
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
          ) : types.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-3 text-gray-300 dark:text-gray-500">
              <Tag className="w-8 h-8" />
              <p className="text-sm">등록된 마케팅 유형이 없습니다</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="marketing-types">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="divide-y divide-gray-100 dark:divide-gray-800"
                  >
                    {types.map((type, index) => (
                      <SortableItem
                        key={type.id}
                        type={type}
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
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="마케팅 유형 삭제"
          description={`"${deleteTarget?.name ?? ''}"을(를) 삭제하면 복구할 수 없습니다. 이미 사용 중인 업무에서 연결이 끊길 수 있습니다.`}
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
