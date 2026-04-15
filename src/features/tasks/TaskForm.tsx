import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  CalendarIcon,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import { z } from 'zod'
import type { MarketingType } from '../tasks/types'
import { TASK_STATUS_LABELS } from './types'

const taskFormSchema = z.object({
  company_name: z.string().min(1, '업체명을 입력해주세요'),
  received_amount: z.coerce.number().min(0),
  execution_cost: z.coerce.number().min(0),
  status: z.enum([
    'not_started',
    'in_progress',
    'done_settled',
    'done_unsettled',
  ] as const),
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
  onSubmit: (data: TaskFormValues) => Promise<void>
  onCancel: () => void
  showEndDate?: boolean
  isLoading?: boolean
  submitLabel?: string
}

const inputClass =
  'h-9 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/60 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-gray-400/30 focus-visible:border-gray-400 transition'

const FieldLabel = ({
  children,
  required,
}: { children: React.ReactNode; required?: boolean }) => {
  return (
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
      {children}
      {required && <span className="text-gray-400 ml-0.5">*</span>}
    </p>
  )
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
          'w-full flex items-center text-left px-3',
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
    <div className="flex items-center gap-2 mb-4">
      <span className="w-0.5 h-3.5 bg-gray-800 dark:bg-gray-200 rounded-full" />
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {children}
      </span>
    </div>
  )
}

export const TaskForm = ({
  defaultValues,
  marketingTypes,
  onSubmit,
  onCancel,
  showEndDate = false,
  isLoading = false,
  submitLabel = '저장',
}: TaskFormProps) => {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema) as never,
    defaultValues: {
      company_name: '',
      received_amount: 0,
      execution_cost: 0,
      status: 'not_started',
      note: '',
      marketings: [{ marketing_type_id: '', count: 1 }],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'marketings',
  })

  const receivedAmount = Number(form.watch('received_amount')) || 0
  const executionCost = Number(form.watch('execution_cost')) || 0
  const profit = receivedAmount - executionCost

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit as never)}
        className="space-y-7"
      >
        {/* 기본 정보 */}
        <section>
          <SectionHeader>기본 정보</SectionHeader>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control as never}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel required>업체명</FieldLabel>
                  <Input
                    className={inputClass}
                    placeholder="업체명 입력"
                    {...field}
                  />
                  <FormMessage className="text-xs mt-1" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as never}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel required>진행 상태</FieldLabel>
                  <Select
                    value={field.value as string}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className={cn(inputClass, 'w-full')}>
                      <SelectValue placeholder="상태 선택">
                        {
                          TASK_STATUS_LABELS[
                            field.value as keyof typeof TASK_STATUS_LABELS
                          ]
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {Object.entries(TASK_STATUS_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs mt-1" />
                </FormItem>
              )}
            />
          </div>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        {/* 날짜 */}
        <section>
          <SectionHeader>날짜</SectionHeader>
          <div
            className={cn(
              'grid gap-4',
              showEndDate ? 'grid-cols-2' : 'grid-cols-1 max-w-[200px]',
            )}
          >
            <FormField
              control={form.control as never}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel required>시작일</FieldLabel>
                  <DatePicker
                    value={field.value as Date}
                    onChange={field.onChange}
                  />
                  <FormMessage className="text-xs mt-1" />
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
                    <DatePicker
                      value={(field.value as Date | null) ?? undefined}
                      onChange={field.onChange}
                    />
                    <FormMessage className="text-xs mt-1" />
                  </FormItem>
                )}
              />
            )}
          </div>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        {/* 금액 */}
        <section>
          <SectionHeader>금액</SectionHeader>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control as never}
              name="received_amount"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel>받은 금액</FieldLabel>
                  <NumericFormat
                    customInput={Input}
                    thousandSeparator=","
                    suffix="원"
                    className={cn(inputClass, 'text-right tabular-nums')}
                    value={field.value as number}
                    onValueChange={({ floatValue }) =>
                      field.onChange(floatValue ?? 0)
                    }
                  />
                  <FormMessage className="text-xs mt-1" />
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
                    onValueChange={({ floatValue }) =>
                      field.onChange(floatValue ?? 0)
                    }
                  />
                  <FormMessage className="text-xs mt-1" />
                </FormItem>
              )}
            />
            <div className="grid gap-2">
              <FieldLabel>수익 (자동계산)</FieldLabel>
              <div
                className={cn(
                  'h-9 px-3 flex items-center justify-between rounded-md border text-sm font-semibold tabular-nums',
                  profit >= 0
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
                )}
              >
                <span className="text-xs">
                  {new Intl.NumberFormat('ko-KR').format(profit)}원
                </span>
                {profit >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        {/* 마케팅 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <SectionHeader>마케팅 항목</SectionHeader>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => append({ marketing_type_id: '', count: 1 })}
              className="h-7 px-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 gap-1 -mt-4"
            >
              <Plus className="w-3 h-3" />
              추가
            </Button>
          </div>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <FormField
                  control={form.control as never}
                  name={`marketings.${index}.marketing_type_id` as never}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <Select
                        value={f.value as string}
                        onValueChange={f.onChange}
                      >
                        <SelectTrigger
                          className={cn(inputClass, 'w-full h-9!')}
                        >
                          <SelectValue placeholder="마케팅 유형 선택">
                            {marketingTypes.find(
                              (t) => t.id === (f.value as string),
                            )?.name ?? ''}
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
                      <FormMessage className="text-xs mt-1" />
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
                        onValueChange={({ floatValue }) =>
                          f.onChange(floatValue ?? 1)
                        }
                      />
                      <FormMessage className="text-xs mt-1" />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  className="h-9 w-9 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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
                  className="resize-none text-sm rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-slate-500 focus-visible:ring-gray-400/30 focus-visible:border-gray-400 transition"
                  rows={3}
                  {...field}
                />
                <FormMessage className="text-xs mt-1" />
              </FormItem>
            )}
          />
        </section>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-1 border-t border-gray-100 dark:border-gray-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="h-8 px-4 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="h-8 px-5 text-xs"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
