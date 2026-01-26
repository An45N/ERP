import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { showToast } from '../../lib/toast';
import type { Invoice, BankAccount } from '../../types';

const paymentSchema = z.object({
  paymentDate: z.string().min(1, 'Payment date is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  reference: z.string(),
  bankAccountId: z.string().optional(),
  notes: z.string(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice: Invoice;
  companyId: string;
}

export function PaymentModal({ isOpen, onClose, onSuccess, invoice, companyId }: PaymentModalProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const balanceAmount = invoice.total - invoice.paidAmount;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
      amount: balanceAmount,
      paymentMethod: 'BANK_TRANSFER',
      reference: '',
      bankAccountId: '',
      notes: '',
    },
  });

  const watchPaymentMethod = watch('paymentMethod');

  useEffect(() => {
    if (isOpen) {
      fetchBankAccounts();
    } else {
      setLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchBankAccounts = async () => {
    try {
      const response = await api.get<{ bankAccounts: BankAccount[] }>(`/bank/accounts?companyId=${companyId}`);
      setBankAccounts(response.data.bankAccounts.filter(a => a.isActive));
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
      showToast.error('Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    const toastId = showToast.loading('Recording payment...');
    
    try {
      const payload = {
        ...data,
        reference: data.reference || null,
        notes: data.notes || null,
        bankAccountId: data.bankAccountId || null,
      };

      await api.post(`/invoices/${invoice.id}/payments`, payload);
      showToast.dismiss(toastId);
      showToast.success('Payment recorded successfully');

      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast.dismiss(toastId);
      const errorMessage = error.response?.data?.error || 'Failed to record payment';
      showToast.error(errorMessage);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CHECK', label: 'Check' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'DEBIT_CARD', label: 'Debit Card' },
    { value: 'MOBILE_MONEY', label: 'Mobile Money' },
    { value: 'OTHER', label: 'Other' },
  ];

  if (loading && isOpen) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Loading..." size="md">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading form data...</div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Payment"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Invoice Number</p>
              <p className="font-semibold">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-gray-600">Customer</p>
              <p className="font-semibold">{invoice.customer?.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Invoice Total</p>
              <p className="font-semibold">MUR {invoice.total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Amount Paid</p>
              <p className="font-semibold">MUR {invoice.paidAmount.toFixed(2)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600">Balance Due</p>
              <p className="text-xl font-bold text-blue-600">MUR {balanceAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              {...register('paymentDate')}
              className={errors.paymentDate ? 'border-red-500' : ''}
            />
            {errors.paymentDate && (
              <p className="text-red-500 text-sm mt-1">{errors.paymentDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              {...register('amount')}
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method <span className="text-red-500">*</span>
          </label>
          <select
            {...register('paymentMethod')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {paymentMethods.map(method => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
          {errors.paymentMethod && (
            <p className="text-red-500 text-sm mt-1">{errors.paymentMethod.message}</p>
          )}
        </div>

        {(watchPaymentMethod === 'BANK_TRANSFER' || watchPaymentMethod === 'CHECK') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Account
            </label>
            <select
              {...register('bankAccountId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select bank account...</option>
              {bankAccounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.accountNumber}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference
          </label>
          <Input
            {...register('reference')}
            placeholder="Check number, transaction ID, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Additional notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
