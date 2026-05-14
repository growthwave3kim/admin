import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Paperclip, Trash2, Upload } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  deleteAttachment,
  downloadAsDataUrl,
  type ExpenseAttachment,
  getSignedUrl,
  listAttachments,
  uploadAttachment,
} from '@/features/expenses/attachments'

type Props = {
  expenseId: string
}

const attachmentKey = (expenseId: string) => ['expense-attachments', expenseId]

export const AttachmentUploader = ({ expenseId }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  const { data: attachments = [] } = useQuery({
    queryKey: attachmentKey(expenseId),
    queryFn: () => listAttachments(expenseId),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAttachment(expenseId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attachmentKey(expenseId) })
      qc.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('파일이 업로드되었습니다')
    },
    onError: (e: Error) => toast.error(e.message ?? '업로드에 실패했습니다'),
  })

  const deleteMutation = useMutation({
    mutationFn: (attachment: ExpenseAttachment) => deleteAttachment(attachment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attachmentKey(expenseId) })
      qc.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('삭제되었습니다')
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      uploadMutation.mutate(file)
    }
  }

  const handleOpen = async (attachment: ExpenseAttachment) => {
    try {
      const url = await getSignedUrl(attachment.storage_path)
      window.open(url, '_blank')
    } catch {
      toast.error('파일을 열 수 없습니다')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 font-medium text-gray-500 text-xs dark:text-gray-400">
          <Paperclip className="h-3.5 w-3.5" />
          영수증/증빙 ({attachments.length}/5)
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-gray-500 text-xs"
          onClick={() => inputRef.current?.click()}
          disabled={attachments.length >= 5 || uploadMutation.isPending}
        >
          <Upload className="mr-1 h-3.5 w-3.5" />
          파일 추가
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {attachments.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
            >
              {a.mime_type.startsWith('image/') ? (
                <button type="button" className="aspect-square w-full" onClick={() => handleOpen(a)}>
                  <AttachmentThumb attachment={a} />
                </button>
              ) : (
                <button
                  type="button"
                  className="flex aspect-square w-full flex-col items-center justify-center gap-1 p-2"
                  onClick={() => handleOpen(a)}
                >
                  <FileText className="h-6 w-6 text-gray-400" />
                  <span className="w-full truncate text-center text-[10px] text-gray-500">{a.file_name}</span>
                </button>
              )}
              <button
                type="button"
                className="absolute top-1 right-1 rounded bg-white p-0.5 opacity-0 shadow transition-opacity group-hover:opacity-100 dark:bg-gray-900"
                onClick={() => deleteMutation.mutate(a)}
              >
                <Trash2 className="h-3 w-3 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadMutation.isPending && (
        <p className="flex items-center gap-1 text-gray-400 text-xs">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          업로드 중...
        </p>
      )}
    </div>
  )
}

export const AttachmentThumb = ({ attachment }: { attachment: ExpenseAttachment }) => {
  const { data: dataUrl, isError } = useQuery({
    queryKey: ['attachment-thumb', attachment.id],
    queryFn: () => downloadAsDataUrl(attachment.storage_path),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  })

  if (isError)
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 bg-gray-50 p-2 dark:bg-gray-800">
        <FileText className="h-6 w-6 text-gray-400" />
        <span className="w-full truncate text-center text-[10px] text-gray-500">{attachment.file_name}</span>
      </div>
    )

  if (!dataUrl) return <div className="aspect-square w-full animate-pulse bg-gray-100 dark:bg-gray-700" />

  return <img src={dataUrl} alt={attachment.file_name} className="h-full w-full object-cover" />
}
