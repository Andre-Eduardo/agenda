import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { MantineProvider } from '@mantine/core';
import { theme } from './styles/theme';
import './translations/i18n';
import { useAppStore } from './store/appStore';
import { routeTree } from './routeTree.gen';

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
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  const auth = useAppStore((state) => state.auth);

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} context={{ auth, queryClient }} />
      </QueryClientProvider>
    </MantineProvider>
  );
}
