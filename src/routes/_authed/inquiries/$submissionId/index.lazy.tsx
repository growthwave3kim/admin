import { useQuery } from '@tanstack/react-query'
import { createLazyFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { fetchInquiry } from '@/features/inquiries/queries'

export const Route = createLazyFileRoute('/_authed/inquiries/$submissionId/')({
  component: InquiryDetailPage,
})

function InquiryDetailPage() {
  const { submissionId } = useParams({ from: '/_authed/inquiries/$submissionId/' })
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['inquiry', submissionId],
    queryFn: () => fetchInquiry(submissionId),
  })

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: '/inquiries' })}
          className="flex items-center gap-1.5 text-gray-500 text-xs transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          목록
        </button>
        <span className="text-gray-300 dark:text-gray-700">/</span>
        <span className="font-semibold text-base text-gray-800 dark:text-gray-200">문의 상세</span>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500 dark:border-gray-700 dark:border-t-gray-400" />
        </div>
      ) : !data ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-400 text-sm">문의를 찾을 수 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-gray-200 border-b px-5 py-3 dark:border-gray-800">
              <p className="font-medium text-gray-700 text-sm dark:text-gray-300">기본 정보</p>
            </div>
            <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
              <InfoRow label="이름" value={data.name} />
              <InfoRow label="업체명" value={data.company} />
              <InfoRow label="직종" value={data.profession} />
              <InfoRow label="연락처" value={data.tel} mono />
              <InfoRow label="이메일" value={data.email} mono />
              <InfoRow label="유입경로" value={data.source} />
              <InfoRow
                label="접수일시"
                value={data.created_at ? format(new Date(data.created_at), 'yyyy년 MM월 dd일 HH:mm') : '-'}
                mono
                fullWidth
              />
            </div>
          </div>

          <div className="border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-gray-200 border-b px-5 py-3 dark:border-gray-800">
              <p className="font-medium text-gray-700 text-sm dark:text-gray-300">문의 내용</p>
            </div>
            <div className="px-5 py-4">
              {data.message ? (
                <p className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed dark:text-gray-300">
                  {data.message}
                </p>
              ) : (
                <p className="text-gray-400 text-sm dark:text-gray-500">내용 없음</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type InfoRowProps = {
  label: string
  value: string | null | undefined
  mono?: boolean
  fullWidth?: boolean
}

const InfoRow = ({ label, value, mono, fullWidth }: InfoRowProps) => (
  <div
    className={`flex flex-col gap-0.5 border-gray-100 border-b px-5 py-3 last:border-b-0 dark:border-gray-800 ${fullWidth ? 'sm:col-span-2' : ''}`}
  >
    <span className="font-semibold text-[10px] text-gray-400 uppercase tracking-wide dark:text-gray-500">{label}</span>
    <span className={`text-gray-800 text-sm dark:text-gray-200 ${mono ? 'tabular-nums' : ''}`}>{value || '-'}</span>
  </div>
)
