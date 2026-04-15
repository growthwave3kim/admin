import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  createMarketingType,
  deleteMarketingType,
  fetchMarketingTypes,
  updateMarketingType,
} from '@/features/marketing-types/queries'
import type { MarketingType } from '@/features/tasks/types'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Check, GripVertical, Pencil, Plus, Tag, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import { toast } from 'sonner'
import { z } from 'zod'

export const Route = createFileRoute('/_authed/marketing-types/')({
  component: MarketingTypesPage,
})

const formSchema = z.object({
  name: z.string().min(1, '유형명을 입력해주세요'),
  sort_order: z.coerce.number().min(0),
})

type FormValues = z.infer<typeof formSchema>

const ACCENT_COLORS = [
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
]

const inputCls =
  'h-8 text-sm rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus-visible:ring-purple-500/30 focus-visible:border-purple-400 transition'

const EditRow = ({
  type,
  onDone,
}: {
  type: MarketingType
  onDone: () => void
}) => {
  const qc = useQueryClient()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as never,
    defaultValues: { name: type.name, sort_order: type.sort_order },
  })

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      updateMarketingType(type.id, {
        name: data.name,
        sort_order: data.sort_order,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing-types'] })
      toast.success('수정되었습니다')
      onDone()
    },
    onError: () => toast.error('수정에 실패했습니다'),
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((d) => mutation.mutate(d as FormValues))}
        className="flex items-start gap-2 flex-1"
      >
        <FormField
          control={form.control as never}
          name="name"
          render={({ field }) => (
            <FormItem className="flex-1">
              <Input
                className={inputCls}
                placeholder="유형명"
                autoFocus
                {...field}
              />
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control as never}
          name="sort_order"
          render={({ field }) => (
            <FormItem className="w-20">
              <NumericFormat
                customInput={Input}
                allowNegative={false}
                decimalScale={0}
                className={inputCls}
                placeholder="순서"
                value={field.value as number}
                onValueChange={({ floatValue }) =>
                  field.onChange(floatValue ?? 0)
                }
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
          disabled={mutation.isPending}
        >
          <Check className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-gray-300 hover:text-gray-500 dark:text-gray-600 shrink-0"
          onClick={onDone}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </form>
    </Form>
  )
}

function MarketingTypesPage() {
  const qc = useQueryClient()
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MarketingType | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['marketing-types'],
    queryFn: fetchMarketingTypes,
  })

  const addForm = useForm<FormValues>({
    resolver: zodResolver(formSchema) as never,
    defaultValues: { name: '', sort_order: types.length + 1 },
  })

  const addMutation = useMutation({
    mutationFn: (data: FormValues) =>
      createMarketingType(data.name, data.sort_order),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing-types'] })
      toast.success('추가되었습니다')
      addForm.reset({ name: '', sort_order: types.length + 2 })
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

  return (
    <div className="max-w-xl mx-auto space-y-5 px-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
            마케팅 유형
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {types.length}개
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setIsAdding(true)
            setEditId(null)
          }}
          className="h-8 px-3 text-xs gap-1.5 text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 shadow-sm shadow-purple-200 dark:shadow-none"
        >
          <Plus className="w-3.5 h-3.5" />새 유형
        </Button>
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="rounded-xl border border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-900/10 p-4">
          <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-3">
            새 마케팅 유형 추가
          </p>
          <Form {...addForm}>
            <form
              onSubmit={addForm.handleSubmit((d) =>
                addMutation.mutate(d as FormValues),
              )}
              className="flex gap-2 items-start"
            >
              <FormField
                control={addForm.control as never}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Input
                      className={inputCls}
                      placeholder="유형명 입력"
                      autoFocus
                      {...field}
                    />
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control as never}
                name="sort_order"
                render={({ field }) => (
                  <FormItem className="w-20">
                    <NumericFormat
                      customInput={Input}
                      allowNegative={false}
                      decimalScale={0}
                      className={inputCls}
                      placeholder="순서"
                      value={field.value as number}
                      onValueChange={({ floatValue }) =>
                        field.onChange(floatValue ?? 0)
                      }
                    />
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={addMutation.isPending}
                className="h-8 px-3 text-xs text-white bg-purple-600 hover:bg-purple-700 shrink-0"
              >
                {addMutation.isPending ? '추가 중...' : '추가'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-300 hover:text-gray-500 shrink-0"
                onClick={() => setIsAdding(false)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </form>
          </Form>
        </div>
      )}

      {/* List */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : types.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-3 text-gray-300 dark:text-gray-600">
            <Tag className="w-8 h-8" />
            <p className="text-sm">등록된 마케팅 유형이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {types.map((type, index) => (
              <div
                key={type.id}
                className={cn(
                  'group flex items-center gap-3 px-4 py-3 transition-colors',
                  editId !== type.id &&
                    'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                )}
              >
                <GripVertical className="w-3.5 h-3.5 text-gray-200 dark:text-gray-700 shrink-0 cursor-grab" />

                <span
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0',
                    ACCENT_COLORS[index % ACCENT_COLORS.length],
                  )}
                >
                  {type.sort_order}
                </span>

                {editId === type.id ? (
                  <EditRow type={type} onDone={() => setEditId(null)} />
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {type.name}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-purple-600 dark:text-gray-500 dark:hover:text-purple-400"
                        onClick={() => {
                          setEditId(type.id)
                          setIsAdding(false)
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                        onClick={() => setDeleteTarget(type)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>마케팅 유형 삭제</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                "{deleteTarget?.name}"
              </span>
              을(를) 삭제하면 복구할 수 없습니다. 이미 사용 중인 업무에서 연결이
              끊길 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
