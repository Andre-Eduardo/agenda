import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  auth: boolean;
  userId: string | null;
  setAuth: (auth: boolean, userId?: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      auth: false,
      userId: null,
      setAuth: (auth, userId = null) => set({ auth, userId }),
    }),
    {
      name: 'app-storage',
    },
  ),
);
