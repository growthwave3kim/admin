import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'
import type { SortBy } from '@/features/tasks/types'

export const SortIcon = ({ col, sortBy, sortDir }: { col: SortBy; sortBy?: SortBy; sortDir?: 'asc' | 'desc' }) => {
  if (sortBy !== col) return <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-30" />
  return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />
}
