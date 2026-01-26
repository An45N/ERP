import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { showToast } from '../../lib/toast';
import { Plus, Trash2 } from 'lucide-react';
import type { Bill, Supplier, Account, TaxRate } from '../../types';

const billLineSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be positive'),
  taxRateId: z.string().nullable(),
  accountId: z.string().min(1, 'Account is required'),
});

const billSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  billDate: z.string().min(1, 'Bill date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  reference: z.string(),
  notes: z.string(),
  lines: z.array(billLineSchema).min(1, 'At least one line item is required'),
});

type BillFormData = z.infer<typeof billSchema>;

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bill?: Bill;
  companyId: string;
}

export function BillModal({ isOpen, onClose, onSuccess, bill, companyId }: BillModalProps) {
  const isEditing = !!bill;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
  } = useForm<BillFormData>({
    resolver: zodResolver(billSchema) as any,
    defaultValues: bill ? {
      supplierId: bill.supplierId,
      billDate: bill.billDate.split('T')[0],
      dueDate: bill.dueDate.split('T')[0],
      reference: '',
      notes: '',
      lines: bill.lines.map(line => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRateId: line.taxRateId,
        accountId: line.accountId,
      })),
    } : {
      supplierId: '',
      billDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reference: '',
      notes: '',
      lines: [{ description: '', quantity: 1, unitPrice: 0, taxRateId: null, accountId: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const watchLines = watch('lines');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    } else {
      setLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [suppliersRes, accountsRes, taxRatesRes] = await Promise.all([
        api.get<{ suppliers: Supplier[] }>(`/suppliers?companyId=${companyId}`),
        api.get<{ accounts: Account[] }>(`/accounts?companyId=${companyId}&type=EXPENSE`),
        api.get<{ taxRates: TaxRate[] }>(`/tax-rates?companyId=${companyId}`),
      ]);
      setSuppliers(suppliersRes.data.suppliers.filter(s => s.isActive));
      setAccounts(accountsRes.data.accounts.filter(a => a.isActive));
      setTaxRates(taxRatesRes.data.taxRates.filter(t => t.isActive));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const calculateLineTotal = (index: number) => {
    const line = watchLines[index];
    if (!line) return 0;
    
    const subtotal = (line.quantity || 0) * (line.unitPrice || 0);
    const taxRate = taxRates.find(t => t.id === line.taxRateId);
    const taxAmount = taxRate ? subtotal * (taxRate.rate / 100) : 0;
    
    return subtotal + taxAmount;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;

    watchLines.forEach((line) => {
      const lineSubtotal = (line.quantity || 0) * (line.unitPrice || 0);
      subtotal += lineSubtotal;

      const taxRate = taxRates.find(t => t.id === line.taxRateId);
      if (taxRate) {
        taxAmount += lineSubtotal * (taxRate.rate / 100);
      }
    });

    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    };
  };

  const totals = calculateTotals();

  const onSubmit = async (data: BillFormData) => {
    const toastId = showToast.loading(isEditing ? 'Updating bill...' : 'Creating bill...');
    
    try {
      const payload = {
        ...data,
        companyId,
        reference: data.reference || null,
        notes: data.notes || null,
        lines: data.lines.map(line => ({
          ...line,
          taxRateId: line.taxRateId || null,
        })),
      };

      if (isEditing) {
        await api.patch(`/bills/${bill.id}`, payload);
        showToast.dismiss(toastId);
        showToast.success('Bill updated successfully');
      } else {
        await api.post('/bills', payload);
        showToast.dismiss(toastId);
        showToast.success('Bill created successfully');
      }

      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast.dismiss(toastId);
      const errorMessage = error.response?.data?.error || 'Failed to save bill';
      showToast.error(errorMessage);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const addLine = () => {
    append({ description: '', quantity: 1, unitPrice: 0, taxRateId: null, accountId: '' });
  };

  if (loading && isOpen) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Loading..." size="xl">
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
      title={isEditing ? 'Edit Bill' : 'New Bill'}
      size="xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="text-left">
            <div className="text-sm text-gray-600">
              Subtotal: <span className="font-semibold">MUR {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="text-sm text-gray-600">
              Tax: <span className="font-semibold">MUR {totals.taxAmount.toFixed(2)}</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              Total: MUR {totals.total.toFixed(2)}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit as any)} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              {...register('supplierId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select supplier...</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} ({supplier.code})
                </option>
              ))}
            </select>
            {errors.supplierId && (
              <p className="text-red-500 text-sm mt-1">{errors.supplierId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference
            </label>
            <Input
              {...register('reference')}
              placeholder="Invoice #12345"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bill Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              {...register('billDate')}
              className={errors.billDate ? 'border-red-500' : ''}
            />
            {errors.billDate && (
              <p className="text-red-500 text-sm mt-1">{errors.billDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              {...register('dueDate')}
              className={errors.dueDate ? 'border-red-500' : ''}
            />
            {errors.dueDate && (
              <p className="text-red-500 text-sm mt-1">{errors.dueDate.message}</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Line Items <span className="text-red-500">*</span>
            </label>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 mr-1" />
              Add Line
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Description</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 w-24">Qty</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 w-32">Unit Price</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 w-40">Account</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 w-32">Tax</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700 w-32">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id} className="border-t">
                      <td className="py-2 px-3">
                        <Input
                          {...register(`lines.${index}.description`)}
                          placeholder="Item description"
                          className={errors.lines?.[index]?.description ? 'border-red-500' : ''}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`lines.${index}.quantity`)}
                          className={errors.lines?.[index]?.quantity ? 'border-red-500' : ''}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`lines.${index}.unitPrice`)}
                          className={errors.lines?.[index]?.unitPrice ? 'border-red-500' : ''}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          {...register(`lines.${index}.accountId`)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select...</option>
                          {accounts.map(account => (
                            <option key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <select
                          {...register(`lines.${index}.taxRateId`)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">No Tax</option>
                          {taxRates.map(tax => (
                            <option key={tax.id} value={tax.id}>
                              {tax.name} ({tax.rate}%)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3 text-right text-sm font-medium">
                        {calculateLineTotal(index).toFixed(2)}
                      </td>
                      <td className="py-2 px-3">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {errors.lines && (
            <p className="text-red-500 text-sm mt-1">
              {typeof errors.lines.message === 'string' ? errors.lines.message : 'Please check line items'}
            </p>
          )}
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
      </form>
    </Modal>
  );
}
