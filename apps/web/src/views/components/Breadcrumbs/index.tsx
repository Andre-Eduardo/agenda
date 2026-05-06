import { Fragment } from "react";
import { Link, useMatches } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "./breadcrumbs.module.css";

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
    <nav aria-label="Breadcrumb" className={styles.nav}>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <Fragment key={crumb.pathname}>
            {index > 0 && <ChevronRight aria-hidden className={styles.separator} />}
            {isLast ? (
              <span className={styles.current}>{t(crumb.key)}</span>
            ) : (
              <Link to={crumb.pathname} className={styles.link}>
                {t(crumb.key)}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
