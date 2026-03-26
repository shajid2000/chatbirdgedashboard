import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export function useInfiniteCustomers(filters = {}) {
  return useInfiniteQuery({
    queryKey: ['customers', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get('/customers/', { params: { ...filters, page: pageParam } })
      return data // { count, next, previous, results }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined
      const url = new URL(lastPage.next)
      return Number(url.searchParams.get('page'))
    },
  })
}

export function useCustomer(customerId) {
  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const { data } = await api.get(`/customers/${customerId}/`)
      return data
    },
    enabled: !!customerId,
  })
}

export function useUpdateCustomer(customerId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api.patch(`/customers/${customerId}/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useAssignAgent(customerId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (agentId) => api.post(`/customers/${customerId}/assign/`, { agent_id: agentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useUpdateStatus(customerId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (status) => api.post(`/customers/${customerId}/status/`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useMergeCustomer(customerId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (mergeIds) => api.post(`/customers/${customerId}/merge/`, { merge_ids: mergeIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['messages', customerId] })
    },
  })
}
