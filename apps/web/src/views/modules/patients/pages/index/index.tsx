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
import { useState, useEffect, useRef, type ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useSearchPatients, useSearchAppointments } from "@agenda-app/client";
import type { Patient, PatientGender } from "@agenda-app/client";
import { Page } from "@/views/components/Page";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import * as S from "./styles";

export const Route = createFileRoute("/_stackedLayout/patients")({
  component: PatientsPage,
});

// ── Types ────────────────────────────────────────────────────────────────────

type Layout = "table" | "cards";

interface PatientPage {
  totalCount: number;
  data: Patient[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAvatarVariant(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;

  return S.avatarVariants[hash % S.avatarVariants.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
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

function PatientAvatar({ name, id, size = "md" }: { name: string; id: string; size?: "md" | "lg" }) {
  const variant = getAvatarVariant(id);

  return (
    <div className={cn(S.avatar({ size }), variant)}>{getInitials(name)}</div>
  );
}

const GENDER_SHORT: Record<NonNullable<PatientGender>, string> = { FEMALE: "F", MALE: "M", OTHER: "O" };

function GenderBadge({ gender }: { gender: PatientGender }) {
  if (!gender) return null;

  return <span className={S.genderBadge({ gender })}>{GENDER_SHORT[gender]}</span>;
}

function StatTile({
  label,
  value,
  delta,
  icon,
  iconClass,
  loading,
}: {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  icon: ReactNode;
  iconClass: string;
  loading?: boolean;
}) {
  return (
    <div className={S.statTile.root}>
      <div className={S.statTile.header}>
        <span className={S.statTile.label}>{label}</span>
        <div className={cn(S.statTile.iconBase, iconClass)}>{icon}</div>
      </div>

      {loading ? (
        <Skeleton className="mt-0.5 h-8 w-16" />
      ) : (
        <p className={S.statTile.value}>{value}</p>
      )}

      {delta && <p className={S.statTile.delta}>{delta}</p>}
    </div>
  );
}

function RowContextMenu({
  onClose,
  onAction,
}: {
  onClose: () => void;
  onAction: (a: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={S.contextMenu.root}
      style={{ boxShadow: "var(--shadow-dropdown)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {(
        [
          { action: "view", icon: <UserRound className="size-3.5" />, label: "Ver perfil" },
          { action: "edit", icon: <Pencil className="size-3.5" />, label: "Editar cadastro" },
          { action: "schedule", icon: <CalendarPlus className="size-3.5" />, label: "Agendar consulta" },
        ] as const
      ).map(({ action, icon, label }) => (
        <button key={action} className={S.contextMenu.item} onClick={() => onAction(action)}>
          {icon}
          {label}
        </button>
      ))}

      <div className={S.contextMenu.divider} />

      <button className={S.contextMenu.itemDanger} onClick={() => onAction("archive")}>
        <Archive className="size-3.5" />
        Arquivar paciente
      </button>
    </div>
  );
}

const TABLE_COLS = "minmax(260px,1.6fr) 90px 1.2fr 1.2fr 130px 56px";

function PatientTableRow({
  patient,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onClick,
}: {
  patient: Patient;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
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
        <button aria-label="Ações" className={S.tableRow.actionBtn} onClick={onToggleMenu}>
          <MoreHorizontal className="size-4" strokeWidth={1.5} />
        </button>
        {isMenuOpen && (
          <RowContextMenu
            onClose={onCloseMenu}
            onAction={(action) => {
              onCloseMenu();
              if (action === "view") onClick();
            }}
          />
        )}
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
  openMenuId,
  setOpenMenuId,
  totalCount,
  onOpen,
}: {
  isLoading: boolean;
  patients: Patient[];
  layout: Layout;
  search: string;
  setSearch: (v: string) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  totalCount: number;
  onOpen: (p: Patient) => void;
}) {
  if (!isLoading && patients.length === 0) {
    return (
      <div className={S.emptyState.root}>
        <div className={S.emptyState.body}>
          <div className={S.emptyState.iconWrapper}>
            <SearchX className="size-7" strokeWidth={1.5} />
          </div>
          <div className={S.emptyState.textBlock}>
            <h3 className={S.emptyState.title}>Nenhum paciente encontrado</h3>
            <p className={S.emptyState.description}>
              {search
                ? `Nenhum resultado para "${search}"`
                : "Ajuste os filtros para ver mais resultados"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSearch("")}>
            <X className="size-4" />
            Limpar busca
          </Button>
        </div>
      </div>
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
                isMenuOpen={openMenuId === p.id}
                onToggleMenu={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                onCloseMenu={() => setOpenMenuId(null)}
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
  const isLoading = query.isLoading;

  function openPatient(patient: Patient) {
    navigate({ to: "/patients/$patientId", params: { patientId: patient.id } });
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
        <Button size="sm">
          <Plus className="size-4" />
          Novo paciente
        </Button>
      }
    >
      {/* Stats */}
      <div className={S.statsGrid}>
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
          iconClass="bg-(--color-primary-surface) text-(--color-primary-text)"
        />
        <StatTile
          label="Total de consultas"
          value={totalAppointments ?? 0}
          loading={appointmentsQuery.isLoading}
          icon={<CalendarDays className="size-4" strokeWidth={1.5} />}
          iconClass="bg-(--color-info-surface) text-(--color-info)"
        />
        <StatTile
          label="Pré-evoluções IA"
          value="—"
          delta="conectar módulo IA"
          loading={false}
          icon={<Sparkles className="size-4" strokeWidth={1.5} />}
          iconClass="bg-(--color-ai-bg) text-(--color-ai-text)"
        />
      </div>

      {/* Toolbar */}
      <div className={S.toolbar.root}>
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

        <div className={S.toolbar.layoutGroup}>
          {(
            [
              { value: "table", icon: <Rows3 className="size-[15px]" />, title: "Tabela" },
              { value: "cards", icon: <LayoutGrid className="size-[15px]" />, title: "Cards" },
            ] as const
          ).map(({ value, icon, title }) => (
            <button
              key={value}
              title={title}
              onClick={() => setLayout(value)}
              className={S.layoutToggleBtn({ active: layout === value })}
            >
              {icon}
            </button>
          ))}
        </div>

        {search && (
          <button className={S.toolbar.clearBtn} onClick={() => setSearch("")}>
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
        openMenuId={openMenuId}
        setOpenMenuId={setOpenMenuId}
        totalCount={totalCount}
        onOpen={openPatient}
      />
    </Page>
  );
}
