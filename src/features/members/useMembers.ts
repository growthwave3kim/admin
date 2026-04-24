import { useQuery } from '@tanstack/react-query'
import { fetchMembers } from './queries'

export const useMembers = () => {
  return useQuery({
    queryKey: ['members'],
    queryFn: fetchMembers,
    staleTime: 10 * 60 * 1000,
  })
}
