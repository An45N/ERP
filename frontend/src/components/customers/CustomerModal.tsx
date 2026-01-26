import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { showToast } from '../../lib/toast';
import type { Customer } from '../../types';

const customerSchema = z.object({
  code: z.string().min(1, 'Customer code is required').max(20, 'Code must be 20 characters or less'),
  name: z.string().min(1, 'Customer name is required').max(200, 'Name must be 200 characters or less'),
  email: z.string().email('Invalid email address').or(z.literal('')),
  phone: z.string().max(50, 'Phone must be 50 characters or less'),
  address: z.string().max(500, 'Address must be 500 characters or less'),
  city: z.string().max(100, 'City must be 100 characters or less'),
  country: z.string().max(100, 'Country must be 100 characters or less'),
  postalCode: z.string().max(20, 'Postal code must be 20 characters or less'),
  taxId: z.string().max(50, 'Tax ID must be 50 characters or less'),
  creditLimit: z.coerce.number().min(0, 'Credit limit must be positive').nullable(),
  paymentTerms: z.string().max(100, 'Payment terms must be 100 characters or less'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  isActive: z.boolean(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: Customer;
  companyId: string;
}

export function CustomerModal({ isOpen, onClose, onSuccess, customer, companyId }: CustomerModalProps) {
  const isEditing = !!customer;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ? {
      code: customer.code,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      country: customer.country || '',
      postalCode: customer.postalCode || '',
      taxId: customer.taxId || '',
      creditLimit: customer.creditLimit,
      paymentTerms: customer.paymentTerms || '',
      currency: customer.currency,
      isActive: customer.isActive,
    } : {
      code: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Mauritius',
      postalCode: '',
      taxId: '',
      creditLimit: null,
      paymentTerms: 'Net 30',
      currency: 'MUR',
      isActive: true,
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    const toastId = showToast.loading(isEditing ? 'Updating customer...' : 'Creating customer...');
    
    try {
      const payload = {
        ...data,
        companyId,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        country: data.country || null,
        postalCode: data.postalCode || null,
        taxId: data.taxId || null,
        paymentTerms: data.paymentTerms || null,
      };

      if (isEditing) {
        await api.patch(`/customers/${customer.id}`, payload);
        showToast.dismiss(toastId);
        showToast.success('Customer updated successfully');
      } else {
        await api.post('/customers', payload);
        showToast.dismiss(toastId);
        showToast.success('Customer created successfully');
      }

      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast.dismiss(toastId);
      const errorMessage = error.response?.data?.error || 'Failed to save customer';
      showToast.error(errorMessage);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Customer' : 'New Customer'}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Code <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('code')}
              placeholder="CUST001"
              disabled={isEditing}
              className={errors.code ? 'border-red-500' : ''}
            />
            {errors.code && (
              <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('name')}
              placeholder="ABC Company Ltd"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              {...register('email')}
              type="email"
              placeholder="contact@customer.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <Input
              {...register('phone')}
              placeholder="+230 5xxx xxxx"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            {...register('address')}
            rows={2}
            placeholder="Street address"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <Input
              {...register('city')}
              placeholder="Port Louis"
              className={errors.city ? 'border-red-500' : ''}
            />
            {errors.city && (
              <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postal Code
            </label>
            <Input
              {...register('postalCode')}
              placeholder="11302"
              className={errors.postalCode ? 'border-red-500' : ''}
            />
            {errors.postalCode && (
              <p className="text-red-500 text-sm mt-1">{errors.postalCode.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <Input
              {...register('country')}
              placeholder="Mauritius"
              className={errors.country ? 'border-red-500' : ''}
            />
            {errors.country && (
              <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax ID / VAT Number
            </label>
            <Input
              {...register('taxId')}
              placeholder="V12345678"
              className={errors.taxId ? 'border-red-500' : ''}
            />
            {errors.taxId && (
              <p className="text-red-500 text-sm mt-1">{errors.taxId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Credit Limit (MUR)
            </label>
            <Input
              {...register('creditLimit', { valueAsNumber: true })}
              type="number"
              step="0.01"
              placeholder="50000.00"
              className={errors.creditLimit ? 'border-red-500' : ''}
            />
            {errors.creditLimit && (
              <p className="text-red-500 text-sm mt-1">{errors.creditLimit.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Terms
            </label>
            <Input
              {...register('paymentTerms')}
              placeholder="Net 30"
              className={errors.paymentTerms ? 'border-red-500' : ''}
            />
            {errors.paymentTerms && (
              <p className="text-red-500 text-sm mt-1">{errors.paymentTerms.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              {...register('currency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="MUR">MUR - Mauritian Rupee</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
            {errors.currency && (
              <p className="text-red-500 text-sm mt-1">{errors.currency.message}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mt-7">
              <input
                type="checkbox"
                {...register('isActive')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              Active Customer
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
