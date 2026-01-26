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
      companyId: 'c5f61904-b52b-4e97-a1a7-1164cd5556d2',
      companyName: 'Default Company',
      setCompany: (id: string, name: string) => set({ companyId: id, companyName: name }),
    }),
    {
      name: 'company-storage',
    }
  )
);
