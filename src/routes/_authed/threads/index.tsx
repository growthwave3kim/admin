import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  page: z.coerce.number().optional().default(1),
  persona: z.enum(['all', 'growth_hacker', 'strategist', 'field_expert', 'agency_brand']).optional().default('all'),
})

export const Route = createFileRoute('/_authed/threads/')({
  validateSearch: searchSchema,
})
