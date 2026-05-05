import {useEffect} from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ShieldOff } from "lucide-react";
import {useQueryErrorResetBoundary} from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {useRouterErrorHandler} from "@/hooks/useRouterErrorHandler";
import {isForbiddenError, isUnauthorizedError} from "@/views/components/QueryErrorHandler";

interface ErrorPageProps {
  error?: Error;
  reset?: () => void;
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
  const { t } = useTranslation();
  const { handleUnauthorizedError } = useRouterErrorHandler();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();
  const isForbidden = isForbiddenError(error);

  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  useEffect(() => {
    if (isUnauthorizedError(error)) {
      handleUnauthorizedError();
    }
  }, [error, handleUnauthorizedError]);

  if (isForbidden) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--color-bg-page) p-6">
        <Card className="w-full max-w-md border-(--color-border) bg-(--color-bg-card) shadow-none">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-(--color-warning-surface) text-(--color-warning)">
              <ShieldOff aria-hidden className="size-6" />
            </div>
            <CardTitle className="text-lead font-medium text-(--color-text-primary)">
              {t("states.forbidden")}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-bg-page) p-6">
      <Card className="w-full max-w-md border-(--color-border) bg-(--color-bg-card) shadow-none">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-(--color-warning-surface) text-(--color-warning)">
            <AlertTriangle aria-hidden className="size-6" />
          </div>
          <CardTitle className="text-lead font-medium text-(--color-text-primary)">
            {t("states.error")}
          </CardTitle>
          {error?.message && (
            <CardDescription className="text-sm text-(--color-text-secondary)">
              {error.message}
            </CardDescription>
          )}
        </CardHeader>
        {reset && (
          <CardContent className="flex justify-center">
            <Button type="button" onClick={reset}>
              {t("actions.confirm")}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
