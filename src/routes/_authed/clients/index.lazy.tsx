import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClientFormDialog } from '@/features/clients/ClientFormDialog'
import { fetchClients, softDeleteClient } from '@/features/clients/queries'
import type { Client } from '@/features/clients/types'
import { cn } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createLazyFileRoute, getRouteApi } from '@tanstack/react-router'
import { Building2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createLazyFileRoute('/_authed/clients/')({
  component: ClientsPage,
})

const routeApi = getRouteApi('/_authed/clients/')

function ClientsPage() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const qc = useQueryClient()

  const searchText = search.search ?? ''
  const page = search.page ?? 1
  const [searchInput, setSearchInput] = useState(searchText)
  const PAGE_SIZE = 15
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => softDeleteClient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('삭제되었습니다')
      setDeleteTarget(null)
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const filtered = clients.filter((c) =>
    searchText
      ? c.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (c.contact_name ?? '').toLowerCase().includes(searchText.toLowerCase())
      : true,
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginatedClients = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  const handleSearch = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        search: searchInput || undefined,
        page: 1,
      }),
    })
  }

  const handleOpenAdd = () => {
    setEditTarget(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (client: Client) => {
    setEditTarget(client)
    setDialogOpen(true)
  }

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
            거래처
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-400">
            {filtered.length !== clients.length
              ? `${filtered.length} / ${clients.length}개`
              : `총 ${clients.length}개`}
          </span>
        </div>
        <Button
          size="sm"
          className="gap-1.5 h-8 text-xs"
          onClick={handleOpenAdd}
        >
          <Plus className="w-3.5 h-3.5" />새 거래처
        </Button>
      </div>

      {/* Filter bar */}
      <div className="shrink-0 flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="거래처명, 담당자명 검색"
            className="h-8 pl-8 pr-7 w-64 text-xs rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus-visible:ring-gray-400/40"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
                navigate({
                  search: (prev) => ({ ...prev, search: undefined, page: 1 }),
                })
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
          onClick={handleSearch}
        >
          <Search className="w-3.5 h-3.5" />
          검색
        </Button>
        {searchText && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {filtered.length}개 검색됨
          </span>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 flex flex-col border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  거래처명
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  담당자
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  연락처
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  메모
                </th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {isLoading ? (
                ['a', 'b', 'c', 'd'].map((k) => (
                  <tr key={k} className="h-[50px]">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <td key={i} className="px-4 py-2">
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20">
                    <div className="flex flex-col items-center gap-3 text-gray-300 dark:text-gray-600">
                      <Building2 className="w-8 h-8" />
                      <p className="text-sm">
                        {searchText
                          ? '검색 결과가 없습니다'
                          : '등록된 거래처가 없습니다'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => (
                  <tr
                    key={client.id}
                    className={cn(
                      'group h-[50px] hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors',
                    )}
                  >
                    <td className="px-4 py-2 font-medium">
                      <Link
                        to="/clients/$clientId"
                        params={{ clientId: client.id }}
                        className="text-gray-900 dark:text-gray-100 hover:underline"
                      >
                        {client.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300 text-xs">
                      {client.contact_name ?? '-'}
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300 text-xs tabular-nums">
                      {client.contact_phone ?? '-'}
                    </td>
                    <td className="px-4 py-2 text-gray-500 dark:text-gray-400 text-xs truncate max-w-[200px]">
                      {client.note ?? '-'}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          onClick={() => handleOpenEdit(client)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => setDeleteTarget(client)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="shrink-0 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) =>
              navigate({ search: (prev) => ({ ...prev, page: p }) })
            }
          />
        </div>
      </div>

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditTarget(null)
        }}
        editTarget={editTarget}
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
    </div>
  )
}
