import { useEffect, useState } from 'react';
import { Card, CardContent } from './Card';
import { Download, CheckCircle, X, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export interface DownloadTask {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'excel' | 'csv';
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface DownloadProgressProps {
  tasks: DownloadTask[];
  onDismiss: (taskId: string) => void;
  onRetry?: (taskId: string) => void;
}

export function DownloadProgress({ tasks, onDismiss, onRetry }: DownloadProgressProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const activeTasks = tasks.filter(t => t.status === 'downloading' || t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const errorTasks = tasks.filter(t => t.status === 'error');

  // Auto-dismiss completed tasks after 5 seconds
  useEffect(() => {
    completedTasks.forEach(task => {
      setTimeout(() => {
        onDismiss(task.id);
      }, 5000);
    });
  }, [completedTasks.length]);

  if (tasks.length === 0) return null;

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return '📄';
      case 'excel': return '📊';
      case 'csv': return '📋';
      default: return '📁';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'downloading': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96">
      <Card className="shadow-lg">
        <div 
          className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-gray-50"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">
              Downloads ({activeTasks.length} active)
            </h3>
          </div>
          <button className="text-gray-500 hover:text-gray-700">
            {isMinimized ? '▲' : '▼'}
          </button>
        </div>

        {!isMinimized && (
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No downloads
              </div>
            ) : (
              <div className="divide-y">
                {tasks.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="text-2xl">{getFileIcon(task.fileType)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{task.fileName}</p>
                          <p className={`text-xs ${getStatusColor(task.status)}`}>
                            {task.status === 'pending' && 'Preparing...'}
                            {task.status === 'downloading' && `Downloading ${task.progress}%`}
                            {task.status === 'completed' && 'Completed'}
                            {task.status === 'error' && (task.error || 'Download failed')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.status === 'completed' && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {task.status === 'error' && (
                          <>
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            {onRetry && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onRetry(task.id)}
                                className="text-xs"
                              >
                                Retry
                              </Button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => onDismiss(task.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(task.status === 'downloading' || task.status === 'pending') && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}

        {/* Summary when minimized */}
        {isMinimized && (activeTasks.length > 0 || errorTasks.length > 0) && (
          <div className="p-2 text-xs text-gray-600 border-t">
            {activeTasks.length > 0 && `${activeTasks.length} downloading`}
            {activeTasks.length > 0 && errorTasks.length > 0 && ' • '}
            {errorTasks.length > 0 && `${errorTasks.length} failed`}
          </div>
        )}
      </Card>
    </div>
  );
}
