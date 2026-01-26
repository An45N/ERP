import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckCircle, XCircle, Clock, User, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useCompanyStore } from '../store/companyStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDate } from '../lib/utils';
import toast from 'react-hot-toast';

interface PendingApproval {
  id: string;
  entityType: 'invoice' | 'bill' | 'payment' | 'journal_entry';
  entityId: string;
  entityNumber: string;
  amount: number;
  description: string;
  requestedBy: string;
  requestedAt: string;
  currentApprover: string;
  approvalLevel: number;
  totalLevels: number;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
}

interface ApprovalHistory {
  id: string;
  entityType: string;
  entityNumber: string;
  amount: number;
  requestedBy: string;
  approvedBy?: string;
  rejectedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  comments?: string;
  status: 'approved' | 'rejected';
}

export function ApprovalWorkflows() {
  const companyId = useCompanyStore((state) => state.companyId);
  const user = useAuthStore((state) => state.user);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [myApprovals, setMyApprovals] = useState<PendingApproval[]>([]);
  const [history, setHistory] = useState<ApprovalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'my_approvals' | 'history'>('my_approvals');

  useEffect(() => {
    fetchApprovals();
  }, [companyId, user]);

  const fetchApprovals = async () => {
    try {
      const [pendingRes, myApprovalsRes, historyRes] = await Promise.all([
        api.get(`/approvals/pending?companyId=${companyId}`),
        api.get(`/approvals/my-approvals?companyId=${companyId}&userId=${user?.id}`),
        api.get(`/approvals/history?companyId=${companyId}&limit=50`),
      ]);

      setPendingApprovals(pendingRes.data.approvals || []);
      setMyApprovals(myApprovalsRes.data.approvals || []);
      setHistory(historyRes.data.history || []);
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    const comments = prompt('Add approval comments (optional):');
    
    try {
      await api.post(`/approvals/${approvalId}/approve`, {
        userId: user?.id,
        comments,
      });
      toast.success('Approved successfully');
      fetchApprovals();
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (approvalId: string) => {
    const comments = prompt('Rejection reason (required):');
    
    if (!comments) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      await api.post(`/approvals/${approvalId}/reject`, {
        userId: user?.id,
        comments,
      });
      toast.success('Rejected successfully');
      fetchApprovals();
    } catch (error) {
      console.error('Failed to reject:', error);
      toast.error('Failed to reject');
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'invoice': return '📄';
      case 'bill': return '🧾';
      case 'payment': return '💰';
      case 'journal_entry': return '📝';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading approvals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Approval Workflows</h1>
        <p className="text-gray-600 mt-2">Review and approve pending transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Awaiting My Approval</p>
                <p className="text-2xl font-bold text-orange-600">{myApprovals.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pending</p>
                <p className="text-2xl font-bold">{pendingApprovals.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {history.filter(h => 
                    h.status === 'approved' && 
                    new Date(h.approvedAt!).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected Today</p>
                <p className="text-2xl font-bold text-red-600">
                  {history.filter(h => 
                    h.status === 'rejected' && 
                    new Date(h.rejectedAt!).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'my_approvals' as const, label: 'My Approvals', count: myApprovals.length },
            { id: 'pending' as const, label: 'All Pending', count: pendingApprovals.length },
            { id: 'history' as const, label: 'History', count: history.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* My Approvals Tab */}
      {activeTab === 'my_approvals' && (
        <Card>
          <CardHeader>
            <CardTitle>Awaiting My Approval</CardTitle>
          </CardHeader>
          <CardContent>
            {myApprovals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pending approvals
              </div>
            ) : (
              <div className="space-y-4">
                {myApprovals.map((approval) => (
                  <div key={approval.id} className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{getEntityIcon(approval.entityType)}</span>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {approval.entityType.replace('_', ' ').toUpperCase()} {approval.entityNumber}
                          </h3>
                          <p className="text-sm text-gray-600">{approval.description}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Requested by {approval.requestedBy} on {formatDate(approval.requestedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">{formatCurrency(approval.amount)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Level {approval.approvalLevel} of {approval.totalLevels}
                        </p>
                      </div>
                    </div>
                    {approval.comments && (
                      <div className="mb-3 p-3 bg-gray-50 rounded text-sm">
                        <p className="font-medium text-gray-700">Comments:</p>
                        <p className="text-gray-600">{approval.comments}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(approval.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReject(approval.id)}
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Pending Tab */}
      {activeTab === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle>All Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pending approvals
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Number</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Requested By</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Approver</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovals.map((approval) => (
                      <tr key={approval.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            {approval.entityType.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium">{approval.entityNumber}</td>
                        <td className="py-3 px-4">{approval.description}</td>
                        <td className="py-3 px-4 text-right font-semibold">{formatCurrency(approval.amount)}</td>
                        <td className="py-3 px-4 text-sm">{approval.requestedBy}</td>
                        <td className="py-3 px-4 text-sm">{approval.currentApprover}</td>
                        <td className="py-3 px-4 text-center text-sm">
                          {approval.approvalLevel}/{approval.totalLevels}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Approval History</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No approval history
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Number</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Requested By</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Action By</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {item.entityType.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium">{item.entityNumber}</td>
                        <td className="py-3 px-4 text-right font-semibold">{formatCurrency(item.amount)}</td>
                        <td className="py-3 px-4 text-sm">{item.requestedBy}</td>
                        <td className="py-3 px-4 text-sm">{item.approvedBy || item.rejectedBy}</td>
                        <td className="py-3 px-4 text-sm">
                          {formatDate(item.approvedAt || item.rejectedAt!)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">{item.comments || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
