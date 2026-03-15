import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export function useMessages(customerId) {
  return useQuery({
    queryKey: ['messages', customerId],
    queryFn: async () => {
      const { data } = await api.get(`/customers/${customerId}/messages/`)
      return data
    },
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
