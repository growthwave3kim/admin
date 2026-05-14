import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export const Pagination = ({ page, totalPages, onPageChange, className }: PaginationProps) => {
  const total = Math.max(totalPages, 1)
  const pages: (number | 'ellipsis-left' | 'ellipsis-right')[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('ellipsis-left')
    for (let p = Math.max(2, page - 1); p <= Math.min(total - 1, page + 1); p++) pages.push(p)
    if (page < total - 2) pages.push('ellipsis-right')
    pages.push(total)
  }

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      <Button
        variant="ghost"
        size="icon"
        disabled={page <= 1}
        className="h-7 w-7 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((p) =>
        p === 'ellipsis-left' || p === 'ellipsis-right' ? (
          <span key={p} className="w-7 select-none text-center text-gray-400 text-xs dark:text-gray-400">
            ···
          </span>
        ) : (
          <Button
            key={p}
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 w-7 rounded-lg text-xs',
              p === page
                ? 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100',
            )}
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ),
      )}

      <Button
        variant="ghost"
        size="icon"
        disabled={page >= totalPages}
        className="h-7 w-7 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
