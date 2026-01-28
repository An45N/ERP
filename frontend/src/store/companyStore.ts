import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CompanyState {
  companyId: string;
  companyName: string;
  setCompany: (id: string, name: string) => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      companyId: '',
      companyName: '',
      setCompany: (id: string, name: string) => set({ companyId: id, companyName: name }),
    }),
    {
      name: 'company-storage',
    }
  )
);
