import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, GripVertical, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  fetchMarketingTypes,
  createMarketingType,
  updateMarketingType,
  deleteMarketingType,
} from '@/features/marketing-types/queries'
import type { MarketingType } from '@/features/tasks/types'

export const Route = createFileRoute('/_authed/marketing-types/')({
  component: MarketingTypesPage,
})

const addSchema = z.object({
  name: z.string().min(1, '유형명을 입력해주세요'),
  sort_order: z.coerce.number().min(0),
})

type AddForm = z.infer<typeof addSchema>

function EditRow({
  type,
  onDone,
}: {
  type: MarketingType
  onDone: () => void
}) {
  const qc = useQueryClient()
  const [name, setName] = useState(type.name)
  const [order, setOrder] = useState(String(type.sort_order))

  const mutation = useMutation({
    mutationFn: () =>
      updateMarketingType(type.id, { name, sort_order: Number(order) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing-types'] })
      toast.success('수정되었습니다')
      onDone()
    },
    onError: () => toast.error('수정에 실패했습니다'),
  })

  return (
    <div className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 h-8 text-sm"
        placeholder="유형명"
      />
      <Input
        type="number"
        value={order}
        onChange={(e) => setOrder(e.target.value)}
        className="w-20 h-8 text-sm"
        placeholder="순서"
      />
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-green-600"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        <Check className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-gray-400"
        onClick={onDone}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}

function MarketingTypesPage() {
  const qc = useQueryClient()
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MarketingType | null>(null)

  const { data: types = [] } = useQuery({
    queryKey: ['marketing-types'],
    queryFn: fetchMarketingTypes,
  })

  const addForm = useForm<AddForm>({
    resolver: zodResolver(addSchema),
    defaultValues: { name: '', sort_order: types.length + 1 },
  })

  const addMutation = useMutation({
    mutationFn: (data: AddForm) => createMarketingType(data.name, data.sort_order),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing-types'] })
      toast.success('마케팅 유형이 추가되었습니다')
      addForm.reset({ name: '', sort_order: types.length + 2 })
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">마케팅 유형 관리</h1>
        <p className="text-sm text-gray-500 mt-1">마케팅 유형을 추가, 수정, 삭제할 수 있습니다</p>
      </div>

      {/* Add form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">새 유형 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...addForm}>
            <form
              onSubmit={addForm.handleSubmit((d) => addMutation.mutate(d))}
              className="flex gap-3"
            >
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="sr-only">유형명</FormLabel>
                    <FormControl>
                      <Input placeholder="유형명 입력" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem className="w-28">
                    <FormLabel className="sr-only">정렬 순서</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="순서" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={addMutation.isPending} className="gap-2 self-start">
                <Plus className="w-4 h-4" />
                추가
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Type list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">유형 목록 ({types.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {types.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              등록된 마케팅 유형이 없습니다
            </p>
          )}
          <div className="divide-y divide-gray-100">
            {types.map((type) => (
              <div key={type.id} className="flex items-center gap-3 px-6 py-3">
                <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                  {type.sort_order}
                </div>

                {editId === type.id ? (
                  <div className="flex-1">
                    <EditRow type={type} onDone={() => setEditId(null)} />
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-gray-900">{type.name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditId(type.id)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600"
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
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>마케팅 유형 삭제</DialogTitle>
            <DialogDescription>
              "{deleteTarget?.name}"을(를) 삭제하시겠습니까? 이미 사용 중인 업무에서 연결이 끊길 수
              있습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
