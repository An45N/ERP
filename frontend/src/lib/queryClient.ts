import { QueryClient } from '@tanstack/react-query';

// Create a query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes (gcTime in v5)
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Query keys for consistent cache management
export const queryKeys = {
  invoices: (companyId: string) => ['invoices', companyId] as const,
  invoice: (id: string) => ['invoice', id] as const,
  bills: (companyId: string) => ['bills', companyId] as const,
  bill: (id: string) => ['bill', id] as const,
  customers: (companyId: string) => ['customers', companyId] as const,
  customer: (id: string) => ['customer', id] as const,
  suppliers: (companyId: string) => ['suppliers', companyId] as const,
  supplier: (id: string) => ['supplier', id] as const,
  accounts: (companyId: string) => ['accounts', companyId] as const,
  journalEntries: (companyId: string) => ['journal-entries', companyId] as const,
  reports: (type: string, params: Record<string, any>) => ['reports', type, params] as const,
  dashboard: (companyId: string) => ['dashboard', companyId] as const,
  taxRates: (companyId: string) => ['tax-rates', companyId] as const,
  users: (companyId: string) => ['users', companyId] as const,
};
