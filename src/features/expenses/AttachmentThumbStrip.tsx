import { AttachmentThumb } from '@/features/expenses/AttachmentUploader'
import type { ExpenseAttachment } from '@/features/expenses/attachments'
import { FileText } from 'lucide-react'

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

export const AttachmentThumbStrip = ({
  attachments,
  onOpen,
  size = 48,
}: Props) => {
  if (attachments.length === 0) return null

  const visible = attachments.slice(0, 3)
  const extra = attachments.length - visible.length

  return (
    <div className="flex items-center gap-1 mt-1">
      {visible.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
          className="shrink-0 rounded overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
          style={{ width: size, height: size }}
          title={a.file_name}
        >
          {a.mime_type.startsWith('image/') ? (
            <AttachmentThumb attachment={a as ExpenseAttachment} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-gray-400" />
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
          className="shrink-0 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-500 font-medium"
          style={{ width: size, height: size }}
        >
          +{extra}
        </button>
      )}
    </div>
  )
}
