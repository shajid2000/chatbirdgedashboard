import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export function useAIConfig() {
  return useQuery({
    queryKey: ['ai-config'],
    queryFn: async () => {
      const { data } = await api.get('/ai/config/')
      return data
    },
    retry: false,
  })
}

export function useUpdateAIConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.patch('/ai/config/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-config'] })
    },
  })
}
