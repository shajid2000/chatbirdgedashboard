import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export function useSourceConnections() {
  return useQuery({
    queryKey: ['source-connections'],
    queryFn: async () => {
      const { data } = await api.get('/sources/')
      return data
    },
  })
}

// Phase A — returns { login_url }
// Phase B — called with auth_code (full redirect URL), returns connection
export function useConnectSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post('/sources/connect/', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-connections'] })
      queryClient.invalidateQueries({ queryKey: ['channels-all'] })
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

// PATCH — assign selected page after multi-page Messenger connect
export function useAssignSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.patch('/sources/assign/', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-connections'] })
      queryClient.invalidateQueries({ queryKey: ['channels-all'] })
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

// DELETE — disconnect source connection
export function useDisconnectSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/sources/connect/${id}/`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-connections'] })
      queryClient.invalidateQueries({ queryKey: ['channels-all'] })
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}
