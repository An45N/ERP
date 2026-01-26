import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Search, Filter, Download } from "lucide-react";
import { DateRangeFilter } from "../../components/ui/DateRangeFilter";
import { DropdownFilter } from "../../components/ui/DropdownFilter";
import { Pagination } from "../../components/ui/Pagination";
import { api } from "../../lib/api";
import { useCompanyStore } from "../../store/companyStore";
import { formatDate } from "../../lib/utils";
import toast from "react-hot-toast";

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export function AdminAuditLogs() {
  const companyId = useCompanyStore((state) => state.companyId);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const response = await api.get(`/audit-logs?companyId=${companyId}`);
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDateRange =
      (!filterStartDate || new Date(log.timestamp) >= new Date(filterStartDate)) &&
      (!filterEndDate || new Date(log.timestamp) <= new Date(filterEndDate));
    const matchesAction = !filterAction || log.action === filterAction;
    const matchesEntity = !filterEntity || log.entity === filterEntity;
    return matchesSearch && matchesDateRange && matchesAction && matchesEntity;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  const actions = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "EXPORT"];
  const entities = ["INVOICE", "BILL", "CUSTOMER", "SUPPLIER", "JOURNAL_ENTRY", "USER"];

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "LOGIN":
        return "bg-purple-100 text-purple-800";
      case "EXPORT":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading audit logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-gray-600 mt-1">Track all system activities and changes</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <DateRangeFilter
                  startDate={filterStartDate}
                  endDate={filterEndDate}
                  onStartDateChange={setFilterStartDate}
                  onEndDateChange={setFilterEndDate}
                  onClear={() => {
                    setFilterStartDate("");
                    setFilterEndDate("");
                  }}
                  label="Date Range"
                />
                <DropdownFilter
                  value={filterAction}
                  onChange={setFilterAction}
                  options={actions.map((a) => ({ value: a, label: a }))}
                  label="Action"
                  placeholder="All Actions"
                />
                <DropdownFilter
                  value={filterEntity}
                  onChange={setFilterEntity}
                  options={entities.map((e) => ({ value: e, label: e }))}
                  label="Entity"
                  placeholder="All Entities"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Timestamp</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Entity</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Entity ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">IP Address</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Details</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 font-medium">{log.userName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">{log.entity}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                      {log.entityId.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{log.ipAddress}</td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-gray-500">No audit logs found</div>
          )}

          {filteredLogs.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredLogs.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
