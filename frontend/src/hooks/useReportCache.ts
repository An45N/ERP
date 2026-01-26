import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryClient';

interface ReportParams {
  companyId: string;
  startDate?: string;
  endDate?: string;
  accountId?: string;
  customerId?: string;
  [key: string]: any;
}

/**
 * Custom hook for cached report generation
 * Automatically caches reports for 10 minutes to improve performance
 */
export function useReportCache(
  reportType: string,
  params: ReportParams,
  enabled: boolean = true
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.reports(reportType, params),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await api.get(`/reports/${reportType}?${queryParams.toString()}`);
      return response.data;
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const invalidateReport = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.reports(reportType, params) });
  };

  const prefetchReport = async (prefetchParams: ReportParams) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.reports(reportType, prefetchParams),
      queryFn: async () => {
        const queryParams = new URLSearchParams();
        Object.entries(prefetchParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });

        const response = await api.get(`/reports/${reportType}?${queryParams.toString()}`);
        return response.data;
      },
    });
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidateReport,
    prefetchReport,
  };
}

/**
 * Hook to invalidate all report caches
 */
export function useInvalidateAllReports() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        const key = query.queryKey[0];
        return key === 'reports';
      }
    });
  };
}

/**
 * Hook to clear all report caches
 */
export function useClearReportCache() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({ 
      predicate: (query) => {
        const key = query.queryKey[0];
        return key === 'reports';
      }
    });
  };
}
