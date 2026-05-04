import { createFileRoute, useNavigate } from '@tanstack/react-router';
import type { UseQueryResult } from '@tanstack/react-query';
import {
  useGetCurrentUser,
  useSearchAppointments,
  useSearchRecords,
  AppointmentStatus,
  AppointmentType,
  type Appointment,
  type Record as ClinicalRecord,
} from '@agenda-app/client';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CalendarX2,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  CircleCheckBig,
  Clock,
  FileText,
  Sparkles,
  Stethoscope,
  UserPlus,
} from 'lucide-react';
import { Page } from '@/views/components/Page';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import * as S from './styles';

// ─── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_stackedLayout/dashboard')({
  component: DashboardPage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface PaginatedPage<T> {
  data: T[];
  totalCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(iso: string) {
  return iso.slice(0, 10); // YYYY-MM-DD
}

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function fmtFullDate() {
  const now = new Date();
  const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return `${weekdays[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
}

function fmtDayLabel(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((dt.getTime() - today.getTime()) / 86_400_000);
  if (diff === 1) return 'Amanhã';
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  if (diff < 7) return weekdays[dt.getDay()];
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

const STATUS_LABELS: Record<string, string> = {
  [AppointmentStatus.SCHEDULED]:   'Agendado',
  [AppointmentStatus.CONFIRMED]:   'Confirmado',
  [AppointmentStatus.COMPLETED]:   'Realizado',
  [AppointmentStatus.CANCELLED]:   'Cancelado',
  [AppointmentStatus.NO_SHOW]:     'Não compareceu',
  [AppointmentStatus.ARRIVED]:     'Chegou',
  [AppointmentStatus.IN_PROGRESS]: 'Em atendimento',
};

const TYPE_LABELS: Record<string, string> = {
  [AppointmentType.FIRST_VISIT]:  'Primeira consulta',
  [AppointmentType.RETURN]:       'Retorno',
  [AppointmentType.WALK_IN]:      'Urgência',
  [AppointmentType.TELEMEDICINE]: 'Teleconsulta',
  [AppointmentType.PROCEDURE]:    'Procedimento',
};

const ACTIVE_STATUSES = new Set([
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.ARRIVED,
  AppointmentStatus.IN_PROGRESS,
]);

// ─── Page ────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate();

  // Current user
  const userQuery = useGetCurrentUser();
  const user = userQuery.data;
  const firstName = user?.name?.split(' ')[0] ?? '…';

  // Appointments — fetch a generous batch, filter client-side
  const apptQuery = useSearchAppointments({
    term: '',
    limit: 200,
    cursor: null,
    sort: { startAt: 'asc' },
  }) as unknown as UseQueryResult<PaginatedPage<Appointment>>;

  const allAppts = apptQuery.data?.data ?? [];
  const today = todayStr();

  const todayAppts = allAppts
    .filter(a => toDateStr(a.startAt) === today)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  const upcomingAppts = allAppts
    .filter(a => toDateStr(a.startAt) > today && ACTIVE_STATUSES.has(a.status))
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 5);

  const counts = {
    total:     todayAppts.length,
    confirmed: todayAppts.filter(a => a.status === AppointmentStatus.CONFIRMED).length,
    done:      todayAppts.filter(a => a.status === AppointmentStatus.COMPLETED).length,
    pending:   todayAppts.filter(a => ACTIVE_STATUSES.has(a.status)).length,
  };

  // Recent records (evolutions)
  const recentQuery = useSearchRecords({
    term: '',
    limit: 5,
    cursor: null,
    patientId: '',
    attendanceType: undefined as unknown as string,
    clinicalStatus: undefined as unknown as string,
    dateStart: '',
    dateEnd: '',
    source: undefined as unknown as string,
    sort: { eventDate: 'desc' },
  }) as unknown as UseQueryResult<PaginatedPage<ClinicalRecord>>;

  const recentRecords = recentQuery.data?.data ?? [];
  const isLoading = apptQuery.isLoading || userQuery.isLoading;

  return (
    <Page title="Dashboard" className={S.page}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={S.header}>
        <div>
          {isLoading ? (
            <Skeleton className="h-7 w-48 mb-1" />
          ) : (
            <h1 className={S.greeting}>{greeting()}, {firstName}</h1>
          )}
          <p className={S.dateLabel}>{fmtFullDate()}</p>
        </div>
        <div className={S.agentBadge}>
          <span className={S.agentDot} />
          <span className="text-(--color-text-secondary)">Agente IA ativo</span>
          <Sparkles size={12} />
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className={S.statsGrid}>
        <StatCard label="Consultas hoje" value={counts.total}     icon={<Clock size={16} />}          tone="neutral" loading={isLoading} />
        <StatCard label="Confirmadas"    value={counts.confirmed}  icon={<CheckCircle2 size={16} />}   tone="success" loading={isLoading} />
        <StatCard label="Realizadas"     value={counts.done}       icon={<CircleCheckBig size={16} />} tone="muted"   loading={isLoading} />
        <StatCard label="Pendentes"      value={counts.pending}    icon={<Clock size={16} />}          tone="primary" loading={isLoading} />
      </div>

      {/* ── Two-column body ────────────────────────────────────────────── */}
      <div className={S.cols}>
        {/* Left column */}
        <div className={S.colMain}>
          {/* Today's appointments */}
          <section className={S.sectionCard}>
            <div className={S.sectionHead}>
              <div>
                <div className={S.sectionTitle}>Consultas de hoje</div>
                {counts.total > 0 && (
                  <div className={S.sectionSub}>
                    {counts.total} {counts.total === 1 ? 'consulta agendada' : 'consultas agendadas'}
                  </div>
                )}
              </div>
              <button
                className={S.secLink}
                onClick={() => navigate({ to: '/agenda' })}
              >
                Ver agenda <ArrowUpRight size={12} />
              </button>
            </div>
            <div className={S.sectionBody}>
              {isLoading ? (
                <AppointmentSkeleton rows={3} />
              ) : todayAppts.length === 0 ? (
                <div className={S.empty}>
                  <CalendarX2 size={28} className={S.emptyIcon} />
                  <div className={S.emptyTitle}>Sem consultas hoje</div>
                  <p className={S.emptySub}>
                    Aproveite para revisar pendências ou criar novos agendamentos.
                  </p>
                </div>
              ) : (
                <div className={S.apptList}>
                  {todayAppts.map(apt => (
                    <ApptRow key={apt.id} apt={apt} />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Recent records */}
          <section className={S.sectionCard}>
            <div className={S.sectionHead}>
              <div>
                <div className={S.sectionTitle}>Atividade recente</div>
                <div className={S.sectionSub}>Últimas evoluções registradas</div>
              </div>
              <button className={S.secLink}>
                Ver todas <ArrowUpRight size={12} />
              </button>
            </div>
            <div className={S.sectionBody}>
              {recentQuery.isLoading ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-3.5 w-32 mb-1.5" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentRecords.length === 0 ? (
                <div className={S.empty}>
                  <FileText size={24} className={S.emptyIcon} />
                  <div className={S.emptyTitle}>Nenhuma evolução registrada</div>
                </div>
              ) : (
                <div className={S.evolList}>
                  {recentRecords.map(rec => (
                    <RecentRecordRow key={rec.id} record={rec} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className={S.colSide}>
          {/* Quick actions */}
          <section className={S.sectionCard}>
            <div className={S.sectionHead}>
              <div className={S.sectionTitle}>Ações rápidas</div>
            </div>
            <div className={S.sectionBody}>
              <div className={S.qaGrid}>
                <QuickAction
                  icon={<UserPlus size={16} />}
                  label="Novo paciente"
                  onClick={() => navigate({ to: '/patients/new' })}
                />
                <QuickAction
                  icon={<FileText size={16} />}
                  label="Nova evolução"
                  sub="Buscar paciente"
                  onClick={() => navigate({ to: '/patients' })}
                />
                <QuickAction
                  icon={<CalendarPlus size={16} />}
                  label="Novo agendamento"
                  onClick={() => navigate({ to: '/agenda' })}
                />
                <QuickAction
                  icon={<Stethoscope size={16} />}
                  label="Ver pacientes"
                  onClick={() => navigate({ to: '/patients' })}
                />
              </div>
            </div>
          </section>

          {/* Upcoming appointments */}
          <section className={S.sectionCard}>
            <div className={S.sectionHead}>
              <div>
                <div className={S.sectionTitle}>Próximas consultas</div>
                <div className={S.sectionSub}>A partir de amanhã</div>
              </div>
              <button
                className={S.secLink}
                onClick={() => navigate({ to: '/agenda' })}
              >
                Ver agenda <ArrowUpRight size={12} />
              </button>
            </div>
            <div className={S.sectionBody}>
              {isLoading ? (
                <AppointmentSkeleton rows={3} compact />
              ) : upcomingAppts.length === 0 ? (
                <div className={S.empty}>
                  <CalendarX2 size={22} className={S.emptyIcon} />
                  <div className={S.emptyTitle}>Nenhuma consulta agendada</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate({ to: '/agenda' })}
                    className="mt-1"
                  >
                    <CalendarPlus size={13} />
                    Criar agendamento
                  </Button>
                </div>
              ) : (
                <div className={S.upList}>
                  {upcomingAppts.map(apt => (
                    <UpcomingRow key={apt.id} apt={apt} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </Page>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  tone,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: 'neutral' | 'success' | 'muted' | 'primary';
  loading?: boolean;
}) {
  return (
    <div className={S.statCard}>
      <div className={S.statIcon({ tone })}>
        {icon}
      </div>
      <div>
        {loading ? (
          <Skeleton className="h-6 w-8 mb-1" />
        ) : (
          <div className={S.statValue}>{value}</div>
        )}
        <div className={S.statLabel}>{label}</div>
      </div>
    </div>
  );
}

function ApptRow({ apt }: { apt: Appointment }) {
  const start = fmtTime(apt.startAt);
  const end = fmtTime(apt.endAt);
  const status = apt.status;
  const isActive = ACTIVE_STATUSES.has(status);

  return (
    <div className={S.apptRow}>
      {/* Time */}
      <div className={S.apptTime}>
        <span className={S.apptTimeStart}>{start}</span>
        <span className={S.apptTimeEnd}>{end}</span>
      </div>

      {/* Patient placeholder (no patient enrichment here) */}
      <div className={S.apptPatBtn}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-text-tertiary)/15 text-[11px] font-medium text-(--color-text-secondary)">
          —
        </div>
        <div className="min-w-0">
          <div className={S.apptPatName}>Paciente</div>
          <div className={S.apptPatType}>
            {TYPE_LABELS[apt.type] ?? apt.type}
          </div>
        </div>
      </div>

      {/* Status badge */}
      <span className={S.statusBadge({ status })}>
        <span className={S.statusDot} />
        {STATUS_LABELS[status] ?? status}
      </span>

      {/* Action */}
      {isActive && (
        <Button size="sm" variant="outline" className="shrink-0 gap-1.5">
          <Stethoscope size={12} />
          Iniciar
        </Button>
      )}
    </div>
  );
}

function RecentRecordRow({ record }: { record: ClinicalRecord }) {
  const dateLabel = record.eventDate
    ? (() => {
        const [y, m, d] = (record.eventDate as string).split('-').map(Number);
        const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        return `${String(d).padStart(2, '0')} ${months[m - 1]}`;
      })()
    : '';

  const excerpt =
    (record.subjective as string | null) ??
    (record.description as string | null) ??
    (record.freeNotes as string | null) ??
    'Sem conteúdo';

  return (
    <div className={S.evolRow}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-text-tertiary)/15 text-[11px] font-medium text-(--color-text-secondary)">
        P
      </div>
      <div className={S.evolBody}>
        <div className={S.evolMeta}>
          {dateLabel && <span className="font-mono tabular-nums">{dateLabel}</span>}
          {record.attendanceType && (
            <>
              <span>·</span>
              <span>{record.attendanceType}</span>
            </>
          )}
          {record.source === 'AI' && (
            <span className={S.aiBadge}>
              <Sparkles size={9} />
              Origem IA
            </span>
          )}
        </div>
        <div className={S.evolExcerpt}>{excerpt}</div>
      </div>
    </div>
  );
}

function UpcomingRow({ apt }: { apt: Appointment }) {
  const dateStr = toDateStr(apt.startAt);
  const dayLabel = fmtDayLabel(dateStr);
  const timeLabel = fmtTime(apt.startAt);

  return (
    <div className={S.upRow}>
      <div className={S.upDate}>
        <span className={S.upDay}>{dayLabel}</span>
        <span className={S.upTime}>{timeLabel}</span>
      </div>
      <div className={S.upInfo}>
        <div className={S.upName}>Paciente</div>
        <div className={S.upType}>{TYPE_LABELS[apt.type] ?? apt.type}</div>
      </div>
      <ChevronRight size={14} className="text-(--color-text-tertiary) shrink-0" />
    </div>
  );
}

function QuickAction({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick?: () => void;
}) {
  return (
    <button className={S.qaBtn} onClick={onClick}>
      <span className={S.qaIcon}>{icon}</span>
      <div>
        <div className={S.qaLabel}>{label}</div>
        {sub && <div className={S.qaSub}>{sub}</div>}
      </div>
    </button>
  );
}

function AppointmentSkeleton({ rows, compact }: { rows: number; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {!compact && <Skeleton className="h-9 w-12" />}
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-3.5 w-28 mb-1.5" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
