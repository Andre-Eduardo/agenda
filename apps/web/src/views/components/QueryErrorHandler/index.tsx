import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

/**
 * Subscribes to React Query cache events and surfaces unhandled query errors
 * via a toast (Sonner). Sits at the provider tree root in App.tsx so it
 * captures errors from every query without coupling to specific pages.
 */
export function QueryErrorHandler() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  useEffect(() => {
    const cache = queryClient.getQueryCache();
    const unsubscribe = cache.subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") {
        const error = event.action.error as { detail?: string; title?: string } | undefined;

        toast.error(error?.title ?? t("states.error"), {
          description: error?.detail,
        });
      }
    });

    return unsubscribe;
  }, [queryClient, t]);

  return null;
}
