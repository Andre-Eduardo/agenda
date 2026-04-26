import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ColorMode = "light" | "dark";

interface AppState {
  auth: boolean;
  userId: string | null;
  colorMode: ColorMode;
  setAuth: (auth: boolean, userId?: string | null) => void;
  setColorMode: (colorMode: ColorMode) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      auth: false,
      userId: null,
      colorMode: "light",
      setAuth: (auth, userId = null) => set({ auth, userId }),
      setColorMode: (colorMode) => set({ colorMode }),
    }),
    {
      name: "app-storage",
    },
  ),
);
