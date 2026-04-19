import { layout, rootRoute, route } from '@tanstack/virtual-file-routes';

export const routes = rootRoute('../root.tsx', [
  layout('auth', '../layouts/AuthLayout/index.tsx', [
    route('/auth/login', 'auth/pages/login/index.tsx'),
  ]),
  layout('stackedLayout', '../layouts/StackedLayout/index.tsx', [
    route('/', 'dashboard/pages/index/index.tsx'),

    route('/patients', 'patient/pages/list/index.tsx'),
    route('/patients/new', 'patient/pages/form/new.tsx'),
    route('/patients/$patientId', 'patient/pages/detail/index.tsx'),
    route('/patients/$patientId/edit', 'patient/pages/form/edit.tsx'),
    route('/patients/$patientId/ai-analysis', 'clinicalChat/pages/aiAnalysis/index.tsx'),
    route('/patients/$patientId/chat', 'clinicalChat/pages/session/index.tsx'),
    route('/patients/$patientId/records/new', 'record/pages/new/index.tsx'),
    route('/patients/$patientId/records/$recordId/edit', 'record/pages/edit/index.tsx'),
    route('/patients/$patientId/forms/$patientFormId', 'patientForm/pages/fill/index.tsx'),

    route('/appointments', 'appointment/pages/list/index.tsx'),

    route('/professionals', 'professional/pages/list/index.tsx'),
    route('/professionals/new', 'professional/pages/form/new.tsx'),
    route('/professionals/$professionalId/edit', 'professional/pages/form/edit.tsx'),

    route('/form-templates', 'formTemplate/pages/list/index.tsx'),
  ]),
]);

export function filePathLayout(module: string): string {
  return `${module}/layout.tsx`;
}

export function filePath(module: string, page: string): string {
  return `${module}/pages/${page}/index.tsx`;
}
