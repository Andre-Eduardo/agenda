import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BASE = '/api/v1';

async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function qs(params: Record<string, any>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== '') p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  birthDate?: string;
  gender?: string;
  createdAt?: string;
}

export interface Professional {
  id: string;
  name: string;
  email?: string;
  username?: string;
  specialty?: string;
  crm?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  professionalId: string;
  startAt: string;
  endAt?: string;
  status: string;
  notes?: string;
}

export interface Record {
  id: string;
  patientId: string;
  professionalId?: string;
  content?: string;
  attendanceType?: string;
  clinicalStatus?: string;
  createdAt?: string;
}

export interface PatientAlert {
  id: string;
  patientId: string;
  type: string;
  message: string;
  severity?: string;
  resolvedAt?: string | null;
}

export interface User {
  id: string;
  name?: string;
  username: string;
  email?: string;
  role?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: { username: string; password: string; professionalId?: string | null } }) =>
      api('/auth/sign-in', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['current-user'] }),
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api('/auth/sign-out', { method: 'POST' }),
    onSuccess: () => qc.clear(),
  });
}

export function useGetCurrentUser(opts?: { query?: Record<string, any> }) {
  return useQuery<User>({
    queryKey: ['current-user'],
    queryFn: () => api('/user/me'),
    retry: false,
    staleTime: 60_000,
    ...(opts?.query ?? {}),
  });
}

// ─── Patients ─────────────────────────────────────────────────────────────────

export function useSearchPatients(params?: { term?: string; cursor?: string | null; limit?: number } | any) {
  const p = params ?? {};
  return useQuery<any>({
    queryKey: ['patients', p],
    queryFn: () => api(`/patients${qs({ term: p.term, cursor: p.cursor, limit: p.limit ?? 50 })}`),
    staleTime: 30_000,
  });
}

export function useGetPatient(id: string, opts?: { query?: Record<string, any> }) {
  return useQuery<Patient>({
    queryKey: ['patient', id],
    queryFn: () => api(`/patients/${id}`),
    enabled: Boolean(id),
    ...(opts?.query ?? {}),
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: Partial<Patient> }) =>
      api('/patients', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Patient> }) =>
      api(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      qc.invalidateQueries({ queryKey: ['patient', id] });
    },
  });
}

// ─── Professionals ────────────────────────────────────────────────────────────

export function useSearchProfessionals(params?: { term?: string; cursor?: string | null; limit?: number } | any) {
  const p = params ?? {};
  return useQuery<any>({
    queryKey: ['professionals', p],
    queryFn: () => api(`/professionals${qs({ term: p.term, cursor: p.cursor, limit: p.limit ?? 50 })}`),
    staleTime: 30_000,
  });
}

export function useGetProfessional(id: string, opts?: { query?: Record<string, any> }) {
  return useQuery<Professional>({
    queryKey: ['professional', id],
    queryFn: () => api(`/professionals/${id}`),
    enabled: Boolean(id),
    ...(opts?.query ?? {}),
  });
}

export function useCreateProfessional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: Partial<Professional> }) =>
      api('/professionals', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['professionals'] }),
  });
}

export function useUpdateProfessional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Professional> }) =>
      api(`/professionals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['professionals'] });
      qc.invalidateQueries({ queryKey: ['professional', id] });
    },
  });
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export function useSearchAppointments(params?: {
  term?: string;
  cursor?: string | null;
  limit?: number;
  sort?: string | null;
  patientId?: string;
  professionalId?: string;
  startAtFrom?: string;
  startAtTo?: string;
} | any) {
  const p = params ?? {};
  return useQuery<any>({
    queryKey: ['appointments', p],
    queryFn: () =>
      api(`/appointments${qs({
        term: p.term,
        cursor: p.cursor,
        limit: p.limit ?? 50,
        sort: p.sort,
        patientId: p.patientId,
        professionalId: p.professionalId,
        startAtFrom: p.startAtFrom,
        startAtTo: p.startAtTo,
      })}`),
    staleTime: 15_000,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: Partial<Appointment> }) =>
      api('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { reason: string } }) =>
      api(`/appointments/${id}/cancel`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

// ─── Records ──────────────────────────────────────────────────────────────────

export function useSearchRecords(params?: {
  term?: string;
  patientId?: string;
  cursor?: string | null;
  limit?: number;
  attendanceType?: string;
  clinicalStatus?: string;
  dateFrom?: string;
  dateTo?: string;
} | any) {
  const p = params ?? {};
  return useQuery<any>({
    queryKey: ['records', p],
    queryFn: () =>
      api(`/records${qs({
        term: p.term,
        patientId: p.patientId,
        cursor: p.cursor,
        limit: p.limit ?? 50,
        attendanceType: p.attendanceType,
        clinicalStatus: p.clinicalStatus,
        dateFrom: p.dateFrom,
        dateTo: p.dateTo,
      })}`),
    staleTime: 15_000,
  });
}

export function useGetRecord(id: string) {
  return useQuery<Record>({
    queryKey: ['record', id],
    queryFn: () => api(`/records/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: Partial<Record> }) =>
      api('/records', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['records'] }),
  });
}

export function useUpdateRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Record> }) =>
      api(`/records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['records'] });
      qc.invalidateQueries({ queryKey: ['record', id] });
    },
  });
}

// ─── Clinical Profile ─────────────────────────────────────────────────────────

export function useGetClinicalProfile(patientId: string) {
  return useQuery<any>({
    queryKey: ['clinical-profile', patientId],
    queryFn: () => api(`/patients/${patientId}/clinical-profile`),
    enabled: Boolean(patientId),
  });
}

// ─── Patient Alerts ───────────────────────────────────────────────────────────

export function useSearchPatientAlerts(patientId: string) {
  return useQuery<{ items: PatientAlert[] }>({
    queryKey: ['patient-alerts', patientId],
    queryFn: () => api(`/patients/${patientId}/alerts`),
    enabled: Boolean(patientId),
  });
}

// ─── Form Templates ───────────────────────────────────────────────────────────

export function useSearchFormTemplates(params?: { term?: string; cursor?: string | null; limit?: number } | any) {
  const p = params ?? {};
  return useQuery<any>({
    queryKey: ['form-templates', p],
    queryFn: () => api(`/form-templates${qs({ term: p.term, cursor: p.cursor, limit: p.limit ?? 50 })}`),
    staleTime: 60_000,
  });
}

// ─── Patient Forms ────────────────────────────────────────────────────────────

export function useGetById({ patientId, patientFormId }: { patientId: string; patientFormId: string }) {
  return useQuery<any>({
    queryKey: ['patient-form', patientId, patientFormId],
    queryFn: () => api(`/patients/${patientId}/forms/${patientFormId}`),
    enabled: Boolean(patientId) && Boolean(patientFormId),
  });
}

export function useSaveDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ patientId, patientFormId, data }: { patientId: string; patientFormId: string; data: any }) =>
      api(`/patients/${patientId}/forms/${patientFormId}/draft`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patient-form'] }),
  });
}

export function useComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ patientId, patientFormId }: { patientId: string; patientFormId: string }) =>
      api(`/patients/${patientId}/forms/${patientFormId}/complete`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patient-form'] }),
  });
}

// ─── Clinical Chat ────────────────────────────────────────────────────────────

export function useListSessions(params?: { patientId?: string; professionalId?: string; status?: string; cursor?: string | null; limit?: number; sort?: string | null } | any) {
  const p = params ?? {};
  return useQuery<any>({
    queryKey: ['clinical-chat-sessions', p],
    queryFn: () =>
      api(`/clinical-chat/sessions${qs({
        patientId: p.patientId,
        professionalId: p.professionalId,
        status: p.status,
        cursor: p.cursor,
        limit: p.limit ?? 50,
        sort: p.sort,
      })}`),
    staleTime: 15_000,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: { patientId: string; professionalId?: string; title?: string } }) =>
      api('/clinical-chat/sessions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clinical-chat-sessions'] }),
  });
}

export function getListMessagesQueryKey(sessionId: string) {
  return ['clinical-chat-messages', sessionId];
}

export function useListMessages(sessionId: string, opts?: { query?: Record<string, any> }) {
  return useQuery<any>({
    queryKey: getListMessagesQueryKey(sessionId),
    queryFn: () => api(`/clinical-chat/sessions/${sessionId}/messages`),
    enabled: Boolean(sessionId),
    ...(opts?.query ?? {}),
  });
}

export function useSendChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { content: string } }) =>
      api(`/clinical-chat/sessions/${id}/chat`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: getListMessagesQueryKey(id) });
      qc.invalidateQueries({ queryKey: ['clinical-chat-sessions'] });
    },
  });
}

export function useGetSnapshot(patientId: string) {
  return useQuery<any>({
    queryKey: ['clinical-chat-snapshot', patientId],
    queryFn: () => api(`/clinical-chat/context/snapshot/${patientId}`),
    enabled: Boolean(patientId),
    staleTime: 30_000,
  });
}
