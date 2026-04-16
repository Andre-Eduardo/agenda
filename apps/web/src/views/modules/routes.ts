import { layout, rootRoute, route } from '@tanstack/virtual-file-routes';

export const routes = rootRoute('../root.tsx', [
  layout('auth', '../layouts/AuthLayout/index.tsx', [
    route('/auth/login', 'auth/pages/login/index.tsx'),
  ]),
  layout('stackedLayout', '../layouts/StackedLayout/index.tsx', [
    route('/', 'dashboard/pages/index/index.tsx'),
  ]),
]);

export function filePathLayout(module: string): string {
  return `${module}/layout.tsx`;
}

export function filePath(module: string, page: string): string {
  return `${module}/pages/${page}/index.tsx`;
}
