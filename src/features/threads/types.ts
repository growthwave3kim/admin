export type ThreadsPostStatus = 'draft' | 'published'

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
  topic: string
  hook_pattern: number | null
  thread_post_id: string | null
  thread_post_url: string | null
}

export type ThreadsPostWithSegments = ThreadsPost & {
  threads_post_segments: ThreadsPostSegment[]
}
