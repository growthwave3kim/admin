import { FileText } from 'lucide-react'
import { AttachmentThumb } from '@/features/expenses/AttachmentUploader'
import type { ExpenseAttachment } from '@/features/expenses/attachments'

type Attachment = {
  id: string
  storage_path: string
  mime_type: string
  file_name: string
}

type Props = {
  attachments: Attachment[]
  onOpen: () => void
  size?: number
}

export const AttachmentThumbStrip = ({ attachments, onOpen, size = 48 }: Props) => {
  if (attachments.length === 0) return null

  const visible = attachments.slice(0, 3)
  const extra = attachments.length - visible.length

  return (
    <div className="mt-1 flex items-center gap-1">
      {visible.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
          className="shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
          style={{ width: size, height: size }}
          title={a.file_name}
        >
          {a.mime_type.startsWith('image/') ? (
            <AttachmentThumb attachment={a as ExpenseAttachment} />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FileText className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </button>
      ))}
      {extra > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
          className="flex shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-50 font-medium text-gray-500 text-xs dark:border-gray-700 dark:bg-gray-800"
          style={{ width: size, height: size }}
        >
          +{extra}
        </button>
      )}
    </div>
  )
}
