import { Outlet, createFileRoute } from "@tanstack/react-router";

/**
 * Pathless layout for unauthenticated pages (sign-in, sign-up).
 *
 * NOTE: this layout is currently NOT registered in
 * `src/views/modules/routes.ts` to avoid a path conflict with the empty
 * StackedLayout scaffold. Re-register it as soon as you add a child route
 * (e.g. /auth/login). Once registered, add the redirect guard back:
 *
 *   beforeLoad: ({search, context}) => {
 *     if (context?.auth) throw redirect({to: search?.redirect ?? '/'});
 *   }
 */
export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-bg-page) p-6">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
