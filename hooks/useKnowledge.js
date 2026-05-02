import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export function useKnowledgeChunks({ search = '', source = '', page = 1 } = {}) {
  return useQuery({
    queryKey: ['knowledge', { search, source, page }],
    queryFn: () => {
      const params = new URLSearchParams({ page })
      if (search) params.set('search', search)
      if (source) params.set('source', source)
      return api.get(`/knowledge/?${params}`).then(r => r.data)
    },
    keepPreviousData: true,
  })
}

export function useCreateKnowledgeChunk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post('/knowledge/', payload).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge'] }),
  })
}

export function useDeleteKnowledgeChunk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/knowledge/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge'] }),
  })
}

export function useKnowledgeFromUrl() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post('/knowledge/from-url/', payload).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge'] }),
  })
}
