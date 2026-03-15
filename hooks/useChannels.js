import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      const { data } = await api.get('/channels/')
      return data.filter((c) => c.status === 'active')
    },
    staleTime: 60_000,
  })
}
