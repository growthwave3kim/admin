export type ThreadsPostStatus = 'draft' | 'published'

export type ThreadsPersona = 'growth_hacker' | 'strategist' | 'field_expert' | 'agency_brand'

export const THREADS_PERSONA_LABELS: Record<ThreadsPersona, string> = {
  growth_hacker: '그로스해커형',
  strategist: '심리전략가형',
  field_expert: '필드전문가형',
  agency_brand: '그로스웨이브',
}

export const THREADS_PERSONAS = Object.keys(THREADS_PERSONA_LABELS) as ThreadsPersona[]

export type ThreadsPostSegment = {
  id: string
  post_id: string
  order_index: number
  content: string
  reply_thread_id: string | null
}

export type ThreadsPost = {
  id: string
  created_at: string
  generated_at: string
  published_at: string | null
  status: ThreadsPostStatus
  persona: ThreadsPersona | null
  topic: string
  hook_pattern: number | null
  topic_tag: string | null
  thread_post_id: string | null
  thread_post_url: string | null
}

export type ThreadsPostWithSegments = ThreadsPost & {
  threads_post_segments: ThreadsPostSegment[]
}
