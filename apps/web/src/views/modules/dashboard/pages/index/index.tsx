import { useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Box, Text, Button } from '@mantine/core';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSearchAppointments, useSearchPatients, useSearchRecords, useGetCurrentUser } from '@agenda-app/client';
import {
  pageHeaderStyle,
  greetingStyle,
  dateStyle,
  statsGridStyle,
  statCardStyle,
  statCardAccentStyle,
  statIconContainerStyle,
  statValueStyle,
  statLabelStyle,
  statTrendStyle,
  contentGridStyle,
  cardStyle,
  cardHeaderStyle,
  cardTitleStyle,
  appointmentRowStyle,
  appointmentAvatarStyle,
  statusBadgeStyle,
  quickActionStyle,
} from './styles';

export const Route = createFileRoute('/_stackedLayout/')({
  component: DashboardPage,
});

type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled' | 'done';

const statusLabel: Record<AppointmentStatus, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendente',
  cancelled: 'Cancelado',
  done: 'Concluído',
};

function mapStatus(raw: string | undefined): AppointmentStatus {
  switch (raw) {
    case 'COMPLETED':
      return 'done';
    case 'CANCELED':
      return 'cancelled';
    case 'SCHEDULED':
      return 'confirmed';
    default:
      return 'pending';
  }
}

function initialsOf(name: string | undefined): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

const AVATAR_PALETTE = ['#455f88', '#7c3aed', '#0e7490', '#be185d', '#b45309', '#16a34a'];

function colorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  accent: string;
  iconBg: string;
  iconColor: string;
  trend: string;
  trendPositive: boolean;
}

function StatCard({ icon, label, value, accent, iconBg, iconColor, trend, trendPositive }: StatCardProps) {
  return (
    <Box style={statCardStyle}>
      <Box style={statCardAccentStyle(accent)} />
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box style={statIconContainerStyle(iconBg)}>
          <span className="material-symbols-outlined" style={{ fontSize: '22px', color: iconColor }}>
            {icon}
          </span>
        </Box>
        <Box style={statTrendStyle(trendPositive)}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
            {trendPositive ? 'trending_up' : 'trending_down'}
          </span>
          {trend}
        </Box>
      </Box>
      <Box>
        <Text style={statValueStyle}>{value}</Text>
        <Text style={statLabelStyle}>{label}</Text>
      </Box>
    </Box>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const formattedDate = format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const { dateFrom, dateTo } = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
  }, []);

  const { data: userData } = useGetCurrentUser({ query: { retry: false, staleTime: 60_000 } } as any);
  const user = userData as any;
  const userName = user?.name ?? user?.email ?? 'Doutor';

  const { data: apptData } = useSearchAppointments({
    dateFrom,
    dateTo,
    limit: 50,
  } as any);
  const appointments = ((apptData as any)?.items ?? []) as any[];
  const totalAppts = (apptData as any)?.total ?? appointments.length;
  const done = appointments.filter((a) => a.status === 'COMPLETED').length;
  const pending = appointments.filter((a) => a.status === 'SCHEDULED').length;
  const attendanceRate = totalAppts > 0 ? Math.round((done / totalAppts) * 100) : 0;

  const { data: patientsData } = useSearchPatients({ limit: 1, cursor: null, sort: null } as any);
  const totalPatients = (patientsData as any)?.total ?? 0;

  const { data: recordsData } = useSearchRecords({ limit: 5, cursor: null, sort: null } as any);
  const recentRecords = ((recordsData as any)?.items ?? []) as any[];

  return (
    <Box>
      <Box style={pageHeaderStyle}>
        <Text style={greetingStyle}>{greeting}, {userName} 👋</Text>
        <Text style={dateStyle}>
          {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
        </Text>
      </Box>

      <Box style={statsGridStyle}>
        <StatCard
          icon="calendar_month"
          label="Consultas Hoje"
          value={totalAppts}
          accent="#455f88"
          iconBg="#eff4ff"
          iconColor="#455f88"
          trend={`${appointments.length} agendadas`}
          trendPositive
        />
        <StatCard
          icon="check_circle"
          label="Atendidos"
          value={done}
          accent="#16a34a"
          iconBg="#dcfce7"
          iconColor="#16a34a"
          trend={`${attendanceRate}% taxa`}
          trendPositive
        />
        <StatCard
          icon="pending_actions"
          label="Pendentes"
          value={pending}
          accent="#ca8a04"
          iconBg="#fef9c3"
          iconColor="#ca8a04"
          trend={`${pending} hoje`}
          trendPositive={false}
        />
        <StatCard
          icon="groups"
          label="Pacientes"
          value={totalPatients}
          accent="#7c3aed"
          iconBg="#ede9fe"
          iconColor="#7c3aed"
          trend="total"
          trendPositive
        />
      </Box>

      <Box style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Button
          leftSection={
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              add_circle
            </span>
          }
          onClick={() => navigate({ to: '/appointments' })}
          style={{
            background: 'linear-gradient(135deg, var(--mantine-color-brand-5), var(--mantine-color-brand-7))',
            color: 'white',
            fontWeight: 700,
            height: '40px',
            borderRadius: '8px',
          }}
        >
          Nova Consulta
        </Button>
        <Button
          variant="default"
          leftSection={
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              person_add
            </span>
          }
          onClick={() => navigate({ to: '/patients/new' })}
          style={{
            fontWeight: 600,
            height: '40px',
            borderRadius: '8px',
            border: '1px solid var(--mantine-color-brand-2)',
            color: 'var(--mantine-color-brand-7)',
          }}
        >
          Novo Paciente
        </Button>
        <Button
          variant="default"
          leftSection={
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              list_alt
            </span>
          }
          onClick={() => navigate({ to: '/patients' })}
          style={{
            fontWeight: 600,
            height: '40px',
            borderRadius: '8px',
            border: '1px solid var(--mantine-color-brand-2)',
            color: 'var(--mantine-color-brand-7)',
          }}
        >
          Lista de Pacientes
        </Button>
      </Box>

      <Box style={contentGridStyle}>
        <Box style={cardStyle}>
          <Box style={cardHeaderStyle}>
            <Text style={cardTitleStyle}>Consultas de Hoje</Text>
            <Text size="xs" c="brand.4" fw={500}>
              {appointments.length} consultas
            </Text>
          </Box>

          {appointments.length === 0 ? (
            <Box style={{ padding: '32px 20px', textAlign: 'center' }}>
              <Text size="sm" c="dimmed">Nenhuma consulta para hoje.</Text>
            </Box>
          ) : (
            appointments.slice(0, 8).map((appt) => {
              const status = mapStatus(appt.status);
              const patientName = appt.patient?.name ?? appt.patientName ?? '—';
              const professionalName = appt.professional?.name ?? appt.professionalName ?? '—';
              const time = appt.scheduledAt ? format(new Date(appt.scheduledAt), 'HH:mm') : '--:--';
              return (
                <Box
                  key={appt.id}
                  style={appointmentRowStyle}
                  onClick={() => navigate({ to: '/appointments' })}
                >
                  <Box style={appointmentAvatarStyle(colorFor(appt.id ?? patientName))}>
                    {initialsOf(patientName)}
                  </Box>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={700} c="brand.8" truncate>
                      {patientName}
                    </Text>
                    <Text size="xs" c="brand.4" truncate>
                      {appt.type ?? 'Consulta'} · {professionalName}
                    </Text>
                  </Box>
                  <Box style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <Text size="xs" fw={700} c="brand.5">
                      {time}
                    </Text>
                    <Box style={statusBadgeStyle(status)}>{statusLabel[status]}</Box>
                  </Box>
                </Box>
              );
            })
          )}

          <Box
            style={{ padding: '12px 20px', textAlign: 'center', cursor: 'pointer' }}
            onClick={() => navigate({ to: '/appointments' })}
          >
            <Text size="sm" fw={600} c="brand.5">
              Ver todas as consultas →
            </Text>
          </Box>
        </Box>

        <Box style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Box style={cardStyle}>
            <Box style={cardHeaderStyle}>
              <Text style={cardTitleStyle}>Evoluções recentes</Text>
            </Box>
            <Box style={{ padding: '8px 0' }}>
              {recentRecords.length === 0 ? (
                <Box style={{ padding: '24px 20px', textAlign: 'center' }}>
                  <Text size="sm" c="dimmed">Sem evoluções recentes.</Text>
                </Box>
              ) : (
                recentRecords.map((r: any) => (
                  <Box
                    key={r.id}
                    style={{ padding: '10px 20px', cursor: 'pointer' }}
                    onClick={() =>
                      navigate({
                        to: '/patients/$patientId',
                        params: { patientId: r.patientId },
                      })
                    }
                  >
                    <Text size="sm" fw={700} c="brand.8" truncate>
                      {r.patient?.name ?? 'Paciente'}
                    </Text>
                    <Text size="xs" c="brand.4" truncate>
                      {r.attendanceType ?? 'Atendimento'} ·{' '}
                      {r.eventDate ? format(new Date(r.eventDate), "dd/MM HH:mm") : '—'}
                    </Text>
                  </Box>
                ))
              )}
            </Box>
          </Box>

          <Box style={cardStyle}>
            <Box style={cardHeaderStyle}>
              <Text style={cardTitleStyle}>Ações Rápidas</Text>
            </Box>
            <Box style={{ display: 'flex', gap: '10px', padding: '16px', flexWrap: 'wrap' }}>
              {[
                { icon: 'person_search', label: 'Buscar Paciente', to: '/patients' as const },
                { icon: 'event', label: 'Agenda', to: '/appointments' as const },
                { icon: 'badge', label: 'Profissionais', to: '/professionals' as const },
                { icon: 'description', label: 'Templates', to: '/form-templates' as const },
              ].map((action) => (
                <Box
                  key={action.label}
                  style={quickActionStyle}
                  onClick={() => navigate({ to: action.to })}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '22px', color: 'var(--mantine-color-brand-5)' }}
                  >
                    {action.icon}
                  </span>
                  <Text size="xs" fw={600} c="brand.7" ta="center" lh={1.3}>
                    {action.label}
                  </Text>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
