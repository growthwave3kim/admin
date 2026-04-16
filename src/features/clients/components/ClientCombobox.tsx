import { inputClass } from '@/components/common/FieldLabel'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { fetchClient, fetchClientsPage } from '@/features/clients/queries'
import { cn } from '@/lib/utils'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Check, ChevronDown, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type ClientComboboxProps = {
  value: string | null | undefined
  onChange: (id: string | null) => void
  onSelectClient?: (client: { id: string; name: string } | null) => void
}

export const ClientCombobox = ({
  value,
  onChange,
  onSelectClient,
}: ClientComboboxProps) => {
  const [open, setOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data: selectedClient } = useQuery({
    queryKey: ['client', value],
    queryFn: () => fetchClient(value as string),
    enabled: !!value,
    staleTime: 60_000,
  })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useInfiniteQuery({
      queryKey: ['clients-infinite', debouncedSearch],
      queryFn: ({ pageParam }) =>
        fetchClientsPage({
          search: debouncedSearch,
          pageParam: pageParam as number,
        }),
      getNextPageParam: (lastPage) => lastPage.nextPage,
      initialPageParam: 0,
      enabled: open,
    })

  const clients = data?.pages.flatMap((p) => p.data) ?? []

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleOpenChange = (o: boolean) => {
    setOpen(o)
    if (!o) {
      setSearchInput('')
      setDebouncedSearch('')
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className={cn(
          inputClass,
          'w-full flex items-center justify-between text-left px-3',
          !value && 'text-gray-400 dark:text-gray-500',
        )}
      >
        <span className="truncate">
          {value ? (selectedClient?.name ?? '...') : '거래처 선택'}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
                onSelectClient?.(null)
              }}
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <div className="p-2 border-b border-gray-100 dark:border-gray-800">
          <Input
            placeholder="거래처 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-7 text-xs border-gray-200 dark:border-gray-700"
            autoFocus
          />
        </div>
        <div className="max-h-52 overflow-y-auto py-1">
          {isPending ? (
            <div className="flex justify-center py-6">
              <span className="inline-block w-4 h-4 border-2 border-gray-200 dark:border-gray-700 border-t-gray-500 dark:border-t-gray-400 rounded-full animate-spin" />
            </div>
          ) : clients.length === 0 ? (
            <p className="px-3 py-6 text-xs text-gray-400 dark:text-gray-500 text-center">
              {debouncedSearch
                ? '검색 결과가 없습니다'
                : '등록된 거래처가 없습니다'}
            </p>
          ) : (
            <>
              {clients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => {
                    onChange(client.id)
                    onSelectClient?.({ id: client.id, name: client.name })
                    handleOpenChange(false)
                  }}
                >
                  <span>{client.name}</span>
                  {value === client.id && (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  )}
                </button>
              ))}
              <div ref={sentinelRef} className="h-1" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-2">
                  <span className="inline-block w-3 h-3 border-2 border-gray-200 dark:border-gray-700 border-t-gray-500 dark:border-t-gray-400 rounded-full animate-spin" />
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
