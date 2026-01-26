import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Mail, Send, X } from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface EmailInvoiceProps {
  invoiceId: string;
  invoiceNumber: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  onClose: () => void;
  onSent: () => void;
}

export function EmailInvoice({
  invoiceId,
  invoiceNumber,
  customerEmail,
  customerName,
  amount,
  onClose,
  onSent,
}: EmailInvoiceProps) {
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    to: customerEmail,
    cc: '',
    bcc: '',
    subject: `Invoice ${invoiceNumber} from Your Company`,
    message: `Dear ${customerName},\n\nPlease find attached invoice ${invoiceNumber} for the amount of ${amount}.\n\nThank you for your business.\n\nBest regards,\nYour Company`,
    attachPdf: true,
  });

  const handleSend = async () => {
    if (!formData.to) {
      toast.error('Please enter recipient email');
      return;
    }

    setSending(true);
    try {
      await api.post(`/invoices/${invoiceId}/send-email`, formData);
      toast.success('Invoice sent successfully');
      onSent();
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Failed to send invoice');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Invoice via Email
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Invoice Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Invoice: {invoiceNumber}
              </p>
              <p className="text-sm text-blue-700">
                Customer: {customerName}
              </p>
            </div>

            {/* To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                placeholder="customer@example.com"
              />
            </div>

            {/* CC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CC (optional)
              </label>
              <Input
                type="email"
                value={formData.cc}
                onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                placeholder="cc@example.com"
              />
            </div>

            {/* BCC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BCC (optional)
              </label>
              <Input
                type="email"
                value={formData.bcc}
                onChange={(e) => setFormData({ ...formData, bcc: e.target.value })}
                placeholder="bcc@example.com"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Invoice subject"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Email message"
              />
            </div>

            {/* Attach PDF */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="attachPdf"
                checked={formData.attachPdf}
                onChange={(e) => setFormData({ ...formData, attachPdf: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="attachPdf" className="text-sm font-medium text-gray-700">
                Attach invoice PDF
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            <Button onClick={handleSend} disabled={sending} className="flex-1">
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send Email'}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
