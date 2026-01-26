import { useState, useCallback } from 'react';
import { DownloadTask } from '../components/ui/DownloadProgress';

/**
 * Custom hook for managing download progress
 * Tracks multiple concurrent downloads with progress indicators
 */
export function useDownloadProgress() {
  const [tasks, setTasks] = useState<DownloadTask[]>([]);

  const addTask = useCallback((fileName: string, fileType: 'pdf' | 'excel' | 'csv') => {
    const taskId = `download-${Date.now()}-${Math.random()}`;
    const newTask: DownloadTask = {
      id: taskId,
      fileName,
      fileType,
      status: 'pending',
      progress: 0,
    };

    setTasks(prev => [...prev, newTask]);
    return taskId;
  }, []);

  const updateProgress = useCallback((taskId: string, progress: number) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, status: 'downloading' as const, progress: Math.min(100, Math.max(0, progress)) }
          : task
      )
    );
  }, []);

  const completeTask = useCallback((taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, status: 'completed' as const, progress: 100 }
          : task
      )
    );
  }, []);

  const errorTask = useCallback((taskId: string, error: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, status: 'error' as const, error }
          : task
      )
    );
  }, []);

  const dismissTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  const clearCompleted = useCallback(() => {
    setTasks(prev => prev.filter(task => task.status !== 'completed'));
  }, []);

  const clearAll = useCallback(() => {
    setTasks([]);
  }, []);

  /**
   * Simulate download progress for file generation
   * Useful for PDF/Excel generation where actual progress isn't available
   */
  const simulateProgress = useCallback((taskId: string, duration: number = 3000) => {
    const steps = 20;
    const interval = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = (currentStep / steps) * 100;
      
      if (currentStep >= steps) {
        clearInterval(timer);
        completeTask(taskId);
      } else {
        updateProgress(taskId, progress);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [updateProgress, completeTask]);

  /**
   * Download with progress tracking
   * For actual file downloads with progress events
   */
  const downloadWithProgress = useCallback(async (
    fileName: string,
    fileType: 'pdf' | 'excel' | 'csv',
    downloadFn: (onProgress: (progress: number) => void) => Promise<void>
  ) => {
    const taskId = addTask(fileName, fileType);

    try {
      await downloadFn((progress) => {
        updateProgress(taskId, progress);
      });
      completeTask(taskId);
    } catch (error) {
      errorTask(taskId, error instanceof Error ? error.message : 'Download failed');
      throw error;
    }
  }, [addTask, updateProgress, completeTask, errorTask]);

  return {
    tasks,
    addTask,
    updateProgress,
    completeTask,
    errorTask,
    dismissTask,
    clearCompleted,
    clearAll,
    simulateProgress,
    downloadWithProgress,
  };
}
