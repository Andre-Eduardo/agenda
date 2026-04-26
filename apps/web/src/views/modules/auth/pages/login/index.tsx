import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_auth/auth/login")({
  component: LoginPage,
});

/**
 * Placeholder login page. The real implementation should:
 *  - Render Inputs (email, password) from @/components/ui/input
 *  - Call useSignIn() from @agenda-app/client
 *  - On success: setAuth(true), router.invalidate(), navigate to redirect target
 *
 * See docs/frontend/03-auth.md for the full sign-in flow.
 */
export function LoginPage() {
  return (
    <Card className="border-(--color-border) bg-(--color-bg-card) shadow-none">
      <CardHeader>
        <CardTitle className="text-lead font-medium text-(--color-text-primary)">
          Login (placeholder)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-(--color-text-secondary)">
          TODO: implement sign-in form using shadcn Input + useSignIn from @agenda-app/client.
        </p>
      </CardContent>
    </Card>
  );
}
