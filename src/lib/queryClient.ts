import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

export const STALE_FOREVER = Number.POSITIVE_INFINITY
export const STALE_30M = 1000 * 60 * 30
