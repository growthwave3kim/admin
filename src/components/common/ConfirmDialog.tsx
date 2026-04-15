import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { AlertTriangle, HelpCircle } from 'lucide-react'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'destructive'
  isPending?: boolean
  onConfirm: () => void
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  tone = 'default',
  isPending = false,
  onConfirm,
}: ConfirmDialogProps) => {
  const Icon = tone === 'destructive' ? AlertTriangle : HelpCircle
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md p-6 gap-0">
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
              tone === 'destructive'
                ? 'bg-red-50 dark:bg-red-900/20'
                : 'bg-gray-100 dark:bg-gray-800',
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5',
                tone === 'destructive'
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-gray-700 dark:text-gray-300',
              )}
            />
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <DialogTitle className="leading-tight">{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
                {description}
              </DialogDescription>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-4 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'destructive' ? 'destructive' : 'default'}
            size="sm"
            className="h-8 px-4 text-xs"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? '처리 중...' : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
