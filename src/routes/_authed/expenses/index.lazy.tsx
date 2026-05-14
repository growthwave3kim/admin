import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLazyFileRoute, getRouteApi } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { Check, Paperclip, Pencil, Plus, Search, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import { toast } from 'sonner'
import { z } from 'zod'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DatePicker } from '@/components/common/DatePicker'
import { FieldLabel, inputClass } from '@/components/common/FieldLabel'
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchExpenseCategories } from '@/features/expense-categories/queries'
import { AttachmentThumbStrip } from '@/features/expenses/AttachmentThumbStrip'
import { AttachmentUploader } from '@/features/expenses/AttachmentUploader'
import { createExpense, fetchExpenses, softDeleteExpense, updateExpense } from '@/features/expenses/queries'
import { type EntryType, type Expense, type ExpenseFormData, PAGE_SIZE } from '@/features/expenses/types'
import { useExpenseFilters } from '@/features/expenses/useExpenseFilters'
import { useMembers } from '@/features/members/useMembers'
import { fetchTasks } from '@/features/tasks/queries'
import { STALE_FOREVER } from '@/lib/queryClient'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

export const Route = createLazyFileRoute('/_authed/expenses/')({
  component: ExpensesPage,
})

const routeApi = getRouteApi('/_authed/expenses/')

const expenseFormSchema = z.object({
  entry_type: z.enum(['income', 'expense'] as const),
  description: z.string().min(1, '내용을 입력해주세요'),
  amount: z.coerce.number().min(1, '금액을 입력해주세요'),
  expense_date: z.date(),
  spender_member_id: z.string().min(1, '담당자를 선택해주세요'),
  category_id: z.string().nullable().optional(),
})

type ExpenseFormValues = z.infer<typeof expenseFormSchema>

const smallInputClass =
  'h-7 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus-visible:ring-gray-400/30 focus-visible:border-gray-400 transition'

function ExpenseFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const { data: members = [] } = useMembers()
  const [createdExpenseId, setCreatedExpenseId] = useState<string | null>(null)

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema) as never,
    defaultValues: {
      entry_type: 'expense',
      description: '',
      amount: 0,
      expense_date: new Date(),
      spender_member_id: undefined,
      category_id: null,
    },
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: fetchExpenseCategories,
    staleTime: STALE_FOREVER,
  })

  const entryType = form.watch('entry_type')
  const selectedCategoryId = form.watch('category_id')
  const isOtherCategory = categories.find((c) => c.id === selectedCategoryId)?.name === '기타'

  const qc = useQueryClient()

  const handleClose = () => {
    form.reset()
    setCreatedExpenseId(null)
    onSuccess()
  }

  const createMutation = useMutation({
    mutationFn: (data: ExpenseFormData) => createExpense(data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('내역이 등록되었습니다')
      form.reset()
      setCreatedExpenseId((data as { id: string }).id)
    },
    onError: () => toast.error('등록에 실패했습니다'),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          form.reset()
          setCreatedExpenseId(null)
        }
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{createdExpenseId ? '영수증/증빙 첨부' : '내역 등록'}</DialogTitle>
        </DialogHeader>

        {createdExpenseId ? (
          <div className="mt-2 space-y-4">
            <AttachmentUploader expenseId={createdExpenseId} />
            <div className="flex justify-end gap-2 border-gray-100 border-t pt-2 dark:border-gray-800">
              <Button type="button" variant="ghost" onClick={handleClose} className="h-8 px-4 text-gray-500 text-xs">
                건너뛰기
              </Button>
              <Button type="button" onClick={handleClose} className="h-8 px-5 text-xs">
                완료
              </Button>
            </div>
          </div>
        ) : null}

        {!createdExpenseId && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => createMutation.mutate(v as ExpenseFormData))}
              className="mt-2 space-y-4"
            >
              <FormField
                control={form.control as never}
                name="entry_type"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>구분</FieldLabel>
                    <Select
                      value={field.value as string}
                      onValueChange={(v) => {
                        field.onChange(v)
                        if (v === 'income') form.setValue('category_id', null)
                      }}
                    >
                      <SelectTrigger className={cn(inputClass, 'w-full')}>
                        <SelectValue placeholder="수입/지출 선택">
                          {(field.value as string) === 'income'
                            ? '수입'
                            : (field.value as string) === 'expense'
                              ? '지출'
                              : ''}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        <SelectItem value="income">수입</SelectItem>
                        <SelectItem value="expense">지출</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="mt-1 text-xs" />
                  </FormItem>
                )}
              />
              {entryType === 'expense' && (
                <FormField
                  control={form.control as never}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>카테고리</FieldLabel>
                      <Select
                        value={(field.value as string) ?? ''}
                        onValueChange={(v) => {
                          field.onChange(v || null)
                          if (v && categories.find((c) => c.id === v)?.name !== '기타') {
                            form.setValue('description', '')
                          }
                        }}
                      >
                        <SelectTrigger className={cn(inputClass, 'w-full')}>
                          <SelectValue placeholder="카테고리 선택">
                            {selectedCategoryId
                              ? (categories.find((c) => c.id === selectedCategoryId)?.name ?? '')
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="mt-1 text-xs" />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control as never}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>내용</FieldLabel>
                    <Input
                      className={inputClass}
                      placeholder={isOtherCategory ? '어떤 항목인지 입력해주세요' : '내용 입력'}
                      {...field}
                    />
                    <FormMessage className="mt-1 text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as never}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>금액</FieldLabel>
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
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control as never}
                  name="expense_date"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>날짜</FieldLabel>
                      <DatePicker variant="form" value={field.value as Date} onChange={field.onChange} />
                      <FormMessage className="mt-1 text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as never}
                  name="spender_member_id"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel required>담당자</FieldLabel>
                      <Select value={field.value as string} onValueChange={field.onChange}>
                        <SelectTrigger className={cn(inputClass, 'w-full')}>
                          <SelectValue placeholder="선택">
                            {members.find((m) => m.id === field.value)?.name}
                          </SelectValue>
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
              <div className="flex justify-end gap-2 border-gray-100 border-t pt-2 dark:border-gray-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="h-8 px-4 text-gray-500 text-xs dark:text-gray-400"
                >
                  취소
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="h-8 px-5 text-xs">
                  {createMutation.isPending ? (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      저장 중...
                    </span>
                  ) : (
                    '등록'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

type InlineValues = {
  description: string
  amount: number
  date: string
  spender_member_id: string
  entry_type: EntryType
  category_id: string | null
}

type ExpenseCategory = { id: string; name: string }

type ExpenseCardProps = {
  row: import('@/features/expenses/types').ExpenseRow
  expenseCategories: ExpenseCategory[]
  onEdit: () => void
  onDelete: () => void
  onOpenAttachment: () => void
}

const ExpenseCard = ({ row, expenseCategories, onEdit, onDelete, onOpenAttachment }: ExpenseCardProps) => {
  const categoryName =
    row.type === 'income' ? '수입' : (expenseCategories.find((c) => c.id === row.category_id)?.name ?? '지출')

  return (
    <div
      className={cn(
        'bg-white p-3 dark:bg-gray-900',
        row.type === 'income' ? 'border-emerald-500 border-l-4' : 'border-red-500 border-l-4',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'inline-flex shrink-0 items-center whitespace-nowrap rounded-sm px-2 py-0.5 font-medium text-xs',
              row.type === 'income'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
            )}
          >
            {categoryName}
          </span>
          <span
            className={cn(
              'font-semibold text-sm tabular-nums',
              row.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
            )}
          >
            {row.type === 'income' ? '+' : '-'}
            {row.amount.toLocaleString('ko-KR')}원
          </span>
        </div>
        <span className="shrink-0 text-gray-400 text-xs tabular-nums">{formatDate(row.date)}</span>
      </div>

      <p className="mt-1 truncate text-gray-700 text-sm dark:text-gray-300">{row.description}</p>

      <AttachmentThumbStrip attachments={row.attachments} onOpen={onOpenAttachment} size={40} />

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center whitespace-nowrap rounded-sm px-2 py-0.5 text-xs',
              row.source === 'task'
                ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
            )}
          >
            {row.source === 'task' ? '업무연동' : '직접등록'}
          </span>
          {row.spender && <span className="text-gray-500 text-xs dark:text-gray-400">{row.spender}</span>}
        </div>
        {row.editable && (
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={onOpenAttachment}
              title="영수증/증빙"
            >
              <Paperclip className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function ExpensesPage() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const { data: members = [] } = useMembers()

  const page = search.page ?? 1
  const searchText = search.search ?? ''
  const spenderFilter = search.spender ?? 'all'
  const dateFrom = search.dateFrom
  const dateTo = search.dateTo

  const [searchInput, setSearchInput] = useState(searchText)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [inlineValues, setInlineValues] = useState<InlineValues | null>(null)
  const [isMobileEditOpen, setIsMobileEditOpen] = useState(false)
  const [attachmentExpenseId, setAttachmentExpenseId] = useState<string | null>(null)

  const update = (patch: Partial<typeof search>) => {
    navigate({ search: (prev) => ({ ...prev, ...patch }) })
  }

  const qc = useQueryClient()

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
  })

  const { data: expenseCategories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: fetchExpenseCategories,
    staleTime: STALE_FOREVER,
  })

  const isLoading = tasksLoading || expensesLoading

  const { allRows, filteredRows, sortedRows, summary } = useExpenseFilters(expenses, tasks, {
    searchText,
    spenderFilter,
    dateFrom,
    dateTo,
  })

  const deleteMutation = useMutation({
    mutationFn: softDeleteExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('삭제되었습니다')
      setDeleteId(null)
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const inlineSaveMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!editingId || !inlineValues) return
      await updateExpense(editingId, {
        description: inlineValues.description,
        amount: inlineValues.amount,
        expense_date: parseISO(inlineValues.date),
        spender_member_id: inlineValues.spender_member_id,
        entry_type: inlineValues.entry_type,
        category_id: inlineValues.category_id,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('수정되었습니다')
      setEditingId(null)
      setInlineValues(null)
      setIsMobileEditOpen(false)
    },
    onError: () => toast.error('수정에 실패했습니다'),
  })

  const handleStartEdit = (expense: Expense) => {
    setEditingId(expense.id)
    setInlineValues({
      description: expense.description,
      amount: expense.amount,
      date: expense.expense_date,
      spender_member_id: expense.spender_member_id,
      entry_type: expense.entry_type,
      category_id: expense.category_id,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setInlineValues(null)
    setIsMobileEditOpen(false)
  }

  const patchInline = (patch: Partial<InlineValues>) => {
    setInlineValues((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  const totalPages = Math.ceil(sortedRows.length / PAGE_SIZE)
  const paginatedRows = sortedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearch = () => {
    update({ page: 1, search: searchInput || undefined })
  }

  const hasActiveFilter = !!searchText || (!!spenderFilter && spenderFilter !== 'all') || !!dateFrom || !!dateTo

  const selectedSpenderName = members.find((m) => m.id === spenderFilter)?.name ?? '담당자 전체'

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-base text-gray-800 dark:text-gray-200">지출내역서</span>
            <span className="text-gray-400 text-xs">
              {filteredRows.length !== allRows.length
                ? `${filteredRows.length} / ${allRows.length}건`
                : `총 ${allRows.length}건`}
            </span>
          </div>
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            내역 등록
          </Button>
        </div>

        {/* Summary */}
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-x-visible sm:px-0">
          <div className="flex gap-2 sm:grid sm:grid-cols-3 sm:gap-3">
            <div className="w-44 shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 sm:w-auto sm:px-4 sm:py-3 dark:border-emerald-800 dark:bg-emerald-900/20">
              <p className="mb-1 flex items-center gap-1.5 font-medium text-emerald-600 text-xs dark:text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" />총 수입
              </p>
              <p className="whitespace-nowrap font-bold text-base text-emerald-700 tabular-nums sm:text-lg dark:text-emerald-300">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>
            <div className="w-44 shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 sm:w-auto sm:px-4 sm:py-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="mb-1 flex items-center gap-1.5 font-medium text-red-500 text-xs dark:text-red-400">
                <TrendingDown className="h-3.5 w-3.5" />총 지출
              </p>
              <p className="whitespace-nowrap font-bold text-base text-red-600 tabular-nums sm:text-lg dark:text-red-400">
                {formatCurrency(summary.totalExpense)}
              </p>
            </div>
            <div
              className={cn(
                'w-44 shrink-0 rounded-xl border px-3 py-2 sm:w-auto sm:px-4 sm:py-3',
                summary.netProfit >= 0
                  ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                  : 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20',
              )}
            >
              <p
                className={cn(
                  'mb-1 font-medium text-xs',
                  summary.netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-500 dark:text-orange-400',
                )}
              >
                순수익
              </p>
              <p
                className={cn(
                  'whitespace-nowrap font-bold text-base tabular-nums sm:text-lg',
                  summary.netProfit >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-600 dark:text-orange-400',
                )}
              >
                {formatCurrency(summary.netProfit)}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-x-visible sm:px-0">
          <div className="flex min-w-max items-center gap-2 sm:min-w-0 sm:flex-wrap">
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="relative w-44 sm:w-56">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="내용 검색"
                  className="h-8 rounded-lg border-gray-300 bg-white pr-7 pl-8 text-gray-900 text-xs placeholder:text-gray-400 focus-visible:ring-gray-400/40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('')
                      update({ page: 1, search: undefined })
                    }}
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-gray-200 px-3 text-gray-600 text-xs hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={handleSearch}
              >
                검색
              </Button>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <DatePicker
                variant="filter"
                value={dateFrom}
                onChange={(v) => update({ page: 1, dateFrom: v })}
                placeholder="시작일"
              />
              <span className="shrink-0 text-gray-400 text-xs">~</span>
              <DatePicker
                variant="filter"
                value={dateTo}
                onChange={(v) => update({ page: 1, dateTo: v })}
                placeholder="종료일"
              />
              <Select
                value={spenderFilter}
                onValueChange={(val) =>
                  update({
                    page: 1,
                    spender: val === 'all' ? undefined : (val ?? undefined),
                  })
                }
              >
                <SelectTrigger className="h-8 w-28 shrink-0 border-gray-300 bg-white text-gray-800 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">
                  <SelectValue>{spenderFilter === 'all' ? '담당자' : selectedSpenderName}</SelectValue>
                </SelectTrigger>
                <SelectContent side="bottom" sideOffset={4}>
                  <SelectItem value="all">담당자 전체</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 gap-1 px-2 text-gray-400 text-xs hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => {
                  setSearchInput('')
                  update({
                    page: 1,
                    search: undefined,
                    spender: undefined,
                    dateFrom: undefined,
                    dateTo: undefined,
                  })
                }}
              >
                <X className="h-3 w-3" />
                초기화
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table — desktop only */}
      <div className="hidden min-h-0 flex-1 flex-col lg:flex">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex-1 overflow-auto">
            <table className="w-full min-w-[700px] table-fixed text-sm">
              <colgroup>
                <col className="w-20" />
                <col className="w-24" />
                <col />
                <col className="w-32" />
                <col className="w-24" />
                <col className="w-24" />
                <col className="w-28" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
                <tr className="border-gray-200 border-b dark:border-gray-800">
                  <th className="px-4 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-300">
                    구분
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-300">
                    날짜
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-300">
                    내용
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-300">
                    금액
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-300">
                    담당자
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-300">
                    출처
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {isLoading ? (
                  ['a', 'b', 'c', 'd', 'e', 'f'].map((k) => (
                    <tr key={k} className="h-[45px]">
                      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <td key={i} className="px-4 py-2">
                          <div className="h-3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-gray-400 text-xs dark:text-gray-400">
                      등록된 내역이 없습니다
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => {
                    const isEditing = row.editable && row.id === editingId

                    if (isEditing && inlineValues) {
                      return (
                        <tr key={row.id} className="h-[45px] bg-blue-50/40 dark:bg-blue-900/10">
                          {/* 구분 */}
                          <td className="px-2 py-2">
                            <div className="flex flex-col gap-1">
                              <Select
                                value={inlineValues.entry_type}
                                onValueChange={(v) =>
                                  patchInline({
                                    entry_type: v as EntryType,
                                    category_id: v === 'income' ? null : inlineValues.category_id,
                                  })
                                }
                              >
                                <SelectTrigger className="h-7 w-full border-gray-300 bg-white text-xs dark:border-gray-600 dark:bg-gray-800">
                                  <SelectValue>{inlineValues.entry_type === 'income' ? '수입' : '지출'}</SelectValue>
                                </SelectTrigger>
                                <SelectContent alignItemWithTrigger={false}>
                                  <SelectItem value="income">수입</SelectItem>
                                  <SelectItem value="expense">지출</SelectItem>
                                </SelectContent>
                              </Select>
                              {inlineValues.entry_type === 'expense' && (
                                <Select
                                  value={inlineValues.category_id ?? ''}
                                  onValueChange={(v) => patchInline({ category_id: v || null })}
                                >
                                  <SelectTrigger className="h-7 w-full border-gray-300 bg-white text-xs dark:border-gray-600 dark:bg-gray-800">
                                    <SelectValue placeholder="카테고리">
                                      {inlineValues.category_id
                                        ? (expenseCategories.find((c) => c.id === inlineValues.category_id)?.name ?? '')
                                        : undefined}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent alignItemWithTrigger={false}>
                                    {expenseCategories.map((c) => (
                                      <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </td>
                          {/* 날짜 */}
                          <td className="px-2 py-2">
                            <DatePicker
                              variant="inline"
                              value={inlineValues.date}
                              onChange={(v) => patchInline({ date: v })}
                            />
                          </td>
                          {/* 내용 */}
                          <td className="px-2 py-2">
                            <Input
                              className={smallInputClass}
                              value={inlineValues.description}
                              onChange={(e) => patchInline({ description: e.target.value })}
                            />
                          </td>
                          {/* 금액 */}
                          <td className="px-2 py-2">
                            <NumericFormat
                              customInput={Input}
                              thousandSeparator=","
                              suffix="원"
                              className={cn(smallInputClass, 'text-right tabular-nums')}
                              value={inlineValues.amount}
                              onValueChange={({ floatValue }) => patchInline({ amount: floatValue ?? 0 })}
                            />
                          </td>
                          {/* 담당자 */}
                          <td className="px-2 py-2">
                            <Select
                              value={inlineValues.spender_member_id}
                              onValueChange={(v) => v && patchInline({ spender_member_id: v })}
                            >
                              <SelectTrigger className="h-7 w-full border-gray-300 bg-white text-xs dark:border-gray-600 dark:bg-gray-800">
                                <SelectValue>
                                  {members.find((m) => m.id === inlineValues.spender_member_id)?.name}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent alignItemWithTrigger={false}>
                                {members.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          {/* 출처 */}
                          <td className="px-2 py-2 text-center">
                            <span className="inline-flex items-center rounded-sm bg-blue-50 px-2 py-0.5 text-blue-600 text-xs dark:bg-blue-900/20 dark:text-blue-400">
                              직접등록
                            </span>
                          </td>
                          {/* 저장/취소 */}
                          <td className="px-2 py-2">
                            <div className="flex items-center justify-center gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-emerald-500 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                                disabled={inlineSaveMutation.isPending}
                                onClick={() => inlineSaveMutation.mutate()}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    return (
                      <tr key={row.id} className="transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                        <td className="px-4 py-2 text-center">
                          <span
                            className={cn(
                              'inline-flex items-center whitespace-nowrap rounded-sm px-2 py-0.5 font-medium text-xs',
                              row.type === 'income'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                            )}
                          >
                            {row.type === 'income'
                              ? '수입'
                              : (expenseCategories.find((c) => c.id === row.category_id)?.name ?? '지출')}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center text-gray-500 text-xs tabular-nums dark:text-gray-300">
                          {formatDate(row.date)}
                        </td>
                        <td className="px-4 py-2">
                          <span className="block truncate text-gray-900 text-sm dark:text-gray-100">
                            {row.description}
                          </span>
                          <AttachmentThumbStrip
                            attachments={row.attachments}
                            onOpen={() => setAttachmentExpenseId(row.source === 'manual' ? row.id : '')}
                            size={48}
                          />
                        </td>
                        <td
                          className={cn(
                            'truncate px-4 py-2 text-right font-semibold text-xs tabular-nums',
                            row.type === 'income'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-500 dark:text-red-400',
                          )}
                        >
                          {row.type === 'income' ? '+' : '-'}
                          {formatCurrency(row.amount)}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-500 text-xs dark:text-gray-300">
                          {row.spender ?? '-'}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span
                            className={cn(
                              'inline-flex items-center whitespace-nowrap rounded-sm px-2 py-0.5 text-xs',
                              row.source === 'task'
                                ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
                            )}
                          >
                            {row.source === 'task' ? '업무연동' : '직접등록'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex h-7 items-center justify-center gap-0.5">
                            {row.editable && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                  onClick={() => setAttachmentExpenseId(row.id)}
                                  title="영수증/증빙"
                                >
                                  <Paperclip className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                  onClick={() => {
                                    const expense = expenses.find((e) => e.id === row.id)
                                    if (expense) handleStartEdit(expense)
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                  onClick={() => setDeleteId(row.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="shrink-0 border-gray-100 border-t bg-white py-3 dark:border-gray-800 dark:bg-gray-900">
            <Pagination page={page} totalPages={totalPages} onPageChange={(p) => update({ page: p })} />
          </div>
        </div>
      </div>

      {/* Mobile / tablet card list */}
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        <div className="flex-1 divide-y divide-gray-100 overflow-auto border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
          {isLoading ? (
            ['a', 'b', 'c', 'd'].map((k) => (
              <div key={k} className="animate-pulse space-y-2 p-3">
                <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))
          ) : paginatedRows.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-xs">등록된 내역이 없습니다</div>
          ) : (
            paginatedRows.map((row) => (
              <ExpenseCard
                key={row.id}
                row={row}
                expenseCategories={expenseCategories}
                onEdit={() => {
                  const expense = expenses.find((e) => e.id === row.id)
                  if (expense) {
                    handleStartEdit(expense)
                    setIsMobileEditOpen(true)
                  }
                }}
                onDelete={() => setDeleteId(row.id)}
                onOpenAttachment={() => setAttachmentExpenseId(row.source === 'manual' ? row.id : '')}
              />
            ))
          )}
        </div>
        <div className="shrink-0 border-gray-100 border-t bg-white py-3 dark:border-gray-800 dark:bg-gray-900">
          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => update({ page: p })} />
        </div>
      </div>

      <ExpenseFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={() => setDialogOpen(false)} />

      <Dialog open={isMobileEditOpen} onOpenChange={(o) => !o && handleCancelEdit()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>내역 수정</DialogTitle>
          </DialogHeader>
          {inlineValues && (
            <div className="mt-2 space-y-3">
              <div>
                <FieldLabel required>구분</FieldLabel>
                <Select
                  value={inlineValues.entry_type}
                  onValueChange={(v) =>
                    patchInline({
                      entry_type: v as EntryType,
                      category_id: v === 'income' ? null : inlineValues.category_id,
                    })
                  }
                >
                  <SelectTrigger className={cn(inputClass, 'w-full')}>
                    <SelectValue>{inlineValues.entry_type === 'income' ? '수입' : '지출'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectItem value="income">수입</SelectItem>
                    <SelectItem value="expense">지출</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {inlineValues.entry_type === 'expense' && (
                <div>
                  <FieldLabel>카테고리</FieldLabel>
                  <Select
                    value={inlineValues.category_id ?? ''}
                    onValueChange={(v) => patchInline({ category_id: v || null })}
                  >
                    <SelectTrigger className={cn(inputClass, 'w-full')}>
                      <SelectValue placeholder="카테고리">
                        {inlineValues.category_id
                          ? (expenseCategories.find((c) => c.id === inlineValues.category_id)?.name ?? '')
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {expenseCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <FieldLabel required>날짜</FieldLabel>
                <DatePicker
                  variant="form"
                  value={inlineValues.date ? parseISO(inlineValues.date) : null}
                  onChange={(d) =>
                    patchInline({
                      date: d ? format(d, 'yyyy-MM-dd') : '',
                    })
                  }
                />
              </div>

              <div>
                <FieldLabel required>내용</FieldLabel>
                <Input
                  className={inputClass}
                  value={inlineValues.description}
                  onChange={(e) => patchInline({ description: e.target.value })}
                />
              </div>

              <div>
                <FieldLabel required>금액</FieldLabel>
                <NumericFormat
                  customInput={Input}
                  thousandSeparator=","
                  suffix="원"
                  className={cn(inputClass, 'text-right tabular-nums')}
                  value={inlineValues.amount}
                  onValueChange={({ floatValue }) => patchInline({ amount: floatValue ?? 0 })}
                />
              </div>

              <div>
                <FieldLabel required>담당자</FieldLabel>
                <Select
                  value={inlineValues.spender_member_id}
                  onValueChange={(v) => v && patchInline({ spender_member_id: v })}
                >
                  <SelectTrigger className={cn(inputClass, 'w-full')}>
                    <SelectValue>{members.find((m) => m.id === inlineValues.spender_member_id)?.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 border-gray-100 border-t pt-2 dark:border-gray-800">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 px-4 text-gray-500 text-xs"
                  onClick={handleCancelEdit}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  className="h-8 px-5 text-xs"
                  disabled={inlineSaveMutation.isPending}
                  onClick={() => inlineSaveMutation.mutate()}
                >
                  저장
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!attachmentExpenseId} onOpenChange={(o) => !o && setAttachmentExpenseId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>영수증/증빙 첨부</DialogTitle>
          </DialogHeader>
          {attachmentExpenseId && (
            <div className="mt-2">
              <AttachmentUploader expenseId={attachmentExpenseId} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="내역 삭제"
        description="이 내역을 삭제하면 복구할 수 없습니다. 삭제하시겠습니까?"
        confirmLabel="삭제"
        tone="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  )
}
