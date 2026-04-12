import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  auth: boolean;
  setAuth: (auth: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      auth: false,
      setAuth: (auth) => set({ auth }),
    }),
    {
      name: 'app-storage',
    },
  ),
);
