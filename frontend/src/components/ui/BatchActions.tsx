import { Button } from './Button';
import { CheckCircle, XCircle, Trash2, Mail, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface BatchActionsProps {
  selectedCount: number;
  onApprove?: () => Promise<void>;
  onReject?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  onEmail?: () => Promise<void>;
  onExport?: () => void;
  onClearSelection: () => void;
}

export function BatchActions({
  selectedCount,
  onApprove,
  onReject,
  onDelete,
  onEmail,
  onExport,
  onClearSelection,
}: BatchActionsProps) {
  if (selectedCount === 0) return null;

  const handleAction = async (action: () => Promise<void> | void, actionName: string) => {
    if (!window.confirm(`${actionName} ${selectedCount} selected items?`)) {
      return;
    }

    try {
      await action();
      toast.success(`${selectedCount} items ${actionName.toLowerCase()}d successfully`);
      onClearSelection();
    } catch (error) {
      console.error(`Failed to ${actionName.toLowerCase()}:`, error);
      toast.error(`Failed to ${actionName.toLowerCase()} items`);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
              {selectedCount}
            </div>
            <span className="font-medium text-gray-700">
              {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          <div className="flex items-center gap-2">
            {onApprove && (
              <Button
                size="sm"
                onClick={() => handleAction(onApprove, 'Approve')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
            )}

            {onReject && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction(onReject, 'Reject')}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            )}

            {onEmail && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction(onEmail, 'Email')}
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
            )}

            {onExport && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onExport();
                  toast.success('Export started');
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}

            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction(onDelete, 'Delete')}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}

            <div className="h-6 w-px bg-gray-300" />

            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
