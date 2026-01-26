import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ArrowLeftRight, TrendingUp } from 'lucide-react';
import { api } from '../lib/api';
import { useCompanyStore } from '../store/companyStore';
import toast from 'react-hot-toast';

interface ConversionResult {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  rate: number;
  inverseRate: number;
  effectiveDate: string;
}

const currencies = [
  { code: "MUR", name: "Mauritian Rupee", symbol: "Rs" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
];

export function CurrencyConverter() {
  const companyId = useCompanyStore((state) => state.companyId);
  const [amount, setAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState('MUR');
  const [toCurrency, setToCurrency] = useState('USD');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      handleConvert();
    }
  }, [fromCurrency, toCurrency]);

  const handleConvert = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/exchange-rates/convert', {
        amount: parseFloat(amount),
        fromCurrency,
        toCurrency,
        companyId,
      });
      setResult(response.data);
    } catch (error) {
      console.error('Conversion failed:', error);
      toast.error('Failed to convert currency');
    } finally {
      setLoading(false);
    }
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const getCurrencySymbol = (code: string) => {
    return currencies.find(c => c.code === code)?.symbol || code;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Currency Converter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          {/* From Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From
            </label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwapCurrencies}
              className="rounded-full"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </div>

          {/* To Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To
            </label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Convert Button */}
          <Button onClick={handleConvert} disabled={loading} className="w-full">
            {loading ? 'Converting...' : 'Convert'}
          </Button>

          {/* Result */}
          {result && (
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-1">
                  {result.fromAmount.toLocaleString()} {result.fromCurrency}
                </p>
                <p className="text-3xl font-bold text-primary">
                  {getCurrencySymbol(result.toCurrency)} {result.toAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {result.toCurrency}
                </p>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Exchange Rate:</span>
                  <span className="font-medium">
                    1 {result.fromCurrency} = {result.rate.toFixed(4)} {result.toCurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Inverse Rate:</span>
                  <span className="font-medium">
                    1 {result.toCurrency} = {result.inverseRate.toFixed(4)} {result.fromCurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Rate Date:</span>
                  <span className="font-medium">
                    {new Date(result.effectiveDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
