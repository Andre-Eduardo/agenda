import { createFileRoute } from '@tanstack/react-router';
import { Box, Text, Button } from '@mantine/core';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  timeSlotStyle,
  timeStyle,
  quickActionStyle,
} from './styles';

export const Route = createFileRoute('/_stackedLayout/')({
  component: DashboardPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled' | 'done';

interface Appointment {
  id: number;
  patient: string;
  initials: string;
  avatarColor: string;
  type: string;
  professional: string;
  time: string;
  status: AppointmentStatus;
}

interface TimeSlot {
  time: string;
  patient: string | null;
  type: string | null;
  active: boolean;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const appointments: Appointment[] = [
  {
    id: 1,
    patient: 'Ana Beatriz Lima',
    initials: 'AB',
    avatarColor: '#455f88',
    type: 'Consulta de Rotina',
    professional: 'Dr. Carlos Mendes',
    time: '08:00',
    status: 'done',
  },
  {
    id: 2,
    patient: 'Roberto Alves',
    initials: 'RA',
    avatarColor: '#7c3aed',
    type: 'Retorno Pós-Cirúrgico',
    professional: 'Dra. Sofia Ramos',
    time: '09:15',
    status: 'confirmed',
  },
  {
    id: 3,
    patient: 'Carla Fernandes',
    initials: 'CF',
    avatarColor: '#0e7490',
    type: 'Exame de Sangue',
    professional: 'Dr. Carlos Mendes',
    time: '10:00',
    status: 'confirmed',
  },
  {
    id: 4,
    patient: 'Marcos Oliveira',
    initials: 'MO',
    avatarColor: '#be185d',
    type: 'Avaliação Cardiológica',
    professional: 'Dra. Sofia Ramos',
    time: '11:30',
    status: 'pending',
  },
  {
    id: 5,
    patient: 'Juliana Costa',
    initials: 'JC',
    avatarColor: '#b45309',
    type: 'Consulta de Rotina',
    professional: 'Dr. Carlos Mendes',
    time: '14:00',
    status: 'pending',
  },
  {
    id: 6,
    patient: 'Pedro Monteiro',
    initials: 'PM',
    avatarColor: '#6b7280',
    type: 'Triagem Inicial',
    professional: 'Dra. Sofia Ramos',
    time: '15:30',
    status: 'cancelled',
  },
];

const todaySlots: TimeSlot[] = [
  { time: '07:30', patient: null, type: null, active: false },
  { time: '08:00', patient: 'Ana Beatriz Lima', type: 'Rotina', active: false },
  { time: '09:00', patient: null, type: null, active: false },
  { time: '09:15', patient: 'Roberto Alves', type: 'Retorno', active: true },
  { time: '10:00', patient: 'Carla Fernandes', type: 'Exame', active: false },
  { time: '11:00', patient: null, type: null, active: false },
  { time: '11:30', patient: 'Marcos Oliveira', type: 'Cardiologia', active: false },
  { time: '12:00', patient: null, type: null, active: false },
];

const statusLabel: Record<AppointmentStatus, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendente',
  cancelled: 'Cancelado',
  done: 'Concluído',
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────

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

// ─── Main component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const formattedDate = format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <Box>
      {/* Page header */}
      <Box style={pageHeaderStyle}>
        <Text style={greetingStyle}>{greeting}, Dr. Admin 👋</Text>
        <Text style={dateStyle}>
          {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
        </Text>
      </Box>

      {/* Stats */}
      <Box style={statsGridStyle}>
        <StatCard
          icon="calendar_month"
          label="Consultas Hoje"
          value={24}
          accent="#455f88"
          iconBg="#eff4ff"
          iconColor="#455f88"
          trend="+3 vs ontem"
          trendPositive
        />
        <StatCard
          icon="check_circle"
          label="Atendidos"
          value={18}
          accent="#16a34a"
          iconBg="#dcfce7"
          iconColor="#16a34a"
          trend="75% taxa"
          trendPositive
        />
        <StatCard
          icon="pending_actions"
          label="Confirmações Pendentes"
          value={6}
          accent="#ca8a04"
          iconBg="#fef9c3"
          iconColor="#ca8a04"
          trend="-2 vs ontem"
          trendPositive={false}
        />
        <StatCard
          icon="stethoscope"
          label="Profissionais Ativos"
          value={8}
          accent="#7c3aed"
          iconBg="#ede9fe"
          iconColor="#7c3aed"
          trend="100% escala"
          trendPositive
        />
      </Box>

      {/* Quick actions */}
      <Box
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <Button
          leftSection={
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              add_circle
            </span>
          }
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
              print
            </span>
          }
          style={{
            fontWeight: 600,
            height: '40px',
            borderRadius: '8px',
            border: '1px solid var(--mantine-color-brand-2)',
            color: 'var(--mantine-color-brand-7)',
          }}
        >
          Imprimir Agenda
        </Button>
      </Box>

      {/* Main content grid */}
      <Box style={contentGridStyle}>
        {/* Appointments list */}
        <Box style={cardStyle}>
          <Box style={cardHeaderStyle}>
            <Text style={cardTitleStyle}>Consultas de Hoje</Text>
            <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text size="xs" c="brand.4" fw={500}>
                {appointments.length} consultas
              </Text>
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--mantine-color-brand-0)',
                  cursor: 'pointer',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '16px', color: 'var(--mantine-color-brand-4)' }}
                >
                  filter_list
                </span>
                <Text size="xs" c="brand.4" fw={600}>
                  Filtrar
                </Text>
              </Box>
            </Box>
          </Box>

          {appointments.map((appt) => (
            <Box
              key={appt.id}
              style={appointmentRowStyle}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'var(--mantine-color-brand-0)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'white';
              }}
            >
              <Box style={appointmentAvatarStyle(appt.avatarColor)}>{appt.initials}</Box>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={700} c="brand.8" truncate>
                  {appt.patient}
                </Text>
                <Text size="xs" c="brand.4" truncate>
                  {appt.type} · {appt.professional}
                </Text>
              </Box>
              <Box style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <Text size="xs" fw={700} c="brand.5">
                  {appt.time}
                </Text>
                <Box style={statusBadgeStyle(appt.status)}>
                  {statusLabel[appt.status]}
                </Box>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '18px', color: 'var(--mantine-color-brand-3)' }}
                >
                  chevron_right
                </span>
              </Box>
            </Box>
          ))}

          <Box
            style={{
              padding: '12px 20px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <Text size="sm" fw={600} c="brand.5">
              Ver todas as consultas →
            </Text>
          </Box>
        </Box>

        {/* Right column */}
        <Box style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Agenda do Dia */}
          <Box style={cardStyle}>
            <Box style={cardHeaderStyle}>
              <Text style={cardTitleStyle}>Agenda do Dia</Text>
              <Text size="xs" c="brand.4" fw={500}>
                Dr. Carlos Mendes
              </Text>
            </Box>
            {todaySlots.map((slot) => (
              <Box key={slot.time} style={timeSlotStyle(slot.active)}>
                <Text style={timeStyle}>{slot.time}</Text>
                {slot.patient ? (
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text size="xs" fw={700} c={slot.active ? 'brand.5' : 'brand.8'} truncate>
                      {slot.patient}
                    </Text>
                    <Text size="xs" c="brand.4">
                      {slot.type}
                    </Text>
                  </Box>
                ) : (
                  <Text
                    size="xs"
                    c="brand.2"
                    fw={500}
                    style={{ fontStyle: 'italic' }}
                  >
                    Disponível
                  </Text>
                )}
                {slot.active && (
                  <Box
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#455f88',
                      flexShrink: 0,
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>

          {/* Ações rápidas */}
          <Box style={cardStyle}>
            <Box style={cardHeaderStyle}>
              <Text style={cardTitleStyle}>Ações Rápidas</Text>
            </Box>
            <Box
              style={{
                display: 'flex',
                gap: '10px',
                padding: '16px',
                flexWrap: 'wrap',
              }}
            >
              {[
                { icon: 'person_search', label: 'Buscar Paciente' },
                { icon: 'receipt_long', label: 'Prontuário' },
                { icon: 'local_pharmacy', label: 'Prescrição' },
                { icon: 'bar_chart', label: 'Relatório' },
              ].map((action) => (
                <Box
                  key={action.label}
                  style={quickActionStyle}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      'var(--mantine-color-brand-1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      'var(--mantine-color-brand-0)';
                  }}
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

          {/* Resumo do Mês */}
          <Box style={cardStyle}>
            <Box style={cardHeaderStyle}>
              <Text style={cardTitleStyle}>Resumo do Mês</Text>
              <Text size="xs" c="brand.4" fw={500}>
                Abril 2026
              </Text>
            </Box>
            <Box style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Total de Consultas', value: '312', icon: 'calendar_month', color: '#455f88' },
                { label: 'Novos Pacientes', value: '47', icon: 'person_add', color: '#16a34a' },
                { label: 'Taxa de Ocupação', value: '84%', icon: 'donut_large', color: '#7c3aed' },
                { label: 'Cancelamentos', value: '23', icon: 'event_busy', color: '#dc2626' },
              ].map((item) => (
                <Box
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '18px', color: item.color }}
                    >
                      {item.icon}
                    </span>
                    <Text size="xs" c="brand.4" fw={500}>
                      {item.label}
                    </Text>
                  </Box>
                  <Text size="sm" fw={800} c="brand.8">
                    {item.value}
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
