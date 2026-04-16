import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  page: z.coerce.number().optional().default(1),
  search: z.string().optional(),
})

export const Route = createFileRoute('/_authed/clients/')({
  validateSearch: searchSchema,
})
