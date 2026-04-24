import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
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
    className:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  update: {
    label: '수정',
    className:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  delete: {
    label: '삭제',
    className: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
}

const FieldDiff = ({
  changedFields,
}: { changedFields: AuditLog['changed_fields'] }) => {
  if (!changedFields || Object.keys(changedFields).length === 0) return null
  const entries = Object.entries(changedFields)
  return (
    <div className="mt-1.5 space-y-1">
      {entries.map(([field, { old: oldVal, new: newVal }]) => (
        <div
          key={field}
          className="text-xs text-gray-500 dark:text-gray-400 flex gap-1 flex-wrap"
        >
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {field}
          </span>
          <span className="line-through opacity-60">
            {String(oldVal ?? '-')}
          </span>
          <span className="text-gray-400">→</span>
          <span>{String(newVal ?? '-')}</span>
        </div>
      ))}
    </div>
  )
}

export const AuditLogDrawer = ({
  open,
  onOpenChange,
  tableName,
  recordId,
  title,
}: Props) => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', tableName, recordId],
    queryFn: () => fetchAuditLogsByRecord(tableName, recordId),
    enabled: open,
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-sm font-semibold">
            {title ?? '변경 이력'}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-10">
              변경 이력이 없습니다
            </p>
          ) : (
            <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-2 space-y-5">
              {logs.map((log) => {
                const badge = ACTION_LABELS[log.action] ?? {
                  label: log.action,
                  className: 'bg-gray-100 text-gray-600',
                }
                return (
                  <li key={log.id} className="ml-4">
                    <div className="absolute w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full -left-1.5 border border-white dark:border-gray-900" />
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {log.actor_name ?? '알 수 없음'}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {format(new Date(log.created_at), 'MM.dd HH:mm', {
                          locale: ko,
                        })}
                      </span>
                    </div>
                    {log.action === 'update' && (
                      <FieldDiff changedFields={log.changed_fields} />
                    )}
                    {log.note && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                        "{log.note}"
                      </p>
                    )}
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
