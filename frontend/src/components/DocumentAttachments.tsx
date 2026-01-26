import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Upload, File, Download, Eye, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';
import toast from 'react-hot-toast';

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
  url: string;
}

interface DocumentAttachmentsProps {
  entityType: 'invoice' | 'bill' | 'receipt' | 'customer' | 'supplier';
  entityId: string;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
}

export function DocumentAttachments({
  entityType,
  entityId,
  attachments,
  onAttachmentsChange,
  maxFileSize = 10,
  allowedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx'],
}: DocumentAttachmentsProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxFileSize}MB`);
      return;
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isAllowed = allowedTypes.some(type => {
      if (type.includes('*')) {
        const category = type.split('/')[0];
        return file.type.startsWith(category);
      }
      return type === fileExtension || file.type === type;
    });

    if (!isAllowed) {
      toast.error('File type not allowed');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    setUploading(true);
    try {
      const response = await api.post('/attachments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newAttachment: Attachment = response.data;
      onAttachmentsChange([...attachments, newAttachment]);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    try {
      await api.delete(`/attachments/${attachmentId}`);
      onAttachmentsChange(attachments.filter(a => a.id !== attachmentId));
      toast.success('Attachment deleted');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete attachment');
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await api.get(`/attachments/${attachment.id}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };

  const handleView = (attachment: Attachment) => {
    window.open(attachment.url, '_blank');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5" />
          Attachments ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Max file size: {maxFileSize}MB
          </p>
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              {uploading ? 'Uploading...' : 'Choose File'}
            </div>
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={(e) => handleFileUpload(e.target.files)}
            accept={allowedTypes.join(',')}
            className="hidden"
          />
        </div>

        {/* Attachments List */}
        {attachments.length > 0 && (
          <div className="mt-6 space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{getFileIcon(attachment.fileType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{attachment.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.fileSize)} • {formatDate(attachment.uploadedAt)} • {attachment.uploadedBy}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(attachment)}
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(attachment.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
