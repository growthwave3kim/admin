import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

const VIEW_MODE_KEY = 'tasks_view_mode'

const searchSchema = z.object({
  mode: z.enum(['list', 'board']).optional(),
  page: z.coerce.number().optional().default(1),
  sortBy: z.enum(['start_date', 'created_at', 'received_amount', 'execution_cost', 'profit']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  filterStatus: z
    .enum(['all', 'proposal', 'not_started', 'in_progress', 'done_settled', 'done_unsettled', 'lost'])
    .optional(),
  memberId: z.string().optional(),
})

export const Route = createFileRoute('/_authed/tasks/')({
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    if (!search.mode) {
      const stored =
        typeof window !== 'undefined' ? (localStorage.getItem(VIEW_MODE_KEY) as 'list' | 'board' | null) : null
      if (stored === 'board') {
        throw redirect({
          to: '/tasks',
          search: (prev) => ({ ...prev, mode: 'board' as const }),
        })
      }
    }
  },
})
