import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Play, FileText, Users, Calendar } from "lucide-react";
import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Page } from "@/views/components/Page";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AIBlock } from "@/components/clinical/ai-block";
import { VitalsDisplay } from "@/components/clinical/vitals-display";
import { useSearchPatients, useSearchAppointments } from "@agenda-app/client";
import type { Appointment } from "@agenda-app/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_stackedLayout/")({
  component: DashboardPage,
});

// ── Void-cast helpers ────────────────────────────────────────────────────────

interface PatientPage { totalCount: number; data: unknown[] }
interface AppointmentPage { totalCount: number; data: Appointment[] }

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
    <div className="rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card) px-4 py-[14px]">
      <p className="text-sm leading-[1.4] text-(--color-text-secondary)">{label}</p>
      {loading ? (
        <Skeleton className="mt-1 h-7 w-14" />
      ) : (
        <p className="mt-1 font-mono text-xl font-medium leading-[1.2] tabular-nums text-(--color-text-primary)">
          {value}
        </p>
      )}
      {delta && !loading && (
        <p className="mt-0.5 text-xs leading-[1.4] text-(--color-success)">{delta}</p>
      )}
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
  const styles: Record<string, string> = {
    "ai-soft": "bg-(--color-ai-bg) text-(--color-ai-text) border border-(--color-ai-border)/30",
    primary: "bg-(--color-primary-surface) text-(--color-primary-text) border border-(--color-primary-border)",
    neutral: "bg-(--color-bg-surface) text-(--color-text-secondary) border border-(--color-border)",
    info: "bg-(--color-info-surface) text-(--color-info) border border-(--color-info)/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-(--radius-badge) px-[10px] py-1 text-xs font-medium",
        styles[variant],
      )}
    >
      {dot && <span className="text-[8px] leading-none">●</span>}
      {children}
    </span>
  );
}

function AIActionButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-(--radius-button) bg-(--color-ai-badge-bg) px-3 py-[7px] text-[13px] font-medium text-white transition-all duration-(--duration-fast) ease-out hover:opacity-90 focus-visible:outline-none"
    >
      {children}
    </button>
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
  const apptPart = isLoading
    ? "carregando…"
    : appointmentsTotal !== undefined
      ? `${appointmentsTotal} consultas agendadas`
      : "";
  return `${capitalDay}, ${dayMonth}${apptPart ? ` · ${apptPart}` : ""}`;
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
    sort: { startAt: "asc" as "asc" },
  }) as unknown as UseQueryResult<AppointmentPage>;

  const totalPatients = patientsQuery.data?.totalCount;
  const totalAppointments = appointmentsQuery.data?.totalCount;
  const appointments = appointmentsQuery.data?.data ?? [];

  // First upcoming appointment (startAt >= now)
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
      <div className="grid grid-cols-4 gap-3 mb-6">
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

      <div className="grid gap-4 grid-cols-[1.4fr_1fr]">
        {/* AI pre-evolutions */}
        <Card className="rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card) shadow-none">
          <CardHeader className="flex-row items-center justify-between space-y-0 px-4 py-3">
            <h3 className="text-sm-body font-medium text-(--color-text-primary)">
              Pré-evoluções aguardando revisão
            </h3>
            <ClinicalBadge variant="ai-soft">— pendentes</ClinicalBadge>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-4 pb-4 pt-0">
            <div className="flex items-center justify-center py-8 text-sm text-(--color-text-tertiary)">
              Nenhuma pré-evolução pendente
            </div>
          </CardContent>
        </Card>

        {/* Next appointment */}
        <Card className="rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card) shadow-none">
          <CardHeader className="flex-row items-center justify-between space-y-0 px-4 py-3">
            <h3 className="text-sm-body font-medium text-(--color-text-primary)">
              Próxima consulta
            </h3>
            {appointmentsQuery.isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : nextIsSoon ? (
              <ClinicalBadge variant="primary" dot>
                em {minsUntilNext} min
              </ClinicalBadge>
            ) : nextAppointment ? (
              <ClinicalBadge variant="neutral">
                {formatTime(nextAppointment.startAt)}
              </ClinicalBadge>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-4 pb-4 pt-0">
            {appointmentsQuery.isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-8 w-32" />
              </div>
            ) : nextAppointment ? (
              <>
                <div>
                  <p className="text-lead font-medium leading-[1.3] text-(--color-text-primary)">
                    Consulta agendada
                  </p>
                  <p className="mt-[2px] font-mono text-xs leading-[1.4] tabular-nums text-(--color-text-secondary)">
                    {formatTime(nextAppointment.startAt)} · {nextAppointment.durationMinutes} min
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <ClinicalBadge variant="neutral">
                    {appointmentTypeLabel(nextAppointment.type)}
                  </ClinicalBadge>
                </div>
                <div className="flex gap-2 mt-1">
                  <Button
                    size="sm"
                    onClick={() => void navigate({ to: "/patients" })}
                  >
                    <Play className="size-4" />
                    Ver pacientes
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-8 text-sm text-(--color-text-tertiary)">
                Nenhuma consulta agendada
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
