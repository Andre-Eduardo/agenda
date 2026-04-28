import { index, layout, rootRoute, route } from "@tanstack/virtual-file-routes";

/**
 * Central virtual route tree.
 *
 * Currently registers:
 *  - StackedLayout with a single Welcome placeholder at `/`
 *  - AuthLayout with a single Login placeholder at `/auth/login`
 *
 * Add new feature modules under `apps/web/src/views/modules/{module}/` and
 * register their routes here. See docs/frontend/02-routing.md.
 */
export const routes = rootRoute("../root.tsx", [
  layout("auth", "../layouts/AuthLayout/index.tsx", [
    route("/auth/login", filePath("auth", "login")),
  ]),
  layout("stackedLayout", "../layouts/StackedLayout/index.tsx", [
    index(filePath("welcome", "index")),
    route("/patients", filePath("patients", "index")),
    route("/patients/$patientId", filePath("patients", "detail")),
  ]),
]);

export function filePathLayout(module: string): string {
  return `${module}/layout.tsx`;
}

export function filePath(module: string, page: string): string {
  return `${module}/pages/${page}/index.tsx`;
}
