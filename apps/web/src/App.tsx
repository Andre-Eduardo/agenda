import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/views/components/ThemeProvider";
import { QueryErrorHandler } from "@/views/components/QueryErrorHandler";
import { AppLoader } from "@/views/components/AppLoader";
import { ErrorPage } from "@/views/pages/ErrorPage";
import { NotFoundPage } from "@/views/pages/NotFoundPage";
import "./translations/i18n";
import { useAppStore } from "./store/appStore";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
    },
  },
});

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: false,
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  defaultPendingComponent: AppLoader,
  defaultErrorComponent: ({ error, reset }) => <ErrorPage error={error} reset={reset} />,
  defaultNotFoundComponent: () => <NotFoundPage />,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  const auth = useAppStore((state) => state.auth);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <QueryErrorHandler />
        <RouterProvider router={router} context={{ auth, queryClient }} />
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
