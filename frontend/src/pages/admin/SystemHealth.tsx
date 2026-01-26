import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { 
  Activity, 
  Database, 
  Server, 
  HardDrive,
  Cpu,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { api } from "../../lib/api";
import toast from "react-hot-toast";

interface SystemMetrics {
  database: {
    status: "healthy" | "warning" | "error";
    connections: number;
    maxConnections: number;
    size: string;
  };
  server: {
    status: "healthy" | "warning" | "error";
    uptime: string;
    memory: {
      used: string;
      total: string;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
  api: {
    status: "healthy" | "warning" | "error";
    responseTime: number;
    requestsPerMinute: number;
  };
  storage: {
    status: "healthy" | "warning" | "error";
    used: string;
    total: string;
    percentage: number;
  };
}

export function AdminSystemHealth() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await api.get("/system/health");
      setMetrics(response.data);
    } catch (error) {
      console.error("Failed to fetch system metrics:", error);
      toast.error("Failed to load system health");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading system health...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Unable to load system metrics</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Health</h2>
          <p className="text-gray-600 mt-1">Monitor system performance and status</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Database Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-base">Database</CardTitle>
              </div>
              {getStatusIcon(metrics.database.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold px-2 py-1 rounded-full text-xs ${getStatusColor(metrics.database.status)}`}>
                  {metrics.database.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Connections:</span>
                <span className="font-medium">{metrics.database.connections}/{metrics.database.maxConnections}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium">{metrics.database.size}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Server Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Server className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-base">Server</CardTitle>
              </div>
              {getStatusIcon(metrics.server.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold px-2 py-1 rounded-full text-xs ${getStatusColor(metrics.server.status)}`}>
                  {metrics.server.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uptime:</span>
                <span className="font-medium">{metrics.server.uptime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Memory:</span>
                <span className="font-medium">{metrics.server.memory.percentage}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-base">API</CardTitle>
              </div>
              {getStatusIcon(metrics.api.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold px-2 py-1 rounded-full text-xs ${getStatusColor(metrics.api.status)}`}>
                  {metrics.api.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Response Time:</span>
                <span className="font-medium">{metrics.api.responseTime}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Requests/min:</span>
                <span className="font-medium">{metrics.api.requestsPerMinute}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <HardDrive className="h-5 w-5 text-orange-600" />
                </div>
                <CardTitle className="text-base">Storage</CardTitle>
              </div>
              {getStatusIcon(metrics.storage.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold px-2 py-1 rounded-full text-xs ${getStatusColor(metrics.storage.status)}`}>
                  {metrics.storage.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used:</span>
                <span className="font-medium">{metrics.storage.used}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">{metrics.storage.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Cpu className="h-5 w-5 text-gray-600" />
              <CardTitle>CPU & Memory Usage</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">CPU Usage</span>
                  <span className="text-sm font-semibold">{metrics.server.cpu.usage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${metrics.server.cpu.usage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                  <span className="text-sm font-semibold">
                    {metrics.server.memory.used} / {metrics.server.memory.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${metrics.server.memory.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-gray-600" />
              <CardTitle>Storage Usage</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Disk Usage</span>
                  <span className="text-sm font-semibold">
                    {metrics.storage.used} / {metrics.storage.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      metrics.storage.percentage > 80 ? 'bg-red-600' :
                      metrics.storage.percentage > 60 ? 'bg-yellow-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${metrics.storage.percentage}%` }}
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Database size: {metrics.database.size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
