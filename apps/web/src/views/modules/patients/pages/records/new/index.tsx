import {useRef, useState, useEffect, type ReactNode} from 'react';
import {
    CreateRecordDtoAttendanceType,
    CreateRecordDtoClinicalStatus,
    CreateRecordDtoConductTagsItem,
    CreateRecordDtoTemplateType,
    useCreateRecord,
    useGetCurrentUser,
    useGetPatient,
    type Patient,
} from '@agenda-app/client';
import {createFileRoute, useNavigate, Link} from '@tanstack/react-router';
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
} from 'lucide-react';
import {toast} from 'sonner';
import {AvatarInitials} from '@/components/ui/componentes/avatar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/componentes/breadcrumb';
import {Button} from '@/components/ui/componentes/button';
import {Field, FormGrid} from '@/components/ui/componentes/field';
import {Input} from '@/components/ui/componentes/input';
import {NativeSelect} from '@/components/ui/componentes/native-select';
import {PageHeader} from '@/components/ui/componentes/page-header';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {Textarea} from '@/components/ui/componentes/textarea';
import {useAppStore} from '@/store/appStore';
import {cx} from '@/styled-system/css';
import {
    ConductGrid,
    FooterBar,
    ModalBackdrop,
    ModalPanel,
    RecordForm,
    SectionCard,
    SkeletonRoot,
    SoapFieldShell,
    SoapStack,
    UploadList,
    UploadZone,
    VitalCell,
    VitalsGrid,
    VitalsPrevBox,
    VitalsPrevToggle,
    conductChip,
    errorText,
    flexItemsBaselineGap1,
    icon10,
    icon11,
    icon12,
    icon13,
    icon14,
    icon18,
    icon22,
    icon3,
    icon35,
    icon4,
    icon5,
    imcTag,
    modalIcon,
    monoDate,
    pageErrorLink,
    pageErrorState,
    pageHeaderMt5,
    skeletonH160Rounded12,
    skeletonH4W64,
    skeletonH60RoundedCard,
    skeletonH8W48,
    skeletonH9Rounded8,
    soapLetter,
    textareaResizeY,
} from './styles';

export const Route = createFileRoute('/_stackedLayout/patients/$patientId/records/new')({
    component: NewEvolutionPage,
});

// ── Constants ─────────────────────────────────────────────────────────────────

const ATTENDANCE_OPTIONS: Array<{value: CreateRecordDtoAttendanceType; label: string}> = [
    {value: CreateRecordDtoAttendanceType.FIRST_VISIT, label: 'Primeira consulta'},
    {value: CreateRecordDtoAttendanceType.FOLLOW_UP, label: 'Retorno'},
    {value: CreateRecordDtoAttendanceType.EVALUATION, label: 'Avaliação'},
    {value: CreateRecordDtoAttendanceType.PROCEDURE, label: 'Procedimento'},
    {value: CreateRecordDtoAttendanceType.TELEMEDICINE, label: 'Telemedicina'},
    {value: CreateRecordDtoAttendanceType.INTERCURRENCE, label: 'Intercorrência'},
];

const CLINICAL_STATUS_OPTIONS: Array<{value: CreateRecordDtoClinicalStatus; label: string}> = [
    {value: CreateRecordDtoClinicalStatus.STABLE, label: 'Estável'},
    {value: CreateRecordDtoClinicalStatus.IMPROVING, label: 'Melhorando'},
    {value: CreateRecordDtoClinicalStatus.WORSENING, label: 'Piorando'},
    {value: CreateRecordDtoClinicalStatus.UNCHANGED, label: 'Sem mudança'},
    {value: CreateRecordDtoClinicalStatus.UNDER_OBSERVATION, label: 'Em observação'},
];

const CONDUCT_TAGS: Array<{value: CreateRecordDtoConductTagsItem; label: string; icon: ReactNode}> = [
    {value: CreateRecordDtoConductTagsItem.PRESCRIPTION, label: 'Prescrição', icon: <Pill className={icon13} />},
    {
        value: CreateRecordDtoConductTagsItem.EXAM_REQUESTED,
        label: 'Solicitação de exame',
        icon: <FlaskConical className={icon13} />,
    },
    {
        value: CreateRecordDtoConductTagsItem.REFERRAL,
        label: 'Encaminhamento',
        icon: <Forward className={icon13} />,
    },
    {
        value: CreateRecordDtoConductTagsItem.GUIDANCE,
        label: 'Orientação',
        icon: <MessageSquare className={icon13} />,
    },
    {
        value: CreateRecordDtoConductTagsItem.THERAPY_ADJUSTMENT,
        label: 'Ajuste de terapia',
        icon: <Syringe className={icon13} />,
    },
    {
        value: CreateRecordDtoConductTagsItem.FOLLOW_UP_SCHEDULED,
        label: 'Retorno agendado',
        icon: <CalendarClock className={icon13} />,
    },
];

const VITALS_RANGES = {
    sys: {min: 70, max: 220, label: 'Sistólica (mmHg)'},
    dia: {min: 40, max: 130, label: 'Diastólica (mmHg)'},
    hr: {min: 30, max: 200, label: 'bpm'},
    spo2: {min: 70, max: 100, label: '%'},
    temp: {min: 33, max: 42, label: '°C'},
    weight: {min: 1, max: 300, label: 'kg'},
    height: {min: 30, max: 230, label: 'cm'},
};

const TOC_SECTIONS = [
    {id: 'sec-attend', icon: <ClipboardList className={icon14} />, label: 'Atendimento'},
    {id: 'sec-vitais', icon: <Activity className={icon14} />, label: 'Sinais vitais'},
    {id: 'sec-soap', icon: <FileText className={icon14} />, label: 'SOAP'},
    {id: 'sec-class', icon: <Tag className={icon14} />, label: 'Classificações'},
    {id: 'sec-files', icon: <Paperclip className={icon14} />, label: 'Anexos'},
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function asStr(v: unknown): string | null {
    return typeof v === 'string' && v ? v : null;
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

    return `Sinais vitais: ${parts.join(' | ')}`;
}

function calcBmi(weight: string, height: string): {value: string; tone: 'ok' | 'warn' | 'bad'} | null {
    const w = parseFloat(weight);
    const h = parseFloat(height);

    if (!w || !h || h < 50) return null;
    const bmi = w / (h / 100) ** 2;
    const value = bmi.toFixed(1);

    if (bmi < 18.5) return {value, tone: 'warn'};

    if (bmi < 25) return {value, tone: 'ok'};

    if (bmi < 30) return {value, tone: 'warn'};

    return {value, tone: 'bad'};
}

function getBmiLabel(bmi: number): string {
    if (bmi < 18.5) return 'Baixo peso';

    if (bmi < 25) return 'Eutrófico';

    if (bmi < 30) return 'Sobrepeso';

    if (bmi < 35) return 'Obesidade I';

    if (bmi < 40) return 'Obesidade II';

    return 'Obesidade III';
}

function getAvatarColorIndex(id: string): number {
    let h = 0;

    // eslint-disable-next-line no-bitwise -- standard string-hash uint32 pattern
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;

    return h;
}

function isVitalOutOfRange(val: string, range: {min: number; max: number}): boolean {
    const n = parseFloat(val);

    if (!val || Number.isNaN(n)) return false;

    return n < range.min || n > range.max;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface VitalsState {
    sys: string;
    dia: string;
    hr: string;
    spo2: string;
    temp: string;
    weight: string;
    height: string;
}

interface LocalFile {
    id: number;
    name: string;
    size: string;
}

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
    letter: 's' | 'o' | 'a' | 'p';
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
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, [value]);

    return (
        <SoapFieldShell>
            <div className="head">
                <span className={soapLetter({v: letter})}>{letter.toUpperCase()}</span>
                <div className="hint-wrap">
                    <div className="title">{title}</div>
                    <div className="hint">{hint}</div>
                </div>
            </div>
            {children}
            <textarea
                ref={ref}
                className="textarea"
                rows={4}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={title}
            />
        </SoapFieldShell>
    );
}

function VitalCellField({
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
        <VitalCell wide={wide} readonly={readonly}>
            <div className="vital-head">
                <span className="label">{label}</span>
                <span className="unit">{unit}</span>
            </div>
            {children}
        </VitalCell>
    );
}

function VitalAlert({val, range}: {val: string; range: {min: number; max: number}}) {
    if (!isVitalOutOfRange(val, range)) return null;

    return (
        <div className="vital-warn">
            <AlertTriangle className={icon10} />
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
        <ModalBackdrop onClick={onCancel}>
            <ModalPanel onClick={(e) => e.stopPropagation()}>
                <div className="head">
                    <span className={modalIcon({tone: 'ok'})}>
                        <CheckCircle2 className={icon18} />
                    </span>
                    <div>
                        <h3 className="title">Publicar evolução?</h3>
                        <p className="sub">Após publicar, o registro é imutável e não pode ser editado.</p>
                    </div>
                </div>

                <div className="summary">
                    <div className="row">
                        <span className="label">Paciente</span>
                        <span className="value">{summary.patient.name}</span>
                    </div>
                    <div className="row">
                        <span className="label">Tipo</span>
                        <span className="value">{attendanceLabel}</span>
                    </div>
                    <div className="row">
                        <span className="label">Data e hora</span>
                        <span className="date-value">
                            {summary.date} · {summary.time || '—'}
                        </span>
                    </div>
                    <div className="row">
                        <span className="label">Conteúdo</span>
                        <div className="chips">
                            {summary.hasSoap && <span className="chip">SOAP</span>}
                            {summary.vitalsCount > 0 && (
                                <span className="chip">
                                    <Activity className={icon10} />
                                    {summary.vitalsCount} vitais
                                </span>
                            )}
                            {summary.conductCount > 0 && (
                                <span className="chip">
                                    <Tag className={icon10} />
                                    {summary.conductCount} condutas
                                </span>
                            )}
                            {summary.fileCount > 0 && (
                                <span className="chip">
                                    <Paperclip className={icon10} />
                                    {summary.fileCount} anexos
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="actions">
                    <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
                        Voltar e revisar
                    </Button>
                    <Button size="sm" onClick={onConfirm} disabled={loading}>
                        {loading ? (
                            <>
                                <svg
                                    className={cx(icon4, 'animate-spin')}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                >
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                                Publicando…
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className={icon4} />
                                Publicar evolução
                            </>
                        )}
                    </Button>
                </div>
            </ModalPanel>
        </ModalBackdrop>
    );
}


function DiscardModal({onCancel, onConfirm}: {onCancel: () => void; onConfirm: () => void}) {
    return (
        <ModalBackdrop onClick={onCancel}>
            <ModalPanel onClick={(e) => e.stopPropagation()}>
                <div className="head">
                    <span className={modalIcon({tone: 'warn'})}>
                        <AlertTriangle className={icon18} />
                    </span>
                    <div>
                        <h3 className="title">Descartar alterações?</h3>
                        <p className="sub">Há informações não salvas. Esta ação não pode ser desfeita.</p>
                    </div>
                </div>
                <div className="actions">
                    <Button variant="outline" size="sm" onClick={onCancel}>
                        Continuar editando
                    </Button>
                    <Button variant="destructive" size="sm" onClick={onConfirm}>
                        Descartar
                    </Button>
                </div>
            </ModalPanel>
        </ModalBackdrop>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function NewEvolutionPage() {
    const {patientId} = Route.useParams();
    const {data: patient, isLoading, isError} = useGetPatient(patientId);

    if (isLoading) return <PageSkeleton />;

    if (isError || !patient) {
        return (
            <div className={pageErrorState}>
                <p className={errorText}>Paciente não encontrado ou erro ao carregar.</p>
                <Link to="/patients" className={pageErrorLink}>
                    Voltar para pacientes
                </Link>
            </div>
        );
    }

    return <NewEvolutionForm patient={patient} />;
}

function PageSkeleton() {
    return (
        <SkeletonRoot>
            <Skeleton className={skeletonH4W64} />
            <Skeleton className={skeletonH8W48} />
            <Skeleton className={skeletonH60RoundedCard} />
            <div className="skeleton-grid">
                <div className="nav-stack">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className={skeletonH9Rounded8} />
                    ))}
                </div>
                <div className="content-stack">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className={skeletonH160Rounded12} />
                    ))}
                </div>
            </div>
        </SkeletonRoot>
    );
}

function NewEvolutionForm({patient}: {patient: Patient}) {
    const navigate = useNavigate();
    const {userId} = useAppStore();
    const {data: currentUser} = useGetCurrentUser();

    // ── Form state ─────────────────────────────────────────────────────────────
    const today = new Date();
    const todayISO = today.toISOString().slice(0, 10);
    const nowHHMM = today.toTimeString().slice(0, 5);

    const [date, setDate] = useState(todayISO);
    const [time, setTime] = useState(nowHHMM);
    const [endTime, setEndTime] = useState('');
    const [attendanceType, setAttendanceType] = useState<CreateRecordDtoAttendanceType>(
        CreateRecordDtoAttendanceType.FOLLOW_UP
    );

    const [vitals, setVitals] = useState<VitalsState>({
        sys: '',
        dia: '',
        hr: '',
        spo2: '',
        temp: '',
        weight: '',
        height: '',
    });
    const [showPrevVitals, setShowPrevVitals] = useState(false);

    const [subjective, setSubjective] = useState('');
    const [objective, setObjective] = useState('');
    const [assessment, setAssessment] = useState('');
    const [plan, setPlan] = useState('');

    const [clinicalStatus, setClinicalStatus] = useState<CreateRecordDtoClinicalStatus>(
        CreateRecordDtoClinicalStatus.STABLE
    );
    const [conductTags, setConductTags] = useState<CreateRecordDtoConductTagsItem[]>([]);
    const [freeNotes, setFreeNotes] = useState('');

    const [files, setFiles] = useState<LocalFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeSec, setActiveSec] = useState('sec-attend');
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showDiscardModal, setShowDiscardModal] = useState(false);

    // ── Scrollspy ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const onScroll = () => {
            let cur = TOC_SECTIONS[0]?.id ?? 'sec-attend';

            for (const sec of TOC_SECTIONS) {
                const el = document.getElementById(sec.id);

                if (!el) continue;

                if (el.getBoundingClientRect().top <= 120) cur = sec.id;
            }

            setActiveSec(cur);
        };

        window.addEventListener('scroll', onScroll, {passive: true});

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // ── Derived ────────────────────────────────────────────────────────────────
    const bmi = calcBmi(vitals.weight, vitals.height);
    const age = getAge(patient.birthDate);
    const vitalsCount = Object.values(vitals).filter(Boolean).length;
    const isDirty = !!(
        subjective ||
        objective ||
        assessment ||
        plan ||
        freeNotes ||
        vitalsCount > 0 ||
        files.length > 0
    );
    const hasSoap = !!(subjective || objective || assessment || plan);

    // ── Mutation ───────────────────────────────────────────────────────────────
    const createRecord = useCreateRecord({
        mutation: {
            onSuccess: async () => {
                toast.success('Evolução registrada com sucesso');
                await navigate({to: '/patients/$patientId', params: {patientId: patient.id}});
            },
            onError: () => {
                toast.error('Erro ao registrar evolução. Verifique os dados e tente novamente.');
            },
        },
    });

    // ── Handlers ───────────────────────────────────────────────────────────────
    function toggleConduct(tag: CreateRecordDtoConductTagsItem) {
        setConductTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    }

    function jumpTo(id: string) {
        const el = document.getElementById(id);

        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 80;

        window.scrollTo({top, behavior: 'smooth'});
    }

    function handleCancel() {
        if (isDirty) {
            setShowDiscardModal(true);
        } else {
            void navigate({to: '/patients/$patientId', params: {patientId: patient.id}});
        }
    }

    function handlePublishClick() {
        if (!hasSoap && vitalsCount === 0) {
            toast.warning('Preencha pelo menos um campo SOAP ou sinais vitais antes de publicar.');

            return;
        }

        setShowPublishModal(true);
    }

    function handlePublishConfirm() {
        const vitalsText = composeVitalsText(vitals);
        const finalObjective = objective || vitalsText || undefined;

        const responsibleProfessionalId = userId ?? currentUser?.id ?? '';

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
        const fmt = (b: number) =>
            b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

        setFiles((prev) => [...prev, ...list.map((f, i) => ({id: Date.now() + i, name: f.name, size: fmt(f.size)}))]);
        e.target.value = '';
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <RecordForm>
            <div className="topbar">
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
                                <Link to="/patients/$patientId" params={{patientId: patient.id}}>
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
                <PageHeader title="Nova evolução" className={pageHeaderMt5} />

                {/* Patient card */}
                <div className="patient-card">
                    <AvatarInitials name={patient.name} colorIndex={getAvatarColorIndex(patient.id)} size="sm" />
                    <div className="info">
                        <Link to="/patients/$patientId" params={{patientId: patient.id}} className="name">
                            {patient.name}
                        </Link>
                        <div className="meta">
                            {age !== null && <span>{age} anos</span>}
                            {age !== null && ' · '}
                            <span className={monoDate}>{patient.documentId}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="layout">
                {/* TOC sidebar */}
                <aside className="toc">
                    <div className="toc-title">Seções</div>
                    {TOC_SECTIONS.map((sec) => (
                        <button
                            key={sec.id}
                            type="button"
                            className={cx('toc-item', activeSec === sec.id && 'toc-item-active')}
                            onClick={() => jumpTo(sec.id)}
                        >
                            {sec.icon}
                            <span>{sec.label}</span>
                        </button>
                    ))}
                    <div className="toc-foot">
                        <Lock className={icon11} />
                        <span>Salvo ao publicar</span>
                    </div>
                </aside>

                {/* Content */}
                <div className="content">
                    {/* ── Atendimento ─────────────────────────────────────────────── */}
                    <SectionCard id="sec-attend">
                        <div className="head">
                            <span className="icon">
                                <ClipboardList className={icon14} />
                            </span>
                            <div className="right">
                                <h2 className="title">Dados do atendimento</h2>
                                <div className="sub">Contexto clínico desse registro.</div>
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
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </Field>
                        </FormGrid>
                    </SectionCard>

                    {/* ── Sinais vitais ─────────────────────────────────────────── */}
                    <SectionCard id="sec-vitais">
                        <div className="head">
                            <span className="icon">
                                <Activity className={icon14} />
                            </span>
                            <div className="right">
                                <h2 className="title">Sinais vitais</h2>
                                <div className="sub">Preencha apenas o que foi aferido.</div>
                            </div>
                            <div className="aside">
                                <VitalsPrevToggle onClick={() => setShowPrevVitals((v) => !v)}>
                                    {showPrevVitals ? (
                                        <ChevronUp className={icon13} />
                                    ) : (
                                        <ChevronDown className={icon13} />
                                    )}
                                    Vitais anteriores
                                </VitalsPrevToggle>
                            </div>
                        </div>

                        {showPrevVitals && (
                            <VitalsPrevBox>
                                <div className="head">
                                    <History className={icon12} />
                                    <span>Última evolução registrada</span>
                                </div>
                                <p className="empty">Nenhum vital anterior disponível</p>
                            </VitalsPrevBox>
                        )}

                        <VitalsGrid>
                            <VitalCellField label="Pressão arterial" unit="mmHg" wide>
                                <div className="pa-row">
                                    <input
                                        className="vital-input"
                                        inputMode="numeric"
                                        placeholder="128"
                                        aria-label="Pressão arterial sistólica"
                                        value={vitals.sys}
                                        onChange={(e) => setVitals((v) => ({...v, sys: e.target.value}))}
                                    />
                                    <span className="pa-sep">/</span>
                                    <input
                                        className="vital-input"
                                        inputMode="numeric"
                                        placeholder="82"
                                        aria-label="Pressão arterial diastólica"
                                        value={vitals.dia}
                                        onChange={(e) => setVitals((v) => ({...v, dia: e.target.value}))}
                                    />
                                </div>
                                <VitalAlert val={vitals.sys} range={VITALS_RANGES.sys} />
                                <VitalAlert val={vitals.dia} range={VITALS_RANGES.dia} />
                            </VitalCellField>

                            <VitalCellField label="Frequência cardíaca" unit="bpm">
                                <input
                                    className="vital-input"
                                    inputMode="numeric"
                                    placeholder="72"
                                    aria-label="Frequência cardíaca"
                                    value={vitals.hr}
                                    onChange={(e) => setVitals((v) => ({...v, hr: e.target.value}))}
                                />
                                <VitalAlert val={vitals.hr} range={VITALS_RANGES.hr} />
                            </VitalCellField>

                            <VitalCellField label="Saturação O₂" unit="%">
                                <input
                                    className="vital-input"
                                    inputMode="numeric"
                                    placeholder="98"
                                    aria-label="Saturação O₂"
                                    value={vitals.spo2}
                                    onChange={(e) => setVitals((v) => ({...v, spo2: e.target.value}))}
                                />
                                <VitalAlert val={vitals.spo2} range={VITALS_RANGES.spo2} />
                            </VitalCellField>

                            <VitalCellField label="Temperatura" unit="°C">
                                <input
                                    className="vital-input"
                                    inputMode="decimal"
                                    placeholder="36.5"
                                    aria-label="Temperatura"
                                    value={vitals.temp}
                                    onChange={(e) => setVitals((v) => ({...v, temp: e.target.value}))}
                                />
                                <VitalAlert val={vitals.temp} range={VITALS_RANGES.temp} />
                            </VitalCellField>

                            <VitalCellField label="Peso" unit="kg">
                                <input
                                    className="vital-input"
                                    inputMode="decimal"
                                    placeholder="70.0"
                                    aria-label="Peso"
                                    value={vitals.weight}
                                    onChange={(e) => setVitals((v) => ({...v, weight: e.target.value}))}
                                />
                            </VitalCellField>

                            <VitalCellField label="Altura" unit="cm">
                                <input
                                    className="vital-input"
                                    inputMode="numeric"
                                    placeholder="170"
                                    aria-label="Altura"
                                    value={vitals.height}
                                    onChange={(e) => setVitals((v) => ({...v, height: e.target.value}))}
                                />
                            </VitalCellField>

                            <VitalCellField label="IMC" unit="kg/m²" readonly>
                                {bmi ? (
                                    <div className={flexItemsBaselineGap1}>
                                        <span className="imc-value">{bmi.value}</span>
                                        <span className={imcTag({tone: bmi.tone})}>
                                            {getBmiLabel(parseFloat(bmi.value))}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="imc-empty">— automático</span>
                                )}
                            </VitalCellField>
                        </VitalsGrid>
                    </SectionCard>

                    {/* ── SOAP ─────────────────────────────────────────────────── */}
                    <SectionCard id="sec-soap">
                        <div className="head">
                            <span className="icon">
                                <FileText className={icon14} />
                            </span>
                            <div className="right">
                                <h2 className="title">Evolução clínica · SOAP</h2>
                                <div className="sub">
                                    Subjetivo, Objetivo, Avaliação, Plano. Os campos crescem conforme você escreve.
                                </div>
                            </div>
                        </div>

                        <SoapStack>
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
                                    <div className="vitals-ref">
                                        <Activity className={icon12} />
                                        <span>Vitais aferidos:</span>
                                        {vitals.sys && vitals.dia && (
                                            <span>
                                                <strong>PA</strong> {vitals.sys}/{vitals.dia}
                                            </span>
                                        )}
                                        {vitals.hr && (
                                            <span>
                                                <strong>FC</strong> {vitals.hr} bpm
                                            </span>
                                        )}
                                        {vitals.spo2 && (
                                            <span>
                                                <strong>SpO₂</strong> {vitals.spo2}%
                                            </span>
                                        )}
                                        {vitals.temp && (
                                            <span>
                                                <strong>T</strong> {vitals.temp}°C
                                            </span>
                                        )}
                                        {vitals.weight && (
                                            <span>
                                                <strong>Peso</strong> {vitals.weight} kg
                                            </span>
                                        )}
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
                        </SoapStack>
                    </SectionCard>

                    {/* ── Classificações ─────────────────────────────────────── */}
                    <SectionCard id="sec-class">
                        <div className="head">
                            <span className="icon">
                                <Tag className={icon14} />
                            </span>
                            <div className="right">
                                <h2 className="title">Classificações e tags</h2>
                                <div className="sub">Estruturam o registro para filtros e relatórios.</div>
                            </div>
                        </div>

                        <FormGrid>
                            <Field label="Status clínico" cols={6}>
                                <NativeSelect
                                    value={clinicalStatus}
                                    onChange={(e) => setClinicalStatus(e.target.value as CreateRecordDtoClinicalStatus)}
                                >
                                    {CLINICAL_STATUS_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </Field>

                            <Field label="Conduta" optional cols={12}>
                                <ConductGrid>
                                    {CONDUCT_TAGS.map((t) => {
                                        const on = conductTags.includes(t.value);

                                        return (
                                            <button
                                                key={t.value}
                                                type="button"
                                                className={conductChip({on})}
                                                onClick={() => toggleConduct(t.value)}
                                            >
                                                {t.icon}
                                                <span>{t.label}</span>
                                                {on && <Check className={icon11} />}
                                            </button>
                                        );
                                    })}
                                </ConductGrid>
                            </Field>

                            <Field label="Observações complementares" optional cols={12}>
                                <Textarea
                                    value={freeNotes}
                                    onChange={(e) => setFreeNotes(e.target.value)}
                                    rows={3}
                                    className={textareaResizeY}
                                    placeholder="Informações que não se encaixam na estrutura SOAP. Lembretes para o próximo retorno…"
                                />
                            </Field>
                        </FormGrid>
                    </SectionCard>

                    {/* ── Anexos ───────────────────────────────────────────────── */}
                    <SectionCard id="sec-files">
                        <div className="head">
                            <span className="icon">
                                <Paperclip className={icon14} />
                            </span>
                            <div className="right">
                                <h2 className="title">Anexos</h2>
                                <div className="sub">Vincule arquivos relacionados a esse atendimento.</div>
                            </div>
                        </div>

                        <UploadZone onClick={() => fileInputRef.current?.click()}>
                            <UploadCloud className={icon22} />
                            <div className="title">Clique para enviar ou arraste arquivos aqui</div>
                            <div className="sub">Imagens e PDFs · até 25 MB cada</div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                style={{display: 'none'}}
                                aria-label="Enviar arquivos relacionados ao atendimento"
                                onChange={handleFileAdd}
                            />
                        </UploadZone>

                        {files.length > 0 && (
                            <UploadList>
                                {files.map((f) => (
                                    <div key={f.id} className="row">
                                        <span className="icon">
                                            {f.name.endsWith('.pdf') ? (
                                                <FileText className={icon4} />
                                            ) : (
                                                <FileText className={icon4} />
                                            )}
                                        </span>
                                        <div className="body">
                                            <div className="name">{f.name}</div>
                                            <div className="size">{f.size}</div>
                                        </div>
                                        <button
                                            type="button"
                                            className="remove"
                                            onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                                            aria-label="Remover arquivo"
                                        >
                                            <X className={icon14} />
                                        </button>
                                    </div>
                                ))}
                            </UploadList>
                        )}
                    </SectionCard>
                </div>
            </div>

            {/* Sticky footer */}
            <FooterBar>
                <div className="meta">
                    <Lock className={icon3} strokeWidth={1.5} />
                    <span>Após publicar, o registro é imutável · LGPD</span>
                </div>
                <div className="actions">
                    <Button variant="outline" size="sm" type="button" onClick={handleCancel}>
                        Cancelar
                    </Button>
                    <Button size="sm" type="button" onClick={handlePublishClick} disabled={createRecord.isPending}>
                        <CheckCircle2 className={icon4} />
                        Publicar evolução
                    </Button>
                </div>
            </FooterBar>

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
                        void navigate({to: '/patients/$patientId', params: {patientId: patient.id}});
                    }}
                />
            )}
        </RecordForm>
    );
}
