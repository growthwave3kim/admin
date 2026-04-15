import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TaskStatusBadge } from '@/features/tasks/TaskStatusBadge'
import {
  deleteTask,
  fetchTasks,
  updateTaskStatus,
} from '@/features/tasks/queries'
import {
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from '@/features/tasks/types'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import {
  DragDropContext,
  Draggable,
  type DropResult,
  Droppable,
} from '@hello-pangea/dnd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Link,
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Columns,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

type SortBy =
  | 'start_date'
  | 'created_at'
  | 'received_amount'
  | 'execution_cost'
  | 'profit'

const VIEW_MODE_KEY = 'tasks_view_mode'

const getStoredViewMode = (): 'list' | 'board' => {
  if (typeof window === 'undefined') return 'list'
  const saved = localStorage.getItem(VIEW_MODE_KEY)
  return saved === 'board' ? 'board' : 'list'
}

const searchSchema = z.object({
  mode: z.enum(['list', 'board']).optional(),
  page: z.coerce.number().optional().default(1),
  sortBy: z
    .enum([
      'start_date',
      'created_at',
      'received_amount',
      'execution_cost',
      'profit',
    ])
    .optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  filterStatus: z
    .enum([
      'all',
      'not_started',
      'in_progress',
      'done_settled',
      'done_unsettled',
    ])
    .optional(),
})

export const Route = createFileRoute('/_authed/tasks/')({
  validateSearch: searchSchema,
  component: TasksPage,
})

const STATUS_ORDER: TaskStatus[] = [
  'not_started',
  'in_progress',
  'done_settled',
  'done_unsettled',
]
const PAGE_SIZE = 15

const COLUMN_STYLES: Record<TaskStatus, { dot: string; header: string }> = {
  not_started: {
    dot: 'bg-slate-400',
    header: 'text-slate-600 dark:text-gray-300',
  },
  in_progress: {
    dot: 'bg-blue-500',
    header: 'text-blue-700 dark:text-blue-400',
  },
  done_settled: {
    dot: 'bg-emerald-500',
    header: 'text-emerald-700 dark:text-emerald-400',
  },
  done_unsettled: {
    dot: 'bg-amber-500',
    header: 'text-amber-700 dark:text-amber-400',
  },
}

const formatMarketingSummary = (task: Task): string => {
  if (!task.task_marketings?.length) return '-'
  return task.task_marketings
    .map((m) => `${m.marketing_types?.name ?? '?'} ${m.count}건`)
    .join(', ')
}

const SortIcon = ({
  col,
  sortBy,
  sortDir,
}: {
  col: SortBy
  sortBy?: SortBy
  sortDir?: string
}) => {
  if (sortBy !== col)
    return <ChevronsUpDown className="w-3 h-3 opacity-30 shrink-0" />
  return sortDir === 'asc' ? (
    <ChevronUp className="w-3 h-3 shrink-0" />
  ) : (
    <ChevronDown className="w-3 h-3 shrink-0" />
  )
}

const SkeletonRow = () => (
  <tr className="border-b border-gray-100 dark:border-gray-800/60">
    {['c', 'm', 'n', 'ra', 'ea', 'p', 's', 'sd', 'ed', 'cd', 'ac'].map((k) => (
      <td key={k} className="px-4 py-3">
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </td>
    ))}
  </tr>
)

const KanbanColumn = ({
  status,
  tasks,
  onCardClick,
  onEdit,
  onDelete,
}: {
  status: TaskStatus
  tasks: Task[]
  onCardClick: (taskId: string) => void
  onEdit: (taskId: string) => void
  onDelete: (taskId: string) => void
}) => {
  const style = COLUMN_STYLES[status]

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 min-h-[400px]">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', style.dot)} />
          <span className={cn('text-xs font-semibold', style.header)}>
            {TASK_STATUS_LABELS[status]}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-0.5 min-w-[22px] text-center">
          {tasks.length}
        </span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 p-3 space-y-2.5 overflow-y-auto transition-colors rounded-b-lg',
              snapshot.isDraggingOver
                ? 'bg-gray-200/50 dark:bg-gray-700/30'
                : '',
            )}
          >
            {tasks.map((task, index) => {
              const profit = task.profit || 0
              const isPositive = profit >= 0
              return (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={provided.draggableProps.style}
                      className={cn(
                        'group bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing transition-all',
                        snapshot.isDragging
                          ? 'shadow-lg border-gray-400 dark:border-gray-400 ring-2 ring-gray-200 dark:ring-gray-600'
                          : 'hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm',
                      )}
                      onClick={() =>
                        !snapshot.isDragging && onCardClick(task.id)
                      }
                    >
                      <div className="p-3.5 space-y-3">
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-semibold text-[13px] text-gray-900 dark:text-gray-50 truncate leading-tight flex-1">
                            {task.company_name}
                          </p>
                          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEdit(task.id)
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDelete(task.id)
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p
                          className={cn(
                            'text-sm font-bold tabular-nums',
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-500 dark:text-red-400',
                          )}
                        >
                          {formatCurrency(profit)}
                        </p>
                        <div className="pt-2.5 border-t border-gray-100 dark:border-gray-700/50 space-y-1.5">
                          <p className="text-[11px] text-gray-600 dark:text-gray-300 truncate">
                            {formatMarketingSummary(task)}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
                            {formatDate(task.start_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              )
            })}
            {provided.placeholder}
            {tasks.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-10">
                업무 없음
              </p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}

function TasksPage() {
  const {
    mode: modeParam,
    page: pageParam,
    sortBy: sortByParam,
    sortDir: sortDirParam,
    search: searchParam,
    filterStatus: filterStatusParam,
  } = Route.useSearch()
  const mode = modeParam ?? getStoredViewMode()
  const page = pageParam ?? 1
  const sortBy = sortByParam ?? 'start_date'
  const sortDir = sortDirParam ?? 'desc'
  const search = searchParam ?? ''
  const filterStatus = filterStatusParam ?? 'all'

  const router = useRouter()
  const navigate = useNavigate({ from: Route.fullPath })

  const buildSearch = (params: {
    mode: 'list' | 'board'
    page: number
    sortBy: string
    sortDir: string
    search: string
    filterStatus: string
  }) => ({
    mode: params.mode,
    page: params.page,
    sortBy:
      params.sortBy !== 'start_date' ? (params.sortBy as SortBy) : undefined,
    sortDir:
      params.sortDir !== 'desc'
        ? (params.sortDir as 'asc' | 'desc')
        : undefined,
    search: params.search || undefined,
    filterStatus:
      params.filterStatus !== 'all'
        ? (params.filterStatus as typeof filterStatusParam)
        : undefined,
  })
  const qc = useQueryClient()

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('업무가 삭제되었습니다')
      setDeleteId(null)
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateTaskStatus(id, status),
    onError: () => {
      setBoardStatusOverrides({})
      toast.error('상태 변경에 실패했습니다')
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ['tasks'] })
      setBoardStatusOverrides({})
    },
  })

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(search ?? '')
  const [boardStatusOverrides, setBoardStatusOverrides] = useState<
    Record<string, TaskStatus>
  >({})
  const [boardColumnOrder, setBoardColumnOrder] = useState<
    Record<TaskStatus, string[]>
  >({
    not_started: [],
    in_progress: [],
    done_settled: [],
    done_unsettled: [],
  })

  const handleSearch = () => {
    navigate({
      search: buildSearch({
        mode,
        page: 1,
        sortBy,
        sortDir,
        search: searchInput,
        filterStatus,
      }),
    })
  }
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, source, destination } = result

    if (source.droppableId === destination.droppableId) {
      // Same-column reorder — persist local order
      const colStatus = source.droppableId as TaskStatus
      setBoardColumnOrder((prev) => {
        const currentIds =
          prev[colStatus].length > 0
            ? prev[colStatus]
            : tasksByStatus[colStatus].map((t) => t.id)
        const next = [...currentIds]
        const [moved] = next.splice(source.index, 1)
        next.splice(destination.index, 0, moved)
        return { ...prev, [colStatus]: next }
      })
      return
    }

    const targetStatus = destination.droppableId as TaskStatus

    setBoardStatusOverrides((prev) => ({
      ...prev,
      [draggableId]: targetStatus,
    }))
    setBoardColumnOrder((prev) => {
      const srcStatus = source.droppableId as TaskStatus
      const srcIds =
        prev[srcStatus].length > 0
          ? prev[srcStatus]
          : tasksByStatus[srcStatus].map((t) => t.id)
      const dstIds =
        prev[targetStatus].length > 0
          ? prev[targetStatus]
          : tasksByStatus[targetStatus].map((t) => t.id)
      const nextSrc = srcIds.filter((id) => id !== draggableId)
      const nextDst = [...dstIds]
      nextDst.splice(destination.index, 0, draggableId)
      return { ...prev, [srcStatus]: nextSrc, [targetStatus]: nextDst }
    })
    statusMutation.mutate({ id: draggableId, status: targetStatus })
  }

  const handleSort = (col: SortBy) => {
    if (sortBy !== col) {
      navigate({
        search: buildSearch({
          mode,
          page: 1,
          sortBy: col,
          sortDir: 'desc',
          search,
          filterStatus,
        }),
      })
    } else if (sortDir === 'desc') {
      navigate({
        search: buildSearch({
          mode,
          page: 1,
          sortBy: col,
          sortDir: 'asc',
          search,
          filterStatus,
        }),
      })
    } else {
      // reset to default (start_date desc → omitted from URL)
      navigate({
        search: buildSearch({
          mode,
          page: 1,
          sortBy: 'start_date',
          sortDir: 'desc',
          search,
          filterStatus,
        }),
      })
    }
  }

  const filteredTasks = tasks.filter((t) => {
    const matchSearch = search
      ? t.company_name.toLowerCase().includes(search.toLowerCase())
      : true
    const matchStatus =
      filterStatus && filterStatus !== 'all' ? t.status === filterStatus : true
    return matchSearch && matchStatus
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (!sortBy) return 0
    let aVal: number | string
    let bVal: number | string
    if (sortBy === 'start_date') {
      aVal = a.start_date
      bVal = b.start_date
    } else if (sortBy === 'created_at') {
      aVal = a.created_at
      bVal = b.created_at
    } else if (sortBy === 'received_amount') {
      aVal = a.received_amount
      bVal = b.received_amount
    } else if (sortBy === 'execution_cost') {
      aVal = a.execution_cost
      bVal = b.execution_cost
    } else {
      aVal = a.profit || 0
      bVal = b.profit || 0
    }
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.ceil(sortedTasks.length / PAGE_SIZE)
  const paginatedTasks = sortedTasks.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  const tasksByStatus = STATUS_ORDER.reduce(
    (acc, s) => {
      const statusTasks = tasks.filter(
        (t) => (boardStatusOverrides[t.id] ?? t.status) === s,
      )
      const orderIds = boardColumnOrder[s]
      if (orderIds.length > 0) {
        const ordered = orderIds.flatMap((id) =>
          statusTasks.filter((t) => t.id === id),
        )
        const unordered = statusTasks.filter((t) => !orderIds.includes(t.id))
        acc[s] = [...ordered, ...unordered]
      } else {
        acc[s] = statusTasks
      }
      return acc
    },
    {} as Record<TaskStatus, Task[]>,
  )

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
              업무 목록
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-400">
              {filteredTasks.length !== tasks.length
                ? `${filteredTasks.length} / ${tasks.length}건`
                : `총 ${tasks.length}건`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem(VIEW_MODE_KEY, 'list')
                  navigate({
                    search: buildSearch({
                      mode: 'list',
                      page: 1,
                      sortBy,
                      sortDir,
                      search,
                      filterStatus,
                    }),
                  })
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  mode === 'list'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
                )}
              >
                <List className="w-3.5 h-3.5" />
                목록
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem(VIEW_MODE_KEY, 'board')
                  navigate({
                    search: buildSearch({
                      mode: 'board',
                      page: 1,
                      sortBy,
                      sortDir,
                      search,
                      filterStatus,
                    }),
                  })
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  mode === 'board'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
                )}
              >
                <Columns className="w-3.5 h-3.5" />
                칸반
              </button>
            </div>
            <Link to="/tasks/new">
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <Plus className="w-3.5 h-3.5" />새 업무
              </Button>
            </Link>
          </div>
        </div>

        {/* Search + filter row */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-400 pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="업체명 검색"
                className="h-8 pl-8 pr-7 text-xs rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-gray-400/40 focus-visible:border-gray-500"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('')
                    navigate({
                      search: buildSearch({
                        mode,
                        page: 1,
                        sortBy,
                        sortDir,
                        search: '',
                        filterStatus,
                      }),
                    })
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
          <Select
            value={filterStatus}
            onValueChange={(val) =>
              val &&
              navigate({
                search: buildSearch({
                  mode,
                  page: 1,
                  sortBy,
                  sortDir,
                  search,
                  filterStatus: val,
                }),
              })
            }
          >
            <SelectTrigger className="h-8 w-32 text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
              <SelectValue>
                {(
                  {
                    all: '전체',
                    not_started: '시작 전',
                    in_progress: '진행 중',
                    done_settled: '정산완료',
                    done_unsettled: '정산미완료',
                  } as Record<string, string>
                )[filterStatus] ?? '전체'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" sideOffset={4}>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="not_started">시작 전</SelectItem>
              <SelectItem value="in_progress">진행 중</SelectItem>
              <SelectItem value="done_settled">정산완료</SelectItem>
              <SelectItem value="done_unsettled">정산미완료</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List Mode */}
      {mode === 'list' && (
        <div className="flex-1 min-h-0 flex flex-col border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          {/* Scrollable table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-44" />
                <col className="w-40" />
                <col className="w-32" />
                <col className="w-28" />
                <col className="w-24" />
                <col className="w-24" />
                <col className="w-36" />
                <col className="w-24" />
                <col className="w-24" />
                <col className="w-36" />
                <col className="w-16" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                    업체명
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                    마케팅
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                    비고
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('received_amount')}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleSort('received_amount')
                    }
                  >
                    <div className="flex items-center justify-end gap-1">
                      받은금액
                      <SortIcon
                        col="received_amount"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </div>
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('execution_cost')}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleSort('execution_cost')
                    }
                  >
                    <div className="flex items-center justify-end gap-1">
                      실행비
                      <SortIcon
                        col="execution_cost"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </div>
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('profit')}
                    onKeyDown={(e) => e.key === 'Enter' && handleSort('profit')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      수익
                      <SortIcon
                        col="profit"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </div>
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                    상태
                  </th>
                  <th
                    className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('start_date')}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleSort('start_date')
                    }
                  >
                    <div className="flex items-center justify-center gap-1">
                      시작일
                      <SortIcon
                        col="start_date"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </div>
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                    종료일
                  </th>
                  <th
                    className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('created_at')}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleSort('created_at')
                    }
                  >
                    <div className="flex items-center justify-center gap-1">
                      등록일
                      <SortIcon
                        col="created_at"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {isLoading ? (
                  ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((k) => (
                    <SkeletonRow key={k} />
                  ))
                ) : paginatedTasks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="text-center py-20 text-xs text-gray-400 dark:text-gray-400"
                    >
                      등록된 업무가 없습니다
                    </td>
                  </tr>
                ) : null}
                {!isLoading &&
                  paginatedTasks.map((task) => (
                    <tr
                      key={task.id}
                      tabIndex={0}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 cursor-pointer transition-colors"
                      onClick={() =>
                        router.navigate({
                          to: '/tasks/$taskId',
                          params: { taskId: task.id },
                        })
                      }
                      onKeyDown={(e) =>
                        e.key === 'Enter' &&
                        router.navigate({
                          to: '/tasks/$taskId',
                          params: { taskId: task.id },
                        })
                      }
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                        {task.company_name}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 truncate">
                        {formatMarketingSummary(task)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 truncate">
                        {task.note || '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-600 dark:text-slate-300 tabular-nums truncate">
                        {formatCurrency(task.received_amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-600 dark:text-slate-300 tabular-nums truncate">
                        {formatCurrency(task.execution_cost)}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 text-right text-xs font-semibold tabular-nums truncate',
                          (task.profit || 0) >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-500 dark:text-red-400',
                        )}
                      >
                        {formatCurrency(task.profit || 0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <TaskStatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-300 tabular-nums truncate">
                        {formatDate(task.start_date)}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-300 tabular-nums truncate">
                        {formatDate(task.end_date)}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-400 dark:text-gray-400 tabular-nums truncate">
                        {formatDateTime(task.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center justify-center gap-0.5"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <Link
                            to="/tasks/$taskId/edit"
                            params={{ taskId: task.id }}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                            onClick={() => setDeleteId(task.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination — pinned to bottom of card */}
          <div className="shrink-0 flex items-center justify-center gap-1 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <Button
              variant="ghost"
              size="icon"
              disabled={page <= 1}
              className="h-7 w-7 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
              onClick={() =>
                navigate({
                  search: buildSearch({
                    mode,
                    page: page - 1,
                    sortBy,
                    sortDir,
                    search,
                    filterStatus,
                  }),
                })
              }
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {(() => {
              const total = Math.max(totalPages, 1)
              const pages: (number | 'ellipsis')[] = []
              if (total <= 7) {
                for (let i = 1; i <= total; i++) pages.push(i)
              } else {
                pages.push(1)
                if (page > 3) pages.push('ellipsis')
                for (
                  let p = Math.max(2, page - 1);
                  p <= Math.min(total - 1, page + 1);
                  p++
                )
                  pages.push(p)
                if (page < total - 2) pages.push('ellipsis')
                pages.push(total)
              }
              return pages.map((p, idx) =>
                p === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${
                      idx < pages.length / 2 ? 'left' : 'right'
                    }`}
                    className="w-7 text-center text-xs text-gray-400 dark:text-gray-400 select-none"
                  >
                    ···
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-7 w-7 text-xs rounded-lg',
                      p === page
                        ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200'
                        : 'text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
                    )}
                    onClick={() =>
                      navigate({
                        search: buildSearch({
                          mode,
                          page: p,
                          sortBy,
                          sortDir,
                          search,
                          filterStatus,
                        }),
                      })
                    }
                  >
                    {p}
                  </Button>
                ),
              )
            })()}
            <Button
              variant="ghost"
              size="icon"
              disabled={page >= totalPages}
              className="h-7 w-7 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
              onClick={() =>
                navigate({
                  search: buildSearch({
                    mode,
                    page: page + 1,
                    sortBy,
                    sortDir,
                    search,
                    filterStatus,
                  }),
                })
              }
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Board Mode */}
      {mode === 'board' && (
        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading ? (
            <div className="grid grid-cols-4 gap-3 min-h-[500px]">
              {STATUS_ORDER.map((status) => (
                <div
                  key={status}
                  className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/40 p-2.5 gap-2"
                >
                  <div className="h-8 mx-1 mb-1 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                  {['x', 'y', 'z'].map((k) => (
                    <div
                      key={k}
                      className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-100 dark:border-gray-700/60 p-3.5 animate-pulse space-y-2"
                    >
                      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-4 gap-3 h-full min-h-[500px]">
                {STATUS_ORDER.map((status) => (
                  <KanbanColumn
                    key={status}
                    status={status}
                    tasks={tasksByStatus[status]}
                    onCardClick={(taskId) =>
                      router.navigate({
                        to: '/tasks/$taskId',
                        params: { taskId },
                      })
                    }
                    onEdit={(taskId) =>
                      router.navigate({
                        to: '/tasks/$taskId/edit',
                        params: { taskId },
                      })
                    }
                    onDelete={(taskId) => setDeleteId(taskId)}
                  />
                ))}
              </div>
            </DragDropContext>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="업무 삭제"
        description="이 업무를 삭제하면 복구할 수 없습니다. 삭제하시겠습니까?"
        confirmLabel="삭제"
        tone="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  )
}
