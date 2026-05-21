import { supabase } from '@/lib/supabase'
import type { ThreadsPersona, ThreadsPost, ThreadsPostSegment, ThreadsPostWithSegments } from './types'

const PAGE_SIZE = 20

export const fetchThreadsPostsPage = async ({
  pageParam = 0,
  persona = 'all',
}: {
  pageParam?: number
  persona?: ThreadsPersona | 'all'
}) => {
  const from = pageParam * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  let query = supabase
    .from('threads_posts')
    .select('*, threads_post_segments(content, order_index)', { count: 'exact' })
    .order('created_at', { ascending: false })
  if (persona !== 'all') query = query.eq('persona', persona)
  const { data, error, count } = await query.range(from, to)
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

export const saveThreadsPostSegments = async (
  segments: Pick<ThreadsPostSegment, 'id' | 'content' | 'order_index'>[],
) => {
  await Promise.all(
    segments.map(({ id, content, order_index }) =>
      supabase.from('threads_post_segments').update({ content, order_index }).eq('id', id),
    ),
  )
}

export const createThreadsPostSegments = async (
  segments: Pick<ThreadsPostSegment, 'post_id' | 'order_index' | 'content'>[],
) => {
  const { error } = await supabase.from('threads_post_segments').insert(segments)
  if (error) throw error
}

export const deleteThreadsPostSegments = async (ids: string[]) => {
  if (ids.length === 0) return
  const { error } = await supabase.from('threads_post_segments').delete().in('id', ids)
  if (error) throw error
}

export const deleteThreadsPost = async (id: string) => {
  const { error: segError } = await supabase.from('threads_post_segments').delete().eq('post_id', id)
  if (segError) throw segError
  const { error } = await supabase.from('threads_posts').delete().eq('id', id)
  if (error) throw error
}

export const publishToThreads = async (postId: string) => {
  const { data, error } = await supabase.functions.invoke('publish-threads', {
    body: { post_id: postId },
  })
  if (error) throw error
  return data as { success: boolean; thread_post_url: string }
}
