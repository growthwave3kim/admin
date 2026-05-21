import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLazyFileRoute, getRouteApi, Link } from '@tanstack/react-router'
import { ArrowLeft, ExternalLink, MessageCircle, Plus, Send, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  createThreadsPostSegments,
  deleteThreadsPost,
  deleteThreadsPostSegments,
  fetchThreadsPost,
  publishToThreads,
  saveThreadsPostSegments,
  updateThreadsPost,
} from '@/features/threads/queries'
import type { ThreadsPostSegment } from '@/features/threads/types'
import { cn } from '@/lib/utils'

export const Route = createLazyFileRoute('/_authed/threads/$postId/')({
  component: ThreadsPostDetailPage,
})

const routeApi = getRouteApi('/_authed/threads/$postId/')

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '방금'
  if (minutes < 60) return `${minutes}분`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간`
  const days = Math.floor(hours / 24)
  return `${days}일`
}

function ThreadsPostDetailPage() {
  const { postId } = routeApi.useParams()
  const navigate = routeApi.useNavigate()
  const qc = useQueryClient()

  const { data: post, isLoading } = useQuery({
    queryKey: ['threads-post', postId],
    queryFn: () => fetchThreadsPost(postId),
  })

  const [topic, setTopic] = useState('')
  const [segments, setSegments] = useState<ThreadsPostSegment[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const isPublished = post?.status === 'published'

  useEffect(() => {
    if (post) {
      setTopic(post.topic)
      setSegments(post.threads_post_segments)
    }
  }, [post])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const renumbered = segments.map((s, i) => ({ ...s, order_index: i }))
      const existing = renumbered.filter((s) => !s.id.startsWith('temp-'))
      const created = renumbered.filter((s) => s.id.startsWith('temp-'))
      await Promise.all([
        updateThreadsPost(postId, { topic }),
        deleteThreadsPostSegments(deletedIds),
        saveThreadsPostSegments(existing.map(({ id, content, order_index }) => ({ id, content, order_index }))),
      ])
      if (created.length > 0) {
        await createThreadsPostSegments(
          created.map(({ content, order_index }) => ({ post_id: postId, content, order_index })),
        )
      }
    },
    onSuccess: () => {
      setDeletedIds([])
      qc.invalidateQueries({ queryKey: ['threads-post', postId] })
      qc.invalidateQueries({ queryKey: ['threads-posts'] })
      toast.success('저장되었습니다')
    },
    onError: () => toast.error('저장에 실패했습니다'),
  })

  const addReplySegment = () => {
    setSegments((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, post_id: postId, order_index: prev.length, content: '', reply_thread_id: null },
    ])
  }

  const deleteReplySegment = (seg: ThreadsPostSegment) => {
    if (!seg.id.startsWith('temp-')) setDeletedIds((prev) => [...prev, seg.id])
    setSegments((prev) => prev.filter((s) => s.id !== seg.id))
  }

  const publishMutation = useMutation({
    mutationFn: async () => {
      await saveMutation.mutateAsync()
      return publishToThreads(postId)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['threads-posts'] })
      toast.success('스레드에 발행되었습니다')
      navigate({ to: '/threads' })
    },
    onError: () => toast.error('발행에 실패했습니다. Threads 토큰을 확인하세요.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteThreadsPost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['threads-posts'] })
      toast.success('삭제되었습니다')
      navigate({ to: '/threads' })
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const updateSegment = (id: string, content: string) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, content } : s)))
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
        <p>게시글을 찾을 수 없습니다</p>
        <Link to="/threads" className="text-xs underline">
          목록으로
        </Link>
      </div>
    )
  }

  // order_index 0 → 본문, 나머지 → 댓글(스레드 체인)
  const mainSegment = segments[0]
  const replySegments = segments.slice(1)
  const relativeTime = formatRelativeTime(post.created_at)

  return (
    <div className="flex h-full flex-col">
      {/* 상단 네비게이션 바 */}
      <div className="flex shrink-0 items-center gap-3 border-gray-200 border-b px-4 py-3 dark:border-gray-800">
        <Link
          to="/threads"
          search={{ persona: post.persona ?? 'all', page: 1 }}
          className="flex items-center gap-1.5 text-gray-400 text-xs hover:text-gray-600 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          목록
        </Link>
        <span className="text-gray-300 dark:text-gray-700">/</span>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={isPublished}
          placeholder="주제 입력"
          className={cn(
            'flex-1 bg-transparent font-medium text-gray-800 text-sm outline-none placeholder:text-gray-300 dark:text-gray-200',
            isPublished && 'cursor-default opacity-60',
          )}
        />
        <button
          type="button"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="flex items-center gap-1 text-gray-400 text-xs hover:text-red-500 dark:hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        {isPublished && post.thread_post_url && (
          <a
            href={post.thread_post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-gray-400 text-xs hover:text-gray-600 dark:hover:text-gray-300"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Threads에서 보기
          </a>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[600px]">
          {/* ── 전체 래퍼: 본문 + 구분선 + 정렬바 + 댓글 ── */}
          <div className="mx-4 my-4 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
            {/* 본문 */}
            {mainSegment && (
              <div className="px-4 py-4">
                {/* 프로필 */}
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-violet-500 to-pink-500">
                    <span className="font-bold text-sm text-white">G</span>
                  </div>
                  <span className="font-semibold text-[15px] text-gray-900 dark:text-white">growthwave</span>
                  <svg className="h-[14px] w-[14px] shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="12" fill="#3B82F6" />
                    <path
                      d="M7 12.5L10.5 16L17 9"
                      stroke="white"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* 텍스트 */}
                {isPublished ? (
                  <p className="whitespace-pre-wrap text-[15px] text-gray-900 leading-normal dark:text-gray-100">
                    {mainSegment.content}
                  </p>
                ) : (
                  <AutoResizeTextarea
                    value={mainSegment.content}
                    onChange={(v) => updateSegment(mainSegment.id, v)}
                    placeholder="본문 내용을 입력하세요..."
                    className="w-full resize-none bg-transparent text-[15px] text-gray-900 leading-normal outline-none placeholder:text-gray-300 dark:text-gray-100 dark:placeholder:text-gray-600"
                  />
                )}
              </div>
            )}

            {/* 구분선 */}
            <div className="border-gray-200 border-t dark:border-gray-700" />

            {/* 정렬 바 */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <button
                type="button"
                className="flex items-center gap-1.5 font-medium text-[14px] text-gray-700 transition-opacity hover:opacity-70 dark:text-gray-300"
              >
                <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-current" aria-hidden="true">
                  <path d="M9.29 15.74 7 18.03V3.436a1 1 0 0 0-2 0v14.599l-2.296-2.295a1 1 0 0 0-1.414 1.414l4.002 4a1.001 1.001 0 0 0 1.416 0l3.996-4A1 1 0 0 0 9.29 15.74zm13.42-9.012-4.002-4a1 1 0 0 0-1.416 0l-3.997 4a1 1 0 0 0 1.414 1.414L17 5.849v14.597a1 1 0 0 0 2 0V5.848l2.295 2.294a1 1 0 1 0 1.414-1.414z" />
                </svg>
                <span>인기순</span>
                <svg viewBox="0 0 24 24" className="h-[11px] w-[11px] fill-current" aria-hidden="true">
                  <path d="M20.707 8.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-8-8a1 1 0 1 1 1.414-1.414L12 15.586l7.293-7.293a1 1 0 0 1 1.414 0Z" />
                </svg>
              </button>
              <button
                type="button"
                className="flex items-center gap-1 text-[14px] text-gray-500 transition-opacity hover:opacity-70 dark:text-gray-400"
              >
                <span>활동 보기</span>
                <svg viewBox="0 0 24 24" className="h-[11px] w-[11px] fill-current" aria-hidden="true">
                  <path d="M9.293 4.293a1 1 0 0 1 1.414 0l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 0 1-1.414-1.414L15.586 12 9.293 5.707a1 1 0 0 1 0-1.414Z" />
                </svg>
              </button>
            </div>

            {/* 구분선 */}
            <div className="border-gray-200 border-t dark:border-gray-700" />

            {/* 댓글 목록 */}
            {replySegments.length > 0 ? (
              <div className="px-4 pt-3 pb-2">
                {replySegments.map((seg, idx) => (
                  <ReplySegment
                    key={seg.id}
                    segment={seg}
                    index={idx}
                    total={replySegments.length}
                    isPublished={isPublished}
                    onChange={updateSegment}
                    onDelete={!isPublished ? () => deleteReplySegment(seg) : undefined}
                    relativeTime={relativeTime}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <MessageCircle className="h-7 w-7 text-gray-200 dark:text-gray-700" />
                <p className="text-gray-400 text-sm">아직 댓글이 없습니다</p>
              </div>
            )}

            {/* 댓글 추가 버튼 */}
            {!isPublished && (
              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={addReplySegment}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 border-dashed py-2.5 text-gray-400 text-xs transition-colors hover:border-gray-300 hover:text-gray-500 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:text-gray-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  댓글 추가
                </button>
              </div>
            )}
          </div>
          {/* end 전체 래퍼 */}
        </div>
      </div>

      {/* 하단 액션 버튼 */}
      {!isPublished && (
        <div className="flex shrink-0 items-center justify-end gap-2 border-gray-200 border-t px-4 py-3 dark:border-gray-800">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={saveMutation.isPending || publishMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? '저장 중...' : '저장하기'}
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={saveMutation.isPending || publishMutation.isPending}
            onClick={() => setIsPublishDialogOpen(true)}
          >
            <Send className="h-3.5 w-3.5" />
            {publishMutation.isPending ? '발행 중...' : '발행하기'}
          </Button>
        </div>
      )}

      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>스레드에 발행하기</DialogTitle>
            <DialogDescription>발행하면 Threads에 즉시 게시됩니다. 발행 후에는 수정할 수 없습니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPublishDialogOpen(false)}
              disabled={publishMutation.isPending}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              disabled={publishMutation.isPending}
              onClick={() => {
                setIsPublishDialogOpen(false)
                publishMutation.mutate()
              }}
            >
              <Send className="h-3.5 w-3.5" />
              {publishMutation.isPending ? '발행 중...' : '발행하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>게시글 삭제</DialogTitle>
            <DialogDescription>삭제된 게시글은 복구할 수 없습니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── AutoResizeTextarea ────────────────────────────────────────────────────────
function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  })

  return (
    <textarea
      ref={ref}
      rows={2}
      value={value}
      placeholder={placeholder}
      className={className}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

// ── ReplySegment: 댓글 형태 ───────────────────────────────────────────────────
type ReplySegmentProps = {
  segment: ThreadsPostSegment
  index: number
  total: number
  isPublished: boolean
  onChange: (id: string, content: string) => void
  onDelete?: () => void
  relativeTime: string
}

function ReplySegment({ segment, index, total, isPublished, onChange, onDelete, relativeTime }: ReplySegmentProps) {
  const isLast = index === total - 1
  const showCounter = total > 1

  return (
    <div className="flex gap-3">
      {/* 아바타 + 연결선 */}
      <div className="flex flex-col items-center">
        <div className="relative shrink-0">
          <div className="flex h-9 w-9 select-none items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-violet-500 to-pink-500">
            <span className="font-bold text-sm text-white">G</span>
          </div>
          <div className="absolute -bottom-[5px] left-1/2 flex h-[18px] w-[18px] -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-sm ring-[1.5px] ring-white dark:bg-gray-950 dark:ring-gray-950">
            <div className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-black dark:bg-white">
              <svg viewBox="0 0 10 9" className="h-[8px] w-[8px] fill-white dark:fill-black" aria-hidden="true">
                <path d="M4.99512 8.66895C4.64355 8.66895 4.35059 8.36621 4.35059 8.03418V5.12891H1.50391C1.17188 5.12891 0.864258 4.83594 0.864258 4.47949C0.864258 4.12793 1.17188 3.83008 1.50391 3.83008H4.35059V0.924805C4.35059 0.583008 4.64355 0.290039 4.99512 0.290039C5.35156 0.290039 5.64453 0.583008 5.64453 0.924805V3.83008H8.49121C8.83301 3.83008 9.13086 4.12793 9.13086 4.47949C9.13086 4.83594 8.83301 5.12891 8.49121 5.12891H5.64453V8.03418C5.64453 8.36621 5.35156 8.66895 4.99512 8.66895Z" />
              </svg>
            </div>
          </div>
        </div>
        {!isLast && (
          <div className="mt-3 w-0.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-700" style={{ minHeight: 32 }} />
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="min-w-0 flex-1 pb-4">
        {/* 헤더 */}
        <div className="flex items-center gap-1">
          <span className="font-semibold text-[14px] text-gray-900 dark:text-white">growthwave</span>
          <svg className="h-[13px] w-[13px] shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="12" fill="#3B82F6" />
            <path
              d="M7 12.5L10.5 16L17 9"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="ml-0.5 text-[13px] text-gray-400">{relativeTime}</span>
          {(showCounter || onDelete) && (
            <div className="ml-auto flex shrink-0 items-center gap-1">
              {showCounter && (
                <span className="text-[12px] text-gray-400">
                  {index + 1}/{total}
                </span>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded p-0.5 text-gray-300 transition-colors hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* 내용 */}
        <div className="mt-0.5">
          {isPublished ? (
            <p className="whitespace-pre-wrap text-[15px] text-gray-900 leading-[1.45] dark:text-gray-100">
              {segment.content}
            </p>
          ) : (
            <AutoResizeTextarea
              value={segment.content}
              onChange={(v) => onChange(segment.id, v)}
              placeholder="내용을 입력하세요..."
              className="w-full resize-none bg-transparent text-[15px] text-gray-900 leading-[1.45] outline-none placeholder:text-gray-300 dark:text-gray-100 dark:placeholder:text-gray-600"
            />
          )}
        </div>
      </div>
    </div>
  )
}
