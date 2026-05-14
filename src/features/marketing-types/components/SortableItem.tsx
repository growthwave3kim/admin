import { Draggable } from '@hello-pangea/dnd'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, GripVertical, Pencil, Trash2, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { inputClassSm } from '@/components/common/FieldLabel'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { updateMarketingType } from '@/features/marketing-types/queries'
import type { MarketingType } from '@/features/marketing-types/types'
import { type NameForm, nameSchema } from '@/features/marketing-types/types'
import { cn } from '@/lib/utils'

const ACCENT_COLORS = [
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
]

export const SortableItem = ({
  type,
  index,
  editId,
  onEdit,
  onDelete,
  onEditDone,
}: {
  type: MarketingType
  index: number
  editId: string | null
  onEdit: (id: string) => void
  onDelete: (type: MarketingType) => void
  onEditDone: () => void
}) => {
  const qc = useQueryClient()

  const editForm = useForm<NameForm>({
    resolver: zodResolver(nameSchema) as never,
    defaultValues: { name: type.name },
  })

  const editMutation = useMutation({
    mutationFn: (data: NameForm) => updateMarketingType(type.id, { name: data.name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing-types'] })
      toast.success('수정되었습니다')
      onEditDone()
    },
    onError: () => toast.error('수정에 실패했습니다'),
  })

  return (
    <Draggable draggableId={type.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={provided.draggableProps.style}
          className={cn(
            'group flex items-center gap-3 px-4 py-3 transition-colors',
            editId !== type.id && 'hover:bg-gray-50 dark:hover:bg-gray-800/40',
            snapshot.isDragging && 'z-10 bg-white shadow-lg dark:bg-gray-900',
          )}
        >
          <button
            type="button"
            {...provided.dragHandleProps}
            className="cursor-grab touch-none outline-none active:cursor-grabbing"
            tabIndex={-1}
          >
            <GripVertical className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-500" />
          </button>

          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-semibold text-xs',
              ACCENT_COLORS[index % ACCENT_COLORS.length],
            )}
          >
            {index + 1}
          </span>

          {editId === type.id ? (
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit((d) => editMutation.mutate(d as NameForm))}
                className="flex flex-1 items-start gap-2"
              >
                <FormField
                  control={editForm.control as never}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Input className={inputClassSm} placeholder="유형명" autoFocus {...field} />
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
              <span className="flex-1 font-medium text-gray-800 text-sm dark:text-gray-200">{type.name}</span>
              <div className="flex items-center gap-0.5 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => onEdit(type.id)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                  onClick={() => onDelete(type)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Draggable>
  )
}
