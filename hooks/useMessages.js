import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

function extractCursor(url) {
  if (!url) return undefined
  try {
    return new URL(url).searchParams.get('cursor') || undefined
  } catch {
    return undefined
  }
}

export function useMessages(customerId) {
  return useInfiniteQuery({
    queryKey: ['messages', customerId],
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? { cursor: pageParam } : {}
      const { data } = await api.get(`/customers/${customerId}/messages/`, { params })
      return data
    },
    getNextPageParam: (lastPage) => extractCursor(lastPage.next),
    initialPageParam: null,
    enabled: !!customerId,
    refetchOnWindowFocus: false,
  })
}

export function useSendMessage(customerId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post(`/customers/${customerId}/messages/send/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', customerId] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}
