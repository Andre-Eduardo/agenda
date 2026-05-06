import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  ChevronLeft,
  Clock,
  Sparkles,
  Pencil,
  ShieldCheck,
  Paperclip,
  FileText,
  Download,
  Eye,
  Printer,
} from "lucide-react";
import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AvatarInitials } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useGetRecord, useGetPatient, useSearchRecords } from "@agenda-app/client";
import type {
  Record as MedicalRecord,
  Patient,
  RecordClinicalStatus,
  RecordConductTagsItem,
  SearchRecordsSortEventDate,
  SearchRecordsAttendanceType,
  SearchRecordsClinicalStatus,
  SearchRecordsSource,
} from "@agenda-app/client";
import { cn } from "@/lib/utils";
import * as S from "./styles";

export const Route = createFileRoute("/_stackedLayout/patients/$patientId/records/$recordId")({
  component: RecordDetailPage,
});

// ── Types ──────────────────────────────────────────────────────────────────────

interface PaginatedPage<T> {
  totalCount: number;
  data: T[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function asStr(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

const PT_WEEKDAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const PT_MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const PT_MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function formatFullDate(v: unknown): string {
  const s = asStr(v);
  if (!s) return "—";
  const d = new Date(s);
  return `${PT_WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${PT_MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

function formatShortDate(v: unknown): string {
  const s = asStr(v);
  if (!s) return "—";
  const d = new Date(s);
  return `${d.getDate()} ${PT_MONTHS_SHORT[d.getMonth()]}`;
}

function formatDateTime(v: unknown): string {
  const s = asStr(v);
  if (!s) return "—";
  const d = new Date(s);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${PT_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

function formatTime(v: unknown): string {
  const s = asStr(v);
  if (!s) return "—";
  return new Date(s).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
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

function getAvatarColorIndex(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function attendanceLabel(type: string | null | undefined): string {
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

function clinicalStatusLabel(status: RecordClinicalStatus): string {
  const map: Record<string, string> = {
    STABLE: "Estável",
    IMPROVING: "Melhorando",
    WORSENING: "Piorando",
    UNCHANGED: "Sem mudança",
    UNDER_OBSERVATION: "Em observação",
  };
  return status ? (map[status] ?? status) : "—";
}

function conductLabel(tag: RecordConductTagsItem): string {
  const map: Record<string, string> = {
    PRESCRIPTION: "Prescrição",
    EXAM_REQUESTED: "Solicitação de exame",
    REFERRAL: "Encaminhamento",
    GUIDANCE: "Orientação",
    THERAPY_ADJUSTMENT: "Ajuste de terapia",
    FOLLOW_UP_SCHEDULED: "Retorno agendado",
  };
  return map[tag] ?? tag;
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-[18px] px-6 pt-6 pb-[60px]">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-[120px] rounded-[14px]" />
      <Skeleton className="h-[200px] rounded-[12px]" />
      <Skeleton className="h-[160px] rounded-[12px]" />
    </div>
  );
}

// ── SOAP section ───────────────────────────────────────────────────────────────

const SOAP_DEFS: { key: "s" | "o" | "a" | "p"; letter: string; title: string; desc: string }[] = [
  { key: "s", letter: "S", title: "Subjetivo", desc: "Queixas, história e contexto relatado pelo paciente" },
  { key: "o", letter: "O", title: "Objetivo", desc: "Achados de exame, vitais e dados objetivos" },
  { key: "a", letter: "A", title: "Avaliação", desc: "Diagnósticos, hipóteses e raciocínio clínico" },
  { key: "p", letter: "P", title: "Plano", desc: "Conduta, prescrições, exames e retorno" },
];

function SoapSection({ record }: { record: MedicalRecord }) {
  const contents: Record<"s" | "o" | "a" | "p", string | null> = {
    s: asStr(record.subjective),
    o: asStr(record.objective),
    a: asStr(record.assessment),
    p: asStr(record.plan),
  };
  return (
    <section className={S.section.root}>
      <div className={S.section.head}>
        <div className={S.section.title}>Evolução clínica (SOAP)</div>
        <div className={S.section.sub}>Registro estruturado do atendimento</div>
      </div>
      <div className={S.soap.stack}>
        {SOAP_DEFS.map((def) => {
          const content = contents[def.key];
          return (
            <div key={def.key}>
              <div className={S.soap.head}>
                <span className={S.soap.letter({ v: def.key })}>{def.letter}</span>
                <div>
                  <div className={S.soap.metaTitle}>{def.title}</div>
                  <div className={S.soap.metaDesc}>{def.desc}</div>
                </div>
              </div>
              {content ? (
                <p className={S.soap.body}>{content}</p>
              ) : (
                <p className={S.soap.bodyEmpty}>Não registrado</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Tags section ───────────────────────────────────────────────────────────────

function TagsSection({ record }: { record: MedicalRecord }): ReactNode {
  const hasStatus = record.clinicalStatus != null;
  const hasTags = record.conductTags.length > 0;
  if (!hasStatus && !hasTags) return null;
  return (
    <section className={S.section.root}>
      <div className={S.section.head}>
        <div className={S.section.title}>Classificações</div>
      </div>
      <div className={S.tags.grid}>
        {hasStatus && (
          <>
            <div className={S.tags.label}>Status clínico</div>
            <div>
              <Badge clinicalStatus={record.clinicalStatus as NonNullable<RecordClinicalStatus>} className="gap-[6px] rounded-full px-[10px] py-1 text-[12px]">
                <span className={S.tags.dot} />
                {clinicalStatusLabel(record.clinicalStatus)}
              </Badge>
            </div>
          </>
        )}
        {hasTags && (
          <>
            <div className={S.tags.label}>Condutas</div>
            <div className={S.tags.list}>
              {record.conductTags.map((t) => (
                <Badge key={t} variant="outline" className="rounded-full bg-(--color-bg-surface) px-[10px] py-1 text-[12px] font-medium text-(--color-text-secondary)">{conductLabel(t)}</Badge>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ── Notes section ──────────────────────────────────────────────────────────────

function NotesSection({ record }: { record: MedicalRecord }): ReactNode {
  const freeNotes = asStr(record.freeNotes);
  if (!freeNotes) return null;
  return (
    <section className={S.section.root}>
      <div className={S.section.head}>
        <div className={S.section.title}>Observações complementares</div>
      </div>
      <p className={S.notes}>{freeNotes}</p>
    </section>
  );
}

// ── Files section ──────────────────────────────────────────────────────────────

function FilesSection({ record }: { record: MedicalRecord }) {
  return (
    <section className={S.section.root}>
      <div className={S.section.head}>
        <div className={S.section.title}>
          <Paperclip className="size-4" />
          Anexos
        </div>
        {record.files.length > 0 && (
          <div className={S.section.sub}>
            {record.files.length} {record.files.length === 1 ? "arquivo" : "arquivos"}
          </div>
        )}
      </div>
      {record.files.length === 0 ? (
        <div className={S.empty}>
          <Paperclip className="size-4" />
          Nenhum anexo nessa evolução.
        </div>
      ) : (
        <div className={S.files.list}>
          {record.files.map((f) => (
            <div key={f.id} className={S.files.row}>
              <span className={S.files.icon}>
                <FileText className="size-4" />
              </span>
              <div className="min-w-0">
                <div className={S.files.name}>{f.fileName}</div>
                {f.description && <div className={S.files.sub}>{f.description}</div>}
              </div>
              <div className={S.files.actions}>
                <Button variant="ghost" size="icon" className="size-8" asChild>
                  <a href={f.url} target="_blank" rel="noreferrer" aria-label="Visualizar">
                    <Eye className="size-[14px]" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" className="size-8" asChild>
                  <a href={f.url} download={f.fileName} aria-label="Baixar">
                    <Download className="size-[14px]" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Traceability section ───────────────────────────────────────────────────────

function TraceabilitySection({ record }: { record: MedicalRecord }) {
  const isAI = record.source === "IMPORT";
  const publishedAt = asStr(record.signedAt) ?? record.createdAt;

  return (
    <section className={S.section.traceRoot}>
      <div className={S.section.traceBar} />
      <div className={S.section.head}>
        <div className={S.section.title}>
          <ShieldCheck className="size-4 text-(--color-primary)" />
          Rastreabilidade do registro
        </div>
        <div className={S.section.sub}>Auditoria, origem e revisão humana</div>
      </div>
      <div className={S.trace.grid}>
        <div className={S.trace.row}>
          <div className={S.trace.key}>Publicado em</div>
          <div className={cn(S.trace.val, S.trace.valMono)}>
            {formatDateTime(publishedAt)}
          </div>
        </div>
        <div className={S.trace.row}>
          <div className={S.trace.key}>Status</div>
          <div className={S.trace.val}>
            {record.isLocked ? (
              <span className="inline-flex items-center gap-[6px] rounded-full border border-(--color-success) bg-(--color-success-surface) px-[10px] py-1 text-[12px] font-medium text-(--color-success)">
                <span className="size-[6px] rounded-full bg-current" />
                Assinado e imutável
              </span>
            ) : (
              <span className="inline-flex items-center gap-[6px] rounded-full border border-(--color-border) bg-(--color-bg-surface) px-[10px] py-1 text-[12px] font-medium text-(--color-text-secondary)">
                <span className="size-[6px] rounded-full bg-current" />
                Rascunho
              </span>
            )}
          </div>
        </div>
        <div className={S.trace.row}>
          <div className={S.trace.key}>Origem do conteúdo</div>
          <div className={S.trace.val}>
            {isAI ? (
              <Badge origin="ai" className="gap-[6px] rounded-full px-[11px] py-[5px] text-[12px]">
                <Sparkles className="size-[11px]" />
                Gerado por IA e aprovado
              </Badge>
            ) : (
              <Badge origin="manual" className="gap-[6px] rounded-full px-[11px] py-[5px] text-[12px]">
                <Pencil className="size-[11px]" />
                Registro manual
              </Badge>
            )}
          </div>
        </div>
        {isAI && (
          <div className={S.trace.row}>
            <div className={S.trace.key}>Revisão humana</div>
            <div className={S.trace.val}>
              {record.wasHumanEdited ? (
                <span className={S.trace.editedChip}>
                  <Pencil className="size-[11px]" />
                  Conteúdo editado pelo profissional
                </span>
              ) : (
                <span className={S.trace.muted}>
                  Nenhum campo alterado — sugestão da IA aprovada integralmente.
                </span>
              )}
            </div>
          </div>
        )}
        <div className={S.trace.row}>
          <div className={S.trace.key}>ID do registro</div>
          <div className={cn(S.trace.val, S.trace.valMono, "text-[12px] font-normal text-(--color-text-tertiary)")}>
            {record.id}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────────

function RecordDetailView({
  record,
  patient,
  siblings,
}: {
  record: MedicalRecord;
  patient: Patient;
  siblings: MedicalRecord[];
}) {
  const navigate = useNavigate();

  const idx = siblings.findIndex((s) => s.id === record.id);
  const prev = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const next = idx > 0 ? siblings[idx - 1] : null;

  const isAI = record.source === "IMPORT";
  const age = getAge(patient.birthDate);
  const eventDate = asStr(record.eventDate) ?? record.createdAt;
  const typeLabel = attendanceLabel(record.attendanceType);

  function goToRecord(r: MedicalRecord) {
    void navigate({
      to: "/patients/$patientId/records/$recordId",
      params: { patientId: patient.id, recordId: r.id },
    });
  }

  return (
    <div className={S.page.root}>
      <div className={S.page.inner}>
        {/* Breadcrumb */}
        <Breadcrumb className="mb-3">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/patients">Pacientes</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/patients/$patientId" params={{ patientId: patient.id }}>
                  {patient.name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Evolução</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <header className={S.header.root}>
          <div>
            <div className={S.header.eyebrow}>Evolução clínica</div>
            <div className={S.header.titleRow}>
              <span className={S.header.titleType}>{typeLabel}</span>
              <span className={S.header.titleDot}>·</span>
              <span className={S.header.titleDate}>{formatFullDate(eventDate)}</span>
            </div>
            <div className={S.header.meta}>
              <span className={S.header.metaItem}>
                <Clock className="size-[13px]" />
                {formatTime(eventDate)}
              </span>
              <span className={S.header.metaSep} />
              {isAI ? (
                <Badge origin="ai" className="gap-[6px] rounded-full px-[11px] py-[5px] text-[12px]">
                  <Sparkles className="size-[11px]" />
                  Aprovado a partir de IA
                </Badge>
              ) : (
                <Badge origin="manual" className="gap-[6px] rounded-full px-[11px] py-[5px] text-[12px]">
                  <Pencil className="size-[11px]" />
                  Registro manual
                </Badge>
              )}
            </div>
          </div>

          <div className={S.header.aside}>
            <div
              className={S.header.patCard}
              onClick={() => navigate({ to: "/patients/$patientId", params: { patientId: patient.id } })}
            >
              <AvatarInitials name={patient.name} colorIndex={getAvatarColorIndex(patient.id)} size="sm" />
              <div className="min-w-0 flex-1">
                <div className={S.header.patName}>{patient.name}</div>
                <div className={S.header.patMeta}>{age !== null ? `${age} anos` : "—"}</div>
              </div>
              <ChevronRight className="size-[14px] shrink-0 text-(--color-text-tertiary)" />
            </div>
            <div className={S.header.actions}>
              <Button variant="outline" size="sm">
                <Printer className="size-4" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm">
                <Download className="size-4" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className={S.body}>
          <SoapSection record={record} />
          <TagsSection record={record} />
          <NotesSection record={record} />
          <FilesSection record={record} />
          <TraceabilitySection record={record} />
        </div>

        {/* Bottom navigation */}
        <nav className={S.nav.root}>
          <button
            type="button"
            className={S.nav.btn}
            disabled={!prev}
            onClick={() => prev && goToRecord(prev)}
          >
            <ChevronLeft className="size-[14px] shrink-0" />
            <span className={S.nav.stack}>
              <span className={S.nav.label}>Evolução anterior</span>
              {prev && (
                <span className={S.nav.sub}>
                  {formatShortDate(prev.eventDate ?? prev.createdAt)} · {attendanceLabel(prev.attendanceType)}
                </span>
              )}
            </span>
          </button>

          <button
            type="button"
            className={S.nav.center}
            onClick={() => navigate({ to: "/patients/$patientId", params: { patientId: patient.id } })}
          >
            Ver todas as evoluções
          </button>

          <button
            type="button"
            className={cn(S.nav.btn, S.nav.btnEnd)}
            disabled={!next}
            onClick={() => next && goToRecord(next)}
          >
            <span className={S.nav.stack}>
              <span className={S.nav.label}>Evolução seguinte</span>
              {next && (
                <span className={S.nav.sub}>
                  {formatShortDate(next.eventDate ?? next.createdAt)} · {attendanceLabel(next.attendanceType)}
                </span>
              )}
            </span>
            <ChevronRight className="size-[14px] shrink-0" />
          </button>
        </nav>
      </div>
    </div>
  );
}

// ── Entry ──────────────────────────────────────────────────────────────────────

export function RecordDetailPage() {
  const { patientId, recordId } = Route.useParams();
  const navigate = useNavigate();

  const { data: record, isLoading: loadingRecord, isError: errorRecord } = useGetRecord(recordId);
  const { data: patient, isLoading: loadingPatient, isError: errorPatient } = useGetPatient(patientId);

  const siblingsQuery = useSearchRecords({
    patientId,
    term: "",
    cursor: null,
    limit: 100,
    sort: { eventDate: "desc" as SearchRecordsSortEventDate },
    attendanceType: "" as SearchRecordsAttendanceType,
    clinicalStatus: "" as SearchRecordsClinicalStatus,
    dateStart: "",
    dateEnd: "",
    source: "" as SearchRecordsSource,
  }) as unknown as UseQueryResult<PaginatedPage<MedicalRecord>>;

  if (loadingRecord || loadingPatient) return <DetailSkeleton />;

  if (errorRecord || errorPatient || !record || !patient) {
    return (
      <div className={S.page.errorState}>
        <p className="text-sm">Evolução não encontrada ou erro ao carregar.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: "/patients/$patientId", params: { patientId } })}
        >
          Voltar para o paciente
        </Button>
      </div>
    );
  }

  return (
    <RecordDetailView
      record={record}
      patient={patient}
      siblings={siblingsQuery.data?.data ?? []}
    />
  );
}
