import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  // Table preferences
  pageSize: number;
  setPageSize: (size: number) => void;
  
  // Filter preferences
  savedFilters: Record<string, any>;
  setSavedFilter: (page: string, filters: any) => void;
  getSavedFilter: (page: string) => any;
  
  // Report preferences
  lastReportDates: {
    startDate: string;
    endDate: string;
  };
  setLastReportDates: (startDate: string, endDate: string) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      pageSize: 10,
      setPageSize: (size: number) => set({ pageSize: size }),
      
      savedFilters: {},
      setSavedFilter: (page: string, filters: any) => 
        set((state) => ({
          savedFilters: { ...state.savedFilters, [page]: filters }
        })),
      getSavedFilter: (page: string) => get().savedFilters[page] || {},
      
      lastReportDates: {
        startDate: '',
        endDate: '',
      },
      setLastReportDates: (startDate: string, endDate: string) => 
        set({ lastReportDates: { startDate, endDate } }),
    }),
    {
      name: 'user-preferences',
    }
  )
);
