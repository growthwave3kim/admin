import { useQuery } from '@tanstack/react-query'
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import { Inbox } from 'lucide-react'
import { fetchInquiries } from '@/features/inquiries/queries'
import type { ContactSubmission } from '@/features/inquiries/types'

export const Route = createLazyFileRoute('/_authed/inquiries/')({
  component: InquiriesPage,
})

function InquiriesPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['inquiries'],
    queryFn: fetchInquiries,
  })

  const inquiries = data ?? []

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-base text-gray-800 dark:text-gray-200">홈페이지 문의</span>
          {!isLoading && <span className="text-gray-400 text-xs dark:text-gray-500">총 {inquiries.length}개</span>}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <colgroup>
              <col />
              <col className="w-28" />
              <col className="w-24" />
              <col className="w-32" />
              <col className="w-28" />
              <col className="w-32" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
              <tr className="border-gray-200 border-b dark:border-gray-800">
                <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
                  이름
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
                  업체명
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
                  직종
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
                  연락처
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
                  유입경로
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
                  접수일시
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {isLoading ? (
                ['a', 'b', 'c', 'd'].map((k) => (
                  <tr key={k} className="h-[52px]">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <td key={i} className="px-4 py-2">
                        <div className="h-3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20">
                    <div className="flex flex-col items-center gap-3 text-gray-300 dark:text-gray-600">
                      <Inbox className="h-8 w-8" />
                      <p className="text-sm">접수된 문의가 없습니다</p>
                    </div>
                  </td>
                </tr>
              ) : (
                inquiries.map((item: ContactSubmission) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
                    onClick={() => navigate({ to: '/inquiries/$submissionId', params: { submissionId: item.id } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter')
                        navigate({ to: '/inquiries/$submissionId', params: { submissionId: item.id } })
                    }}
                    tabIndex={0}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 text-xs dark:text-gray-100">{item.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs dark:text-gray-300">{item.company || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs dark:text-gray-300">{item.profession || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs tabular-nums dark:text-gray-300">{item.tel}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs dark:text-gray-400">{item.source || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs tabular-nums dark:text-gray-400">
                      {item.created_at ? format(new Date(item.created_at), 'MM/dd HH:mm') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
