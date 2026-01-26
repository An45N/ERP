import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { RefreshCw, Trash2, Database } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useInvalidateAllReports, useClearReportCache } from '../hooks/useReportCache';
import toast from 'react-hot-toast';

export function ReportCacheManager() {
  const queryClient = useQueryClient();
  const invalidateAllReports = useInvalidateAllReports();
  const clearReportCache = useClearReportCache();

  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const allQueries = cache.getAll();
    const reportQueries = allQueries.filter(q => q.queryKey[0] === 'reports');
    
    return {
      total: reportQueries.length,
      fresh: reportQueries.filter(q => q.state.dataUpdatedAt > Date.now() - 10 * 60 * 1000).length,
      stale: reportQueries.filter(q => q.state.dataUpdatedAt <= Date.now() - 10 * 60 * 1000).length,
    };
  };

  const stats = getCacheStats();

  const handleRefreshAll = () => {
    invalidateAllReports();
    toast.success('All report caches invalidated');
  };

  const handleClearAll = () => {
    if (!window.confirm('Clear all cached reports? They will need to be regenerated.')) {
      return;
    }
    clearReportCache();
    toast.success('All report caches cleared');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Report Cache Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Cached</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Fresh</p>
              <p className="text-2xl font-bold text-green-900">{stats.fresh}</p>
            </div>
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Stale</p>
              <p className="text-2xl font-bold text-orange-900">{stats.stale}</p>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Cache Duration:</strong> Reports are cached for 10 minutes after generation.
              Fresh reports load instantly without API calls.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefreshAll}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
