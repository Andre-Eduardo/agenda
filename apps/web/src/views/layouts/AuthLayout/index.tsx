import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context }) => {
    if (context?.auth) {
      throw redirect({ to: "/" });
    }
  },
  component: AuthLayout,
});

export function AuthLayout() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}
