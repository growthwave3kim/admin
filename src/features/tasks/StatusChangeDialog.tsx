import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TASK_STATUS_LABELS } from '@/features/tasks/types'
import type { TaskStatus } from '@/features/tasks/types'
import { useState } from 'react'

const STATUSES_REQUIRING_NOTE: TaskStatus[] = [
  'done_settled',
  'done_unsettled',
  'lost',
]

export const requiresNote = (status: TaskStatus) =>
  STATUSES_REQUIRING_NOTE.includes(status)

type Props = {
  open: boolean
  newStatus: TaskStatus | null
  onConfirm: (note: string) => void
  onCancel: () => void
}

export const StatusChangeDialog = ({
  open,
  newStatus,
  onConfirm,
  onCancel,
}: Props) => {
  const [note, setNote] = useState('')

  const handleConfirm = () => {
    onConfirm(note.trim())
    setNote('')
  }

  const handleCancel = () => {
    setNote('')
    onCancel()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            상태 변경 —{' '}
            {newStatus ? (TASK_STATUS_LABELS[newStatus] ?? newStatus) : ''}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            변경 사유를 입력해주세요 (선택)
          </p>
          <textarea
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
            rows={3}
            placeholder="예) 계약 완료, 고객 요청으로 취소 등"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2 justify-end pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="h-8 px-4 text-xs text-gray-500"
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              className="h-8 px-5 text-xs"
            >
              확인
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
