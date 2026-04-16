import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  page: z.coerce.number().optional().default(1),
  search: z.string().optional(),
  spender: z.enum(['all', '김도현', '김국민', '김태훈']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export const Route = createFileRoute('/_authed/expenses/')({
  validateSearch: searchSchema,
})
