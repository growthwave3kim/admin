import type { SortBy } from '@/features/tasks/types'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'

export const SortIcon = ({
  col,
  sortBy,
  sortDir,
}: {
  col: SortBy
  sortBy?: SortBy
  sortDir?: 'asc' | 'desc'
}) => {
  if (sortBy !== col)
    return <ChevronsUpDown className="w-3 h-3 opacity-30 shrink-0" />
  return sortDir === 'asc' ? (
    <ChevronUp className="w-3 h-3 shrink-0" />
  ) : (
    <ChevronDown className="w-3 h-3 shrink-0" />
  )
}
