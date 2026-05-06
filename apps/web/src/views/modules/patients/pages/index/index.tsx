import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Plus,
  MoreHorizontal,
  Rows3,
  LayoutGrid,
  Users,
  CalendarDays,
  Sparkles,
  UserRound,
  Pencil,
  CalendarPlus,
  Archive,
  ChevronLeft,
  ChevronRight,
  SearchX,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useSearchPatients, useSearchAppointments } from "@agenda-app/client";
import type { Patient, PatientGender } from "@agenda-app/client";
import { Page } from "@/views/components/Page";
import { Button } from "@/components/ui/componentes/button";
import { Skeleton } from "@/components/ui/componentes/skeleton";
import { Badge } from "@/components/ui/componentes/badge";
import { AvatarInitials, avatarColorVariants } from "@/components/ui/componentes/avatar";
import { StatTile } from "@/components/ui/componentes/stat-tile";
import { SegmentedControl } from "@/components/ui/componentes/segmented-control";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/componentes/dropdown-menu";
import { EmptyStateCard } from "@/components/ui/componentes/empty-state";
import { cn } from "@/lib/utils";
import * as S from "./styles";

export const Route = createFileRoute("/_stackedLayout/patients")({
  component: PatientsPage,
});

// ── Types ────────────────────────────────────────────────────────────────────

type Layout = "table" | "cards";
// NOTE: Patient API does not yet expose a `status` field.
// This filter is a UI placeholder — wire to SearchPatientsParams when the
// backend adds status support.
type StatusFilter = "all" | "active" | "inactive";

interface PatientPage {
  totalCount: number;
  data: Patient[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAvatarColorIndex(id: string): number {
  let hash = 0;

  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;

  return hash % avatarColorVariants.length;
}

function getAge(birthDate: unknown): number | null {
  if (!birthDate || typeof birthDate !== "string") return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;

  return age;
}

function formatBirthDate(birthDate: unknown): string {
  if (!birthDate || typeof birthDate !== "string") return "—";

  return new Date(birthDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Sub-components ───────────────────────────────────────────────────────────

function PatientAvatar({ name, id, size = "md" }: { name: string; id: string; size?: "sm" | "md" | "lg" }) {
  return <AvatarInitials name={name} colorIndex={getAvatarColorIndex(id)} size={size} />;
}

function GenderBadge({ gender }: { gender: PatientGender }) {
  if (!gender) return null;

  const labels: Record<NonNullable<PatientGender>, string> = { FEMALE: "F", MALE: "M", OTHER: "O" };

  return <Badge gender={gender} size="sm">{labels[gender]}</Badge>;
}

const TABLE_COLS = "minmax(260px,1.6fr) 90px 1.2fr 1.2fr 130px 56px";

function PatientTableRow({
  patient,
  onClick,
}: {
  patient: Patient;
  onClick: () => void;
}) {
  const age = getAge(patient.birthDate);

  return (
    <div
      className={S.tableRow.root}
      style={{ gridTemplateColumns: TABLE_COLS }}
      onClick={onClick}
    >
      <div className={S.tableRow.nameCell}>
        <PatientAvatar name={patient.name} id={patient.id} />
        <div className={S.tableRow.nameBlock}>
          <p className={S.tableRow.name}>{patient.name}</p>
          <p className={S.tableRow.email}>
            {typeof patient.email === "string" ? patient.email : "—"}
          </p>
        </div>
      </div>

      <div className={S.tableRow.ageWrapper}>
        <span className={S.tableRow.age}>
          {age !== null ? (
            <>
              {age}
              <span className={S.tableRow.ageUnit}> anos</span>
            </>
          ) : (
            "—"
          )}
        </span>
        {age !== null && (
          <span className={S.tableRow.ageTooltip}>
            Nasc. {formatBirthDate(patient.birthDate)}
          </span>
        )}
      </div>

      <p className={S.tableRow.document}>{patient.documentId}</p>

      {patient.insurancePlan ? (
        <span className={S.tableRow.insuranceBadge}>{patient.insurancePlan.name}</span>
      ) : (
        <span className={S.tableRow.insuranceEmpty}>—</span>
      )}

      <GenderBadge gender={patient.gender} />

      <div className={S.tableRow.actionWrapper} onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="Ações" className={S.tableRow.actionBtn}>
              <MoreHorizontal className="size-4" strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClick}>
              <UserRound className="size-3.5" />
              Ver perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="size-3.5" />
              Editar cadastro
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CalendarPlus className="size-3.5" />
              Agendar consulta
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-(--color-danger) hover:bg-(--color-danger-surface) focus:bg-(--color-danger-surface)">
              <Archive className="size-3.5" />
              Arquivar paciente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function SkeletonTableRow() {
  return (
    <div
      className="grid items-center gap-4 border-b border-(--color-border) px-[18px] py-[14px] last:border-b-0"
      style={{ gridTemplateColumns: TABLE_COLS }}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-8" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-5 w-6 rounded-full" />
      <Skeleton className="ml-auto size-7 rounded-[8px]" />
    </div>
  );
}

function PatientCard({ patient, onClick }: { patient: Patient; onClick: () => void }) {
  const age = getAge(patient.birthDate);

  return (
    <div className={S.patientCard.root} onClick={onClick}>
      <div className={S.patientCard.top}>
        <PatientAvatar name={patient.name} id={patient.id} size="lg" />
        <div className={S.patientCard.nameBlock}>
          <p className={S.patientCard.name}>{patient.name}</p>
          <p className={S.patientCard.meta}>
            {age !== null ? `${age} anos` : "—"} ·{" "}
            {typeof patient.email === "string" ? patient.email : "—"}
          </p>
        </div>
      </div>
      <div className={S.patientCard.details}>
        <div className={S.patientCard.detailRow}>
          <span className={S.patientCard.detailLabel}>Documento</span>
          <span className={S.patientCard.detailValue}>{patient.documentId}</span>
        </div>
        <div className={S.patientCard.detailRow}>
          <span className={S.patientCard.detailLabel}>Convênio</span>
          <span className={S.patientCard.detailValue}>{patient.insurancePlan?.name ?? "—"}</span>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className={S.skeletonCard.root}>
      <div className={S.skeletonCard.top}>
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className={S.skeletonCard.nameBlock}>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className={S.skeletonCard.details}>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

function Pagination({ from, to, total }: { from: number; to: number; total: number }) {
  return (
    <div className={S.pagination.root}>
      <p className={S.pagination.info}>
        Mostrando{" "}
        <strong className={S.pagination.infoStrong}>{from}</strong>–
        <strong className={S.pagination.infoStrong}>{to}</strong> de{" "}
        <strong className={S.pagination.infoStrong}>{total}</strong>{" "}
        pacientes
      </p>
      <div className={S.pagination.controls}>
        <button disabled className={S.pagination.btnDisabled}>
          <ChevronLeft className="size-3.5" />
          Anterior
        </button>
        <button className={S.pagination.btnActive}>1</button>
        <button disabled className={S.pagination.btnDisabled}>
          Próxima
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Patients content ─────────────────────────────────────────────────────────

function PatientsContent({
  isLoading,
  patients,
  layout,
  search,
  setSearch,
  totalCount,
  onOpen,
}: {
  isLoading: boolean;
  patients: Patient[];
  layout: Layout;
  search: string;
  setSearch: (v: string) => void;
  totalCount: number;
  onOpen: (p: Patient) => void;
  // NOTE: statusFilter is intentionally not propagated here — filtering happens
  // at the API layer once the backend adds status support.
}) {
  if (!isLoading && patients.length === 0) {
    return (
      <EmptyStateCard
        icon={<SearchX className="size-6" strokeWidth={1.5} />}
        title="Nenhum paciente encontrado"
        description={search ? `Nenhum resultado para "${search}"` : "Ajuste os filtros para ver mais resultados"}
        action={
          <Button variant="outline" size="sm" onClick={() => setSearch("")}>
            <X className="size-4" />
            Limpar busca
          </Button>
        }
      />
    );
  }

  if (layout === "table") {
    return (
      <div className={S.table.root}>
        <div className={S.table.head} style={{ gridTemplateColumns: TABLE_COLS }}>
          {["Paciente", "Idade", "Documento", "Convênio", "Gênero", ""].map((h, i) => (
            <span key={i} className={S.table.headCell}>{h}</span>
          ))}
        </div>

        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonTableRow key={i} />)
          : patients.map((p) => (
              <PatientTableRow
                key={p.id}
                patient={p}
                onClick={() => onOpen(p)}
              />
            ))}

        <div className={S.table.footer}>
          <Pagination from={Math.min(1, patients.length)} to={patients.length} total={totalCount} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={S.cardsGrid}>
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : patients.map((p) => (
              <PatientCard key={p.id} patient={p} onClick={() => onOpen(p)} />
            ))}
      </div>
      <div className={S.cardsFooter}>
        <Pagination from={Math.min(1, patients.length)} to={patients.length} total={totalCount} />
      </div>
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function PatientsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [layout, setLayout] = useState<Layout>("table");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");


  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);

    return () => clearTimeout(t);
  }, [search]);

  const query = useSearchPatients({
    term: debouncedSearch,
    limit: 50,
    cursor: null,
    sort: null,
  }) as unknown as UseQueryResult<PatientPage>;

  const statsQuery = useSearchPatients({
    term: "",
    limit: 1,
    cursor: null,
    sort: null,
  }) as unknown as UseQueryResult<PatientPage>;

  interface AppointmentPage {
    totalCount: number;
    data: unknown[];
  }

  const appointmentsQuery = useSearchAppointments({
    term: "",
    limit: 1,
    cursor: null,
    sort: null,
  }) as unknown as UseQueryResult<AppointmentPage>;

  const patients = query.data?.data ?? [];
  const totalCount = query.data?.totalCount ?? 0;
  const totalAll = statsQuery.data?.totalCount ?? 0;
  const totalAppointments = appointmentsQuery.data?.totalCount;
  const { isLoading } = query;

  const hasFilters = !!search || statusFilter !== "all";

  function openPatient(patient: Patient) {
    navigate({ to: "/patients/$patientId", params: { patientId: patient.id } });
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  const subtitle = (
    <span>
      <span className="font-mono tabular-nums">
        {statsQuery.isLoading ? "…" : totalAll}
      </span>
      {" pacientes ativos no consultório"}
    </span>
  );

  return (
    <Page
      title="Pacientes"
      subtitle={subtitle}
      actions={
        <Button size="sm" onClick={() => navigate({ to: "/patients/new" })}>
          <Plus className="size-4" />
          Novo paciente
        </Button>
      }
    >
      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatTile
          label="Total de pacientes"
          value={totalAll}
          delta={
            <span>
              <span className="font-medium text-(--color-success)">+4</span> nos últimos 30 dias
            </span>
          }
          loading={statsQuery.isLoading}
          icon={<Users className="size-4" strokeWidth={1.5} />}
          iconIntent="primary"
        />
        <StatTile
          label="Total de consultas"
          value={totalAppointments ?? 0}
          loading={appointmentsQuery.isLoading}
          icon={<CalendarDays className="size-4" strokeWidth={1.5} />}
          iconIntent="info"
        />
        <StatTile
          label="Pré-evoluções IA"
          value="—"
          delta="conectar módulo IA"
          loading={false}
          icon={<Sparkles className="size-4" strokeWidth={1.5} />}
          iconIntent="ai"
        />
      </div>

      {/* Toolbar */}
      <div className={S.toolbar.root}>
        {/* Search */}
        <div className={S.toolbar.search}>
          <Search className="size-4 shrink-0 text-(--color-text-tertiary)" strokeWidth={1.5} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou documento…"
            className={S.toolbar.searchInput}
          />
          <span className={S.toolbar.searchKbd}>⌘K</span>
        </div>

        {/* Status filter */}
        <SegmentedControl value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SegmentedControl.Item value="all">Todos</SegmentedControl.Item>
          <SegmentedControl.Item value="active">Ativos</SegmentedControl.Item>
          <SegmentedControl.Item value="inactive">Inativos</SegmentedControl.Item>
        </SegmentedControl>

        {/* Layout toggle */}
        <SegmentedControl value={layout} onValueChange={(v) => setLayout(v as Layout)}>
          <SegmentedControl.Item value="table" title="Tabela">
            <Rows3 className="size-[15px]" />
          </SegmentedControl.Item>
          <SegmentedControl.Item value="cards" title="Cards">
            <LayoutGrid className="size-[15px]" />
          </SegmentedControl.Item>
        </SegmentedControl>

        {hasFilters && (
          <button className={S.toolbar.clearBtn} onClick={clearFilters}>
            <X className="mr-1 inline size-3.5" />
            Limpar filtros
          </button>
        )}

        <span className={S.toolbar.count}>
          {isLoading ? "…" : `${patients.length} resultado${patients.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      <PatientsContent
        isLoading={isLoading}
        patients={patients}
        layout={layout}
        search={search}
        setSearch={setSearch}
        totalCount={totalCount}
        onOpen={openPatient}
      />
    </Page>
  );
}
