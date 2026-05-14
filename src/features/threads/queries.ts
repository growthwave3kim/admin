import { supabase } from '@/lib/supabase'
import type { ThreadsPost, ThreadsPostSegment, ThreadsPostWithSegments } from './types'

const PAGE_SIZE = 20

export const fetchThreadsPostsPage = async ({ pageParam = 0 }: { pageParam?: number }) => {
  const from = pageParam * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const { data, error, count } = await supabase
    .from('threads_posts')
    .select('*, threads_post_segments(content, order_index)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) throw error
  type Raw = ThreadsPost & { threads_post_segments: { content: string; order_index: number }[] }
  return {
    data: (data as Raw[]).map((post) => ({
      ...post,
      preview: post.threads_post_segments.find((s) => s.order_index === 0)?.content ?? '',
    })),
    total: count ?? 0,
    nextPage: from + PAGE_SIZE < (count ?? 0) ? pageParam + 1 : undefined,
  }
}

export const fetchThreadsPost = async (id: string) => {
  const { data, error } = await supabase
    .from('threads_posts')
    .select('*, threads_post_segments(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  const post = data as ThreadsPostWithSegments
  post.threads_post_segments = post.threads_post_segments.sort((a, b) => a.order_index - b.order_index)
  return post
}

export const updateThreadsPostSegment = async (id: string, content: string) => {
  const { error } = await supabase.from('threads_post_segments').update({ content }).eq('id', id)
  if (error) throw error
}

export const updateThreadsPost = async (
  id: string,
  updates: Partial<Pick<ThreadsPost, 'topic' | 'status' | 'published_at' | 'thread_post_id' | 'thread_post_url'>>,
) => {
  const { data, error } = await supabase.from('threads_posts').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as ThreadsPost
}

export const saveThreadsPostSegments = async (segments: Pick<ThreadsPostSegment, 'id' | 'content'>[]) => {
  await Promise.all(
    segments.map(({ id, content }) => supabase.from('threads_post_segments').update({ content }).eq('id', id)),
  )
}

export const publishToThreads = async (postId: string) => {
  const { data, error } = await supabase.functions.invoke('publish-threads', {
    body: { post_id: postId },
  })
  if (error) throw error
  return data as { success: boolean; thread_post_url: string }
}
