import type {QueryClient} from '@tanstack/react-query';
import {Outlet, createRootRouteWithContext} from '@tanstack/react-router';

export interface RouterContext {
    queryClient: QueryClient;
    auth: boolean;
}

export const Route = createRootRouteWithContext<RouterContext>()({
    component: RootComponent,
});

function RootComponent() {
    return <Outlet />;
}
