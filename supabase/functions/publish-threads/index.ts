import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const THREADS_API = 'https://graph.threads.net/v1.0'

async function threadsRequest(path: string, params: Record<string, string>, method = 'POST') {
  const url = `${THREADS_API}/${path}`
  const body = new URLSearchParams(params)
  const res = await fetch(url, { method, body })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Threads API error: ${res.status} ${err}`)
  }
  return res.json()
}

async function threadsGet(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params)
  const url = `${THREADS_API}/${path}?${qs}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Threads API error: ${res.status}`)
  return res.json()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { post_id } = await req.json()
  if (!post_id) {
    return new Response(JSON.stringify({ error: 'post_id required' }), { status: 400 })
  }

  const { data: post, error: postError } = await supabase
    .from('threads_posts')
    .select('*, threads_post_segments(*)')
    .eq('id', post_id)
    .single()

  if (postError || !post) {
    return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 })
  }

  if (post.status === 'published') {
    return new Response(JSON.stringify({ error: 'Already published' }), { status: 409 })
  }

  // 페르소나별 계정 자격증명 분기.
  // THREADS_USER_ID_<PERSONA> / THREADS_ACCESS_TOKEN_<PERSONA> 가 있으면 그것을,
  // 없으면 기존 단일 THREADS_USER_ID / THREADS_ACCESS_TOKEN 로 폴백 (하위 호환).
  const personaKey = String(post.persona ?? '').toUpperCase()
  const USER_ID = (personaKey && Deno.env.get(`THREADS_USER_ID_${personaKey}`)) || Deno.env.get('THREADS_USER_ID')
  const TOKEN =
    (personaKey && Deno.env.get(`THREADS_ACCESS_TOKEN_${personaKey}`)) || Deno.env.get('THREADS_ACCESS_TOKEN')

  if (!USER_ID || !TOKEN) {
    return new Response(
      JSON.stringify({
        error: `Threads 자격증명 없음 (persona=${post.persona ?? 'null'}). THREADS_USER_ID_${personaKey}/THREADS_ACCESS_TOKEN_${personaKey} 또는 기본 THREADS_USER_ID/THREADS_ACCESS_TOKEN 를 설정하세요.`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  }

  const segments = (post.threads_post_segments as { id: string; order_index: number; content: string }[]).sort(
    (a, b) => a.order_index - b.order_index,
  )

  // 본문 생성 및 발행
  const mainCreated = await threadsRequest(`${USER_ID}/threads`, {
    media_type: 'TEXT',
    text: segments[0].content,
    access_token: TOKEN,
  })
  const mainPublished = await threadsRequest(`${USER_ID}/threads_publish`, {
    creation_id: mainCreated.id,
    access_token: TOKEN,
  })
  const mainPostId: string = mainPublished.id

  // 댓글 발행 (sequential chain: 각 댓글이 직전 댓글에 연결)
  let previousPublishedId = mainPostId
  for (const seg of segments.slice(1)) {
    await new Promise((r) => setTimeout(r, 1500))
    const replyCreated = await threadsRequest(`${USER_ID}/threads`, {
      media_type: 'TEXT',
      text: seg.content,
      reply_to_id: previousPublishedId,
      access_token: TOKEN,
    })
    const replyPublished = await threadsRequest(`${USER_ID}/threads_publish`, {
      creation_id: replyCreated.id,
      access_token: TOKEN,
    })
    previousPublishedId = replyPublished.id
    await supabase.from('threads_post_segments').update({ reply_thread_id: replyPublished.id }).eq('id', seg.id)
    await new Promise((r) => setTimeout(r, 500))
  }

  // 블로그 링크는 본문/체인이 아니라 마지막 별도 답글로 부착 (Threads 도달 보호)
  const BLOG_URL = Deno.env.get('BLOG_URL') || 'https://blog.naver.com/growthwave-'
  if (BLOG_URL) {
    try {
      await new Promise((r) => setTimeout(r, 1500))
      const linkCreated = await threadsRequest(`${USER_ID}/threads`, {
        media_type: 'TEXT',
        text: `이 주제 더 깊이 ↓\n${BLOG_URL}`,
        reply_to_id: previousPublishedId,
        access_token: TOKEN,
      })
      const linkPublished = await threadsRequest(`${USER_ID}/threads_publish`, {
        creation_id: linkCreated.id,
        access_token: TOKEN,
      })
      previousPublishedId = linkPublished.id
    } catch (_e) {
      // 링크 답글 실패는 발행 전체를 막지 않는다 (본문/체인은 이미 게시됨)
    }
  }

  // permalink 조회
  let threadPostUrl = `https://www.threads.net/t/${mainPostId}`
  try {
    const permalinkData = await threadsGet(mainPostId, {
      fields: 'permalink',
      access_token: TOKEN,
    })
    if (permalinkData.permalink) threadPostUrl = permalinkData.permalink
  } catch {
    // permalink 조회 실패 시 기본 URL 사용
  }

  // 게시글 상태 업데이트
  await supabase
    .from('threads_posts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      thread_post_id: mainPostId,
      thread_post_url: threadPostUrl,
    })
    .eq('id', post_id)

  return new Response(JSON.stringify({ success: true, thread_post_url: threadPostUrl }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
