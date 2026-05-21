import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createLazyFileRoute, getRouteApi } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ExternalLink, MessageSquare, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Pagination } from '@/components/common/Pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { deleteThreadsPost, fetchThreadsPostsPage } from '@/features/threads/queries'
import { THREADS_PERSONA_LABELS, type ThreadsPersona, type ThreadsPost } from '@/features/threads/types'
import { cn } from '@/lib/utils'

const PERSONA_TABS: { value: ThreadsPersona | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'growth_hacker', label: THREADS_PERSONA_LABELS.growth_hacker },
  { value: 'strategist', label: THREADS_PERSONA_LABELS.strategist },
  { value: 'field_expert', label: THREADS_PERSONA_LABELS.field_expert },
  { value: 'agency_brand', label: THREADS_PERSONA_LABELS.agency_brand },
]

export const Route = createLazyFileRoute('/_authed/threads/')({
  component: ThreadsListPage,
})

const routeApi = getRouteApi('/_authed/threads/')
const PAGE_SIZE = 20

function ThreadsListPage() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const page = search.page ?? 1
  const persona = search.persona ?? 'all'
  const qc = useQueryClient()
  const [deletingPost, setDeletingPost] = useState<{ id: string; preview: string } | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteThreadsPost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['threads-posts'] })
      setDeletingPost(null)
      toast.success('삭제되었습니다')
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const { data, isLoading } = useInfiniteQuery({
    queryKey: ['threads-posts', persona],
    queryFn: ({ pageParam }) => fetchThreadsPostsPage({ pageParam, persona }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
  })

  const allPosts = data?.pages.flatMap((p) => p.data) ?? []
  const total = data?.pages[0]?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const paginated = allPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-base text-gray-800 dark:text-gray-200">스레드 관리</span>
          <span className="text-gray-400 text-xs dark:text-gray-400">총 {total}개</span>
        </div>
      </div>

      <Tabs
        value={persona}
        onValueChange={(v) =>
          navigate({ search: (prev) => ({ ...prev, persona: v as ThreadsPersona | 'all', page: 1 }) })
        }
        className="shrink-0"
      >
        <TabsList variant="line">
          {PERSONA_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <colgroup>
              <col />
              <col className="w-28" />
              <col className="w-24" />
              <col className="w-28" />
              <col className="w-28" />
              <col className="w-28" />
              <col className="w-10" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
              <tr className="border-gray-200 border-b dark:border-gray-800">
                <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
                  본문
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
                  페르소나
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
                  상태
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
                  생성일
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
                  발행일
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
                  링크
                </th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {isLoading ? (
                ['a', 'b', 'c', 'd'].map((k) => (
                  <tr key={k} className="h-[52px]">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <td key={i} className="px-4 py-2">
                        <div className="h-3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20">
                    <div className="flex flex-col items-center gap-3 text-gray-300 dark:text-gray-600">
                      <MessageSquare className="h-8 w-8" />
                      <p className="text-sm">생성된 게시글이 없습니다</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((post: ThreadsPost & { preview: string }) => (
                  <tr
                    key={post.id}
                    className={cn(
                      'group cursor-pointer transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40',
                    )}
                    onClick={() => navigate({ to: '/threads/$postId', params: { postId: post.id } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate({ to: '/threads/$postId', params: { postId: post.id } })
                    }}
                    tabIndex={0}
                  >
                    <td className="max-w-0 px-4 py-3">
                      <p className="truncate text-gray-900 text-xs dark:text-gray-100">
                        {(post.preview || post.topic || '(내용 없음)').replace(/\n+/g, ' ')}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <PersonaBadge persona={post.persona} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs tabular-nums dark:text-gray-400">
                      {format(new Date(post.created_at), 'MM/dd HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs tabular-nums dark:text-gray-400">
                      {post.published_at ? format(new Date(post.published_at), 'MM/dd HH:mm') : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {post.thread_post_url ? (
                        <a
                          href={post.thread_post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          보기
                        </a>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        className="rounded p-1 text-gray-300 opacity-0 transition-colors hover:text-red-400 group-hover:opacity-100 dark:text-gray-600 dark:hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingPost({
                            id: post.id,
                            preview: (post.preview || post.topic || '').replace(/\n+/g, ' ').slice(0, 60),
                          })
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="shrink-0 border-gray-100 border-t bg-white py-3 dark:border-gray-800 dark:bg-gray-900">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => navigate({ search: (prev) => ({ ...prev, page: p }) })}
          />
        </div>
      </div>

      <Dialog open={!!deletingPost} onOpenChange={(open) => !open && setDeletingPost(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>게시글 삭제</DialogTitle>
            <DialogDescription>삭제된 게시글은 복구할 수 없습니다.</DialogDescription>
          </DialogHeader>
          {deletingPost && (
            <p className="truncate rounded-md bg-gray-50 px-3 py-2 text-gray-600 text-xs dark:bg-gray-800/60 dark:text-gray-400">
              {deletingPost.preview || '(내용 없음)'}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingPost(null)}
              disabled={deleteMutation.isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deletingPost && deleteMutation.mutate(deletingPost.id)}
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  if (status === 'published') {
    return (
      <Badge className="border-0 bg-green-50 text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">
        발행완료
      </Badge>
    )
  }
  return (
    <Badge className="border-0 bg-gray-100 text-gray-500 text-xs dark:bg-gray-800 dark:text-gray-400">임시저장</Badge>
  )
}

function PersonaBadge({ persona }: { persona: ThreadsPost['persona'] }) {
  if (!persona) return <span className="text-gray-300 text-xs dark:text-gray-600">-</span>
  return (
    <Badge className="border-0 bg-indigo-50 text-indigo-600 text-xs dark:bg-indigo-900/30 dark:text-indigo-400">
      {THREADS_PERSONA_LABELS[persona]}
    </Badge>
  )
}
