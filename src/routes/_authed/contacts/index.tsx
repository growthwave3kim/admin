import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  sortDir: z.enum(['asc', 'desc']).optional(),
})

export const Route = createFileRoute('/_authed/contacts/')({
  validateSearch: searchSchema,
})
