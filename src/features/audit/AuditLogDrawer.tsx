import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { fetchAuditLogsByRecord } from './queries'
import type { AuditLog, AuditTable } from './types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tableName: AuditTable
  recordId: string
  title?: string
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

const FieldDiff = ({ changedFields }: { changedFields: AuditLog['changed_fields'] }) => {
  if (!changedFields || Object.keys(changedFields).length === 0) return null
  const entries = Object.entries(changedFields)
  return (
    <div className="mt-1.5 space-y-1">
      {entries.map(([field, { old: oldVal, new: newVal }]) => (
        <div key={field} className="flex flex-wrap gap-1 text-gray-500 text-xs dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">{field}</span>
          <span className="line-through opacity-60">{String(oldVal ?? '-')}</span>
          <span className="text-gray-400">→</span>
          <span>{String(newVal ?? '-')}</span>
        </div>
      ))}
    </div>
  )
}

export const AuditLogDrawer = ({ open, onOpenChange, tableName, recordId, title }: Props) => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', tableName, recordId],
    queryFn: () => fetchAuditLogsByRecord(tableName, recordId),
    enabled: open,
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-semibold text-sm">{title ?? '변경 이력'}</SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="py-10 text-center text-gray-400 text-xs">변경 이력이 없습니다</p>
          ) : (
            <ol className="relative ml-2 space-y-5 border-gray-200 border-l dark:border-gray-700">
              {logs.map((log) => {
                const badge = ACTION_LABELS[log.action] ?? {
                  label: log.action,
                  className: 'bg-gray-100 text-gray-600',
                }
                return (
                  <li key={log.id} className="ml-4">
                    <div className="absolute -left-1.5 h-2.5 w-2.5 rounded-full border border-white bg-gray-300 dark:border-gray-900 dark:bg-gray-600" />
                    <div className="mb-0.5 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 font-medium text-[10px] ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="font-medium text-gray-700 text-xs dark:text-gray-300">
                        {log.actor_name ?? '알 수 없음'}
                      </span>
                      <span className="ml-auto text-[10px] text-gray-400">
                        {format(new Date(log.created_at), 'MM.dd HH:mm', {
                          locale: ko,
                        })}
                      </span>
                    </div>
                    {log.action === 'update' && <FieldDiff changedFields={log.changed_fields} />}
                    {log.note && <p className="mt-1 text-gray-500 text-xs italic dark:text-gray-400">"{log.note}"</p>}
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
