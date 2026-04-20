import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type {
  ImportPreview,
  ImportRow,
} from '@/features/clients/useContactImport'
import { X } from 'lucide-react'
import { useState } from 'react'

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
  const filteredNewRows = preview.newRows.filter(
    (r) => !excluded.has(rowKey(r)),
  )

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>엑셀 가져오기 미리보기</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {preview.irregular.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2">
                확인 필요 {preview.irregular.length}개 (비표준 번호 — 등록
                제외됩니다)
              </p>
              <div className="space-y-1">
                {preview.irregular.map((row) => (
                  <div
                    key={rowKey(row)}
                    className="flex items-center gap-3 text-xs px-3 py-2 bg-orange-50 dark:bg-orange-900/10 rounded"
                  >
                    <span className="font-medium text-gray-800 dark:text-gray-200 flex-1 truncate">
                      {row.name}
                    </span>
                    <span className="text-orange-600 dark:text-orange-400 tabular-nums shrink-0">
                      {row.contact_phone ?? '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview.newRows.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                신규 추가 {filteredNewRows.length}개
                {excluded.size > 0 && (
                  <span className="text-gray-400 font-normal ml-1">
                    ({excluded.size}개 제외됨)
                  </span>
                )}
              </p>
              <div className="space-y-1">
                {preview.newRows.map((row) => {
                  const key = rowKey(row)
                  const isExcluded = excluded.has(key)
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-3 text-xs px-3 py-2 rounded transition-colors ${
                        isExcluded
                          ? 'bg-gray-100 dark:bg-gray-800/40 opacity-50'
                          : 'bg-emerald-50 dark:bg-emerald-900/10'
                      }`}
                    >
                      <span
                        className={`font-medium flex-1 truncate ${isExcluded ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}
                      >
                        {row.name}
                      </span>
                      {row.contact_phone && (
                        <span className="text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
                          {row.contact_phone}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleExclude(key)}
                        className={`shrink-0 rounded p-0.5 transition-colors ${
                          isExcluded
                            ? 'text-emerald-500 hover:text-emerald-700'
                            : 'text-gray-400 hover:text-red-500'
                        }`}
                        title={isExcluded ? '제외 취소' : '제외'}
                      >
                        {isExcluded ? (
                          <span className="text-[10px] font-medium">복원</span>
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {preview.duplicates.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-3">
                중복 감지 {preview.duplicates.length}개
              </p>
              <div className="space-y-2">
                {preview.duplicates.map(({ existing, incoming }) => {
                  const emailChanged = existing.email !== incoming.email
                  return (
                    <div
                      key={existing.id}
                      className="text-xs px-3 py-2 bg-amber-50 dark:bg-amber-900/10 rounded space-y-1"
                    >
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {existing.name}
                      </span>
                      {emailChanged && (
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <span>이메일 기존: {existing.email ?? '-'}</span>
                          <span className="text-amber-600 dark:text-amber-400">
                            → {incoming.email ?? '-'}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {preview.newRows.length === 0 &&
            preview.duplicates.length === 0 &&
            preview.irregular.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-8">
                가져올 데이터가 없습니다
              </p>
            )}
        </div>

        <DialogFooter className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
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
            {filteredNewRows.length > 0
              ? `신규만 추가 (${filteredNewRows.length}개)`
              : '신규 없음'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
