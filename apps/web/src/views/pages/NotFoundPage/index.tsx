import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-bg-page) p-6">
      <Card className="w-full max-w-md border-(--color-border) bg-(--color-bg-card) shadow-none">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-(--color-bg-surface) text-(--color-text-secondary)">
            <Compass aria-hidden className="size-6" />
          </div>
          <CardTitle className="text-2xl font-medium text-(--color-text-primary)">404</CardTitle>
          <CardDescription className="text-sm text-(--color-text-secondary)">
            Página não encontrada
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link to="/">Voltar para o início</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
