import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { FieldLabel, inputClass } from '@/components/common/FieldLabel'
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { fetchExpenseCategories } from '@/features/expense-categories/queries'
import {
  createExpense,
  fetchExpenses,
  softDeleteExpense,
  updateExpense,
} from '@/features/expenses/queries'
import {
  type EntryType,
  type Expense,
  type ExpenseFormData,
  type ExpenseRow,
  PAGE_SIZE,
  SPENDERS,
  type Spender,
} from '@/features/expenses/types'
import { fetchTasks } from '@/features/tasks/queries'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLazyFileRoute, getRouteApi } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  CalendarIcon,
  Check,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import { toast } from 'sonner'
import { z } from 'zod'

export const Route = createLazyFileRoute('/_authed/expenses/')({
  component: ExpensesPage,
})

const routeApi = getRouteApi('/_authed/expenses/')

const expenseFormSchema = z.object({
  entry_type: z.enum(['income', 'expense'] as const),
  description: z.string().min(1, '내용을 입력해주세요'),
  amount: z.coerce.number().min(1, '금액을 입력해주세요'),
  expense_date: z.date(),
  spender: z.enum(['김도현', '김국민', '김태훈'] as const),
  category_id: z.string().nullable().optional(),
})

type ExpenseFormValues = z.infer<typeof expenseFormSchema>

const smallInputClass =
  'h-7 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus-visible:ring-gray-400/30 focus-visible:border-gray-400 transition'

const DatePickerField = ({
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
          !value && 'text-gray-400 dark:text-gray-400',
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

const FilterDatePicker = ({
  value,
  onChange,
  placeholder,
}: {
  value: string | undefined
  onChange: (val: string | undefined) => void
  placeholder: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const parsed = value ? parseISO(value) : undefined
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className={cn(
          'h-8 w-28 px-3 flex items-center gap-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition',
          !value && 'text-gray-400 dark:text-gray-400',
        )}
      >
        <CalendarIcon className="h-3 w-3 text-gray-400" />
        {value ? format(parseISO(value), 'yy.MM.dd') : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsed}
          onSelect={(date) => {
            onChange(date ? format(date, 'yyyy-MM-dd') : undefined)
            setIsOpen(false)
          }}
          locale={ko}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

const InlineDatePicker = ({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className={cn(
          smallInputClass,
          'w-full flex items-center gap-1.5 px-2 border',
          !value && 'text-gray-400',
        )}
      >
        <CalendarIcon className="h-3 w-3 shrink-0 text-gray-400" />
        {value ? format(parseISO(value), 'yy.MM.dd') : '날짜'}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? parseISO(value) : undefined}
          onSelect={(date) => {
            if (date) onChange(format(date, 'yyyy-MM-dd'))
            setIsOpen(false)
          }}
          locale={ko}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

function ExpenseFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema) as never,
    defaultValues: {
      entry_type: 'expense',
      description: '',
      amount: 0,
      expense_date: new Date(),
      spender: undefined,
      category_id: null,
    },
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: fetchExpenseCategories,
  })

  const entryType = form.watch('entry_type')
  const selectedCategoryId = form.watch('category_id')
  const isOtherCategory =
    categories.find((c) => c.id === selectedCategoryId)?.name === '기타'

  const qc = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data: ExpenseFormData) => createExpense(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('내역이 등록되었습니다')
      form.reset()
      onSuccess()
    },
    onError: () => toast.error('등록에 실패했습니다'),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) form.reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>내역 등록</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) =>
              createMutation.mutate(v as ExpenseFormData),
            )}
            className="space-y-4 mt-2"
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
                  <FormMessage className="text-xs mt-1" />
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
                        if (
                          v &&
                          categories.find((c) => c.id === v)?.name !== '기타'
                        ) {
                          form.setValue('description', '')
                        }
                      }}
                    >
                      <SelectTrigger className={cn(inputClass, 'w-full')}>
                        <SelectValue placeholder="카테고리 선택">
                          {selectedCategoryId
                            ? (categories.find(
                                (c) => c.id === selectedCategoryId,
                              )?.name ?? '')
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
                    <FormMessage className="text-xs mt-1" />
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
                    placeholder={
                      isOtherCategory
                        ? '어떤 항목인지 입력해주세요'
                        : '내용 입력'
                    }
                    {...field}
                  />
                  <FormMessage className="text-xs mt-1" />
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
                    onValueChange={({ floatValue }) =>
                      field.onChange(floatValue ?? 0)
                    }
                  />
                  <FormMessage className="text-xs mt-1" />
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
                    <DatePickerField
                      value={field.value as Date}
                      onChange={field.onChange}
                    />
                    <FormMessage className="text-xs mt-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as never}
                name="spender"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>담당자</FieldLabel>
                    <Select
                      value={field.value as string}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className={cn(inputClass, 'w-full')}>
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {SPENDERS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs mt-1" />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-8 px-4 text-xs text-gray-500 dark:text-gray-400"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="h-8 px-5 text-xs"
              >
                {createMutation.isPending ? (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    저장 중...
                  </span>
                ) : (
                  '등록'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

type InlineValues = {
  description: string
  amount: number
  date: string
  spender: string
  entry_type: EntryType
  category_id: string | null
}

function ExpensesPage() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  const page = search.page ?? 1
  const searchText = search.search ?? ''
  const spenderFilter = search.spender ?? 'all'
  const dateFrom = search.dateFrom
  const dateTo = search.dateTo

  const [searchInput, setSearchInput] = useState(searchText)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [inlineValues, setInlineValues] = useState<InlineValues | null>(null)

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
  })

  const isLoading = tasksLoading || expensesLoading

  const deleteMutation = useMutation({
    mutationFn: softDeleteExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('삭제되었습니다')
      setDeleteId(null)
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const inlineSaveMutation = useMutation({
    mutationFn: () => {
      if (!editingId || !inlineValues) return Promise.resolve()
      return updateExpense(editingId, {
        description: inlineValues.description,
        amount: inlineValues.amount,
        expense_date: parseISO(inlineValues.date),
        spender: inlineValues.spender as Spender,
        entry_type: inlineValues.entry_type,
        category_id: inlineValues.category_id,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('수정되었습니다')
      setEditingId(null)
      setInlineValues(null)
    },
    onError: () => toast.error('수정에 실패했습니다'),
  })

  const handleStartEdit = (expense: Expense) => {
    setEditingId(expense.id)
    setInlineValues({
      description: expense.description,
      amount: expense.amount,
      date: expense.expense_date,
      spender: expense.spender,
      entry_type: expense.entry_type,
      category_id: expense.category_id,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setInlineValues(null)
  }

  const patchInline = (patch: Partial<InlineValues>) => {
    setInlineValues((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  // Build unified rows
  const allRows: ExpenseRow[] = useMemo(() => {
    const rows: ExpenseRow[] = []

    for (const task of tasks) {
      if (task.received_amount > 0) {
        rows.push({
          id: `task-income-${task.id}`,
          type: 'income',
          source: 'task',
          description: `${task.company_name} (받은금액)`,
          amount: task.received_amount,
          date: task.start_date,
          spender: null,
          category_id: null,
          editable: false,
        })
      }
      if (task.execution_cost > 0) {
        rows.push({
          id: `task-expense-${task.id}`,
          type: 'expense',
          source: 'task',
          description: `${task.company_name} (실행비)`,
          amount: task.execution_cost,
          date: task.start_date,
          spender: null,
          category_id: null,
          editable: false,
        })
      }
    }

    for (const expense of expenses) {
      rows.push({
        id: expense.id,
        type: expense.entry_type,
        source: 'manual',
        description: expense.description,
        amount: expense.amount,
        date: expense.expense_date,
        spender: expense.spender,
        category_id: expense.category_id,
        editable: true,
      })
    }

    return rows
  }, [tasks, expenses])

  // Filters
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      const matchSearch = searchText
        ? row.description.toLowerCase().includes(searchText.toLowerCase())
        : true
      const matchSpender =
        spenderFilter && spenderFilter !== 'all'
          ? row.source === 'manual' && row.spender === spenderFilter
          : true
      const matchDateFrom = dateFrom ? row.date >= dateFrom : true
      const matchDateTo = dateTo ? row.date <= dateTo : true
      return matchSearch && matchSpender && matchDateFrom && matchDateTo
    })
  }, [allRows, searchText, spenderFilter, dateFrom, dateTo])

  const sortedRows = useMemo(
    () =>
      [...filteredRows].sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
      ),
    [filteredRows],
  )

  const summary = useMemo(() => {
    const totalIncome = filteredRows
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0)
    const totalExpense = filteredRows
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0)
    return { totalIncome, totalExpense, netProfit: totalIncome - totalExpense }
  }, [filteredRows])

  const totalPages = Math.ceil(sortedRows.length / PAGE_SIZE)
  const paginatedRows = sortedRows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  const handleSearch = () => {
    update({ page: 1, search: searchInput || undefined })
  }

  const hasActiveFilter =
    !!searchText ||
    (!!spenderFilter && spenderFilter !== 'all') ||
    !!dateFrom ||
    !!dateTo

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
              지출내역서
            </span>
            <span className="text-xs text-gray-400">
              {filteredRows.length !== allRows.length
                ? `${filteredRows.length} / ${allRows.length}건`
                : `총 ${allRows.length}건`}
            </span>
          </div>
          <Button
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            내역 등록
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />총 수입
            </p>
            <p className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
              {formatCurrency(summary.totalIncome)}
            </p>
          </div>
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3">
            <p className="text-xs text-red-500 dark:text-red-400 font-medium mb-1 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" />총 지출
            </p>
            <p className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400">
              {formatCurrency(summary.totalExpense)}
            </p>
          </div>
          <div
            className={cn(
              'rounded-xl border px-4 py-3',
              summary.netProfit >= 0
                ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                : 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20',
            )}
          >
            <p
              className={cn(
                'text-xs font-medium mb-1',
                summary.netProfit >= 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-orange-500 dark:text-orange-400',
              )}
            >
              순수익
            </p>
            <p
              className={cn(
                'text-lg font-bold tabular-nums',
                summary.netProfit >= 0
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-orange-600 dark:text-orange-400',
              )}
            >
              {formatCurrency(summary.netProfit)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="내용 검색"
                className="h-8 pl-8 pr-7 text-xs rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus-visible:ring-gray-400/40"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('')
                    update({ page: 1, search: undefined })
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={handleSearch}
            >
              검색
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <FilterDatePicker
              value={dateFrom}
              onChange={(v) => update({ page: 1, dateFrom: v })}
              placeholder="시작일"
            />
            <span className="text-xs text-gray-400">~</span>
            <FilterDatePicker
              value={dateTo}
              onChange={(v) => update({ page: 1, dateTo: v })}
              placeholder="종료일"
            />
          </div>

          <Select
            value={spenderFilter}
            onValueChange={(val) =>
              update({
                page: 1,
                spender:
                  val === 'all'
                    ? undefined
                    : (val as '김도현' | '김국민' | '김태훈'),
              })
            }
          >
            <SelectTrigger className="h-8 w-28 text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
              <SelectValue>
                {(
                  {
                    all: '담당자 전체',
                    김도현: '김도현',
                    김국민: '김국민',
                    김태훈: '김태훈',
                  } as Record<string, string>
                )[spenderFilter] ?? '담당자 전체'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" sideOffset={4}>
              <SelectItem value="all">담당자 전체</SelectItem>
              {SPENDERS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 gap-1"
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
              <X className="w-3 h-3" />
              초기화
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 flex flex-col border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-20" />
              <col />
              <col className="w-32" />
              <col className="w-24" />
              <col className="w-24" />
              <col className="w-24" />
              <col className="w-20" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                  구분
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                  내용
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                  금액
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                  날짜
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                  담당자
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
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
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-20 text-xs text-gray-400 dark:text-gray-400"
                  >
                    등록된 내역이 없습니다
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const isEditing = row.editable && row.id === editingId

                  if (isEditing && inlineValues) {
                    return (
                      <tr
                        key={row.id}
                        className="h-[45px] bg-blue-50/40 dark:bg-blue-900/10"
                      >
                        {/* 구분 */}
                        <td className="px-2 py-2">
                          <div className="flex flex-col gap-1">
                            <Select
                              value={inlineValues.entry_type}
                              onValueChange={(v) =>
                                patchInline({
                                  entry_type: v as EntryType,
                                  category_id:
                                    v === 'income'
                                      ? null
                                      : inlineValues.category_id,
                                })
                              }
                            >
                              <SelectTrigger className="h-7 w-full text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                                <SelectValue>
                                  {inlineValues.entry_type === 'income'
                                    ? '수입'
                                    : '지출'}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent alignItemWithTrigger={false}>
                                <SelectItem value="income">수입</SelectItem>
                                <SelectItem value="expense">지출</SelectItem>
                              </SelectContent>
                            </Select>
                            {inlineValues.entry_type === 'expense' && (
                              <Select
                                value={inlineValues.category_id ?? ''}
                                onValueChange={(v) =>
                                  patchInline({ category_id: v || null })
                                }
                              >
                                <SelectTrigger className="h-7 w-full text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                                  <SelectValue placeholder="카테고리">
                                    {inlineValues.category_id
                                      ? (expenseCategories.find(
                                          (c) =>
                                            c.id === inlineValues.category_id,
                                        )?.name ?? '')
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
                        {/* 내용 */}
                        <td className="px-2 py-2">
                          <Input
                            className={smallInputClass}
                            value={inlineValues.description}
                            onChange={(e) =>
                              patchInline({ description: e.target.value })
                            }
                          />
                        </td>
                        {/* 금액 */}
                        <td className="px-2 py-2">
                          <NumericFormat
                            customInput={Input}
                            thousandSeparator=","
                            suffix="원"
                            className={cn(
                              smallInputClass,
                              'text-right tabular-nums',
                            )}
                            value={inlineValues.amount}
                            onValueChange={({ floatValue }) =>
                              patchInline({ amount: floatValue ?? 0 })
                            }
                          />
                        </td>
                        {/* 날짜 */}
                        <td className="px-2 py-2">
                          <InlineDatePicker
                            value={inlineValues.date}
                            onChange={(v) => patchInline({ date: v })}
                          />
                        </td>
                        {/* 담당자 */}
                        <td className="px-2 py-2">
                          <Select
                            value={inlineValues.spender}
                            onValueChange={(v) =>
                              v && patchInline({ spender: v })
                            }
                          >
                            <SelectTrigger className="h-7 w-full text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent alignItemWithTrigger={false}>
                              {SPENDERS.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        {/* 출처 */}
                        <td className="px-2 py-2 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
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
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              onClick={handleCancelEdit}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr
                      key={row.id}
                      className="h-[45px] hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-4 py-2 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
                            row.type === 'income'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                          )}
                        >
                          {row.type === 'income'
                            ? '수입'
                            : (expenseCategories.find(
                                (c) => c.id === row.category_id,
                              )?.name ?? '지출')}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 truncate">
                        {row.description}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-2 text-right text-xs font-semibold tabular-nums truncate',
                          row.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-500 dark:text-red-400',
                        )}
                      >
                        {row.type === 'income' ? '+' : '-'}
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-300 tabular-nums">
                        {formatDate(row.date)}
                      </td>
                      <td className="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-300">
                        {row.spender ?? '-'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs whitespace-nowrap',
                            row.source === 'task'
                              ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                              : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
                          )}
                        >
                          {row.source === 'task' ? '업무연동' : '직접등록'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-0.5 h-7">
                          {row.editable && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                onClick={() => {
                                  const expense = expenses.find(
                                    (e) => e.id === row.id,
                                  )
                                  if (expense) handleStartEdit(expense)
                                }}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                onClick={() => setDeleteId(row.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        <div className="shrink-0 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => update({ page: p })}
          />
        </div>
      </div>

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => setDialogOpen(false)}
      />

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
