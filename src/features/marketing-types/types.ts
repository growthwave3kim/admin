import { z } from 'zod'

export type MarketingType = {
  id: string
  name: string
  sort_order: number
  created_at: string
}

export const nameSchema = z.object({
  name: z.string().min(1, '유형명을 입력해주세요'),
})

export type NameForm = z.infer<typeof nameSchema>
