import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  MoreHorizontal,
  Pencil,
  FilePlus,
  FileUp,
  CalendarPlus,
  MessagesSquare,
  CalendarClock,
  History,
  FileText,
  ClipboardList,
  ArrowUpRight,
  Download,
  Printer,
  Archive,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useRef, useState, useEffect, type ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetPatient,
  useGetClinicalProfile,
  useSearchPatientAlerts,
  useSearchRecords,
  useSearchPatientForms,
} from "@agenda-app/client";
import type {
  Patient,
  PatientGender,
  PatientAlert,
  Record as MedicalRecord,
  RecordAttendanceType,
  PatientForm,
  PatientFormStatus,
  SearchRecordsAttendanceType,
  SearchRecordsClinicalStatus,
  SearchRecordsSource,
  SearchRecordsSortEventDate,
} from "@agenda-app/client";
import { cn } from "@/lib/utils";
import * as S from "./styles";

export const Route = createFileRoute("/_stackedLayout/patients/$patientId")({
  component: PatientDetailPage,
});

// ── Paginated wrapper (void-cast pattern for broken Orval types) ─────────────

interface PaginatedPage<T> {
  totalCount: number;
  data: T[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function asStr(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

function asDisplayStr(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string") return v || null;
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
}

function getAge(birthDate: unknown): number | null {
  const s = asStr(birthDate);
  if (!s) return null;
  const birth = new Date(s);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;

  return age;
}

function formatDate(v: unknown, opts?: Intl.DateTimeFormatOptions): string {
  const s = asStr(v);
  if (!s) return "—";

  return new Date(s).toLocaleDateString("pt-BR", opts ?? { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatRelativeDate(v: unknown): string {
  const s = asStr(v);
  if (!s) return "—";
  const d = new Date(s);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "ontem";
  if (diffDays < 30) return `${diffDays} dias atrás`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;

  return `${Math.floor(diffDays / 365)} anos atrás`;
}

function formatDateShort(v: unknown): string {
  const s = asStr(v);
  if (!s) return "—";

  return new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatTime(v: unknown): string {
  const s = asStr(v);
  if (!s) return "—";

  return new Date(s).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function genderLabel(gender: PatientGender): string {
  if (gender === "FEMALE") return "Feminino";
  if (gender === "MALE") return "Masculino";
  if (gender === "OTHER") return "Outro";

  return "—";
}

function attendanceTypeLabel(type: RecordAttendanceType): string {
  const map: Record<string, string> = {
    FIRST_VISIT: "Primeira consulta",
    FOLLOW_UP: "Retorno",
    EVALUATION: "Avaliação",
    PROCEDURE: "Procedimento",
    TELEMEDICINE: "Telemedicina",
    INTERCURRENCE: "Intercorrência",
  };

  return type ? (map[type] ?? type) : "Consulta";
}

function formStatusLabel(status: PatientFormStatus): string {
  const map: Record<string, string> = {
    DRAFT: "Rascunho",
    IN_PROGRESS: "Em andamento",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
  };

  return map[status] ?? status;
}

function getAvatarVariant(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;

  return S.avatarVariants[h % S.avatarVariants.length] ?? S.avatarVariants[0]!;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0] ?? "").slice(0, 2).toUpperCase();

  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PatientAvatar({ name, id }: { name: string; id: string }) {
  const variant = getAvatarVariant(id);

  return <div className={cn(S.avatarBase, variant)}>{getInitials(name)}</div>;
}

function SectionCard({
  title,
  action,
  children,
  noPad = false,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  noPad?: boolean;
}) {
  return (
    <section className={S.sectionCard.root}>
      <div className={S.sectionCard.header}>
        <h2 className={S.sectionCard.title}>{title}</h2>
        {action}
      </div>
      <div className={noPad ? "" : S.sectionCard.body}>{children}</div>
    </section>
  );
}

function SecLink({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={S.secLink}>
      {children}
    </button>
  );
}

function KV({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  const empty = !value;

  return (
    <div className={S.kv.root}>
      <span className={S.kv.label}>{label}</span>
      <span className={cn(S.kv.value, mono && S.kv.valueMono, empty && S.kv.valueEmpty)}>
        {value ?? "Não informado"}
      </span>
    </div>
  );
}

function InfoGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={S.infoGroup.root}>
      <h4 className={S.infoGroup.title}>{title}</h4>
      {children}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  icon,
  mono = false,
  loading = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  mono?: boolean;
  loading?: boolean;
}) {
  return (
    <div className={S.summaryCard.root}>
      <div className={S.summaryCard.header}>
        <span className={S.summaryCard.label}>{label}</span>
        <span className={S.summaryCard.icon}>{icon}</span>
      </div>
      {loading ? (
        <Skeleton className="h-[22px] w-14" />
      ) : (
        <div className={cn(S.summaryCard.value, mono && S.summaryCard.valueMono)}>{value}</div>
      )}
      {sub && !loading && <div className={S.summaryCard.sub}>{sub}</div>}
    </div>
  );
}

function ActionTile({
  icon,
  label,
  sub,
  ai = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  sub: string;
  ai?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={S.actionTile.root}>
      <span className={cn(S.actionTile.iconBase, ai ? S.actionTile.iconAI : S.actionTile.iconDefault)}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className={S.actionTile.label}>{label}</div>
        <div className={S.actionTile.sub}>{sub}</div>
      </div>
      <ChevronRight className={S.actionTile.chevron} />
    </button>
  );
}

function AlertBadge({ alert }: { alert: PatientAlert }) {
  return (
    <span className={S.alertBadge({ severity: alert.severity })}>
      <TriangleAlert className="size-[10px]" />
      {alert.title}
    </span>
  );
}

function MoreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);

    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button variant="outline" size="icon" onClick={() => setOpen((v) => !v)} aria-label="Mais opções">
        <MoreHorizontal className="size-4" />
      </Button>
      {open && (
        <div className={S.moreMenu.dropdown}>
          <button type="button" className={S.moreMenu.item}>
            <Download className={S.moreMenu.itemIcon} />
            Exportar dados
          </button>
          <button type="button" className={S.moreMenu.item}>
            <Printer className={S.moreMenu.itemIcon} />
            Imprimir resumo
          </button>
          <div className={S.moreMenu.divider} />
          <button type="button" className={S.moreMenu.itemDanger}>
            <Archive className="size-[14px]" />
            Arquivar paciente
          </button>
        </div>
      )}
    </div>
  );
}

function EmptySection({ label }: { label: string }) {
  return <div className={S.emptySection}>{label}</div>;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className={S.skeleton.root}>
      <Skeleton className="h-4 w-48" />
      <div className={S.skeleton.headerShell}>
        <div className={S.skeleton.headerLeft}>
          <Skeleton className="size-12 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className={S.skeleton.headerRight}>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
      <div className={S.skeleton.actionGrid}>
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[82px] rounded-[12px]" />)}
      </div>
      <Skeleton className="h-[160px] rounded-(--radius-card)" />
    </div>
  );
}

// ── Section content helpers ───────────────────────────────────────────────────

function RecordsContent({
  isLoading,
  records,
}: {
  isLoading: boolean;
  records: MedicalRecord[];
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (records.length === 0) return <EmptySection label="Nenhuma evolução registrada" />;

  return (
    <div className="flex flex-col">
      {records.map((r) => {
        const eventDate = asStr(r.eventDate) ?? r.createdAt;
        const description = asDisplayStr(r.description);
        const title = asDisplayStr(r.title);
        const isAI = r.source === "IMPORT";

        return (
          <div key={r.id} className={S.record.row}>
            <div className="text-right">
              <div className={S.record.dateText}>{formatDateShort(eventDate)}</div>
              <div className={S.record.time}>{formatTime(eventDate)}</div>
            </div>
            <div className={S.record.dot} />
            <div className="min-w-0">
              <div className={S.record.tags}>
                <span className={S.record.typeTag}>
                  {r.attendanceType ? attendanceTypeLabel(r.attendanceType) : "Consulta"}
                </span>
                {isAI && (
                  <span className={S.record.aiTag}>
                    <Sparkles className="size-[11px]" />
                    Origem IA
                  </span>
                )}
              </div>
              <p className={S.record.summary}>{title ?? description ?? "Sem descrição"}</p>
            </div>
            <ChevronRight className={S.record.chevron} />
          </div>
        );
      })}
    </div>
  );
}

function ProfileContent({
  isLoading,
  hasData,
  allergiesText,
  conditionsText,
  medicationsText,
  surgicalHistoryText,
  familyHistoryText,
  socialHistoryText,
  generalNotesText,
}: {
  isLoading: boolean;
  hasData: string | null;
  allergiesText: string | null;
  conditionsText: string | null;
  medicationsText: string | null;
  surgicalHistoryText: string | null;
  familyHistoryText: string | null;
  socialHistoryText: string | null;
  generalNotesText: string | null;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  if (!hasData) return <EmptySection label="Perfil clínico ainda não preenchido" />;

  return (
    <>
      {allergiesText && (
        <InfoGroup title="Alergias conhecidas">
          <div className={S.allergy.box}>
            <TriangleAlert className={S.allergy.icon} />
            <p className={S.allergy.text}>{allergiesText}</p>
          </div>
        </InfoGroup>
      )}
      {conditionsText && (
        <InfoGroup title="Condições crônicas">
          <p className={S.profileText}>{conditionsText}</p>
        </InfoGroup>
      )}
      {medicationsText && (
        <InfoGroup title="Medicações em uso">
          <p className={S.profileText}>{medicationsText}</p>
        </InfoGroup>
      )}
      {surgicalHistoryText && (
        <InfoGroup title="Histórico cirúrgico">
          <p className={S.profileText}>{surgicalHistoryText}</p>
        </InfoGroup>
      )}
      {familyHistoryText && (
        <InfoGroup title="Histórico familiar">
          <p className={S.profileText}>{familyHistoryText}</p>
        </InfoGroup>
      )}
      {socialHistoryText && (
        <InfoGroup title="Histórico social">
          <p className={S.profileText}>{socialHistoryText}</p>
        </InfoGroup>
      )}
      {generalNotesText && (
        <InfoGroup title="Observações gerais">
          <p className={S.profileTextSecondary}>{generalNotesText}</p>
        </InfoGroup>
      )}
    </>
  );
}

function FormsContent({
  isLoading,
  forms,
}: {
  isLoading: boolean;
  forms: PatientForm[];
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-[10px]" />)}
      </div>
    );
  }

  if (forms.length === 0) return <EmptySection label="Nenhum formulário disponível" />;

  return (
    <div className="flex flex-col gap-2">
      {forms.map((f) => {
        const isDone = f.status === "COMPLETED";
        const dateField = isDone ? f.completedAt : f.appliedAt;
        const dateLabel = isDone ? "Concluído em" : "Iniciado em";

        return (
          <div key={f.id} className={S.formItemRoot({ done: isDone })}>
            <ClipboardList className={S.formItemIcon({ done: isDone })} />
            <div className={S.formItem.body}>
              <div className={S.formItem.title}>Formulário clínico</div>
              <div className={S.formItem.meta}>
                {dateLabel}{" "}
                <span className="font-mono tabular-nums">{formatDate(dateField)}</span>
                {" · "}{formStatusLabel(f.status)}
              </div>
            </div>
            <span className={S.formBadge({ done: isDone })}>{formStatusLabel(f.status)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function PatientDetailPage() {
  const { patientId } = Route.useParams();
  const navigate = useNavigate();

  const { data: patient, isLoading, isError } = useGetPatient(patientId);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !patient) {
    return (
      <div className={S.page.errorState}>
        <p className="text-sm">Paciente não encontrado ou erro ao carregar.</p>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/patients" })}>
          Voltar para pacientes
        </Button>
      </div>
    );
  }

  return <PatientProfile patient={patient} />;
}

function PatientProfile({ patient }: { patient: Patient }) {
  const age = getAge(patient.birthDate);
  const dob = formatDate(patient.birthDate);
  const gender = genderLabel(patient.gender);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const clinicalProfile = useGetClinicalProfile(patient.id);

  const alertsQuery = useSearchPatientAlerts(patient.id, {
    cursor: null,
    limit: 10,
    isActive: "true",
    sort: { severity: "desc" as "desc" },
  }) as unknown as UseQueryResult<PaginatedPage<PatientAlert>>;

  const baseRecordParams = {
    patientId: patient.id,
    term: "",
    cursor: null,
    attendanceType: "" as SearchRecordsAttendanceType,
    clinicalStatus: "" as SearchRecordsClinicalStatus,
    dateStart: "",
    dateEnd: "",
    source: "" as SearchRecordsSource,
  };

  const recordsQuery = useSearchRecords({
    ...baseRecordParams,
    limit: 3,
    sort: { eventDate: "desc" as SearchRecordsSortEventDate },
  }) as unknown as UseQueryResult<PaginatedPage<MedicalRecord>>;

  const recordsTotalQuery = useSearchRecords({
    ...baseRecordParams,
    limit: 1,
    sort: null,
  }) as unknown as UseQueryResult<PaginatedPage<MedicalRecord>>;

  const formsQuery = useSearchPatientForms(patient.id, {
    cursor: null,
    limit: 10,
  }) as unknown as UseQueryResult<PaginatedPage<PatientForm>>;

  // ── Derived data ──────────────────────────────────────────────────────────

  const alerts = alertsQuery.data?.data ?? [];
  const records = recordsQuery.data?.data ?? [];
  const totalRecords = recordsTotalQuery.data?.totalCount;
  const forms = formsQuery.data?.data ?? [];
  const totalForms = formsQuery.data?.totalCount;
  const profile = clinicalProfile.data;

  const addr = patient.address;
  const addrParts = addr
    ? [
        asStr(addr.street) && asStr(addr.number)
          ? `${asStr(addr.street)}, ${asStr(addr.number)}`
          : asStr(addr.street),
        asStr(addr.complement),
        asStr(addr.neighborhood),
        asStr(addr.city) && asStr(addr.state)
          ? `${asStr(addr.city)} / ${asStr(addr.state)}`
          : asStr(addr.city),
        asStr(addr.zipCode),
      ].filter(Boolean)
    : [];
  const addrLine = addrParts.length > 0 ? addrParts.join(" · ") : null;
  const phone = asStr(patient.phone);
  const email = asStr(patient.email);
  const emergencyName = asStr(patient.emergencyContactName);
  const emergencyPhone = asStr(patient.emergencyContactPhone);

  const allergiesText = asDisplayStr(profile?.allergies);
  const conditionsText = asDisplayStr(profile?.chronicConditions);
  const medicationsText = asDisplayStr(profile?.currentMedications);
  const surgicalHistoryText = asDisplayStr(profile?.surgicalHistory);
  const familyHistoryText = asDisplayStr(profile?.familyHistory);
  const socialHistoryText = asDisplayStr(profile?.socialHistory);
  const generalNotesText = asDisplayStr(profile?.generalNotes);

  const hasProfileData =
    allergiesText ??
    conditionsText ??
    medicationsText ??
    surgicalHistoryText ??
    familyHistoryText ??
    socialHistoryText ??
    generalNotesText;

  return (
    <div className={S.page.root}>
      {/* Breadcrumb */}
      <nav className={S.breadcrumb.root}>
        <Link to="/patients" className={S.breadcrumb.link}>
          Pacientes
        </Link>
        <ChevronRight className="size-3 stroke-[1.5]" />
        <span className={S.breadcrumb.current}>{patient.name}</span>
      </nav>

      {/* Patient header — sticky */}
      <div className={S.header.root}>
        <div className={S.header.inner}>
          <div className={S.header.info}>
            <PatientAvatar name={patient.name} id={patient.id} />
            <div className={S.header.nameBlock}>
              <h1 className={S.header.name}>{patient.name}</h1>
              <div className={S.header.meta}>
                {age !== null && <span>{age} anos</span>}
                {age !== null && <span className={S.header.metaDot}>·</span>}
                <span className={S.header.metaMono}>nasc. {dob}</span>
                <span className={S.header.metaDot}>·</span>
                <span className={S.header.metaMono}>{patient.documentId}</span>
                {patient.gender && (
                  <>
                    <span className={S.header.metaDot}>·</span>
                    <span>{gender}</span>
                  </>
                )}
                {patient.insurancePlan && (
                  <>
                    <span className={S.header.metaDot}>·</span>
                    <span>{patient.insurancePlan.name}</span>
                  </>
                )}
                <span className={S.header.metaDot}>·</span>
                <span className={cn(S.header.metaMono, "text-(--color-text-tertiary)")}>
                  ID {patient.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className={S.header.actions}>
            <Button variant="outline" size="sm">
              <Pencil className="size-4" />
              Editar cadastro
            </Button>
            <MoreMenu />
          </div>
        </div>

        {alerts.length > 0 && (
          <div className={S.header.alertsRow}>
            {alerts.map((a) => <AlertBadge key={a.id} alert={a} />)}
          </div>
        )}
      </div>

      {/* Action grid */}
      <div className={S.actionGrid}>
        <ActionTile icon={<FilePlus className="size-[18px]" />} label="Nova evolução" sub="Registrar SOAP" />
        <ActionTile icon={<FileUp className="size-[18px]" />} label="Importar documento" sub="Foto ou PDF · IA extrai dados" />
        <ActionTile icon={<CalendarPlus className="size-[18px]" />} label="Agendar consulta" sub="Já com paciente preenchido" />
        <ActionTile icon={<MessagesSquare className="size-[18px]" />} label="Chat clínico com IA" sub="Contexto do prontuário" ai />
      </div>

      {/* Resumo clínico */}
      <SectionCard title="Resumo clínico">
        <div className={S.summaryGrid}>
          <SummaryCard label="Próxima consulta" value="—" icon={<CalendarClock className="size-[14px]" />} mono />
          <SummaryCard
            label="Última consulta"
            value={records.length > 0 ? formatRelativeDate(records[0]?.eventDate ?? records[0]?.createdAt) : "—"}
            icon={<History className="size-[14px]" />}
            mono
          />
          <SummaryCard
            label="Total de evoluções"
            value={totalRecords !== undefined ? String(totalRecords) : "—"}
            loading={recordsTotalQuery.isLoading}
            icon={<FileText className="size-[14px]" />}
          />
          <SummaryCard
            label="Formulários"
            value={totalForms !== undefined ? String(totalForms) : "—"}
            loading={formsQuery.isLoading}
            icon={<ClipboardList className="size-[14px]" />}
          />
        </div>
      </SectionCard>

      {/* Vitais recentes */}
      <SectionCard
        title="Vitais recentes"
        action={<SecLink>Ver evolução de origem <ArrowUpRight className="size-3" /></SecLink>}
      >
        <EmptySection label="Nenhum vital registrado" />
      </SectionCard>

      {/* Últimas evoluções */}
      <SectionCard
        title="Últimas evoluções"
        action={<SecLink>Ver prontuário completo <ArrowUpRight className="size-3" /></SecLink>}
      >
        <RecordsContent isLoading={recordsQuery.isLoading} records={records} />
      </SectionCard>

      {/* Two-col: patient info + initial health */}
      <div className={S.twoCol}>
        {/* Informações do paciente */}
        <SectionCard
          title="Informações do paciente"
          action={<SecLink>Editar <Pencil className="size-3" /></SecLink>}
        >
          <InfoGroup title="Dados pessoais">
            <div className={S.kvGrid}>
              <KV label="Nome completo" value={patient.name} />
              <KV label="Data de nascimento" value={dob} mono />
              <KV label="Sexo biológico" value={patient.gender ? gender : null} />
              <KV label="Documento (CPF/ID)" value={patient.documentId} mono />
            </div>
          </InfoGroup>

          <InfoGroup title="Contato">
            <div className={S.kvGrid}>
              <KV label="Celular / WhatsApp" value={phone} mono />
              <KV label="E-mail" value={email} />
            </div>
            {(emergencyName ?? emergencyPhone) && (
              <div className={S.emergency.box}>
                <p className={S.emergency.label}>Responsável</p>
                <div className={S.kvGrid}>
                  <KV label="Nome" value={emergencyName} />
                  <KV label="Telefone" value={emergencyPhone} mono />
                </div>
              </div>
            )}
          </InfoGroup>

          <InfoGroup title="Endereço">
            {addrLine ? (
              <p className={S.profileText}>{addrLine}</p>
            ) : (
              <p className={S.profileTextEmpty}>Não informado</p>
            )}
          </InfoGroup>
        </SectionCard>

        {/* Saúde inicial */}
        <SectionCard
          title="Saúde inicial"
          action={<SecLink>Editar <Pencil className="size-3" /></SecLink>}
        >
          <ProfileContent
            isLoading={clinicalProfile.isLoading}
            hasData={hasProfileData}
            allergiesText={allergiesText}
            conditionsText={conditionsText}
            medicationsText={medicationsText}
            surgicalHistoryText={surgicalHistoryText}
            familyHistoryText={familyHistoryText}
            socialHistoryText={socialHistoryText}
            generalNotesText={generalNotesText}
          />
        </SectionCard>
      </div>

      {/* Formulários clínicos */}
      <SectionCard title="Formulários clínicos">
        <FormsContent isLoading={formsQuery.isLoading} forms={forms} />
      </SectionCard>

      {/* Documentos importados */}
      <SectionCard
        title="Documentos importados"
        action={
          <Button variant="outline" size="sm">
            <FileUp className="size-4" />
            Importar
          </Button>
        }
      >
        <EmptySection label="Nenhum documento importado" />
      </SectionCard>
    </div>
  );
}
