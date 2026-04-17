import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ClientFormDialog } from '@/features/clients/ClientFormDialog'
import {
  fetchClients,
  fetchClientsPage,
  fetchClientsTotal,
  importClients,
  softDeleteClient,
  updateClient,
} from '@/features/clients/queries'
import type { Client } from '@/features/clients/types'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { createLazyFileRoute, getRouteApi } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ClipboardCopy,
  Download,
  Pencil,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export const Route = createLazyFileRoute('/_authed/contacts/')({
  component: ContactsPage,
})

const routeApi = getRouteApi('/_authed/contacts/')

const formatPhone = (phone: string): string => {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('0'))
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
  if (d.length === 10) {
    if (d.startsWith('02'))
      return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  }
  return phone
}

type ImportRow = {
  name: string
  contact_phone: string | null
  email: string | null
}

type DuplicateItem = {
  existing: Client
  incoming: ImportRow
}

type ImportPreview = {
  newRows: ImportRow[]
  duplicates: DuplicateItem[]
  irregular: ImportRow[]
}

const isValidPhone = (phone: string | null): boolean => {
  if (!phone) return true
  const d = phone.replace(/\D/g, '')
  return d.length === 11 && d.startsWith('0')
}

const ImportPreviewModal = ({
  preview,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  preview: ImportPreview
  onClose: () => void
  onConfirm: (overwrite: boolean) => void
  isSubmitting: boolean
}) => (
  <Dialog open onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-lg flex flex-col max-h-[80vh]">
      <DialogHeader>
        <DialogTitle>엑셀 가져오기 미리보기</DialogTitle>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
        {preview.irregular.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2">
              확인 필요 {preview.irregular.length}개 (비표준 번호 — 그대로
              추가됩니다)
            </p>
            <div className="space-y-1">
              {preview.irregular.map((row) => (
                <div
                  key={`${row.name}-${row.contact_phone}`}
                  className="flex items-center gap-3 text-xs px-3 py-2 bg-orange-50 dark:bg-orange-900/10 rounded"
                >
                  <span className="font-medium text-gray-800 dark:text-gray-200 flex-1 truncate">
                    {row.name}
                  </span>
                  <span className="text-orange-600 dark:text-orange-400 tabular-nums shrink-0">
                    {row.contact_phone ?? '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {preview.newRows.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
              신규 추가 {preview.newRows.length}개
            </p>
            <div className="space-y-1">
              {preview.newRows.map((row) => (
                <div
                  key={`${row.name}-${row.contact_phone}`}
                  className="flex items-center gap-3 text-xs px-3 py-2 bg-emerald-50 dark:bg-emerald-900/10 rounded"
                >
                  <span className="font-medium text-gray-800 dark:text-gray-200 flex-1 truncate">
                    {row.name}
                  </span>
                  {row.contact_phone && (
                    <span className="text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
                      {row.contact_phone}
                    </span>
                  )}
                  {row.email && (
                    <span className="text-gray-400 dark:text-gray-500 truncate shrink-0">
                      {row.email}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {preview.duplicates.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-3">
              중복 감지 {preview.duplicates.length}개
            </p>
            <div className="space-y-2">
              {preview.duplicates.map(({ existing, incoming }) => {
                const emailChanged = existing.email !== incoming.email
                return (
                  <div
                    key={existing.id}
                    className="text-xs px-3 py-2 bg-amber-50 dark:bg-amber-900/10 rounded space-y-1"
                  >
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {existing.name}
                    </span>
                    {emailChanged && (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <span>이메일 기존: {existing.email ?? '-'}</span>
                        <span className="text-amber-600 dark:text-amber-400">
                          → {incoming.email ?? '-'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {preview.newRows.length === 0 &&
          preview.duplicates.length === 0 &&
          preview.irregular.length === 0 && (
            <p className="text-center text-xs text-gray-400 py-8">
              가져올 데이터가 없습니다
            </p>
          )}
      </div>

      <DialogFooter className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isSubmitting}
        >
          취소
        </Button>
        {preview.duplicates.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
            onClick={() => onConfirm(true)}
            disabled={isSubmitting}
          >
            전체 덮어쓰기
          </Button>
        )}
        <Button
          size="sm"
          onClick={() => onConfirm(false)}
          disabled={
            isSubmitting ||
            (preview.newRows.length === 0 && preview.irregular.length === 0)
          }
        >
          {preview.newRows.length + preview.irregular.length > 0
            ? `신규만 추가 (${preview.newRows.length + preview.irregular.length}개)`
            : '신규 없음'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

function ContactsPage() {
  const qc = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editTarget, setEditTarget] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [searchText, setSearchText] = useState('')
  const { sortDir: sortDirParam } = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const sortDir = sortDirParam

  const handleSort = () => {
    if (!sortDir) {
      navigate({ search: (prev) => ({ ...prev, sortDir: 'desc' }) })
    } else if (sortDir === 'desc') {
      navigate({ search: (prev) => ({ ...prev, sortDir: 'asc' }) })
    } else {
      navigate({ search: (prev) => ({ ...prev, sortDir: undefined }) })
    }
  }
  const isDragging = useRef(false)
  const hasMoved = useRef(false)
  const mouseDownId = useRef<string | null>(null)
  const dragStartIdx = useRef(-1)
  const clientsRef = useRef<Client[]>([])
  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: totalData } = useQuery({
    queryKey: ['clients-total'],
    queryFn: fetchClientsTotal,
  })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useInfiniteQuery({
      queryKey: ['clients-infinite', ''],
      queryFn: ({ pageParam }) =>
        fetchClientsPage({ pageParam: pageParam as number }),
      getNextPageParam: (lastPage) => lastPage.nextPage,
      initialPageParam: 0,
    })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => softDeleteClient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['clients-infinite'] })
      qc.invalidateQueries({ queryKey: ['clients-total'] })
      toast.success('삭제되었습니다')
      setDeleteTarget(null)
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const clients = useMemo(() => {
    const list = data?.pages.flatMap((p) => p.data) ?? []
    const filtered = searchText
      ? list.filter((c) =>
          c.name.toLowerCase().includes(searchText.toLowerCase()),
        )
      : list
    const sorted = sortDir
      ? [...filtered].sort((a, b) => {
          const cmp = a.name.localeCompare(b.name, 'ko')
          return sortDir === 'asc' ? cmp : -cmp
        })
      : filtered
    clientsRef.current = sorted
    return sorted
  }, [data, sortDir, searchText])

  useEffect(() => {
    const sentinel = sentinelRef.current
    const container = scrollContainerRef.current
    if (!sentinel || !container) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { root: container, rootMargin: '200px', threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    const onMouseUp = () => {
      if (isDragging.current && !hasMoved.current && mouseDownId.current) {
        const id = mouseDownId.current
        setSelectedIds((prev) => {
          const next = new Set(prev)
          if (next.has(id)) {
            next.delete(id)
          } else {
            next.add(id)
          }
          return next
        })
      }
      isDragging.current = false
      hasMoved.current = false
      mouseDownId.current = null
    }
    document.addEventListener('mouseup', onMouseUp)
    return () => document.removeEventListener('mouseup', onMouseUp)
  }, [])

  const handleRowMouseDown =
    (idx: number, id: string) => (e: React.MouseEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      isDragging.current = true
      hasMoved.current = false
      mouseDownId.current = id
      dragStartIdx.current = idx
    }

  const handleRowMouseEnter = (idx: number) => () => {
    if (!isDragging.current) return
    hasMoved.current = true
    const start = Math.min(dragStartIdx.current, idx)
    const end = Math.max(dragStartIdx.current, idx)
    setSelectedIds(new Set(clients.slice(start, end + 1).map((c) => c.id)))
  }

  const phonesOnly = (list: Client[]) =>
    list
      .filter((c) => c.contact_phone)
      .map((c) => (c.contact_phone as string).replace(/\D/g, ''))
      .filter(Boolean)

  const handleCopyAll = async () => {
    const all = await fetchClients()
    const phones = phonesOnly(all)
    if (phones.length === 0) {
      toast.error('복사할 연락처가 없습니다')
      return
    }
    await navigator.clipboard.writeText(phones.join(','))
    toast.success(`${phones.length}개 연락처가 복사되었습니다`)
  }

  const handleCopySelected = async () => {
    const selected = clients.filter((c) => selectedIds.has(c.id))
    const phones = phonesOnly(selected)
    if (phones.length === 0) {
      toast.error('복사할 연락처가 없습니다')
      return
    }
    await navigator.clipboard.writeText(phones.join(','))
    toast.success(`${phones.length}개 연락처가 복사되었습니다`)
  }

  const handleExport = async () => {
    const all = await fetchClients()
    const ws = XLSX.utils.json_to_sheet(
      all.map((c) => ({
        업체명: c.name,
        연락처: c.contact_phone ?? '',
        이메일: c.email ?? '',
      })),
    )
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 35 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '고객DB')
    XLSX.writeFile(wb, `고객DB_${format(new Date(), 'yyyyMMdd')}.xlsx`)
    toast.success('엑셀 파일이 다운로드되었습니다')
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setIsImporting(true)
    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer)
      const ws = wb.Sheets[wb.SheetNames[0]]

      // 헤더 행 위치 자동 탐지 (업체명 컬럼이 있는 행)
      const rawRows = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: '',
      }) as string[][]
      const headerRowIdx = rawRows.findIndex((row) =>
        row.some((cell) => String(cell).trim() === '업체명'),
      )
      if (headerRowIdx === -1) {
        toast.error('가져올 데이터가 없습니다. 업체명 컬럼을 확인해주세요')
        return
      }
      const rows = XLSX.utils.sheet_to_json(ws, {
        range: headerRowIdx,
        defval: '',
      }) as Record<string, string>[]

      const normalizePhone = (raw: string): string | null => {
        const v = raw.trim()
        if (!v) return null
        // +82 → 010...
        if (v.startsWith('+82')) {
          const digits = v.slice(3).replace(/\D/g, '')
          return `0${digits}`
        }
        const digits = v.replace(/\D/g, '')
        if (!digits) return null
        // 이미 0으로 시작하면 그대로
        if (digits.startsWith('0')) return digits
        // 나머지는 010 붙이기
        return `010${digits}`
      }

      const parsed: ImportRow[] = rows
        .map((r) => ({
          name: String(r.업체명 ?? '').trim(),
          contact_phone: normalizePhone(String(r.연락처 ?? '')),
          email: String(r.이메일 ?? '').trim() || null,
        }))
        .filter((r) => r.name)

      if (parsed.length === 0) {
        toast.error('가져올 데이터가 없습니다. 업체명 컬럼을 확인해주세요')
        return
      }

      const existing = await fetchClients()

      const newRows: ImportRow[] = []
      const duplicates: DuplicateItem[] = []
      const irregular: ImportRow[] = []

      // 비교용 정규화: 숫자만 추출 + 10으로 시작하는 10자리는 앞에 0 추가
      const normalizeForCompare = (v: string | null): string | null => {
        if (!v) return null
        const d = v.replace(/\D/g, '')
        if (!d) return null
        if (d.length === 10 && d.startsWith('10')) return `0${d}`
        return d
      }

      for (const row of parsed) {
        const rowPhone = normalizeForCompare(row.contact_phone)
        const match = existing.find((c) => {
          const dbPhone = normalizeForCompare(c.contact_phone)
          return (
            c.name === row.name &&
            (dbPhone === rowPhone || (!dbPhone && !rowPhone))
          )
        })
        if (!isValidPhone(row.contact_phone)) {
          irregular.push(row)
        } else if (match) {
          duplicates.push({ existing: match, incoming: row })
        } else {
          newRows.push(row)
        }
      }

      setImportPreview({ newRows, duplicates, irregular })
    } catch {
      toast.error('파일을 읽는 중 오류가 발생했습니다')
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportConfirm = async (overwrite: boolean) => {
    if (!importPreview) return
    setIsSubmitting(true)
    try {
      const { newRows, duplicates, irregular } = importPreview
      const promises: Promise<unknown>[] = []

      const allNew = [...newRows, ...irregular]
      if (allNew.length > 0) {
        promises.push(importClients(allNew))
      }

      if (overwrite) {
        for (const { existing, incoming } of duplicates) {
          promises.push(
            updateClient(existing.id, {
              name: incoming.name,
              contact_phone: incoming.contact_phone,
              email: incoming.email,
            }),
          )
        }
      }

      await Promise.all(promises)
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['clients-infinite'] })
      qc.invalidateQueries({ queryKey: ['clients-total'] })

      const parts: string[] = []
      if (allNew.length > 0) parts.push(`${allNew.length}개 추가`)
      if (overwrite && duplicates.length > 0)
        parts.push(`${duplicates.length}개 업데이트`)
      if (!overwrite && duplicates.length > 0)
        parts.push(`${duplicates.length}개 중복 건너뜀`)
      if (irregular.length > 0)
        parts.push(`비표준 번호 ${irregular.length}개 포함`)
      toast.success(parts.join(', '))

      setImportPreview(null)
    } catch {
      toast.error('가져오기에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCount = selectedIds.size

  return (
    <div className="h-full flex flex-col gap-3 p-4 md:p-6">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
            고객 DB
          </span>
          {totalData !== undefined && (
            <span className="text-xs text-gray-400">총 {totalData}개</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="hidden sm:flex h-8 text-xs gap-1.5 border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              onClick={handleCopySelected}
            >
              <ClipboardCopy className="w-3.5 h-3.5" />
              선택 연락처 복사 ({selectedCount})
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 border-gray-300 dark:border-gray-600"
            onClick={handleCopyAll}
          >
            <ClipboardCopy className="w-3.5 h-3.5" />
            전체 연락처 복사
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 border-gray-300 dark:border-gray-600"
            onClick={handleExport}
          >
            <Download className="w-3.5 h-3.5" />
            엑셀 추출
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 border-gray-300 dark:border-gray-600"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload className="w-3.5 h-3.5" />
            {isImporting ? '분석 중...' : '엑셀 가져오기'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      {/* Search */}
      <div className="shrink-0 relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="업체명 검색"
          className="h-8 pl-8 pr-7 text-xs w-full sm:w-64 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus-visible:ring-gray-400/40"
        />
        {searchText && (
          <button
            type="button"
            onClick={() => setSearchText('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
        <div ref={scrollContainerRef} className="flex-1 overflow-auto">
          {/* Header */}
          <div
            className="sticky top-0 z-10 grid min-w-[580px] border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 select-none"
            style={{ gridTemplateColumns: '36px 1.2fr 170px 1fr 1fr 60px' }}
          >
            <div className="px-2 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 text-center">
              #
            </div>
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
              onClick={handleSort}
            >
              업체명
              {sortDir === 'desc' ? (
                <ArrowDown className="w-3 h-3" />
              ) : sortDir === 'asc' ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-40" />
              )}
            </button>
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              연락처
            </div>
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              이메일
            </div>
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              비고
            </div>
            <div className="px-2 py-2" />
          </div>

          {/* Rows */}
          {isPending ? (
            <div className="flex items-center justify-center h-32">
              <span className="inline-block w-4 h-4 border-2 border-gray-200 dark:border-gray-700 border-t-gray-500 dark:border-t-gray-400 rounded-full animate-spin" />
            </div>
          ) : clients.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-16">
              등록된 거래처가 없습니다
            </p>
          ) : (
            <>
              {clients.map((client, idx) => {
                const isSelected = selectedIds.has(client.id)
                return (
                  <div
                    key={client.id}
                    className={`grid min-w-[580px] border-b border-gray-100 dark:border-gray-800/60 select-none cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'hover:bg-gray-50/70 dark:hover:bg-gray-800/30'
                    }`}
                    style={{
                      height: 35,
                      gridTemplateColumns: '36px 1.2fr 170px 1fr 1fr 60px',
                    }}
                    onMouseDown={handleRowMouseDown(idx, client.id)}
                    onMouseEnter={handleRowMouseEnter(idx)}
                  >
                    <div className="flex items-center justify-center text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
                      {idx + 1}
                    </div>
                    <div className="px-4 flex items-center text-xs text-gray-800 dark:text-gray-200 truncate">
                      {client.name}
                    </div>
                    <div className="px-4 flex items-center text-xs text-gray-600 dark:text-gray-300 tabular-nums">
                      {client.contact_phone
                        ? formatPhone(client.contact_phone)
                        : '-'}
                    </div>
                    <div className="px-4 flex items-center text-xs text-gray-600 dark:text-gray-300 truncate">
                      {client.email ?? '-'}
                    </div>
                    <div className="px-4 flex items-center text-xs text-gray-500 dark:text-gray-400 truncate">
                      {client.note ?? '-'}
                    </div>
                    <div
                      className="flex items-center justify-center gap-0.5"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditTarget(client)
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(client)
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
              <div ref={sentinelRef} className="h-1" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-3">
                  <span className="inline-block w-3 h-3 border-2 border-gray-200 dark:border-gray-700 border-t-gray-500 dark:border-t-gray-400 rounded-full animate-spin" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="shrink-0 flex items-center gap-3">
          <p className="text-xs text-blue-500 dark:text-blue-400">
            {selectedCount}개 선택됨
          </p>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2"
          >
            선택 초기화
          </button>
        </div>
      )}

      <ClientFormDialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        editTarget={editTarget}
        hideContactName
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="거래처 삭제"
        description={`"${deleteTarget?.name ?? ''}" 거래처를 삭제하면 휴지통으로 이동됩니다.`}
        confirmLabel="삭제"
        tone="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />

      {importPreview && (
        <ImportPreviewModal
          preview={importPreview}
          onClose={() => setImportPreview(null)}
          onConfirm={handleImportConfirm}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
