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
import type { JournalEntry, Account, FiscalPeriod } from '../../types';

const journalLineSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  debit: z.coerce.number().min(0, 'Debit must be positive'),
  credit: z.coerce.number().min(0, 'Credit must be positive'),
  description: z.string(),
}).refine((data) => {
  return !(data.debit > 0 && data.credit > 0);
}, {
  message: 'A line cannot have both debit and credit',
  path: ['debit'],
});

const journalEntrySchema = z.object({
  entryDate: z.string().min(1, 'Entry date is required'),
  fiscalPeriodId: z.string().min(1, 'Fiscal period is required'),
  entryType: z.string().min(1, 'Entry type is required'),
  reference: z.string(),
  description: z.string().min(1, 'Description is required'),
  lines: z.array(journalLineSchema).min(2, 'At least two line items are required'),
}).refine((data) => {
  const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  return Math.abs(totalDebit - totalCredit) < 0.01;
}, {
  message: 'Total debits must equal total credits',
  path: ['lines'],
});

type JournalEntryFormData = z.infer<typeof journalEntrySchema>;

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entry?: JournalEntry;
  companyId: string;
}

export function JournalEntryModal({ isOpen, onClose, onSuccess, entry, companyId }: JournalEntryModalProps) {
  const isEditing = !!entry;
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
  } = useForm<JournalEntryFormData>({
    resolver: zodResolver(journalEntrySchema) as any,
    defaultValues: entry ? {
      entryDate: entry.entryDate.split('T')[0],
      fiscalPeriodId: entry.fiscalPeriodId || '',
      entryType: entry.entryType,
      reference: entry.reference || '',
      description: entry.description,
      lines: entry.lines.map(line => ({
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        description: line.description || '',
      })),
    } : {
      entryDate: new Date().toISOString().split('T')[0],
      fiscalPeriodId: '',
      entryType: 'MANUAL',
      reference: '',
      description: '',
      lines: [
        { accountId: '', debit: 0, credit: 0, description: '' },
        { accountId: '', debit: 0, credit: 0, description: '' },
      ],
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
      const [accountsRes, periodsRes] = await Promise.all([
        api.get<{ accounts: Account[] }>(`/accounts?companyId=${companyId}`),
        api.get<{ periods: FiscalPeriod[] }>(`/fiscal-periods?companyId=${companyId}`),
      ]);
      setAccounts(accountsRes.data.accounts.filter(a => a.isActive));
      setFiscalPeriods(periodsRes.data.periods.filter(p => p.status === 'OPEN'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    let totalDebit = 0;
    let totalCredit = 0;

    watchLines.forEach((line) => {
      totalDebit += line.debit || 0;
      totalCredit += line.credit || 0;
    });

    return {
      totalDebit,
      totalCredit,
      difference: totalDebit - totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  };

  const totals = calculateTotals();

  const onSubmit = async (data: JournalEntryFormData) => {
    const toastId = showToast.loading(isEditing ? 'Updating journal entry...' : 'Creating journal entry...');
    
    try {
      const payload = {
        ...data,
        companyId,
        reference: data.reference || null,
        lines: data.lines.map((line, index) => ({
          ...line,
          lineNumber: index + 1,
          description: line.description || null,
        })),
      };

      if (isEditing) {
        await api.patch(`/journal-entries/${entry.id}`, payload);
        showToast.dismiss(toastId);
        showToast.success('Journal entry updated successfully');
      } else {
        await api.post('/journal-entries', payload);
        showToast.dismiss(toastId);
        showToast.success('Journal entry created successfully');
      }

      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast.dismiss(toastId);
      const errorMessage = error.response?.data?.error || 'Failed to save journal entry';
      showToast.error(errorMessage);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const addLine = () => {
    append({ accountId: '', debit: 0, credit: 0, description: '' });
  };

  const entryTypes = [
    { value: 'MANUAL', label: 'Manual Entry' },
    { value: 'ADJUSTMENT', label: 'Adjustment' },
    { value: 'CLOSING', label: 'Closing Entry' },
  ];

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
      title={isEditing ? 'Edit Journal Entry' : 'New Journal Entry'}
      size="xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="text-left">
            <div className="text-sm text-gray-600">
              Total Debit: <span className="font-semibold">MUR {totals.totalDebit.toFixed(2)}</span>
            </div>
            <div className="text-sm text-gray-600">
              Total Credit: <span className="font-semibold">MUR {totals.totalCredit.toFixed(2)}</span>
            </div>
            <div className={`text-lg font-bold ${totals.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
              Difference: MUR {Math.abs(totals.difference).toFixed(2)}
              {totals.isBalanced && ' ✓'}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit as any)} disabled={isSubmitting || !totals.isBalanced}>
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
              Entry Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              {...register('entryDate')}
              className={errors.entryDate ? 'border-red-500' : ''}
            />
            {errors.entryDate && (
              <p className="text-red-500 text-sm mt-1">{errors.entryDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fiscal Period <span className="text-red-500">*</span>
            </label>
            <select
              {...register('fiscalPeriodId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select period...</option>
              {fiscalPeriods.map(period => (
                <option key={period.id} value={period.id}>
                  {period.name} ({new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()})
                </option>
              ))}
            </select>
            {errors.fiscalPeriodId && (
              <p className="text-red-500 text-sm mt-1">{errors.fiscalPeriodId.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entry Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register('entryType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {entryTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.entryType && (
              <p className="text-red-500 text-sm mt-1">{errors.entryType.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference
            </label>
            <Input
              {...register('reference')}
              placeholder="REF-001"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('description')}
            placeholder="Brief description of the entry"
            className={errors.description ? 'border-red-500' : ''}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Journal Lines <span className="text-red-500">*</span>
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
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 w-48">Account</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Description</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700 w-32">Debit</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700 w-32">Credit</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id} className="border-t">
                      <td className="py-2 px-3">
                        <select
                          {...register(`lines.${index}.accountId`)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select account...</option>
                          {accounts.map(account => (
                            <option key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </option>
                          ))}
                        </select>
                        {errors.lines?.[index]?.accountId && (
                          <p className="text-red-500 text-xs mt-1">{errors.lines[index]?.accountId?.message}</p>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          {...register(`lines.${index}.description`)}
                          placeholder="Line description"
                          className="text-sm"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`lines.${index}.debit`)}
                          className={`text-right text-sm ${errors.lines?.[index]?.debit ? 'border-red-500' : ''}`}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`lines.${index}.credit`)}
                          className="text-right text-sm"
                        />
                      </td>
                      <td className="py-2 px-3">
                        {fields.length > 2 && (
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
          {errors.lines && typeof errors.lines.message === 'string' && (
            <p className="text-red-500 text-sm mt-1">{errors.lines.message}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
