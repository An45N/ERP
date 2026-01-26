import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { api } from '../lib/api';
import { useCompanyStore } from '../store/companyStore';
import { formatCurrency } from '../lib/utils';
import toast from 'react-hot-toast';

interface ForexGain {
  currency: string;
  realizedGain: number;
  unrealizedGain: number;
  totalGain: number;
  openPositions: number;
  closedPositions: number;
}

interface ForexSummary {
  totalRealizedGains: number;
  totalUnrealizedGains: number;
  totalGains: number;
  currencyBreakdown: ForexGain[];
}

export function ForexGains() {
  const companyId = useCompanyStore((state) => state.companyId);
  const [summary, setSummary] = useState<ForexSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForexGains();
  }, [companyId]);

  const fetchForexGains = async () => {
    try {
      const response = await api.get(`/forex-gains?companyId=${companyId}`);
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch forex gains:', error);
      toast.error('Failed to load forex gains');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-500">
            Loading forex gains...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-500">
            No forex data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Realized Gains</p>
                <p className={`text-2xl font-bold ${
                  summary.totalRealizedGains >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(summary.totalRealizedGains)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                summary.totalRealizedGains >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {summary.totalRealizedGains >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              From closed positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unrealized Gains</p>
                <p className={`text-2xl font-bold ${
                  summary.totalUnrealizedGains >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(summary.totalUnrealizedGains)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                summary.totalUnrealizedGains >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {summary.totalUnrealizedGains >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              From open positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Gains/Losses</p>
                <p className={`text-2xl font-bold ${
                  summary.totalGains >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(summary.totalGains)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Combined total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Currency Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Forex Gains by Currency</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.currencyBreakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No currency positions
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Currency</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Realized</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Unrealized</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Open</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.currencyBreakdown.map((gain) => (
                    <tr key={gain.currency} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{gain.currency}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        gain.realizedGain >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(gain.realizedGain)}
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        gain.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(gain.unrealizedGain)}
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        gain.totalGain >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(gain.totalGain)}
                      </td>
                      <td className="py-3 px-4 text-center">{gain.openPositions}</td>
                      <td className="py-3 px-4 text-center">{gain.closedPositions}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-bold">
                  <tr>
                    <td className="py-3 px-4">Total</td>
                    <td className={`py-3 px-4 text-right ${
                      summary.totalRealizedGains >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(summary.totalRealizedGains)}
                    </td>
                    <td className={`py-3 px-4 text-right ${
                      summary.totalUnrealizedGains >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(summary.totalUnrealizedGains)}
                    </td>
                    <td className={`py-3 px-4 text-right ${
                      summary.totalGains >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(summary.totalGains)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {summary.currencyBreakdown.reduce((sum, g) => sum + g.openPositions, 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {summary.currencyBreakdown.reduce((sum, g) => sum + g.closedPositions, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
