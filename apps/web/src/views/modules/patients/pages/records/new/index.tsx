import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState, useEffect, type ReactNode } from "react";
import {
  ClipboardList,
  Activity,
  FileText,
  Tag,
  Paperclip,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Check,
  UploadCloud,
  X,
  History,
  ChevronDown,
  ChevronUp,
  Pill,
  FlaskConical,
  Forward,
  MessageSquare,
  Syringe,
  CalendarClock,
} from "lucide-react";
import { useGetPatient, useGetCurrentUser, useCreateRecord } from "@agenda-app/client";
import type { Patient } from "@agenda-app/client";
import {
  CreateRecordDtoAttendanceType,
  CreateRecordDtoClinicalStatus,
  CreateRecordDtoConductTagsItem,
  CreateRecordDtoTemplateType,
} from "@agenda-app/client";
import { Button } from "@/components/ui/componentes/button";
import { Skeleton } from "@/components/ui/componentes/skeleton";
import { Input } from "@/components/ui/componentes/input";
import { Textarea } from "@/components/ui/componentes/textarea";
import { NativeSelect } from "@/components/ui/componentes/native-select";
import { PageHeader } from "@/components/ui/componentes/page-header";
import { Field, FormGrid } from "@/components/ui/componentes/field";
import { AvatarInitials } from "@/components/ui/componentes/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/componentes/breadcrumb";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/appStore";
import { toast } from "sonner";
import * as S from "./styles";

export const Route = createFileRoute("/_stackedLayout/patients/$patientId/records/new")({
  component: NewEvolutionPage,
});

// ── Constants ─────────────────────────────────────────────────────────────────

const ATTENDANCE_OPTIONS: Array<{ value: CreateRecordDtoAttendanceType; label: string }> = [
  { value: CreateRecordDtoAttendanceType.FIRST_VISIT, label: "Primeira consulta" },
  { value: CreateRecordDtoAttendanceType.FOLLOW_UP, label: "Retorno" },
  { value: CreateRecordDtoAttendanceType.EVALUATION, label: "Avaliação" },
  { value: CreateRecordDtoAttendanceType.PROCEDURE, label: "Procedimento" },
  { value: CreateRecordDtoAttendanceType.TELEMEDICINE, label: "Telemedicina" },
  { value: CreateRecordDtoAttendanceType.INTERCURRENCE, label: "Intercorrência" },
];

const CLINICAL_STATUS_OPTIONS: Array<{ value: CreateRecordDtoClinicalStatus; label: string }> = [
  { value: CreateRecordDtoClinicalStatus.STABLE, label: "Estável" },
  { value: CreateRecordDtoClinicalStatus.IMPROVING, label: "Melhorando" },
  { value: CreateRecordDtoClinicalStatus.WORSENING, label: "Piorando" },
  { value: CreateRecordDtoClinicalStatus.UNCHANGED, label: "Sem mudança" },
  { value: CreateRecordDtoClinicalStatus.UNDER_OBSERVATION, label: "Em observação" },
];

const CONDUCT_TAGS: Array<{ value: CreateRecordDtoConductTagsItem; label: string; icon: ReactNode }> = [
  { value: CreateRecordDtoConductTagsItem.PRESCRIPTION, label: "Prescrição", icon: <Pill className="size-[13px]" /> },
  { value: CreateRecordDtoConductTagsItem.EXAM_REQUESTED, label: "Solicitação de exame", icon: <FlaskConical className="size-[13px]" /> },
  { value: CreateRecordDtoConductTagsItem.REFERRAL, label: "Encaminhamento", icon: <Forward className="size-[13px]" /> },
  { value: CreateRecordDtoConductTagsItem.GUIDANCE, label: "Orientação", icon: <MessageSquare className="size-[13px]" /> },
  { value: CreateRecordDtoConductTagsItem.THERAPY_ADJUSTMENT, label: "Ajuste de terapia", icon: <Syringe className="size-[13px]" /> },
  { value: CreateRecordDtoConductTagsItem.FOLLOW_UP_SCHEDULED, label: "Retorno agendado", icon: <CalendarClock className="size-[13px]" /> },
];

const VITALS_RANGES = {
  sys:    { min: 70,  max: 220, label: "Sistólica (mmHg)" },
  dia:    { min: 40,  max: 130, label: "Diastólica (mmHg)" },
  hr:     { min: 30,  max: 200, label: "bpm" },
  spo2:   { min: 70,  max: 100, label: "%" },
  temp:   { min: 33,  max: 42,  label: "°C" },
  weight: { min: 1,   max: 300, label: "kg" },
  height: { min: 30,  max: 230, label: "cm" },
};

const TOC_SECTIONS = [
  { id: "sec-attend", icon: <ClipboardList className="size-[14px]" />, label: "Atendimento" },
  { id: "sec-vitais", icon: <Activity className="size-[14px]" />,     label: "Sinais vitais" },
  { id: "sec-soap",   icon: <FileText className="size-[14px]" />,     label: "SOAP" },
  { id: "sec-class",  icon: <Tag className="size-[14px]" />,          label: "Classificações" },
  { id: "sec-files",  icon: <Paperclip className="size-[14px]" />,    label: "Anexos" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function asStr(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
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

function buildEventDate(date: string, time: string): string {
  if (!date) return new Date().toISOString();
  const iso = time ? `${date}T${time}:00` : `${date}T00:00:00`;

  return new Date(iso).toISOString();
}

function composeVitalsText(v: VitalsState): string | undefined {
  const parts: string[] = [];

  if (v.sys && v.dia) parts.push(`PA ${v.sys}/${v.dia} mmHg`);

  if (v.hr) parts.push(`FC ${v.hr} bpm`);

  if (v.spo2) parts.push(`SpO₂ ${v.spo2}%`);

  if (v.temp) parts.push(`T ${v.temp}°C`);

  if (v.weight) parts.push(`Peso ${v.weight} kg`);

  if (v.height) parts.push(`Altura ${v.height} cm`);

  if (parts.length === 0) return undefined;

  return `Sinais vitais: ${parts.join(" | ")}`;
}

function calcBmi(weight: string, height: string): { value: string; tone: "ok" | "warn" | "bad" } | null {
  const w = parseFloat(weight);
  const h = parseFloat(height);

  if (!w || !h || h < 50) return null;
  const bmi = w / (h / 100) ** 2;
  const value = bmi.toFixed(1);

  if (bmi < 18.5) return { value, tone: "warn" };

  if (bmi < 25)   return { value, tone: "ok" };

  if (bmi < 30)   return { value, tone: "warn" };

  return { value, tone: "bad" };
}

function getBmiLabel(bmi: number): string {
  if (bmi < 18.5) return "Baixo peso";

  if (bmi < 25)   return "Eutrófico";

  if (bmi < 30)   return "Sobrepeso";

  if (bmi < 35)   return "Obesidade I";

  if (bmi < 40)   return "Obesidade II";

  return "Obesidade III";
}

function getAvatarColorIndex(id: string): number {
  let h = 0;

  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;

  return h;
}

function isVitalOutOfRange(val: string, range: { min: number; max: number }): boolean {
  const n = parseFloat(val);

  if (!val || isNaN(n)) return false;

  return n < range.min || n > range.max;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface VitalsState {
  sys: string; dia: string; hr: string; spo2: string;
  temp: string; weight: string; height: string;
}

interface LocalFile { id: number; name: string; size: string }

interface PublishSummary {
  patient: Patient;
  attendanceType: string;
  date: string;
  time: string;
  hasSoap: boolean;
  vitalsCount: number;
  conductCount: number;
  fileCount: number;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SoapField({
  letter,
  title,
  hint,
  value,
  onChange,
  placeholder,
  children,
}: {
  letter: "s" | "o" | "a" | "p";
  title: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;

    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className={S.soap.field}>
      <div className={S.soap.head}>
        <span className={S.soap.letter({ v: letter })}>{letter.toUpperCase()}</span>
        <div>
          <div className={S.soap.title}>{title}</div>
          <div className={S.soap.hint}>{hint}</div>
        </div>
      </div>
      {children}
      <textarea
        ref={ref}
        className={S.soap.textarea}
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function VitalCell({
  label,
  unit,
  wide,
  readonly,
  children,
}: {
  label: string;
  unit: string;
  wide?: boolean;
  readonly?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn(S.vitals.cell, wide && S.vitals.cellWide, readonly && S.vitals.cellReadonly)}>
      <div className={S.vitals.head}>
        <span className={S.vitals.label}>{label}</span>
        <span className={S.vitals.unit}>{unit}</span>
      </div>
      {children}
    </div>
  );
}

function VitalAlert({ val, range }: { val: string; range: { min: number; max: number } }) {
  if (!isVitalOutOfRange(val, range)) return null;

  return (
    <div className={S.vitals.warn}>
      <AlertTriangle className="size-[10px]" />
      Fora da faixa ({range.min}–{range.max})
    </div>
  );
}

function PublishModal({
  summary,
  onCancel,
  onConfirm,
  loading,
}: {
  summary: PublishSummary;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const attendanceLabel =
    ATTENDANCE_OPTIONS.find((o) => o.value === summary.attendanceType)?.label ?? summary.attendanceType;

  return (
    <div className={S.modal.backdrop} onClick={onCancel}>
      <div className={S.modal.panel} onClick={(e) => e.stopPropagation()}>
        <div className={S.modal.head}>
          <span className={cn(S.modal.icon, S.modal.iconOk)}>
            <CheckCircle2 className="size-[18px]" />
          </span>
          <div>
            <h3 className={S.modal.title}>Publicar evolução?</h3>
            <p className={S.modal.sub}>Após publicar, o registro é imutável e não pode ser editado.</p>
          </div>
        </div>

        <div className={S.modal.summary}>
          <div className={S.modal.summaryRow}>
            <span className={S.modal.summaryLabel}>Paciente</span>
            <span className={S.modal.summaryValue}>{summary.patient.name}</span>
          </div>
          <div className={S.modal.summaryRow}>
            <span className={S.modal.summaryLabel}>Tipo</span>
            <span className={S.modal.summaryValue}>{attendanceLabel}</span>
          </div>
          <div className={S.modal.summaryRow}>
            <span className={S.modal.summaryLabel}>Data e hora</span>
            <span className={cn(S.modal.summaryValue, "font-mono tabular-nums text-[13px]")}>
              {summary.date} · {summary.time || "—"}
            </span>
          </div>
          <div className={S.modal.summaryRow}>
            <span className={S.modal.summaryLabel}>Conteúdo</span>
            <div className={S.modal.chips}>
              {summary.hasSoap && <span className={S.modal.chip}>SOAP</span>}
              {summary.vitalsCount > 0 && (
                <span className={S.modal.chip}>
                  <Activity className="size-[10px]" />
                  {summary.vitalsCount} vitais
                </span>
              )}
              {summary.conductCount > 0 && (
                <span className={S.modal.chip}>
                  <Tag className="size-[10px]" />
                  {summary.conductCount} condutas
                </span>
              )}
              {summary.fileCount > 0 && (
                <span className={S.modal.chip}>
                  <Paperclip className="size-[10px]" />
                  {summary.fileCount} anexos
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={S.modal.actions}>
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            Voltar e revisar
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Publicando…
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Publicar evolução
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DiscardModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className={S.modal.backdrop} onClick={onCancel}>
      <div className={S.modal.panel} onClick={(e) => e.stopPropagation()}>
        <div className={S.modal.head}>
          <span className={cn(S.modal.icon, S.modal.iconWarn)}>
            <AlertTriangle className="size-[18px]" />
          </span>
          <div>
            <h3 className={S.modal.title}>Descartar alterações?</h3>
            <p className={S.modal.sub}>Há informações não salvas. Esta ação não pode ser desfeita.</p>
          </div>
        </div>
        <div className={S.modal.actions}>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Continuar editando
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>
            Descartar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function NewEvolutionPage() {
  const { patientId } = Route.useParams();
  const { data: patient, isLoading, isError } = useGetPatient(patientId);

  if (isLoading) return <PageSkeleton />;

  if (isError || !patient) {
    return (
      <div className={S.page.errorState}>
        <p className="text-sm">Paciente não encontrado ou erro ao carregar.</p>
        <Link to="/patients" className={S.page.errorLink}>
          Voltar para pacientes
        </Link>
      </div>
    );
  }

  return <NewEvolutionForm patient={patient} />;
}

function PageSkeleton() {
  return (
    <div className={S.skeleton.root}>
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className={S.skeleton.patientCard} />
      <div className={S.skeleton.grid}>
        <div className={S.skeleton.navStack}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} className={S.skeleton.navItem} />)}
        </div>
        <div className={S.skeleton.contentStack}>
          {[...Array(3)].map((_, i) => <Skeleton key={i} className={S.skeleton.contentSection} />)}
        </div>
      </div>
    </div>
  );
}

function NewEvolutionForm({ patient }: { patient: Patient }) {
  const navigate = useNavigate();
  const { userId } = useAppStore();
  const { data: currentUser } = useGetCurrentUser();

  // ── Form state ─────────────────────────────────────────────────────────────
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  const nowHHMM = today.toTimeString().slice(0, 5);

  const [date, setDate] = useState(todayISO);
  const [time, setTime] = useState(nowHHMM);
  const [endTime, setEndTime] = useState("");
  const [attendanceType, setAttendanceType] = useState<CreateRecordDtoAttendanceType>(
    CreateRecordDtoAttendanceType.FOLLOW_UP,
  );

  const [vitals, setVitals] = useState<VitalsState>({
    sys: "", dia: "", hr: "", spo2: "", temp: "", weight: "", height: "",
  });
  const [showPrevVitals, setShowPrevVitals] = useState(false);

  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");

  const [clinicalStatus, setClinicalStatus] = useState<CreateRecordDtoClinicalStatus>(
    CreateRecordDtoClinicalStatus.STABLE,
  );
  const [conductTags, setConductTags] = useState<CreateRecordDtoConductTagsItem[]>([]);
  const [freeNotes, setFreeNotes] = useState("");

  const [files, setFiles] = useState<LocalFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeSec, setActiveSec] = useState("sec-attend");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // ── Scrollspy ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      let cur = TOC_SECTIONS[0]?.id ?? "sec-attend";

      for (const sec of TOC_SECTIONS) {
        const el = document.getElementById(sec.id);

        if (!el) continue;

        if (el.getBoundingClientRect().top <= 120) cur = sec.id;
      }

      setActiveSec(cur);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const bmi = calcBmi(vitals.weight, vitals.height);
  const age = getAge(patient.birthDate);
  const vitalsCount = Object.values(vitals).filter(Boolean).length;
  const isDirty = !!(subjective || objective || assessment || plan || freeNotes || vitalsCount > 0 || files.length > 0);
  const hasSoap = !!(subjective || objective || assessment || plan);

  // ── Mutation ───────────────────────────────────────────────────────────────
  const createRecord = useCreateRecord({
    mutation: {
      onSuccess: async () => {
        toast.success("Evolução registrada com sucesso");
        await navigate({ to: "/patients/$patientId", params: { patientId: patient.id } });
      },
      onError: () => {
        toast.error("Erro ao registrar evolução. Verifique os dados e tente novamente.");
      },
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  function toggleConduct(tag: CreateRecordDtoConductTagsItem) {
    setConductTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function jumpTo(id: string) {
    const el = document.getElementById(id);

    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;

    window.scrollTo({ top, behavior: "smooth" });
  }

  function handleCancel() {
    if (isDirty) { setShowDiscardModal(true); } else { void navigate({ to: "/patients/$patientId", params: { patientId: patient.id } }); }
  }

  function handlePublishClick() {
    if (!hasSoap && vitalsCount === 0) {
      toast.warning("Preencha pelo menos um campo SOAP ou sinais vitais antes de publicar.");

      return;
    }

    setShowPublishModal(true);
  }

  function handlePublishConfirm() {
    const vitalsText = composeVitalsText(vitals);
    const finalObjective = objective || vitalsText || undefined;

    const responsibleProfessionalId = userId ?? currentUser?.id ?? "";

    createRecord.mutate({
      data: {
        patientId: patient.id,
        responsibleProfessionalId,
        templateType: CreateRecordDtoTemplateType.SOAP,
        attendanceType,
        clinicalStatus,
        conductTags: conductTags.length > 0 ? conductTags : undefined,
        subjective: subjective || undefined,
        objective: finalObjective,
        assessment: assessment || undefined,
        plan: plan || undefined,
        freeNotes: freeNotes || undefined,
        eventDate: buildEventDate(date, time),
        wasHumanEdited: true,
      },
    });
    setShowPublishModal(false);
  }

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);

    if (!list.length) return;
    const fmt = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

    setFiles((prev) => [...prev, ...list.map((f, i) => ({ id: Date.now() + i, name: f.name, size: fmt(f.size) }))]);
    e.target.value = "";
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={S.page.root}>
      <div className={S.page.top}>
        {/* Breadcrumb */}
        <Breadcrumb>
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
              <BreadcrumbPage>Nova evolução</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Title */}
        <PageHeader title="Nova evolução" className="mt-5" />

        {/* Patient card */}
        <div className={S.patientCard.root}>
          <AvatarInitials name={patient.name} colorIndex={getAvatarColorIndex(patient.id)} size="sm" />
          <div className={S.patientCard.info}>
            <Link
              to="/patients/$patientId"
              params={{ patientId: patient.id }}
              className={S.patientCard.name}
            >
              {patient.name}
            </Link>
            <div className={S.patientCard.meta}>
              {age !== null && <span>{age} anos</span>}
              {age !== null && " · "}
              <span className={S.monoDate}>{patient.documentId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className={S.layout.root}>
        {/* TOC sidebar */}
        <aside className={S.layout.toc}>
          <div className={S.layout.tocTitle}>Seções</div>
          {TOC_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              className={cn(S.layout.tocItem, activeSec === sec.id && S.layout.tocItemActive)}
              onClick={() => jumpTo(sec.id)}
            >
              {sec.icon}
              <span>{sec.label}</span>
            </button>
          ))}
          <div className={S.layout.tocFoot}>
            <Lock className="size-[11px]" />
            <span>Salvo ao publicar</span>
          </div>
        </aside>

        {/* Content */}
        <div className={S.layout.content}>
          {/* ── Atendimento ─────────────────────────────────────────────── */}
          <section id="sec-attend" className={S.section.root}>
            <div className={S.section.head}>
              <span className={S.section.icon}><ClipboardList className="size-[14px]" /></span>
              <div className={S.section.headRight}>
                <h2 className={S.section.title}>Dados do atendimento</h2>
                <div className={S.section.sub}>Contexto clínico desse registro.</div>
              </div>
            </div>

            <FormGrid>
              <Field label="Data" required cols={3}>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  appearance="mono"
                />
              </Field>
              <Field label="Início" required cols={3}>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  appearance="mono"
                />
              </Field>
              <Field label="Término" optional cols={3}>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  appearance="mono"
                />
              </Field>
              <Field label="Tipo de atendimento" required cols={3}>
                <NativeSelect
                  value={attendanceType}
                  onChange={(e) => setAttendanceType(e.target.value as CreateRecordDtoAttendanceType)}
                >
                  {ATTENDANCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </NativeSelect>
              </Field>
            </FormGrid>
          </section>

          {/* ── Sinais vitais ─────────────────────────────────────────── */}
          <section id="sec-vitais" className={S.section.root}>
            <div className={S.section.head}>
              <span className={S.section.icon}><Activity className="size-[14px]" /></span>
              <div className={S.section.headRight}>
                <h2 className={S.section.title}>Sinais vitais</h2>
                <div className={S.section.sub}>Preencha apenas o que foi aferido.</div>
              </div>
              <div className={S.section.headAside}>
                <button
                  type="button"
                  onClick={() => setShowPrevVitals((v) => !v)}
                  className={S.vitals.prevToggle}
                >
                  {showPrevVitals ? <ChevronUp className="size-[13px]" /> : <ChevronDown className="size-[13px]" />}
                  Vitais anteriores
                </button>
              </div>
            </div>

            {showPrevVitals && (
              <div className={S.vitals.prevBox}>
                <div className={S.vitals.prevHead}>
                  <History className="size-[12px]" />
                  <span>Última evolução registrada</span>
                </div>
                <p className={S.vitals.prevEmpty}>Nenhum vital anterior disponível</p>
              </div>
            )}

            <div className={S.vitals.grid}>
              <VitalCell label="Pressão arterial" unit="mmHg" wide>
                <div className={S.vitals.paRow}>
                  <input
                    className={S.vitals.input}
                    inputMode="numeric"
                    placeholder="128"
                    value={vitals.sys}
                    onChange={(e) => setVitals((v) => ({ ...v, sys: e.target.value }))}
                  />
                  <span className={S.vitals.paSep}>/</span>
                  <input
                    className={S.vitals.input}
                    inputMode="numeric"
                    placeholder="82"
                    value={vitals.dia}
                    onChange={(e) => setVitals((v) => ({ ...v, dia: e.target.value }))}
                  />
                </div>
                <VitalAlert val={vitals.sys} range={VITALS_RANGES.sys} />
                <VitalAlert val={vitals.dia} range={VITALS_RANGES.dia} />
              </VitalCell>

              <VitalCell label="Frequência cardíaca" unit="bpm">
                <input
                  className={S.vitals.input}
                  inputMode="numeric"
                  placeholder="72"
                  value={vitals.hr}
                  onChange={(e) => setVitals((v) => ({ ...v, hr: e.target.value }))}
                />
                <VitalAlert val={vitals.hr} range={VITALS_RANGES.hr} />
              </VitalCell>

              <VitalCell label="Saturação O₂" unit="%">
                <input
                  className={S.vitals.input}
                  inputMode="numeric"
                  placeholder="98"
                  value={vitals.spo2}
                  onChange={(e) => setVitals((v) => ({ ...v, spo2: e.target.value }))}
                />
                <VitalAlert val={vitals.spo2} range={VITALS_RANGES.spo2} />
              </VitalCell>

              <VitalCell label="Temperatura" unit="°C">
                <input
                  className={S.vitals.input}
                  inputMode="decimal"
                  placeholder="36.5"
                  value={vitals.temp}
                  onChange={(e) => setVitals((v) => ({ ...v, temp: e.target.value }))}
                />
                <VitalAlert val={vitals.temp} range={VITALS_RANGES.temp} />
              </VitalCell>

              <VitalCell label="Peso" unit="kg">
                <input
                  className={S.vitals.input}
                  inputMode="decimal"
                  placeholder="70.0"
                  value={vitals.weight}
                  onChange={(e) => setVitals((v) => ({ ...v, weight: e.target.value }))}
                />
              </VitalCell>

              <VitalCell label="Altura" unit="cm">
                <input
                  className={S.vitals.input}
                  inputMode="numeric"
                  placeholder="170"
                  value={vitals.height}
                  onChange={(e) => setVitals((v) => ({ ...v, height: e.target.value }))}
                />
              </VitalCell>

              <VitalCell label="IMC" unit="kg/m²" readonly>
                {bmi ? (
                  <div className="flex items-baseline gap-1">
                    <span className={S.vitals.imcValue}>{bmi.value}</span>
                    <span className={S.imcTag({ tone: bmi.tone })}>{getBmiLabel(parseFloat(bmi.value))}</span>
                  </div>
                ) : (
                  <span className={S.vitals.imcEmpty}>— automático</span>
                )}
              </VitalCell>
            </div>
          </section>

          {/* ── SOAP ─────────────────────────────────────────────────── */}
          <section id="sec-soap" className={S.section.root}>
            <div className={S.section.head}>
              <span className={S.section.icon}><FileText className="size-[14px]" /></span>
              <div className={S.section.headRight}>
                <h2 className={S.section.title}>Evolução clínica · SOAP</h2>
                <div className={S.section.sub}>Subjetivo, Objetivo, Avaliação, Plano. Os campos crescem conforme você escreve.</div>
              </div>
            </div>

            <div className={S.soap.stack}>
              <SoapField
                letter="s"
                title="Subjetivo"
                hint="O que o paciente diz."
                value={subjective}
                onChange={setSubjective}
                placeholder="Queixa principal, história da doença atual, sintomas relatados pelo paciente…"
              />

              <SoapField
                letter="o"
                title="Objetivo"
                hint="O que você observa e examina."
                value={objective}
                onChange={setObjective}
                placeholder="Exame físico, achados clínicos, resultados de exames…"
              >
                {vitalsCount > 0 && (
                  <div className={S.soap.vitalsRef}>
                    <Activity className="size-[12px]" />
                    <span>Vitais aferidos:</span>
                    {vitals.sys && vitals.dia && <span><strong>PA</strong> {vitals.sys}/{vitals.dia}</span>}
                    {vitals.hr && <span><strong>FC</strong> {vitals.hr} bpm</span>}
                    {vitals.spo2 && <span><strong>SpO₂</strong> {vitals.spo2}%</span>}
                    {vitals.temp && <span><strong>T</strong> {vitals.temp}°C</span>}
                    {vitals.weight && <span><strong>Peso</strong> {vitals.weight} kg</span>}
                  </div>
                )}
              </SoapField>

              <SoapField
                letter="a"
                title="Avaliação"
                hint="Sua interpretação clínica."
                value={assessment}
                onChange={setAssessment}
                placeholder="Hipóteses diagnósticas, diagnóstico principal, diagnósticos diferenciais…"
              />

              <SoapField
                letter="p"
                title="Plano"
                hint="Conduta definida."
                value={plan}
                onChange={setPlan}
                placeholder="Tratamento, medicações, encaminhamentos, orientações, retorno…"
              />
            </div>
          </section>

          {/* ── Classificações ─────────────────────────────────────── */}
          <section id="sec-class" className={S.section.root}>
            <div className={S.section.head}>
              <span className={S.section.icon}><Tag className="size-[14px]" /></span>
              <div className={S.section.headRight}>
                <h2 className={S.section.title}>Classificações e tags</h2>
                <div className={S.section.sub}>Estruturam o registro para filtros e relatórios.</div>
              </div>
            </div>

            <FormGrid>
              <Field label="Status clínico" cols={6}>
                <NativeSelect
                  value={clinicalStatus}
                  onChange={(e) => setClinicalStatus(e.target.value as CreateRecordDtoClinicalStatus)}
                >
                  {CLINICAL_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </NativeSelect>
              </Field>

              <Field label="Conduta" optional cols={12}>
                <div className={S.conductGrid}>
                  {CONDUCT_TAGS.map((t) => {
                    const on = conductTags.includes(t.value);

                    return (
                      <button
                        key={t.value}
                        type="button"
                        className={S.conductChip({ on })}
                        onClick={() => toggleConduct(t.value)}
                      >
                        {t.icon}
                        <span>{t.label}</span>
                        {on && <Check className="size-[11px]" />}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Observações complementares" optional cols={12}>
                <Textarea
                  value={freeNotes}
                  onChange={(e) => setFreeNotes(e.target.value)}
                  rows={3}
                  className="resize-y min-h-[80px]"
                  placeholder="Informações que não se encaixam na estrutura SOAP. Lembretes para o próximo retorno…"
                />
              </Field>
            </FormGrid>
          </section>

          {/* ── Anexos ───────────────────────────────────────────────── */}
          <section id="sec-files" className={S.section.root}>
            <div className={S.section.head}>
              <span className={S.section.icon}><Paperclip className="size-[14px]" /></span>
              <div className={S.section.headRight}>
                <h2 className={S.section.title}>Anexos</h2>
                <div className={S.section.sub}>Vincule arquivos relacionados a esse atendimento.</div>
              </div>
            </div>

            <button
              type="button"
              className={S.upload.zone}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="size-[22px]" />
              <div className={S.upload.title}>Clique para enviar ou arraste arquivos aqui</div>
              <div className={S.upload.sub}>Imagens e PDFs · até 25 MB cada</div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={handleFileAdd}
              />
            </button>

            {files.length > 0 && (
              <div className={S.upload.list}>
                {files.map((f) => (
                  <div key={f.id} className={S.upload.row}>
                    <span className={S.upload.icon}>
                      {f.name.endsWith(".pdf") ? <FileText className="size-4" /> : <FileText className="size-4" />}
                    </span>
                    <div className={S.upload.body}>
                      <div className={S.upload.name}>{f.name}</div>
                      <div className={S.upload.size}>{f.size}</div>
                    </div>
                    <button
                      type="button"
                      className={S.upload.remove}
                      onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                      aria-label="Remover arquivo"
                    >
                      <X className="size-[14px]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Sticky footer */}
      <div className={S.footer.root}>
        <div className={S.footer.meta}>
          <Lock className="size-3" strokeWidth={1.5} />
          <span>Após publicar, o registro é imutável · LGPD</span>
        </div>
        <div className={S.footer.actions}>
          <Button variant="outline" size="sm" type="button" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button size="sm" type="button" onClick={handlePublishClick} disabled={createRecord.isPending}>
            <CheckCircle2 className="size-4" />
            Publicar evolução
          </Button>
        </div>
      </div>

      {/* Modals */}
      {showPublishModal && (
        <PublishModal
          summary={{
            patient,
            attendanceType,
            date,
            time,
            hasSoap,
            vitalsCount,
            conductCount: conductTags.length,
            fileCount: files.length,
          }}
          onCancel={() => setShowPublishModal(false)}
          onConfirm={handlePublishConfirm}
          loading={createRecord.isPending}
        />
      )}
      {showDiscardModal && (
        <DiscardModal
          onCancel={() => setShowDiscardModal(false)}
          onConfirm={() => {
            setShowDiscardModal(false);
            void navigate({ to: "/patients/$patientId", params: { patientId: patient.id } });
          }}
        />
      )}
    </div>
  );
}
