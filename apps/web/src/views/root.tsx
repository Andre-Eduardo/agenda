import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';

interface RouterContext {
  queryClient: QueryClient;
  auth: boolean;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <Outlet />
    </>
  );
}
