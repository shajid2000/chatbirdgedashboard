import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export function useCustomers(filters = {}) {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: async () => {
      const { data } = await api.get('/customers/', { params: filters })
      return data
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
