import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLazyFileRoute, getRouteApi } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  ArrowDown,
  ArrowRightFromLine,
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
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClientFormDialog } from '@/features/clients/ClientFormDialog'
import { ImportPreviewModal } from '@/features/clients/ImportPreviewModal'
import {
  convertToClient,
  fetchContacts,
  fetchContactsPage,
  fetchContactsTotal,
  softDeleteClient,
} from '@/features/clients/queries'
import type { Client } from '@/features/clients/types'
import { useContactImport } from '@/features/clients/useContactImport'

export const Route = createLazyFileRoute('/_authed/contacts/')({
  component: ContactsPage,
})

const routeApi = getRouteApi('/_authed/contacts/')

const formatPhone = (phone: string): string => {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('0')) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
  if (d.length === 10) {
    if (d.startsWith('02')) return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  }
  return phone
}

function ContactsPage() {
  const qc = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editTarget, setEditTarget] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 300)
    return () => clearTimeout(t)
  }, [searchText])
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

  const { fileInputRef, isImporting, importPreview, isSubmitting, handleImport, handleImportConfirm, clearPreview } =
    useContactImport()

  const { data: totalData } = useQuery({
    queryKey: ['clients-total'],
    queryFn: fetchContactsTotal,
  })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } = useInfiniteQuery({
    queryKey: ['clients-infinite', debouncedSearch],
    queryFn: ({ pageParam }) =>
      fetchContactsPage({
        pageParam: pageParam as number,
        search: debouncedSearch,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  })

  const convertMutation = useMutation({
    mutationFn: (id: string) => convertToClient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['clients-infinite'] })
      qc.invalidateQueries({ queryKey: ['clients-total'] })
      toast.success('거래처로 전환되었습니다')
    },
    onError: () => toast.error('전환에 실패했습니다'),
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
    const filtered = list
    const sorted = sortDir
      ? [...filtered].sort((a, b) => {
          const cmp = a.name.localeCompare(b.name, 'ko')
          return sortDir === 'asc' ? cmp : -cmp
        })
      : filtered
    clientsRef.current = sorted
    return sorted
  }, [data, sortDir])

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

  const handleRowMouseDown = (idx: number, id: string) => (e: React.MouseEvent) => {
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
    const all = await fetchContacts()
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
    const all = await fetchContacts()
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

  const selectedCount = selectedIds.size

  return (
    <div className="flex h-full flex-col gap-3 p-4 md:p-6">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-base text-gray-800 dark:text-gray-200">고객 DB</span>
          {totalData !== undefined && <span className="text-gray-400 text-xs">총 {totalData}개</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="hidden h-8 gap-1.5 border-blue-300 text-blue-600 text-xs hover:bg-blue-50 sm:flex dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
              onClick={handleCopySelected}
            >
              <ClipboardCopy className="h-3.5 w-3.5" />
              선택 연락처 복사 ({selectedCount})
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-gray-300 text-xs dark:border-gray-600"
            onClick={handleCopyAll}
          >
            <ClipboardCopy className="h-3.5 w-3.5" />
            전체 연락처 복사
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-gray-300 text-xs dark:border-gray-600"
            onClick={handleExport}
          >
            <Download className="h-3.5 w-3.5" />
            엑셀 추출
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-gray-300 text-xs dark:border-gray-600"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload className="h-3.5 w-3.5" />
            {isImporting ? '분석 중...' : '엑셀 가져오기'}
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
        </div>
      </div>

      {/* Search */}
      <div className="relative shrink-0">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="업체명, 연락처 검색"
          className="h-8 w-full rounded-lg border-gray-300 bg-white pr-7 pl-8 text-gray-900 text-xs placeholder:text-gray-400 focus-visible:ring-gray-400/40 sm:w-64 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
        {searchText && (
          <button
            type="button"
            onClick={() => setSearchText('')}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div ref={scrollContainerRef} className="flex-1 overflow-auto">
          {/* Header */}
          <div
            className="sticky top-0 z-10 grid min-w-[600px] select-none border-gray-200 border-b bg-white dark:border-gray-800 dark:bg-gray-900"
            style={{ gridTemplateColumns: '36px 1.2fr 170px 1fr 1fr 80px' }}
          >
            <div className="px-2 py-2 text-center font-semibold text-gray-400 text-xs dark:text-gray-500">#</div>
            <button
              type="button"
              className="flex items-center gap-1 px-4 py-2 font-semibold text-gray-500 text-xs uppercase tracking-wide hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              onClick={handleSort}
            >
              업체명
              {sortDir === 'desc' ? (
                <ArrowDown className="h-3 w-3" />
              ) : sortDir === 'asc' ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-40" />
              )}
            </button>
            <div className="px-4 py-2 font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
              연락처
            </div>
            <div className="px-4 py-2 font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
              이메일
            </div>
            <div className="px-4 py-2 font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
              비고
            </div>
            <div className="px-2 py-2" />
          </div>

          {/* Rows */}
          {isPending ? (
            <div className="flex h-32 items-center justify-center">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500 dark:border-gray-700 dark:border-t-gray-400" />
            </div>
          ) : clients.length === 0 ? (
            <p className="py-16 text-center text-gray-400 text-xs">등록된 거래처가 없습니다</p>
          ) : (
            <>
              {clients.map((client, idx) => {
                const isSelected = selectedIds.has(client.id)
                return (
                  <div
                    key={client.id}
                    role="option"
                    tabIndex={0}
                    aria-selected={isSelected}
                    className={`grid min-w-[600px] cursor-pointer select-none border-gray-100 border-b transition-colors dark:border-gray-800/60 ${
                      isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : 'hover:bg-gray-50/70 dark:hover:bg-gray-800/30'
                    }`}
                    style={{
                      height: 35,
                      gridTemplateColumns: '36px 1.2fr 170px 1fr 1fr 80px',
                    }}
                    onMouseDown={handleRowMouseDown(idx, client.id)}
                    onMouseEnter={handleRowMouseEnter(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedIds((prev) => {
                          const next = new Set(prev)
                          if (next.has(client.id)) next.delete(client.id)
                          else next.add(client.id)
                          return next
                        })
                      }
                    }}
                  >
                    <div className="flex items-center justify-center text-[11px] text-gray-400 tabular-nums dark:text-gray-500">
                      {idx + 1}
                    </div>
                    <div className="flex items-center truncate px-4 text-gray-800 text-xs dark:text-gray-200">
                      {client.name}
                    </div>
                    <div className="flex items-center px-4 text-gray-600 text-xs tabular-nums dark:text-gray-300">
                      {client.contact_phone ? formatPhone(client.contact_phone) : '-'}
                    </div>
                    <div className="flex items-center truncate px-4 text-gray-600 text-xs dark:text-gray-300">
                      {client.email ?? '-'}
                    </div>
                    <div className="flex items-center truncate px-4 text-gray-500 text-xs dark:text-gray-400">
                      {client.note ?? '-'}
                    </div>
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        type="button"
                        className="rounded p-1 text-blue-400 transition-colors hover:text-blue-600 dark:hover:text-blue-300"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          convertMutation.mutate(client.id)
                        }}
                        title="거래처로 전환"
                      >
                        <ArrowRightFromLine className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditTarget(client)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-red-400 transition-colors hover:text-red-600 dark:hover:text-red-300"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(client)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
              <div ref={sentinelRef} className="h-1" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-3">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500 dark:border-gray-700 dark:border-t-gray-400" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex shrink-0 items-center gap-3">
          <p className="text-blue-500 text-xs dark:text-blue-400">{selectedCount}개 선택됨</p>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-gray-400 text-xs underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300"
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
          onClose={clearPreview}
          onConfirm={handleImportConfirm}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
