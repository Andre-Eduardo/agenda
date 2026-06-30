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
import {cva} from 'class-variance-authority';
import {clsx} from 'clsx';
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
import {cn} from '@/lib/utils';
import {useAppStore} from '@/store/appStore';
import styles from './styles.module.css';

// ── Local variants ────────────────────────────────────────────────────────────

const imcTag = cva(styles.imcTagBase, {
    variants: {
        tone: {
            ok: styles.imcTagOk,
            warn: styles.imcTagWarn,
            bad: styles.imcTagBad,
        },
    },
});

const soapLetter = cva(styles.soapLetterBase, {
    variants: {
        v: {
            s: styles.soapLetterS,
            o: styles.soapLetterO,
            a: styles.soapLetterA,
            p: styles.soapLetterP,
        },
    },
});

const conductChip = cva(styles.conductChipBase, {
    variants: {
        on: {
            true: styles.conductChipOn,
            false: styles.conductChipOff,
        },
    },
    defaultVariants: {on: false},
});

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
    {value: CreateRecordDtoConductTagsItem.PRESCRIPTION, label: 'Prescrição', icon: <Pill className="size-[13px]" />},
    {
        value: CreateRecordDtoConductTagsItem.EXAM_REQUESTED,
        label: 'Solicitação de exame',
        icon: <FlaskConical className="size-[13px]" />,
    },
    {
        value: CreateRecordDtoConductTagsItem.REFERRAL,
        label: 'Encaminhamento',
        icon: <Forward className="size-[13px]" />,
    },
    {
        value: CreateRecordDtoConductTagsItem.GUIDANCE,
        label: 'Orientação',
        icon: <MessageSquare className="size-[13px]" />,
    },
    {
        value: CreateRecordDtoConductTagsItem.THERAPY_ADJUSTMENT,
        label: 'Ajuste de terapia',
        icon: <Syringe className="size-[13px]" />,
    },
    {
        value: CreateRecordDtoConductTagsItem.FOLLOW_UP_SCHEDULED,
        label: 'Retorno agendado',
        icon: <CalendarClock className="size-[13px]" />,
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
    {id: 'sec-attend', icon: <ClipboardList className="size-[14px]" />, label: 'Atendimento'},
    {id: 'sec-vitais', icon: <Activity className="size-[14px]" />, label: 'Sinais vitais'},
    {id: 'sec-soap', icon: <FileText className="size-[14px]" />, label: 'SOAP'},
    {id: 'sec-class', icon: <Tag className="size-[14px]" />, label: 'Classificações'},
    {id: 'sec-files', icon: <Paperclip className="size-[14px]" />, label: 'Anexos'},
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
        <div className={styles.soapField}>
            <div className={styles.soapHead}>
                <span className={soapLetter({v: letter})}>{letter.toUpperCase()}</span>
                <div>
                    <div className={styles.soapTitle}>{title}</div>
                    <div className={styles.soapHint}>{hint}</div>
                </div>
            </div>
            {children}
            <textarea
                ref={ref}
                className={styles.soapTextarea}
                rows={4}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={title}
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
        <div className={clsx(styles.vitalsCell, wide && styles.vitalsCellWide, readonly && styles.vitalsCellReadonly)}>
            <div className={styles.vitalsHead}>
                <span className={styles.vitalsLabel}>{label}</span>
                <span className={styles.vitalsUnit}>{unit}</span>
            </div>
            {children}
        </div>
    );
}

function VitalAlert({val, range}: {val: string; range: {min: number; max: number}}) {
    if (!isVitalOutOfRange(val, range)) return null;

    return (
        <div className={styles.vitalsWarn}>
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
        <div className={styles.modalBackdrop} onClick={onCancel}>
            <div className={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHead}>
                    <span className={clsx(styles.modalIcon, styles.modalIconOk)}>
                        <CheckCircle2 className="size-[18px]" />
                    </span>
                    <div>
                        <h3 className={styles.modalTitle}>Publicar evolução?</h3>
                        <p className={styles.modalSub}>Após publicar, o registro é imutável e não pode ser editado.</p>
                    </div>
                </div>

                <div className={styles.modalSummary}>
                    <div className={styles.modalSummaryRow}>
                        <span className={styles.modalSummaryLabel}>Paciente</span>
                        <span className={styles.modalSummaryValue}>{summary.patient.name}</span>
                    </div>
                    <div className={styles.modalSummaryRow}>
                        <span className={styles.modalSummaryLabel}>Tipo</span>
                        <span className={styles.modalSummaryValue}>{attendanceLabel}</span>
                    </div>
                    <div className={styles.modalSummaryRow}>
                        <span className={styles.modalSummaryLabel}>Data e hora</span>
                        <span className={cn(styles.modalSummaryValue, 'font-mono tabular-nums text-[13px]')}>
                            {summary.date} · {summary.time || '—'}
                        </span>
                    </div>
                    <div className={styles.modalSummaryRow}>
                        <span className={styles.modalSummaryLabel}>Conteúdo</span>
                        <div className={styles.modalChips}>
                            {summary.hasSoap && <span className={styles.modalChip}>SOAP</span>}
                            {summary.vitalsCount > 0 && (
                                <span className={styles.modalChip}>
                                    <Activity className="size-[10px]" />
                                    {summary.vitalsCount} vitais
                                </span>
                            )}
                            {summary.conductCount > 0 && (
                                <span className={styles.modalChip}>
                                    <Tag className="size-[10px]" />
                                    {summary.conductCount} condutas
                                </span>
                            )}
                            {summary.fileCount > 0 && (
                                <span className={styles.modalChip}>
                                    <Paperclip className="size-[10px]" />
                                    {summary.fileCount} anexos
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
                        Voltar e revisar
                    </Button>
                    <Button size="sm" onClick={onConfirm} disabled={loading}>
                        {loading ? (
                            <>
                                <svg
                                    className="size-4 animate-spin"
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

function DiscardModal({onCancel, onConfirm}: {onCancel: () => void; onConfirm: () => void}) {
    return (
        <div className={styles.modalBackdrop} onClick={onCancel}>
            <div className={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHead}>
                    <span className={clsx(styles.modalIcon, styles.modalIconWarn)}>
                        <AlertTriangle className="size-[18px]" />
                    </span>
                    <div>
                        <h3 className={styles.modalTitle}>Descartar alterações?</h3>
                        <p className={styles.modalSub}>Há informações não salvas. Esta ação não pode ser desfeita.</p>
                    </div>
                </div>
                <div className={styles.modalActions}>
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
    const {patientId} = Route.useParams();
    const {data: patient, isLoading, isError} = useGetPatient(patientId);

    if (isLoading) return <PageSkeleton />;

    if (isError || !patient) {
        return (
            <div className={styles.pageErrorState}>
                <p className="text-sm">Paciente não encontrado ou erro ao carregar.</p>
                <Link to="/patients" className={styles.pageErrorLink}>
                    Voltar para pacientes
                </Link>
            </div>
        );
    }

    return <NewEvolutionForm patient={patient} />;
}

function PageSkeleton() {
    return (
        <div className={styles.skeletonRoot}>
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className={styles.skeletonPatientCard} />
            <div className={styles.skeletonGrid}>
                <div className={styles.skeletonNavStack}>
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className={styles.skeletonNavItem} />
                    ))}
                </div>
                <div className={styles.skeletonContentStack}>
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className={styles.skeletonContentSection} />
                    ))}
                </div>
            </div>
        </div>
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
        <div className={styles.pageRoot}>
            <div className={styles.pageTop}>
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
                <PageHeader title="Nova evolução" className="mt-5" />

                {/* Patient card */}
                <div className={styles.patientCardRoot}>
                    <AvatarInitials name={patient.name} colorIndex={getAvatarColorIndex(patient.id)} size="sm" />
                    <div className={styles.patientCardInfo}>
                        <Link
                            to="/patients/$patientId"
                            params={{patientId: patient.id}}
                            className={styles.patientCardName}
                        >
                            {patient.name}
                        </Link>
                        <div className={styles.patientCardMeta}>
                            {age !== null && <span>{age} anos</span>}
                            {age !== null && ' · '}
                            <span className={styles.monoDate}>{patient.documentId}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Two-column layout */}
            <div className={styles.layoutRoot}>
                {/* TOC sidebar */}
                <aside className={styles.layoutToc}>
                    <div className={styles.layoutTocTitle}>Seções</div>
                    {TOC_SECTIONS.map((sec) => (
                        <button
                            key={sec.id}
                            type="button"
                            className={clsx(styles.layoutTocItem, activeSec === sec.id && styles.layoutTocItemActive)}
                            onClick={() => jumpTo(sec.id)}
                        >
                            {sec.icon}
                            <span>{sec.label}</span>
                        </button>
                    ))}
                    <div className={styles.layoutTocFoot}>
                        <Lock className="size-[11px]" />
                        <span>Salvo ao publicar</span>
                    </div>
                </aside>

                {/* Content */}
                <div className={styles.layoutContent}>
                    {/* ── Atendimento ─────────────────────────────────────────────── */}
                    <section id="sec-attend" className={styles.sectionRoot}>
                        <div className={styles.sectionHead}>
                            <span className={styles.sectionIcon}>
                                <ClipboardList className="size-[14px]" />
                            </span>
                            <div className={styles.sectionHeadRight}>
                                <h2 className={styles.sectionTitle}>Dados do atendimento</h2>
                                <div className={styles.sectionSub}>Contexto clínico desse registro.</div>
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
                    </section>

                    {/* ── Sinais vitais ─────────────────────────────────────────── */}
                    <section id="sec-vitais" className={styles.sectionRoot}>
                        <div className={styles.sectionHead}>
                            <span className={styles.sectionIcon}>
                                <Activity className="size-[14px]" />
                            </span>
                            <div className={styles.sectionHeadRight}>
                                <h2 className={styles.sectionTitle}>Sinais vitais</h2>
                                <div className={styles.sectionSub}>Preencha apenas o que foi aferido.</div>
                            </div>
                            <div className={styles.sectionHeadAside}>
                                <button
                                    type="button"
                                    onClick={() => setShowPrevVitals((v) => !v)}
                                    className={styles.vitalsPrevToggle}
                                >
                                    {showPrevVitals ? (
                                        <ChevronUp className="size-[13px]" />
                                    ) : (
                                        <ChevronDown className="size-[13px]" />
                                    )}
                                    Vitais anteriores
                                </button>
                            </div>
                        </div>

                        {showPrevVitals && (
                            <div className={styles.vitalsPrevBox}>
                                <div className={styles.vitalsPrevHead}>
                                    <History className="size-[12px]" />
                                    <span>Última evolução registrada</span>
                                </div>
                                <p className={styles.vitalsPrevEmpty}>Nenhum vital anterior disponível</p>
                            </div>
                        )}

                        <div className={styles.vitalsGrid}>
                            <VitalCell label="Pressão arterial" unit="mmHg" wide>
                                <div className={styles.vitalsPaRow}>
                                    <input
                                        className={styles.vitalsInput}
                                        inputMode="numeric"
                                        placeholder="128"
                                        aria-label="Pressão arterial sistólica"
                                        value={vitals.sys}
                                        onChange={(e) => setVitals((v) => ({...v, sys: e.target.value}))}
                                    />
                                    <span className={styles.vitalsPaSep}>/</span>
                                    <input
                                        className={styles.vitalsInput}
                                        inputMode="numeric"
                                        placeholder="82"
                                        aria-label="Pressão arterial diastólica"
                                        value={vitals.dia}
                                        onChange={(e) => setVitals((v) => ({...v, dia: e.target.value}))}
                                    />
                                </div>
                                <VitalAlert val={vitals.sys} range={VITALS_RANGES.sys} />
                                <VitalAlert val={vitals.dia} range={VITALS_RANGES.dia} />
                            </VitalCell>

                            <VitalCell label="Frequência cardíaca" unit="bpm">
                                <input
                                    className={styles.vitalsInput}
                                    inputMode="numeric"
                                    placeholder="72"
                                    aria-label="Frequência cardíaca"
                                    value={vitals.hr}
                                    onChange={(e) => setVitals((v) => ({...v, hr: e.target.value}))}
                                />
                                <VitalAlert val={vitals.hr} range={VITALS_RANGES.hr} />
                            </VitalCell>

                            <VitalCell label="Saturação O₂" unit="%">
                                <input
                                    className={styles.vitalsInput}
                                    inputMode="numeric"
                                    placeholder="98"
                                    aria-label="Saturação O₂"
                                    value={vitals.spo2}
                                    onChange={(e) => setVitals((v) => ({...v, spo2: e.target.value}))}
                                />
                                <VitalAlert val={vitals.spo2} range={VITALS_RANGES.spo2} />
                            </VitalCell>

                            <VitalCell label="Temperatura" unit="°C">
                                <input
                                    className={styles.vitalsInput}
                                    inputMode="decimal"
                                    placeholder="36.5"
                                    aria-label="Temperatura"
                                    value={vitals.temp}
                                    onChange={(e) => setVitals((v) => ({...v, temp: e.target.value}))}
                                />
                                <VitalAlert val={vitals.temp} range={VITALS_RANGES.temp} />
                            </VitalCell>

                            <VitalCell label="Peso" unit="kg">
                                <input
                                    className={styles.vitalsInput}
                                    inputMode="decimal"
                                    placeholder="70.0"
                                    aria-label="Peso"
                                    value={vitals.weight}
                                    onChange={(e) => setVitals((v) => ({...v, weight: e.target.value}))}
                                />
                            </VitalCell>

                            <VitalCell label="Altura" unit="cm">
                                <input
                                    className={styles.vitalsInput}
                                    inputMode="numeric"
                                    placeholder="170"
                                    aria-label="Altura"
                                    value={vitals.height}
                                    onChange={(e) => setVitals((v) => ({...v, height: e.target.value}))}
                                />
                            </VitalCell>

                            <VitalCell label="IMC" unit="kg/m²" readonly>
                                {bmi ? (
                                    <div className="flex items-baseline gap-1">
                                        <span className={styles.vitalsImcValue}>{bmi.value}</span>
                                        <span className={imcTag({tone: bmi.tone})}>
                                            {getBmiLabel(parseFloat(bmi.value))}
                                        </span>
                                    </div>
                                ) : (
                                    <span className={styles.vitalsImcEmpty}>— automático</span>
                                )}
                            </VitalCell>
                        </div>
                    </section>

                    {/* ── SOAP ─────────────────────────────────────────────────── */}
                    <section id="sec-soap" className={styles.sectionRoot}>
                        <div className={styles.sectionHead}>
                            <span className={styles.sectionIcon}>
                                <FileText className="size-[14px]" />
                            </span>
                            <div className={styles.sectionHeadRight}>
                                <h2 className={styles.sectionTitle}>Evolução clínica · SOAP</h2>
                                <div className={styles.sectionSub}>
                                    Subjetivo, Objetivo, Avaliação, Plano. Os campos crescem conforme você escreve.
                                </div>
                            </div>
                        </div>

                        <div className={styles.soapStack}>
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
                                    <div className={styles.soapVitalsRef}>
                                        <Activity className="size-[12px]" />
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
                        </div>
                    </section>

                    {/* ── Classificações ─────────────────────────────────────── */}
                    <section id="sec-class" className={styles.sectionRoot}>
                        <div className={styles.sectionHead}>
                            <span className={styles.sectionIcon}>
                                <Tag className="size-[14px]" />
                            </span>
                            <div className={styles.sectionHeadRight}>
                                <h2 className={styles.sectionTitle}>Classificações e tags</h2>
                                <div className={styles.sectionSub}>
                                    Estruturam o registro para filtros e relatórios.
                                </div>
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
                                <div className={styles.conductGrid}>
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
                    <section id="sec-files" className={styles.sectionRoot}>
                        <div className={styles.sectionHead}>
                            <span className={styles.sectionIcon}>
                                <Paperclip className="size-[14px]" />
                            </span>
                            <div className={styles.sectionHeadRight}>
                                <h2 className={styles.sectionTitle}>Anexos</h2>
                                <div className={styles.sectionSub}>
                                    Vincule arquivos relacionados a esse atendimento.
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            className={styles.uploadZone}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <UploadCloud className="size-[22px]" />
                            <div className={styles.uploadTitle}>Clique para enviar ou arraste arquivos aqui</div>
                            <div className={styles.uploadSub}>Imagens e PDFs · até 25 MB cada</div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                style={{display: 'none'}}
                                aria-label="Enviar arquivos relacionados ao atendimento"
                                onChange={handleFileAdd}
                            />
                        </button>

                        {files.length > 0 && (
                            <div className={styles.uploadList}>
                                {files.map((f) => (
                                    <div key={f.id} className={styles.uploadRow}>
                                        <span className={styles.uploadIcon}>
                                            {f.name.endsWith('.pdf') ? (
                                                <FileText className="size-4" />
                                            ) : (
                                                <FileText className="size-4" />
                                            )}
                                        </span>
                                        <div className={styles.uploadBody}>
                                            <div className={styles.uploadName}>{f.name}</div>
                                            <div className={styles.uploadSize}>{f.size}</div>
                                        </div>
                                        <button
                                            type="button"
                                            className={styles.uploadRemove}
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
            <div className={styles.footerRoot}>
                <div className={styles.footerMeta}>
                    <Lock className="size-3" strokeWidth={1.5} />
                    <span>Após publicar, o registro é imutável · LGPD</span>
                </div>
                <div className={styles.footerActions}>
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
                        void navigate({to: '/patients/$patientId', params: {patientId: patient.id}});
                    }}
                />
            )}
        </div>
    );
}
