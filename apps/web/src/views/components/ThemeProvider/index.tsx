import { useEffect, type ReactNode } from "react";
import { useAppStore } from "@/store/appStore";

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Reads `colorMode` from the Zustand store and toggles the `dark` class on
 * <html>. shadcn/ui dark variants depend on `&:is(.dark *)` (see globals.css).
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const colorMode = useAppStore((s) => s.colorMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", colorMode === "dark");
  }, [colorMode]);

  return <>{children}</>;
}
