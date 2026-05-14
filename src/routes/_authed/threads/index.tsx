import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  page: z.coerce.number().optional().default(1),
})

export const Route = createFileRoute('/_authed/threads/')({
  validateSearch: searchSchema,
})
