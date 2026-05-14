import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon, Check, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import { toast } from 'sonner'
import { z } from 'zod'
import { FieldLabel, inputClass } from '@/components/common/FieldLabel'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ClientFormDialog } from '@/features/clients/ClientFormDialog'
import { ClientCombobox } from '@/features/clients/components/ClientCombobox'
import { clearDraft, useFormDraft } from '@/features/tasks/useFormDraft'
import { cn } from '@/lib/utils'
import type { MarketingType, Member } from '../tasks/types'
import { TASK_STATUS_LABELS } from './types'

const taskFormSchema = z.object({
  company_name: z.string(),
  client_id: z.string().min(1, '업체를 선택해주세요'),
  member_id: z.string().optional().nullable(),
  received_amount: z.coerce.number().min(0),
  execution_cost: z.coerce.number().min(0),
  status: z.enum(['proposal', 'not_started', 'in_progress', 'done_settled', 'done_unsettled', 'lost'] as const),
  vat_included: z.boolean(),
  start_date: z.date(),
  end_date: z.date().optional().nullable(),
  note: z.string().optional(),
  marketings: z.array(
    z.object({
      marketing_type_id: z.string().min(1),
      count: z.coerce.number().min(1),
    }),
  ),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>

type TaskFormProps = {
  defaultValues?: Partial<TaskFormValues>
  marketingTypes: MarketingType[]
  members: Member[]
  onSubmit: (data: TaskFormValues) => Promise<void>
  onCancel: () => void
  showEndDate?: boolean
  isLoading?: boolean
  submitLabel?: string
  enableDraft?: boolean
}

const DatePicker = ({
  value,
  onChange,
}: {
  value: Date | null | undefined
  onChange: (date: Date | undefined) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className={cn(
          inputClass,
          'flex w-full items-center px-3 text-left',
          !value && 'text-gray-300 dark:text-gray-400',
        )}
      >
        <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0 text-gray-400" />
        {value ? format(value, 'yyyy-MM-dd') : '날짜 선택'}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(date) => {
            onChange(date)
            setIsOpen(false)
          }}
          locale={ko}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

const SectionHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="h-3.5 w-0.5 rounded-full bg-gray-800 dark:bg-gray-200" />
      <span className="font-semibold text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">
        {children}
      </span>
    </div>
  )
}

export const TaskForm = ({
  defaultValues,
  marketingTypes,
  members,
  onSubmit,
  onCancel,
  showEndDate = false,
  isLoading = false,
  submitLabel = '저장',
  enableDraft = false,
}: TaskFormProps) => {
  const [addClientOpen, setAddClientOpen] = useState(false)

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema) as never,
    defaultValues: {
      company_name: '',
      client_id: '',
      member_id: null,
      received_amount: 0,
      execution_cost: 0,
      status: 'not_started',
      vat_included: false,
      note: '',
      marketings: [{ marketing_type_id: '', count: 1 }],
      ...defaultValues,
    },
  })

  const { hasDraft, restoreDraft, dismissDraft } = useFormDraft(form, enableDraft)

  useEffect(() => {
    if (!hasDraft) return
    toast('이전에 작성 중인 내용이 있습니다', {
      duration: Number.POSITIVE_INFINITY,
      action: { label: '이어쓰기', onClick: restoreDraft },
      cancel: { label: '무시', onClick: dismissDraft },
    })
  }, [hasDraft, restoreDraft, dismissDraft])

  const handleSubmit = async (data: TaskFormValues) => {
    await onSubmit(data)
    if (enableDraft) clearDraft()
  }

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'marketings',
  })

  const receivedAmount = Number(form.watch('received_amount')) || 0
  const executionCost = Number(form.watch('execution_cost')) || 0
  const vatIncluded = form.watch('vat_included')
  const profit = receivedAmount - executionCost
  const vatAmount = vatIncluded ? Math.round(receivedAmount / 11) : 0

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit as never)} className="space-y-7">
        {/* 기본 정보 */}
        <section>
          <SectionHeader>기본 정보</SectionHeader>
          <FormField
            control={form.control as never}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <div className="mb-1.5 flex items-center justify-between">
                  <FieldLabel required>업체명</FieldLabel>
                  <button
                    type="button"
                    onClick={() => setAddClientOpen(true)}
                    className="flex items-center gap-1 text-gray-400 text-xs transition-colors hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <Plus className="h-3 w-3" />새 거래처
                  </button>
                </div>
                <ClientCombobox
                  value={field.value as string | null}
                  onChange={field.onChange}
                  onSelectClient={(client) => form.setValue('company_name', client?.name ?? '')}
                />
                <FormMessage className="mt-1 text-xs" />
              </FormItem>
            )}
          />

          <div className="mt-4 grid grid-cols-2 gap-4">
            <FormField
              control={form.control as never}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel required>진행 상태</FieldLabel>
                  <Select value={field.value as string} onValueChange={field.onChange}>
                    <SelectTrigger className={cn(inputClass, 'w-full')}>
                      <SelectValue placeholder="상태 선택">
                        {TASK_STATUS_LABELS[field.value as keyof typeof TASK_STATUS_LABELS]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="mt-1 text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as never}
              name="member_id"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel>담당자</FieldLabel>
                  <Select
                    value={(field.value as string | null) || null}
                    onValueChange={(v) => field.onChange(v || null)}
                    items={Object.fromEntries(members.map((m) => [m.id, m.name]))}
                  >
                    <SelectTrigger className={cn(inputClass, 'w-full')}>
                      <SelectValue placeholder="담당자 선택" />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="mt-1 text-xs" />
                </FormItem>
              )}
            />
          </div>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        {/* 날짜 */}
        <section>
          <SectionHeader>날짜</SectionHeader>
          <div className={cn('grid gap-4', showEndDate ? 'grid-cols-2' : 'max-w-[200px] grid-cols-1')}>
            <FormField
              control={form.control as never}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel required>시작일</FieldLabel>
                  <DatePicker value={field.value as Date} onChange={field.onChange} />
                  <FormMessage className="mt-1 text-xs" />
                </FormItem>
              )}
            />
            {showEndDate && (
              <FormField
                control={form.control as never}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>종료일</FieldLabel>
                    <DatePicker value={(field.value as Date | null) ?? undefined} onChange={field.onChange} />
                    <FormMessage className="mt-1 text-xs" />
                  </FormItem>
                )}
              />
            )}
          </div>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        {/* 금액 */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <SectionHeader>금액</SectionHeader>
            <FormField
              control={form.control as never}
              name="vat_included"
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => field.onChange(!(field.value as boolean))}
                  className={cn(
                    '-mt-4 flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-medium text-xs transition-all',
                    field.value
                      ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300 dark:border-gray-700 dark:text-gray-500 dark:hover:border-gray-600',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-3.5 w-3.5 items-center justify-center rounded-sm border',
                      field.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600',
                    )}
                  >
                    {field.value && <Check className="h-2.5 w-2.5 text-white" />}
                  </span>
                  VAT 포함
                </button>
              )}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control as never}
              name="received_amount"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel>받은 금액{vatIncluded ? ' (VAT 포함)' : ''}</FieldLabel>
                  <NumericFormat
                    customInput={Input}
                    thousandSeparator=","
                    suffix="원"
                    className={cn(inputClass, 'text-right tabular-nums')}
                    value={field.value as number}
                    onValueChange={({ floatValue }) => field.onChange(floatValue ?? 0)}
                  />
                  {vatIncluded && vatAmount > 0 && (
                    <p className="mt-1 text-blue-500 text-xs tabular-nums dark:text-blue-400">
                      VAT {new Intl.NumberFormat('ko-KR').format(vatAmount)}원
                    </p>
                  )}
                  <FormMessage className="mt-1 text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as never}
              name="execution_cost"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel>실행비</FieldLabel>
                  <NumericFormat
                    customInput={Input}
                    thousandSeparator=","
                    suffix="원"
                    className={cn(inputClass, 'text-right tabular-nums')}
                    value={field.value as number}
                    onValueChange={({ floatValue }) => field.onChange(floatValue ?? 0)}
                  />
                  <FormMessage className="mt-1 text-xs" />
                </FormItem>
              )}
            />
            <div className="grid gap-2">
              <FieldLabel>수익 (자동계산)</FieldLabel>
              <div
                className={cn(
                  'flex h-9 items-center justify-between rounded-md border px-3 font-semibold text-sm tabular-nums',
                  profit >= 0
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
                    : 'border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
                )}
              >
                <span className="text-xs">{new Intl.NumberFormat('ko-KR').format(profit)}원</span>
                {profit >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        {/* 마케팅 */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <SectionHeader>마케팅 항목</SectionHeader>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => append({ marketing_type_id: '', count: 1 })}
              className="-mt-4 h-7 gap-1 px-2 text-gray-600 text-xs hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <Plus className="h-3 w-3" />
              추가
            </Button>
          </div>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <FormField
                  control={form.control as never}
                  name={`marketings.${index}.marketing_type_id` as never}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <Select value={f.value as string} onValueChange={f.onChange}>
                        <SelectTrigger className={cn(inputClass, 'h-9! w-full')}>
                          <SelectValue placeholder="마케팅 유형 선택">
                            {marketingTypes.find((t) => t.id === (f.value as string))?.name ?? ''}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          {marketingTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="mt-1 text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as never}
                  name={`marketings.${index}.count` as never}
                  render={({ field: f }) => (
                    <FormItem className="w-28">
                      <NumericFormat
                        customInput={Input}
                        className={cn(inputClass, 'text-center')}
                        allowNegative={false}
                        decimalScale={0}
                        suffix="건"
                        placeholder="0건"
                        value={f.value as number}
                        onValueChange={({ floatValue }) => f.onChange(floatValue ?? 1)}
                      />
                      <FormMessage className="mt-1 text-xs" />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  className="h-9 w-9 text-red-400 hover:text-red-600 disabled:opacity-30 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        {/* 비고 */}
        <section>
          <SectionHeader>비고</SectionHeader>
          <FormField
            control={form.control as never}
            name="note"
            render={({ field }) => (
              <FormItem>
                <Textarea
                  placeholder="메모를 입력하세요"
                  className="resize-none rounded-md border-gray-200 bg-white text-gray-900 text-sm transition placeholder:text-gray-300 focus-visible:border-gray-400 focus-visible:ring-gray-400/30 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-slate-500"
                  rows={3}
                  {...field}
                />
                <FormMessage className="mt-1 text-xs" />
              </FormItem>
            )}
          />
        </section>

        <ClientFormDialog
          open={addClientOpen}
          onOpenChange={setAddClientOpen}
          onSuccess={(client) => {
            form.setValue('client_id', client.id)
            form.setValue('company_name', client.name)
          }}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2 border-gray-100 border-t pt-1 dark:border-gray-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="h-8 px-4 text-gray-500 text-xs hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            취소
          </Button>
          <Button type="submit" disabled={isLoading} className="h-8 px-5 text-xs">
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                저장 중...
              </span>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
