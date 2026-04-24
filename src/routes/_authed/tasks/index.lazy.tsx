import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCurrentMember } from '@/features/auth/useCurrentMember'
import { useMembers } from '@/features/members/useMembers'
import {
  StatusChangeDialog,
  requiresNote,
} from '@/features/tasks/StatusChangeDialog'
import { TaskStatusBadge } from '@/features/tasks/TaskStatusBadge'
import { KanbanColumn } from '@/features/tasks/components/KanbanColumn'
import { SkeletonRow } from '@/features/tasks/components/SkeletonRow'
import { SortIcon } from '@/features/tasks/components/SortIcon'
import { useTaskSearchState } from '@/features/tasks/hooks/useTaskSearchState'
import {
  fetchTasks,
  softDeleteTask,
  updateTaskStatus,
} from '@/features/tasks/queries'
import {
  PAGE_SIZE,
  STATUS_ORDER,
  type SortBy,
  type Task,
  type TaskStatus,
} from '@/features/tasks/types'
import { formatMarketingSummary } from '@/features/tasks/utils'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createLazyFileRoute, useRouter } from '@tanstack/react-router'
import { Columns, List, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

export const Route = createLazyFileRoute('/_authed/tasks/')({
  component: TasksPage,
})

const VIEW_MODE_KEY = 'tasks_view_mode'

function TasksPage() {
  const { search: searchState, update } = useTaskSearchState()
  const {
    mode: modeParam,
    page: pageParam,
    sortBy: sortByParam,
    sortDir: sortDirParam,
    search: searchParam,
    filterStatus: filterStatusParam,
    memberId: memberIdParam,
  } = searchState
  const mode = modeParam ?? 'list'
  const page = pageParam ?? 1
  const sortBy = sortByParam ?? 'start_date'
  const sortDir = sortDirParam ?? 'desc'
  const search = searchParam ?? ''
  const filterStatus = filterStatusParam ?? 'all'
  const memberId = memberIdParam ?? 'all'

  const router = useRouter()
  const { member: currentMember } = useCurrentMember()
  const { data: members = [] } = useMembers()

  const qc = useQueryClient()

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const deleteMutation = useMutation({
    mutationFn: softDeleteTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('업무가 삭제되었습니다')
      setDeleteId(null)
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const [pendingStatusChange, setPendingStatusChange] = useState<{
    id: string
    status: TaskStatus
  } | null>(null)

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: { id: string; status: TaskStatus; note?: string }) =>
      updateTaskStatus(id, status, note),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const prev = qc.getQueryData<Task[]>(['tasks'])
      qc.setQueryData<Task[]>(['tasks'], (old) =>
        old ? old.map((t) => (t.id === id ? { ...t, status } : t)) : old,
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks'], ctx.prev)
      toast.error('상태 변경에 실패했습니다')
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['task', vars.id] })
    },
  })

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(search ?? '')
  const [boardColumnOrder, setBoardColumnOrder] = useState<
    Record<TaskStatus, string[]>
  >({
    proposal: [],
    not_started: [],
    in_progress: [],
    done_settled: [],
    done_unsettled: [],
    lost: [],
  })

  const handleSearch = () => {
    update({ page: 1, search: searchInput || undefined })
  }

  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) => {
        const matchSearch = search
          ? t.company_name.toLowerCase().includes(search.toLowerCase())
          : true
        const matchStatus =
          filterStatus && filterStatus !== 'all'
            ? t.status === filterStatus
            : true
        const matchMember =
          memberId && memberId !== 'all' ? t.members?.id === memberId : true
        return matchSearch && matchStatus && matchMember
      }),
    [tasks, search, filterStatus, memberId],
  )

  const sortedTasks = useMemo(() => {
    const arr = [...filteredTasks]
    arr.sort((a, b) => {
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
    return arr
  }, [filteredTasks, sortBy, sortDir])

  const totalPages = Math.ceil(sortedTasks.length / PAGE_SIZE)
  const paginatedTasks = sortedTasks.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  const tasksByStatus = useMemo(
    () =>
      STATUS_ORDER.reduce(
        (acc, s) => {
          const statusTasks = tasks.filter((t) => t.status === s)
          const orderIds = boardColumnOrder[s]
          if (orderIds.length > 0) {
            const ordered = orderIds.flatMap((id) =>
              statusTasks.filter((t) => t.id === id),
            )
            const unordered = statusTasks.filter(
              (t) => !orderIds.includes(t.id),
            )
            acc[s] = [...ordered, ...unordered]
          } else {
            acc[s] = statusTasks
          }
          return acc
        },
        {} as Record<TaskStatus, Task[]>,
      ),
    [tasks, boardColumnOrder],
  )

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, source, destination } = result

    if (source.droppableId === destination.droppableId) {
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
    if (requiresNote(targetStatus)) {
      setPendingStatusChange({ id: draggableId, status: targetStatus })
    } else {
      statusMutation.mutate({ id: draggableId, status: targetStatus })
    }
  }

  const getDeadlineRowClass = (task: Task): string => {
    if (!task.end_date) return ''
    if (['done_settled', 'done_unsettled', 'lost'].includes(task.status))
      return ''
    const diffDays = Math.ceil(
      (new Date(task.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    )
    if (diffDays < 0) return ''
    if (diffDays <= 3)
      return 'bg-red-100 dark:bg-red-900/40 hover:bg-red-200/80 dark:hover:bg-red-900/60'
    if (diffDays <= 7)
      return 'bg-orange-100 dark:bg-orange-900/40 hover:bg-orange-200/80 dark:hover:bg-orange-900/60'
    return ''
  }

  const handleSort = (col: SortBy) => {
    if (sortBy !== col) {
      update({ page: 1, sortBy: col, sortDir: 'desc' })
    } else if (sortDir === 'desc') {
      update({ page: 1, sortBy: col, sortDir: 'asc' })
    } else {
      update({ page: 1, sortBy: undefined, sortDir: undefined })
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="shrink-0 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                  update({ mode: 'list', page: 1 })
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
                  update({ mode: 'board', page: 1 })
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
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="relative w-full sm:w-64">
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
          <Select
            value={filterStatus}
            onValueChange={(val) =>
              val &&
              update({
                page: 1,
                filterStatus:
                  val === 'all' ? undefined : (val as typeof filterStatusParam),
              })
            }
          >
            <SelectTrigger className="h-8 w-32 text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
              <SelectValue>
                {(
                  {
                    all: '전체',
                    proposal: '제안',
                    not_started: '시작 전',
                    in_progress: '진행 중',
                    done_settled: '정산완료',
                    done_unsettled: '정산미완료',
                    lost: '실패',
                  } as Record<string, string>
                )[filterStatus] ?? '전체'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" sideOffset={4}>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="proposal">제안</SelectItem>
              <SelectItem value="not_started">시작 전</SelectItem>
              <SelectItem value="in_progress">진행 중</SelectItem>
              <SelectItem value="done_settled">정산완료</SelectItem>
              <SelectItem value="done_unsettled">정산미완료</SelectItem>
              <SelectItem value="lost">실패</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={memberId}
            onValueChange={(val) =>
              update({
                page: 1,
                memberId: val === 'all' ? undefined : (val ?? undefined),
              })
            }
          >
            <SelectTrigger className="h-8 w-28 text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
              <SelectValue>
                {memberId === 'all'
                  ? '담당자 전체'
                  : (members.find((m) => m.id === memberId)?.name ??
                    '담당자 전체')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" sideOffset={4}>
              <SelectItem value="all">담당자 전체</SelectItem>
              {currentMember && (
                <SelectItem value={currentMember.id}>내 업무만</SelectItem>
              )}
              {members
                .filter((m) => m.id !== currentMember?.id)
                .map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List Mode */}
      {mode === 'list' && (
        <div className="flex-1 min-h-0 flex flex-col border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="flex-1 overflow-auto">
            <table className="w-full table-fixed text-sm min-w-[1220px]">
              <colgroup>
                <col className="w-44" />
                <col className="w-40" />
                <col className="w-32" />
                <col className="w-28" />
                <col className="w-24" />
                <col className="w-24" />
                <col className="w-36" />
                <col className="w-20" />
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
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                    담당자
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
                      colSpan={12}
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
                      className={cn(
                        'cursor-pointer transition-colors',
                        getDeadlineRowClass(task) ||
                          'hover:bg-gray-50/80 dark:hover:bg-gray-800/40',
                      )}
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
                      <td className="px-4 py-3 text-center text-xs text-gray-600 dark:text-gray-300 truncate">
                        {task.members?.name ?? '-'}
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

          {/* Pagination */}
          <div className="shrink-0 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => update({ page: p })}
            />
          </div>
        </div>
      )}

      {/* Board Mode */}
      {mode === 'board' && (
        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-h-[500px]">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 h-full min-h-[500px]">
                {STATUS_ORDER.map((status) => (
                  <KanbanColumn
                    key={status}
                    status={status}
                    tasks={tasksByStatus[status]}
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

      <StatusChangeDialog
        open={!!pendingStatusChange}
        newStatus={pendingStatusChange?.status ?? null}
        onConfirm={(note) => {
          if (pendingStatusChange) {
            statusMutation.mutate({ ...pendingStatusChange, note })
          }
          setPendingStatusChange(null)
        }}
        onCancel={() => setPendingStatusChange(null)}
      />
    </div>
  )
}
