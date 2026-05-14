import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FieldLabel, inputClass } from '@/components/common/FieldLabel'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient, updateClient } from '@/features/clients/queries'
import type { Client, ClientFormData } from '@/features/clients/types'

const formatPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

const clientFormSchema = z.object({
  name: z.string().min(1, '거래처명을 입력해주세요'),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  email: z.string().optional(),
  note: z.string().optional(),
})

type ClientFormValues = z.infer<typeof clientFormSchema>

type ClientFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTarget?: Client | null
  onSuccess?: (client: Client) => void
  hideContactName?: boolean
}

export const ClientFormDialog = ({
  open,
  onOpenChange,
  editTarget = null,
  onSuccess,
  hideContactName = false,
}: ClientFormDialogProps) => {
  const qc = useQueryClient()

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema) as never,
    defaultValues: {
      name: '',
      contact_name: '',
      contact_phone: '',
      email: '',
      note: '',
    },
  })

  useEffect(() => {
    form.reset({
      name: editTarget?.name ?? '',
      contact_name: editTarget?.contact_name ?? '',
      contact_phone: editTarget?.contact_phone ?? '',
      email: editTarget?.email ?? '',
      note: editTarget?.note ?? '',
    })
  }, [editTarget, form])

  const mutation = useMutation({
    mutationFn: (data: ClientFormValues) => {
      const payload: ClientFormData = {
        name: data.name,
        contact_name: data.contact_name || null,
        contact_phone: data.contact_phone || null,
        email: data.email || null,
        note: data.note || null,
      }
      return editTarget ? updateClient(editTarget.id, payload) : createClient(payload)
    },
    onSuccess: (client) => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['clients-infinite'] })
      if (editTarget) {
        qc.invalidateQueries({ queryKey: ['client', editTarget.id] })
      }
      toast.success(editTarget ? '수정되었습니다' : '거래처가 추가되었습니다')
      onSuccess?.(client)
      onOpenChange(false)
    },
    onError: () => toast.error(editTarget ? '수정에 실패했습니다' : '추가에 실패했습니다'),
  })

  const handleOpenChange = (o: boolean) => {
    if (!o) form.reset()
    onOpenChange(o)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editTarget ? '거래처 수정' : '새 거래처 추가'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="mt-2 space-y-4">
            <FormField
              control={form.control as never}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel required>거래처명</FieldLabel>
                  <Input className={inputClass} placeholder="거래처명 입력" autoFocus {...field} />
                  <FormMessage className="mt-1 text-xs" />
                </FormItem>
              )}
            />
            <div className={hideContactName ? '' : 'grid grid-cols-2 gap-3'}>
              {!hideContactName && (
                <FormField
                  control={form.control as never}
                  name="contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>담당자명</FieldLabel>
                      <Input className={inputClass} placeholder="담당자명" {...field} />
                      <FormMessage className="mt-1 text-xs" />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control as never}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>연락처</FieldLabel>
                    <Input
                      className={inputClass}
                      placeholder="010-0000-0000"
                      value={field.value as string}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                    />
                    <FormMessage className="mt-1 text-xs" />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control as never}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel>이메일</FieldLabel>
                  <Input className={inputClass} placeholder="example@email.com" type="email" {...field} />
                  <FormMessage className="mt-1 text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as never}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel>메모</FieldLabel>
                  <Textarea
                    placeholder="메모를 입력하세요"
                    rows={3}
                    className="resize-none rounded-md border-gray-200 bg-white text-gray-900 text-sm transition placeholder:text-gray-300 focus-visible:border-gray-400 focus-visible:ring-gray-400/30 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500"
                    {...field}
                  />
                  <FormMessage className="mt-1 text-xs" />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 border-gray-100 border-t pt-2 dark:border-gray-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                className="h-8 px-4 text-gray-500 text-xs dark:text-gray-400"
              >
                취소
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="h-8 px-5 text-xs">
                {mutation.isPending ? (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    저장 중...
                  </span>
                ) : editTarget ? (
                  '저장'
                ) : (
                  '추가'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
