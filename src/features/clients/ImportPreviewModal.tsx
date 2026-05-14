import { X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { ImportPreview, ImportRow } from '@/features/clients/useContactImport'

export const ImportPreviewModal = ({
  preview,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  preview: ImportPreview
  onClose: () => void
  onConfirm: (overwrite: boolean, filteredNewRows: ImportRow[]) => void
  isSubmitting: boolean
}) => {
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const rowKey = (row: ImportRow) => `${row.name}-${row.contact_phone}`
  const toggleExclude = (key: string) =>
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  const filteredNewRows = preview.newRows.filter((r) => !excluded.has(rowKey(r)))

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[80vh] max-w-lg flex-col">
        <DialogHeader>
          <DialogTitle>엑셀 가져오기 미리보기</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {preview.irregular.length > 0 && (
            <div>
              <p className="mb-2 font-semibold text-orange-600 text-xs dark:text-orange-400">
                확인 필요 {preview.irregular.length}개 (비표준 번호 — 등록 제외됩니다)
              </p>
              <div className="space-y-1">
                {preview.irregular.map((row) => (
                  <div
                    key={rowKey(row)}
                    className="flex items-center gap-3 rounded bg-orange-50 px-3 py-2 text-xs dark:bg-orange-900/10"
                  >
                    <span className="flex-1 truncate font-medium text-gray-800 dark:text-gray-200">{row.name}</span>
                    <span className="shrink-0 text-orange-600 tabular-nums dark:text-orange-400">
                      {row.contact_phone ?? '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview.newRows.length > 0 && (
            <div>
              <p className="mb-2 font-semibold text-emerald-600 text-xs dark:text-emerald-400">
                신규 추가 {filteredNewRows.length}개
                {excluded.size > 0 && (
                  <span className="ml-1 font-normal text-gray-400">({excluded.size}개 제외됨)</span>
                )}
              </p>
              <div className="space-y-1">
                {preview.newRows.map((row) => {
                  const key = rowKey(row)
                  const isExcluded = excluded.has(key)
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-3 rounded px-3 py-2 text-xs transition-colors ${
                        isExcluded
                          ? 'bg-gray-100 opacity-50 dark:bg-gray-800/40'
                          : 'bg-emerald-50 dark:bg-emerald-900/10'
                      }`}
                    >
                      <span
                        className={`flex-1 truncate font-medium ${isExcluded ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}
                      >
                        {row.name}
                      </span>
                      {row.contact_phone && (
                        <span className="shrink-0 text-gray-500 tabular-nums dark:text-gray-400">
                          {row.contact_phone}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleExclude(key)}
                        className={`shrink-0 rounded p-0.5 transition-colors ${
                          isExcluded ? 'text-emerald-500 hover:text-emerald-700' : 'text-gray-400 hover:text-red-500'
                        }`}
                        title={isExcluded ? '제외 취소' : '제외'}
                      >
                        {isExcluded ? <span className="font-medium text-[10px]">복원</span> : <X className="h-3 w-3" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {preview.duplicates.length > 0 && (
            <div>
              <p className="mb-3 font-semibold text-amber-600 text-xs dark:text-amber-400">
                중복 감지 {preview.duplicates.length}개
              </p>
              <div className="space-y-2">
                {preview.duplicates.map(({ existing, incoming }) => {
                  const emailChanged = existing.email !== incoming.email
                  return (
                    <div
                      key={existing.id}
                      className="space-y-1 rounded bg-amber-50 px-3 py-2 text-xs dark:bg-amber-900/10"
                    >
                      <span className="font-medium text-gray-800 dark:text-gray-200">{existing.name}</span>
                      {emailChanged && (
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <span>이메일 기존: {existing.email ?? '-'}</span>
                          <span className="text-amber-600 dark:text-amber-400">→ {incoming.email ?? '-'}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {preview.newRows.length === 0 && preview.duplicates.length === 0 && preview.irregular.length === 0 && (
            <p className="py-8 text-center text-gray-400 text-xs">가져올 데이터가 없습니다</p>
          )}
        </div>

        <DialogFooter className="flex shrink-0 gap-2 border-gray-100 border-t pt-2 dark:border-gray-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          {preview.duplicates.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
              onClick={() => onConfirm(true, filteredNewRows)}
              disabled={isSubmitting}
            >
              전체 덮어쓰기
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => onConfirm(false, filteredNewRows)}
            disabled={isSubmitting || filteredNewRows.length === 0}
          >
            {filteredNewRows.length > 0 ? `신규만 추가 (${filteredNewRows.length}개)` : '신규 없음'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
