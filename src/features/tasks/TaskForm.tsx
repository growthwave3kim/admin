import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { TASK_STATUS_LABELS } from './types'
import type { MarketingType } from '../tasks/types'

const taskFormSchema = z.object({
  company_name: z.string().min(1, '업체명을 입력해주세요'),
  received_amount: z.coerce.number().min(0),
  execution_cost: z.coerce.number().min(0),
  status: z.enum(['not_started', 'in_progress', 'done_settled', 'done_unsettled'] as const),
  start_date: z.date({ required_error: '시작 날짜를 선택해주세요' }),
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

interface TaskFormProps {
  defaultValues?: Partial<TaskFormValues>
  marketingTypes: MarketingType[]
  onSubmit: (data: TaskFormValues) => Promise<void>
  onCancel: () => void
  showEndDate?: boolean
  isLoading?: boolean
  submitLabel?: string
}

export function TaskForm({
  defaultValues,
  marketingTypes,
  onSubmit,
  onCancel,
  showEndDate = false,
  isLoading = false,
  submitLabel = '저장',
}: TaskFormProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      company_name: '',
      received_amount: 0,
      execution_cost: 0,
      status: 'not_started',
      note: '',
      marketings: [],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'marketings',
  })

  const receivedAmount = form.watch('received_amount') || 0
  const executionCost = form.watch('execution_cost') || 0
  const profit = receivedAmount - executionCost

  function formatCurrency(val: number) {
    return new Intl.NumberFormat('ko-KR').format(val) + '원'
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Company name */}
        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>업체명 *</FormLabel>
              <FormControl>
                <Input placeholder="업체명을 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>진행 상태 *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dates */}
        <div className={cn('grid gap-4', showEndDate ? 'grid-cols-2' : 'grid-cols-1 max-w-xs')}>
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>시작 날짜 *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'yyyy-MM-dd') : '날짜 선택'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={ko}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {showEndDate && (
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>종료 날짜</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'yyyy-MM-dd') : '날짜 선택'}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={field.onChange}
                        locale={ko}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="received_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>받은 금액 (원)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="execution_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>실행비 (원)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div>
            <Label>수익 (자동계산)</Label>
            <div
              className={cn(
                'mt-2 h-10 px-3 flex items-center rounded-md border text-sm font-medium',
                profit >= 0
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200',
              )}
            >
              {formatCurrency(profit)}
            </div>
          </div>
        </div>

        {/* Marketings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>마케팅 항목</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ marketing_type_id: '', count: 1 })}
              className="gap-1"
            >
              <Plus className="w-3 h-3" />
              추가
            </Button>
          </div>
          {fields.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4 border border-dashed rounded-lg">
              마케팅 항목을 추가해주세요
            </p>
          )}
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <FormField
                  control={form.control}
                  name={`marketings.${index}.marketing_type_id`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <Select onValueChange={f.onChange} defaultValue={f.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="마케팅 유형 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {marketingTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`marketings.${index}.count`}
                  render={({ field: f }) => (
                    <FormItem className="w-24">
                      <FormControl>
                        <Input type="number" min={1} placeholder="건수" {...f} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비고</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="메모를 입력하세요"
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '저장 중...' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
