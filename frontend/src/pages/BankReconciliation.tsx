import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Upload, Check, X, RefreshCw, Download, Search, AlertCircle } from "lucide-react";
import { api } from "../lib/api";
import { useCompanyStore } from "../store/companyStore";
import { formatCurrency, formatDate } from "../lib/utils";
import toast from "react-hot-toast";

interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
  currency: string;
}

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  matched: boolean;
  matchedWith?: string;
}

interface SystemTransaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  matched: boolean;
}

interface Reconciliation {
  id: string;
  accountId: string;
  accountName: string;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  status: 'in_progress' | 'completed';
  matchedCount: number;
  unmatchedCount: number;
  createdAt: string;
}

type ReconciliationStep = 'select_account' | 'import_statement' | 'match_transactions' | 'review';

export function BankReconciliation() {
  const companyId = useCompanyStore((state) => state.companyId);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [systemTransactions, setSystemTransactions] = useState<SystemTransaction[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [currentStep, setCurrentStep] = useState<ReconciliationStep>('select_account');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBankTxn, setSelectedBankTxn] = useState<BankTransaction | null>(null);
  const [matchSuggestions, setMatchSuggestions] = useState<SystemTransaction[]>([]);

  useEffect(() => {
    fetchAccounts();
    fetchReconciliations();
  }, [companyId]);

  const fetchAccounts = async () => {
    try {
      const response = await api.get(`/accounts?companyId=${companyId}&type=BANK`);
      setAccounts(response.data.accounts || []);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
      toast.error("Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  };

  const fetchReconciliations = async () => {
    try {
      const response = await api.get(`/reconciliations?companyId=${companyId}`);
      setReconciliations(response.data.reconciliations || []);
    } catch (error) {
      console.error("Failed to fetch reconciliations:", error);
    }
  };

  const handleSelectAccount = (account: BankAccount) => {
    setSelectedAccount(account);
    setCurrentStep('import_statement');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountId', selectedAccount!.id);
    formData.append('companyId', companyId);

    setImporting(true);
    try {
      const response = await api.post('/reconciliations/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setBankTransactions(response.data.bankTransactions || []);
      setSystemTransactions(response.data.systemTransactions || []);
      toast.success(`Imported ${response.data.bankTransactions?.length || 0} transactions`);
      setCurrentStep('match_transactions');
    } catch (error) {
      console.error("Failed to import statement:", error);
      toast.error("Failed to import bank statement");
    } finally {
      setImporting(false);
    }
  };

  const handleSelectBankTransaction = (txn: BankTransaction) => {
    if (txn.matched) return;
    
    setSelectedBankTxn(txn);
    
    // Find matching suggestions
    const amount = txn.debit || txn.credit;
    const suggestions = systemTransactions.filter(
      (sysTxn) =>
        !sysTxn.matched &&
        Math.abs(sysTxn.amount - amount) < 0.01 &&
        new Date(sysTxn.date).toDateString() === new Date(txn.date).toDateString()
    );
    
    setMatchSuggestions(suggestions);
  };

  const handleMatchTransactions = async (bankTxnId: string, sysTxnId: string) => {
    try {
      await api.post('/reconciliations/match', {
        bankTransactionId: bankTxnId,
        systemTransactionId: sysTxnId,
        companyId,
      });

      // Update local state
      setBankTransactions(prev =>
        prev.map(txn =>
          txn.id === bankTxnId ? { ...txn, matched: true, matchedWith: sysTxnId } : txn
        )
      );
      setSystemTransactions(prev =>
        prev.map(txn =>
          txn.id === sysTxnId ? { ...txn, matched: true } : txn
        )
      );

      setSelectedBankTxn(null);
      setMatchSuggestions([]);
      toast.success("Transactions matched successfully");
    } catch (error) {
      console.error("Failed to match transactions:", error);
      toast.error("Failed to match transactions");
    }
  };

  const handleUnmatch = async (bankTxnId: string) => {
    try {
      await api.post('/reconciliations/unmatch', {
        bankTransactionId: bankTxnId,
        companyId,
      });

      const bankTxn = bankTransactions.find(t => t.id === bankTxnId);
      
      setBankTransactions(prev =>
        prev.map(txn =>
          txn.id === bankTxnId ? { ...txn, matched: false, matchedWith: undefined } : txn
        )
      );
      
      if (bankTxn?.matchedWith) {
        setSystemTransactions(prev =>
          prev.map(txn =>
            txn.id === bankTxn.matchedWith ? { ...txn, matched: false } : txn
          )
        );
      }

      toast.success("Transaction unmatched");
    } catch (error) {
      console.error("Failed to unmatch transaction:", error);
      toast.error("Failed to unmatch transaction");
    }
  };

  const handleCompleteReconciliation = async () => {
    const unmatchedCount = bankTransactions.filter(t => !t.matched).length;
    
    if (unmatchedCount > 0) {
      if (!window.confirm(`There are ${unmatchedCount} unmatched transactions. Complete reconciliation anyway?`)) {
        return;
      }
    }

    try {
      await api.post('/reconciliations/complete', {
        accountId: selectedAccount!.id,
        companyId,
        bankTransactions,
        systemTransactions,
      });

      toast.success("Reconciliation completed successfully");
      setCurrentStep('select_account');
      setSelectedAccount(null);
      setBankTransactions([]);
      setSystemTransactions([]);
      fetchReconciliations();
    } catch (error) {
      console.error("Failed to complete reconciliation:", error);
      toast.error("Failed to complete reconciliation");
    }
  };

  const filteredBankTransactions = bankTransactions.filter(
    (txn) =>
      txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const matchedCount = bankTransactions.filter(t => t.matched).length;
  const unmatchedCount = bankTransactions.filter(t => !t.matched).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading bank accounts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bank Reconciliation</h1>
          <p className="text-gray-600 mt-2">Match bank statements with system transactions</p>
        </div>
        {currentStep !== 'select_account' && (
          <Button
            variant="outline"
            onClick={() => {
              setCurrentStep('select_account');
              setSelectedAccount(null);
              setBankTransactions([]);
              setSystemTransactions([]);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Start New
          </Button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[
          { step: 'select_account', label: 'Select Account' },
          { step: 'import_statement', label: 'Import Statement' },
          { step: 'match_transactions', label: 'Match Transactions' },
          { step: 'review', label: 'Review & Complete' },
        ].map((item, index) => (
          <div key={item.step} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep === item.step
                  ? 'bg-primary text-white'
                  : index < ['select_account', 'import_statement', 'match_transactions', 'review'].indexOf(currentStep)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index + 1}
            </div>
            <span className="ml-2 text-sm font-medium">{item.label}</span>
            {index < 3 && <div className="w-12 h-0.5 bg-gray-300 mx-4" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Account */}
      {currentStep === 'select_account' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="pt-6">
                <div className="text-center py-8 text-gray-500">
                  No bank accounts found. Please create a bank account first.
                </div>
              </CardContent>
            </Card>
          ) : (
            accounts.map((account) => (
              <Card
                key={account.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSelectAccount(account)}
              >
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">{account.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">Account: {account.accountNumber}</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(account.balance)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{account.currency}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Step 2: Import Statement */}
      {currentStep === 'import_statement' && selectedAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Import Bank Statement for {selectedAccount.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Bank Statement</h3>
              <p className="text-gray-600 mb-6">
                Supported formats: CSV, JSON
              </p>
              <label htmlFor="file-upload" className="cursor-pointer">
                <Button disabled={importing} as="span">
                  {importing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </>
                  )}
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="text-sm text-gray-500 mt-4">
                CSV format: Date, Description, Reference, Debit, Credit, Balance
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Match Transactions */}
      {currentStep === 'match_transactions' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold">{bankTransactions.length}</p>
                  </div>
                  <Download className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Matched</p>
                    <p className="text-2xl font-bold text-green-600">{matchedCount}</p>
                  </div>
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unmatched</p>
                    <p className="text-2xl font-bold text-orange-600">{unmatchedCount}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bank Transactions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Bank Statement</CardTitle>
                  <div className="relative w-48">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      size="sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredBankTransactions.map((txn) => (
                    <div
                      key={txn.id}
                      onClick={() => handleSelectBankTransaction(txn)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        txn.matched
                          ? 'bg-green-50 border-green-200'
                          : selectedBankTxn?.id === txn.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{txn.description}</p>
                          <p className="text-sm text-gray-600">{txn.reference}</p>
                          <p className="text-xs text-gray-500">{formatDate(txn.date)}</p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${
                              txn.debit ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            {formatCurrency(txn.debit || txn.credit)}
                          </p>
                          {txn.matched && (
                            <div className="flex items-center gap-1 text-green-600 text-xs mt-1">
                              <Check className="h-3 w-3" />
                              Matched
                            </div>
                          )}
                        </div>
                      </div>
                      {txn.matched && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnmatch(txn.id);
                          }}
                          className="w-full mt-2"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Unmatch
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Transactions / Match Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedBankTxn ? 'Match Suggestions' : 'System Transactions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedBankTxn ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        Selected Bank Transaction:
                      </p>
                      <p className="font-medium">{selectedBankTxn.description}</p>
                      <p className="text-sm text-gray-600">{formatDate(selectedBankTxn.date)}</p>
                      <p className="font-semibold text-primary">
                        {formatCurrency(selectedBankTxn.debit || selectedBankTxn.credit)}
                      </p>
                    </div>

                    {matchSuggestions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No matching suggestions found
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Click to match:
                        </p>
                        {matchSuggestions.map((sysTxn) => (
                          <div
                            key={sysTxn.id}
                            onClick={() => handleMatchTransactions(selectedBankTxn.id, sysTxn.id)}
                            className="p-4 border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{sysTxn.description}</p>
                                <p className="text-sm text-gray-600">{sysTxn.reference}</p>
                                <p className="text-xs text-gray-500">{formatDate(sysTxn.date)}</p>
                              </div>
                              <p className="font-semibold text-primary">
                                {formatCurrency(sysTxn.amount)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {systemTransactions
                      .filter((t) => !t.matched)
                      .map((txn) => (
                        <div
                          key={txn.id}
                          className="p-4 border rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{txn.description}</p>
                              <p className="text-sm text-gray-600">{txn.reference}</p>
                              <p className="text-xs text-gray-500">{formatDate(txn.date)}</p>
                            </div>
                            <p className="font-semibold">{formatCurrency(txn.amount)}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setCurrentStep('import_statement')}>
              Back
            </Button>
            <Button onClick={handleCompleteReconciliation}>
              Complete Reconciliation
            </Button>
          </div>
        </>
      )}

      {/* Reconciliation History */}
      {currentStep === 'select_account' && reconciliations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reconciliation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Account</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Period</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Opening</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Closing</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Matched</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliations.map((recon) => (
                    <tr key={recon.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{formatDate(recon.createdAt)}</td>
                      <td className="py-3 px-4 font-medium">{recon.accountName}</td>
                      <td className="py-3 px-4 text-sm">
                        {formatDate(recon.startDate)} - {formatDate(recon.endDate)}
                      </td>
                      <td className="py-3 px-4 text-right">{formatCurrency(recon.openingBalance)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(recon.closingBalance)}</td>
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {recon.matchedCount} / {recon.matchedCount + recon.unmatchedCount}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            recon.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {recon.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
