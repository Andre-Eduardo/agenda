import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Play } from "lucide-react";
import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Page } from "@/views/components/Page";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchPatients, useSearchAppointments } from "@agenda-app/client";
import type { Appointment } from "@agenda-app/client";
import * as S from "./styles";

export const Route = createFileRoute("/_stackedLayout/")({
  component: DashboardPage,
});

// ── Void-cast helpers ────────────────────────────────────────────────────────

interface PatientPage {
  totalCount: number;
  data: unknown[];
}

interface AppointmentPage {
  totalCount: number;
  data: Appointment[];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  delta,
  loading = false,
}: {
  label: string;
  value: string | number;
  delta?: string;
  loading?: boolean;
}) {
  return (
    <div className={S.statTile.root}>
      <p className={S.statTile.label}>{label}</p>

      {loading ? <Skeleton className="mt-1 h-7 w-14" /> : <p className={S.statTile.value}>{value}</p>}

      {delta && !loading && <p className={S.statTile.delta}>{delta}</p>}
    </div>
  );
}

function ClinicalBadge({
  variant = "neutral",
  children,
  dot,
}: {
  variant?: "ai-soft" | "primary" | "neutral" | "info";
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span className={S.clinicalBadge({ variant })}>
      {dot && <span className="text-[8px] leading-none">●</span>}
      {children}
    </span>
  );
}

function appointmentTypeLabel(type: Appointment["type"]): string {
  const map: Record<string, string> = {
    FIRST_VISIT: "Primeira consulta",
    RETURN: "Retorno",
    WALK_IN: "Encaixe",
    TELEMEDICINE: "Telemedicina",
    PROCEDURE: "Procedimento",
  };

  return map[type] ?? type;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function minutesUntil(iso: string): number {
  return Math.floor((new Date(iso).getTime() - Date.now()) / 60_000);
}

function getPageSubtitle(appointmentsTotal: number | undefined, isLoading: boolean) {
  const now = new Date();
  const dayName = now.toLocaleDateString("pt-BR", { weekday: "long" });
  const dayMonth = now.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  const capitalDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  let apptPart = "";

  if (isLoading) {
    apptPart = "carregando…";
  } else if (appointmentsTotal !== undefined) {
    apptPart = `${appointmentsTotal} consultas agendadas`;
  }

  return `${capitalDay}, ${dayMonth}${apptPart ? ` · ${apptPart}` : ""}`;
}

function NextAppointmentContent({
  isLoading,
  appointment,
  onNavigate,
}: {
  isLoading: boolean;
  appointment: Appointment | undefined;
  onNavigate: () => void;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (!appointment) {
    return <div className={S.panelCard.empty}>Nenhuma consulta agendada</div>;
  }

  return (
    <>
      <div>
        <p className={S.appointment.title}>Consulta agendada</p>
        <p className={S.appointment.time}>
          {formatTime(appointment.startAt)} · {appointment.durationMinutes} min
        </p>
      </div>
      <div className={S.appointment.badgeRow}>
        <ClinicalBadge variant="neutral">{appointmentTypeLabel(appointment.type)}</ClinicalBadge>
      </div>
      <div className={S.appointment.actionRow}>
        <Button size="sm" onClick={onNavigate}>
          <Play className="size-4" />
          Ver pacientes
        </Button>
      </div>
    </>
  );
}

function NextBadge({
  isLoading,
  isSoon,
  minsUntil,
  appointment,
}: {
  isLoading: boolean;
  isSoon: boolean;
  minsUntil: number | null;
  appointment: Appointment | undefined;
}) {
  if (isLoading) return <Skeleton className="h-6 w-20" />;

  if (isSoon) {
    return (
      <ClinicalBadge variant="primary" dot>
        em {minsUntil} min
      </ClinicalBadge>
    );
  }

  if (appointment) {
    return <ClinicalBadge variant="neutral">{formatTime(appointment.startAt)}</ClinicalBadge>;
  }

  return null;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate();

  const patientsQuery = useSearchPatients({
    term: "",
    limit: 1,
    cursor: null,
    sort: null,
  }) as unknown as UseQueryResult<PatientPage>;

  const appointmentsQuery = useSearchAppointments({
    term: "",
    limit: 5,
    cursor: null,
    sort: { startAt: "asc" as const },
  }) as unknown as UseQueryResult<AppointmentPage>;

  const totalPatients = patientsQuery.data?.totalCount;
  const totalAppointments = appointmentsQuery.data?.totalCount;
  const appointments = appointmentsQuery.data?.data ?? [];

  const now = new Date();
  const nextAppointment = appointments.find((a) => new Date(a.startAt) >= now) ?? appointments[0];
  const minsUntilNext = nextAppointment ? minutesUntil(nextAppointment.startAt) : null;
  const nextIsUpcoming = minsUntilNext !== null && minsUntilNext > 0;
  const nextIsSoon = nextIsUpcoming && minsUntilNext <= 30;

  return (
    <Page
      title="Hoje"
      subtitle={getPageSubtitle(totalAppointments, appointmentsQuery.isLoading)}
    >
      {/* Stat tiles */}
      <div className={S.statsGrid}>
        <StatTile
          label="Consultas agendadas"
          value={totalAppointments ?? "—"}
          loading={appointmentsQuery.isLoading}
        />
        <StatTile label="Pré-evoluções IA" value="—" delta="aguardam revisão" />
        <StatTile
          label="Pacientes ativos"
          value={totalPatients ?? "—"}
          loading={patientsQuery.isLoading}
        />
        <StatTile label="Tempo médio consulta" value="—" />
      </div>

      <div className={S.mainGrid}>
        {/* AI pre-evolutions */}
        <Card className={S.panelCard.root}>
          <CardHeader className={S.panelCard.header}>
            <h3 className={S.panelCard.title}>Pré-evoluções aguardando revisão</h3>
            <ClinicalBadge variant="ai-soft">— pendentes</ClinicalBadge>
          </CardHeader>
          <CardContent className={S.panelCard.content}>
            <div className={S.panelCard.empty}>Nenhuma pré-evolução pendente</div>
          </CardContent>
        </Card>

        {/* Next appointment */}
        <Card className={S.panelCard.root}>
          <CardHeader className={S.panelCard.header}>
            <h3 className={S.panelCard.title}>Próxima consulta</h3>
            <NextBadge
              isLoading={appointmentsQuery.isLoading}
              isSoon={nextIsSoon}
              minsUntil={minsUntilNext}
              appointment={nextAppointment}
            />
          </CardHeader>
          <CardContent className={S.panelCard.content}>
            <NextAppointmentContent
              isLoading={appointmentsQuery.isLoading}
              appointment={nextAppointment}
              onNavigate={() => navigate({ to: "/patients" })}
            />
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
