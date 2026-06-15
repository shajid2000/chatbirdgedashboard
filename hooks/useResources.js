import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

// ── Resource Types ────────────────────────────────────────────────────────────

export function useResourceTypes() {
  return useQuery({
    queryKey: ['resource-types'],
    queryFn: () => api.get('/resources/types/').then(r => r.data),
  })
}

export function useCreateResourceType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post('/resources/types/', payload).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resource-types'] }),
  })
}

export function useDeleteResourceType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/resources/types/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resource-types'] }),
  })
}

// ── Resources ─────────────────────────────────────────────────────────────────

export function useResources({ typeId = '' } = {}) {
  return useQuery({
    queryKey: ['resources', { typeId }],
    queryFn: () => {
      const params = new URLSearchParams()
      if (typeId) params.set('type_id', typeId)
      return api.get(`/resources/?${params}`).then(r => r.data)
    },
    keepPreviousData: true,
  })
}

export function useCreateResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post('/resources/', payload).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  })
}

export function useDeleteResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/resources/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  })
}

// ── Availability Entries (scratchpad) ─────────────────────────────────────────

export function useAvailabilityEntries({ date = '', dateFrom = '', dateTo = '', typeId = '', resourceId = '' } = {}) {
  return useQuery({
    queryKey: ['availability', { date, dateFrom, dateTo, typeId, resourceId }],
    queryFn: () => {
      const params = new URLSearchParams()
      if (date)       params.set('date', date)
      if (dateFrom)   params.set('date_from', dateFrom)
      if (dateTo)     params.set('date_to', dateTo)
      if (typeId)     params.set('type_id', typeId)
      if (resourceId) params.set('resource_id', resourceId)
      return api.get(`/resources/availability/?${params}`).then(r => r.data)
    },
    keepPreviousData: true,
  })
}

export function useCreateAvailabilityEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.post('/resources/availability/', payload).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability'] }),
  })
}

export function useDeleteAvailabilityEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/resources/availability/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability'] }),
  })
}
