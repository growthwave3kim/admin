import { useQuery } from '@tanstack/react-query'
import { createLazyFileRoute, getRouteApi, Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { DatePicker } from '@/components/common/DatePicker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchAuditLogs } from '@/features/audit/queries'
import type { AuditLog } from '@/features/audit/types'
import { useMembers } from '@/features/members/useMembers'
import { cn } from '@/lib/utils'

export const Route = createLazyFileRoute('/_authed/audit/')({
  component: AuditPage,
})

const routeApi = getRouteApi('/_authed/audit/')

const TABLE_LABELS: Record<string, string> = {
  tasks: '업무',
  expenses: '지출',
  clients: '거래처/고객',
  expense_attachments: '영수증',
}

const ACTION_LABELS: Record<string, { label: string; className: string }> = {
  insert: {
    label: '등록',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  update: {
    label: '수정',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  delete: {
    label: '삭제',
    className: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
}

const RECORD_LINKS: Record<string, (id: string) => string> = {
  tasks: (id) => `/tasks/${id}`,
  clients: (id) => `/clients/${id}`,
}

const ChangeSummary = ({ log }: { log: AuditLog }) => {
  if (log.action === 'insert') return <span className="text-gray-400 text-xs">신규 등록</span>
  if (log.action === 'delete') return <span className="text-gray-400 text-xs">삭제됨</span>
  if (!log.changed_fields) return null
  const fields = Object.keys(log.changed_fields)
  if (fields.length === 0) return null
  return <span className="text-gray-500 text-xs dark:text-gray-400">{fields.join(', ')} 변경</span>
}

function AuditPage() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const { data: members = [] } = useMembers()

  const tableName = search.tableName ?? 'all'
  const actorMemberId = search.actorMemberId ?? 'all'
  const action = search.action ?? 'all'
  const dateFrom = search.dateFrom
  const dateTo = search.dateTo

  const update = (patch: Partial<typeof search>) => {
    navigate({ search: (prev) => ({ ...prev, ...patch }) })
  }

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', { tableName, actorMemberId, action, dateFrom, dateTo }],
    queryFn: () =>
      fetchAuditLogs({
        tableName: tableName === 'all' ? undefined : tableName,
        actorMemberId: actorMemberId === 'all' ? undefined : actorMemberId,
        action: action === 'all' ? undefined : action,
        dateFrom,
        dateTo,
      }),
  })

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="shrink-0 space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-base text-gray-800 dark:text-gray-200">변경 이력</span>
          <span className="text-gray-400 text-xs">{logs.length}건</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={tableName}
            onValueChange={(v) => update({ tableName: v === 'all' ? undefined : (v ?? undefined) })}
          >
            <SelectTrigger className="h-8 w-28 border-gray-300 bg-white text-xs dark:border-gray-600 dark:bg-gray-900">
              <SelectValue>{TABLE_LABELS[tableName] ?? '전체'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {Object.entries(TABLE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={actorMemberId}
            onValueChange={(v) =>
              update({
                actorMemberId: v === 'all' ? undefined : (v ?? undefined),
              })
            }
          >
            <SelectTrigger className="h-8 w-28 border-gray-300 bg-white text-xs dark:border-gray-600 dark:bg-gray-900">
              <SelectValue>
                {actorMemberId === 'all'
                  ? '전체 멤버'
                  : (members.find((m) => m.id === actorMemberId)?.name ?? '전체 멤버')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 멤버</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={action} onValueChange={(v) => update({ action: v === 'all' ? undefined : (v ?? undefined) })}>
            <SelectTrigger className="h-8 w-24 border-gray-300 bg-white text-xs dark:border-gray-600 dark:bg-gray-900">
              <SelectValue>{ACTION_LABELS[action]?.label ?? '전체'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="insert">등록</SelectItem>
              <SelectItem value="update">수정</SelectItem>
              <SelectItem value="delete">삭제</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <DatePicker
              variant="filter"
              value={dateFrom}
              onChange={(v) => update({ dateFrom: v })}
              placeholder="시작일"
            />
            <span className="text-gray-400 text-xs">~</span>
            <DatePicker variant="filter" value={dateTo} onChange={(v) => update({ dateTo: v })} placeholder="종료일" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
              <tr className="border-gray-200 border-b dark:border-gray-800">
                <th className="w-36 px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  시각
                </th>
                <th className="w-20 px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  멤버
                </th>
                <th className="w-20 px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  대상
                </th>
                <th className="w-16 px-4 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  액션
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  변경 내용
                </th>
                <th className="w-32 px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  기록 ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((k) => (
                  <tr key={k} className="h-[45px]">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <td key={i} className="px-4 py-2">
                        <div className="h-3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-400 text-xs">
                    이력이 없습니다
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = ACTION_LABELS[log.action]
                  const link = RECORD_LINKS[log.table_name]?.(log.record_id)
                  return (
                    <tr
                      key={log.id}
                      className="h-[45px] transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
                    >
                      <td className="whitespace-nowrap px-4 py-2 text-gray-500 text-xs tabular-nums dark:text-gray-400">
                        {format(new Date(log.created_at), 'MM.dd HH:mm', {
                          locale: ko,
                        })}
                      </td>
                      <td className="px-4 py-2 font-medium text-gray-700 text-xs dark:text-gray-300">
                        {log.actor_name ?? '-'}
                      </td>
                      <td className="px-4 py-2 text-gray-500 text-xs dark:text-gray-400">
                        {TABLE_LABELS[log.table_name] ?? log.table_name}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {badge && (
                          <span
                            className={cn(
                              'inline-flex items-center rounded px-1.5 py-0.5 font-medium text-[10px]',
                              badge.className,
                            )}
                          >
                            {badge.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div>
                          <ChangeSummary log={log} />
                          {log.note && <p className="mt-0.5 text-gray-400 text-xs italic">"{log.note}"</p>}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {link ? (
                          <Link to={link} className="font-mono text-blue-500 text-xs hover:underline">
                            {log.record_id.slice(0, 8)}…
                          </Link>
                        ) : (
                          <span className="font-mono text-gray-400 text-xs">{log.record_id.slice(0, 8)}…</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
