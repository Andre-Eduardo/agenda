import { Fragment } from "react";
import { Link, useMatches } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface BreadcrumbContext {
  breadcrumb?: string;
}

/**
 * Reads route match contexts produced by `beforeLoad: () => ({breadcrumb: 'foo.bar'})`
 * and renders them as a breadcrumb trail. Keys are translation keys.
 */
export function Breadcrumbs() {
  const matches = useMatches();
  const { t } = useTranslation();

  const crumbs = matches
    .map((match) => {
      const context = match.context as Partial<BreadcrumbContext> | undefined;
      const key = context?.breadcrumb;

      if (!key) return null;

      return { key, pathname: match.pathname };
    })
    .filter((c): c is { key: string; pathname: string } => c !== null);

  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-sm text-(--color-text-secondary)"
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <Fragment key={crumb.pathname}>
            {index > 0 && (
              <ChevronRight aria-hidden className="size-4 text-(--color-text-tertiary)" />
            )}
            {isLast ? (
              <span className="font-medium text-(--color-text-primary)">{t(crumb.key)}</span>
            ) : (
              <Link
                to={crumb.pathname}
                className="hover:text-(--color-text-primary) transition-colors"
              >
                {t(crumb.key)}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
