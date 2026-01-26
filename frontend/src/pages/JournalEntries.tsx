import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Plus, Search, FileText, ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";
import { Pagination } from "../components/ui/Pagination";
import { formatDate, formatCurrency } from "../lib/utils";
import { exportToCSV, formatCurrencyForExport, formatDateForExport } from "../lib/export";
import { JournalEntryModal } from "../components/journal-entries/JournalEntryModal";
import type { JournalEntry, FiscalPeriod } from "../types";

export function JournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<keyof JournalEntry | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const companyId = "c5f61904-b52b-4e97-a1a7-1164cd5556d2";
      
      const [entriesRes, periodsRes] = await Promise.all([
        api.get<{ entries: JournalEntry[] }>(`/journal-entries?companyId=${companyId}`),
        api.get<{ periods: FiscalPeriod[] }>(`/fiscal-periods?companyId=${companyId}`)
      ]);

      setEntries(entriesRes.data.entries);
      setFiscalPeriods(periodsRes.data.periods);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (entryId: string) => {
    try {
      await api.post(`/journal-entries/${entryId}/post`);
      fetchData();
    } catch (error) {
      console.error("Failed to post entry:", error);
    }
  };

  const handleSort = (field: keyof JournalEntry) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: keyof JournalEntry) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-1 inline" /> : 
      <ArrowDown className="h-4 w-4 ml-1 inline" />;
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = 
      entry.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || entry.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];
    
    if (sortField === 'entryDate') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedEntries.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEntries = sortedEntries.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleExport = () => {
    const exportData = sortedEntries.map(entry => {
      const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
      return {
        entryNumber: entry.entryNumber,
        entryDate: formatDateForExport(entry.entryDate),
        description: entry.description,
        entryType: entry.entryType,
        amount: formatCurrencyForExport(totalDebit),
        status: entry.status,
        reference: entry.reference || '',
      };
    });

    exportToCSV(
      exportData,
      'journal-entries',
      [
        { key: 'entryNumber', label: 'Entry #' },
        { key: 'entryDate', label: 'Date' },
        { key: 'description', label: 'Description' },
        { key: 'entryType', label: 'Type' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
        { key: 'reference', label: 'Reference' },
      ]
    );
  };

  const statuses = ["ALL", "DRAFT", "POSTED", "REVERSED"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading journal entries...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
          <p className="text-gray-600 mt-2">Manage general ledger entries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Draft Entries</p>
                <p className="text-2xl font-bold">
                  {entries.filter(e => e.status === "DRAFT").length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Posted Entries</p>
                <p className="text-2xl font-bold">
                  {entries.filter(e => e.status === "POSTED").length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Periods</p>
                <p className="text-2xl font-bold">
                  {fiscalPeriods.filter(p => p.status === "OPEN").length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    filterStatus === status
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <button 
                      onClick={() => handleSort('entryNumber')}
                      className="flex items-center hover:text-gray-900"
                    >
                      Entry # {getSortIcon('entryNumber')}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <button 
                      onClick={() => handleSort('entryDate')}
                      className="flex items-center hover:text-gray-900"
                    >
                      Date {getSortIcon('entryDate')}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <button 
                      onClick={() => handleSort('description')}
                      className="flex items-center hover:text-gray-900"
                    >
                      Description {getSortIcon('description')}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <button 
                      onClick={() => handleSort('entryType')}
                      className="flex items-center hover:text-gray-900"
                    >
                      Type {getSortIcon('entryType')}
                    </button>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <button 
                      onClick={() => handleSort('status')}
                      className="flex items-center hover:text-gray-900"
                    >
                      Status {getSortIcon('status')}
                    </button>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntries.map((entry) => {
                  const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
                  return (
                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{entry.entryNumber}</td>
                      <td className="py-3 px-4 text-sm">{formatDate(entry.entryDate)}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{entry.description}</div>
                        {entry.reference && (
                          <div className="text-sm text-gray-600">Ref: {entry.reference}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">{entry.entryType}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(totalDebit)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.status === "POSTED" ? "bg-green-100 text-green-800" :
                          entry.status === "DRAFT" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                          {entry.status === "DRAFT" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePost(entry.id)}
                            >
                              Post
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
            {sortedEntries.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No journal entries found
              </div>
            )}
          
          {sortedEntries.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={sortedEntries.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <JournalEntryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchData}
        companyId="c5f61904-b52b-4e97-a1a7-1164cd5556d2"
      />
    </div>
  );
}
