import { AlertTriangle, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

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
      <DialogContent showCloseButton={false} className="gap-0 p-6 sm:max-w-md">
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              tone === 'destructive' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-800',
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5',
                tone === 'destructive' ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300',
              )}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <DialogTitle className="leading-tight">{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-[13px] text-gray-600 leading-relaxed dark:text-gray-300">
                {description}
              </DialogDescription>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
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
