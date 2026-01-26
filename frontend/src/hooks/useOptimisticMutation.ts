import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface OptimisticMutationOptions<TData, TVariables> {
  queryKey: any[];
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccessMessage?: string;
  onErrorMessage?: string;
  updateCache?: (oldData: any, variables: TVariables) => any;
}

/**
 * Custom hook for optimistic updates
 * Immediately updates the UI before the server responds
 */
export function useOptimisticMutation<TData = any, TVariables = any>({
  queryKey,
  mutationFn,
  onSuccessMessage,
  onErrorMessage,
  updateCache,
}: OptimisticMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update to the new value
      if (updateCache && previousData) {
        queryClient.setQueryData(queryKey, (old: any) => updateCache(old, variables));
      }

      // Return context with the previous data
      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback to the previous value on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      
      console.error('Mutation error:', error);
      if (onErrorMessage) {
        toast.error(onErrorMessage);
      }
    },
    onSuccess: () => {
      if (onSuccessMessage) {
        toast.success(onSuccessMessage);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// Example usage hooks for common operations

export function useCreateInvoice(companyId: string) {
  return useOptimisticMutation({
    queryKey: ['invoices', companyId],
    mutationFn: (data: any) => api.post('/invoices', data).then(res => res.data),
    onSuccessMessage: 'Invoice created successfully',
    onErrorMessage: 'Failed to create invoice',
    updateCache: (oldData, newInvoice) => ({
      ...oldData,
      invoices: [newInvoice, ...(oldData.invoices || [])],
    }),
  });
}

export function useUpdateInvoice(companyId: string) {
  return useOptimisticMutation({
    queryKey: ['invoices', companyId],
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.put(`/invoices/${id}`, data).then(res => res.data),
    onSuccessMessage: 'Invoice updated successfully',
    onErrorMessage: 'Failed to update invoice',
    updateCache: (oldData, { id, data }) => ({
      ...oldData,
      invoices: oldData.invoices.map((inv: any) => 
        inv.id === id ? { ...inv, ...data } : inv
      ),
    }),
  });
}

export function useDeleteInvoice(companyId: string) {
  return useOptimisticMutation({
    queryKey: ['invoices', companyId],
    mutationFn: (id: string) => api.delete(`/invoices/${id}`).then(res => res.data),
    onSuccessMessage: 'Invoice deleted successfully',
    onErrorMessage: 'Failed to delete invoice',
    updateCache: (oldData, id) => ({
      ...oldData,
      invoices: oldData.invoices.filter((inv: any) => inv.id !== id),
    }),
  });
}
