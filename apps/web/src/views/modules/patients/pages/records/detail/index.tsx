import type {ReactNode} from 'react';
import {useGetRecord, useGetPatient, useSearchRecords} from '@agenda-app/client';
import type {
    Record as MedicalRecord,
    Patient,
    RecordClinicalStatus,
    RecordConductTagsItem,
    SearchRecordsSortEventDate,
    SearchRecordsAttendanceType,
    SearchRecordsClinicalStatus,
    SearchRecordsSource,
} from '@agenda-app/client';
import type {UseQueryResult} from '@tanstack/react-query';
import {createFileRoute, useNavigate, Link} from '@tanstack/react-router';
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
} from 'lucide-react';
import {AvatarInitials} from '@/components/ui/componentes/avatar';
import {Badge} from '@/components/ui/componentes/badge';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/componentes/breadcrumb';
import {Button} from '@/components/ui/componentes/button';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {cva} from 'class-variance-authority';
import {clsx} from 'clsx';
import {cn} from '@/lib/utils';
import styles from './styles.module.css';

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

export const Route = createFileRoute('/_stackedLayout/patients/$patientId/records/$recordId')({
    component: RecordDetailPage,
});

// ── Types ──────────────────────────────────────────────────────────────────────

interface PaginatedPage<T> {
    totalCount: number;
    data: T[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function asStr(v: unknown): string | null {
    return typeof v === 'string' && v ? v : null;
}

const PT_WEEKDAYS = [
    'domingo',
    'segunda-feira',
    'terça-feira',
    'quarta-feira',
    'quinta-feira',
    'sexta-feira',
    'sábado',
];
const PT_MONTHS = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
];
const PT_MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatFullDate(v: unknown): string {
    const s = asStr(v);

    if (!s) return '—';
    const d = new Date(s);

    return `${PT_WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${PT_MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

function formatShortDate(v: unknown): string {
    const s = asStr(v);

    if (!s) return '—';
    const d = new Date(s);

    return `${d.getDate()} ${PT_MONTHS_SHORT[d.getMonth()]}`;
}

function formatDateTime(v: unknown): string {
    const s = asStr(v);

    if (!s) return '—';
    const d = new Date(s);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');

    return `${d.getDate()} ${PT_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

function formatTime(v: unknown): string {
    const s = asStr(v);

    if (!s) return '—';

    return new Date(s).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
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

    // eslint-disable-next-line no-bitwise -- standard string-hash uint32 pattern
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;

    return h;
}

function attendanceLabel(type: string | null | undefined): string {
    const map: Record<string, string> = {
        FIRST_VISIT: 'Primeira consulta',
        FOLLOW_UP: 'Retorno',
        EVALUATION: 'Avaliação',
        PROCEDURE: 'Procedimento',
        TELEMEDICINE: 'Telemedicina',
        INTERCURRENCE: 'Intercorrência',
    };

    return type ? (map[type] ?? type) : 'Consulta';
}

function clinicalStatusLabel(status: RecordClinicalStatus): string {
    const map: Record<string, string> = {
        STABLE: 'Estável',
        IMPROVING: 'Melhorando',
        WORSENING: 'Piorando',
        UNCHANGED: 'Sem mudança',
        UNDER_OBSERVATION: 'Em observação',
    };

    return status ? (map[status] ?? status) : '—';
}

function conductLabel(tag: RecordConductTagsItem): string {
    const map: Record<string, string> = {
        PRESCRIPTION: 'Prescrição',
        EXAM_REQUESTED: 'Solicitação de exame',
        REFERRAL: 'Encaminhamento',
        GUIDANCE: 'Orientação',
        THERAPY_ADJUSTMENT: 'Ajuste de terapia',
        FOLLOW_UP_SCHEDULED: 'Retorno agendado',
    };

    return map[tag] ?? tag;
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function DetailSkeleton() {
    return (
        <div className={styles.skeletonRoot}>
            <Skeleton className="h-4 w-64" />
            <Skeleton className={styles.skeletonHeaderCard} />
            <Skeleton className={styles.skeletonBodyCard} />
            <Skeleton className={styles.skeletonSectionCard} />
        </div>
    );
}

// ── SOAP section ───────────────────────────────────────────────────────────────

const SOAP_DEFS: Array<{key: 's' | 'o' | 'a' | 'p'; letter: string; title: string; desc: string}> = [
    {key: 's', letter: 'S', title: 'Subjetivo', desc: 'Queixas, história e contexto relatado pelo paciente'},
    {key: 'o', letter: 'O', title: 'Objetivo', desc: 'Achados de exame, vitais e dados objetivos'},
    {key: 'a', letter: 'A', title: 'Avaliação', desc: 'Diagnósticos, hipóteses e raciocínio clínico'},
    {key: 'p', letter: 'P', title: 'Plano', desc: 'Conduta, prescrições, exames e retorno'},
];

function SoapSection({record}: {record: MedicalRecord}) {
    const contents: Record<'s' | 'o' | 'a' | 'p', string | null> = {
        s: asStr(record.subjective),
        o: asStr(record.objective),
        a: asStr(record.assessment),
        p: asStr(record.plan),
    };

    return (
        <section className={styles.sectionRoot}>
            <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}>Evolução clínica (SOAP)</div>
                <div className={styles.sectionSub}>Registro estruturado do atendimento</div>
            </div>
            <div className={styles.soapStack}>
                {SOAP_DEFS.map((def) => {
                    const content = contents[def.key];

                    return (
                        <div key={def.key}>
                            <div className={styles.soapHead}>
                                <span className={soapLetter({v: def.key})}>{def.letter}</span>
                                <div>
                                    <div className={styles.soapMetaTitle}>{def.title}</div>
                                    <div className={styles.soapMetaDesc}>{def.desc}</div>
                                </div>
                            </div>
                            {content ? (
                                <p className={styles.soapBody}>{content}</p>
                            ) : (
                                <p className={styles.soapBodyEmpty}>Não registrado</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

// ── Tags section ───────────────────────────────────────────────────────────────

function TagsSection({record}: {record: MedicalRecord}): ReactNode {
    const hasStatus = record.clinicalStatus != null;
    const hasTags = record.conductTags.length > 0;

    if (!hasStatus && !hasTags) return null;

    return (
        <section className={styles.sectionRoot}>
            <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}>Classificações</div>
            </div>
            <div className={styles.tagsGrid}>
                {hasStatus && (
                    <>
                        <div className={styles.tagsLabel}>Status clínico</div>
                        <div>
                            <Badge
                                clinicalStatus={record.clinicalStatus as NonNullable<RecordClinicalStatus>}
                                className={styles.badgeStatus}
                            >
                                <span className={styles.tagsDot} />
                                {clinicalStatusLabel(record.clinicalStatus)}
                            </Badge>
                        </div>
                    </>
                )}
                {hasTags && (
                    <>
                        <div className={styles.tagsLabel}>Condutas</div>
                        <div className={styles.tagsList}>
                            {record.conductTags.map((t) => (
                                <Badge key={t} variant="outline" className={styles.badgeConduct}>
                                    {conductLabel(t)}
                                </Badge>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

// ── Notes section ──────────────────────────────────────────────────────────────

function NotesSection({record}: {record: MedicalRecord}): ReactNode {
    const freeNotes = asStr(record.freeNotes);

    if (!freeNotes) return null;

    return (
        <section className={styles.sectionRoot}>
            <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}>Observações complementares</div>
            </div>
            <p className={styles.notes}>{freeNotes}</p>
        </section>
    );
}

// ── Files section ──────────────────────────────────────────────────────────────

function FilesSection({record}: {record: MedicalRecord}) {
    return (
        <section className={styles.sectionRoot}>
            <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}>
                    <Paperclip className="size-4" />
                    Anexos
                </div>
                {record.files.length > 0 && (
                    <div className={styles.sectionSub}>
                        {record.files.length} {record.files.length === 1 ? 'arquivo' : 'arquivos'}
                    </div>
                )}
            </div>
            {record.files.length === 0 ? (
                <div className={styles.empty}>
                    <Paperclip className="size-4" />
                    Nenhum anexo nessa evolução.
                </div>
            ) : (
                <div className={styles.filesList}>
                    {record.files.map((f) => (
                        <div key={f.id} className={styles.filesRow}>
                            <span className={styles.filesIcon}>
                                <FileText className="size-4" />
                            </span>
                            <div className="min-w-0">
                                <div className={styles.filesName}>{f.fileName}</div>
                                {f.description && <div className={styles.filesSub}>{f.description}</div>}
                            </div>
                            <div className={styles.filesActions}>
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

function TraceabilitySection({record}: {record: MedicalRecord}) {
    const isAI = record.source === 'IMPORT';
    const publishedAt = asStr(record.signedAt) ?? record.createdAt;

    return (
        <section className={styles.sectionTraceRoot}>
            <div className={styles.sectionTraceBar} />
            <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}>
                    <ShieldCheck className={styles.traceShieldIcon} />
                    Rastreabilidade do registro
                </div>
                <div className={styles.sectionSub}>Auditoria, origem e revisão humana</div>
            </div>
            <div className={styles.traceGrid}>
                <div className={styles.traceRow}>
                    <div className={styles.traceKey}>Publicado em</div>
                    <div className={clsx(styles.traceVal, styles.traceValMono)}>{formatDateTime(publishedAt)}</div>
                </div>
                <div className={styles.traceRow}>
                    <div className={styles.traceKey}>Status</div>
                    <div className={styles.traceVal}>
                        {record.isLocked ? (
                            <span className={styles.signedBadge}>
                                <span className={styles.statusDot} />
                                Assinado e imutável
                            </span>
                        ) : (
                            <span className={styles.draftBadge}>
                                <span className={styles.statusDot} />
                                Rascunho
                            </span>
                        )}
                    </div>
                </div>
                <div className={styles.traceRow}>
                    <div className={styles.traceKey}>Origem do conteúdo</div>
                    <div className={styles.traceVal}>
                        {isAI ? (
                            <Badge origin="ai" className={styles.badgeOrigin}>
                                <Sparkles className="size-[11px]" />
                                Gerado por IA e aprovado
                            </Badge>
                        ) : (
                            <Badge origin="manual" className={styles.badgeOrigin}>
                                <Pencil className="size-[11px]" />
                                Registro manual
                            </Badge>
                        )}
                    </div>
                </div>
                {isAI && (
                    <div className={styles.traceRow}>
                        <div className={styles.traceKey}>Revisão humana</div>
                        <div className={styles.traceVal}>
                            {record.wasHumanEdited ? (
                                <span className={styles.traceEditedChip}>
                                    <Pencil className="size-[11px]" />
                                    Conteúdo editado pelo profissional
                                </span>
                            ) : (
                                <span className={styles.traceMuted}>
                                    Nenhum campo alterado — sugestão da IA aprovada integralmente.
                                </span>
                            )}
                        </div>
                    </div>
                )}
                <div className={styles.traceRow}>
                    <div className={styles.traceKey}>ID do registro</div>
                    <div
                        className={cn(
                            styles.traceVal,
                            styles.traceValMono,
                            'text-[12px] font-normal text-(--color-text-tertiary)'
                        )}
                    >
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

    const isAI = record.source === 'IMPORT';
    const age = getAge(patient.birthDate);
    const eventDate = asStr(record.eventDate) ?? record.createdAt;
    const typeLabel = attendanceLabel(record.attendanceType);

    function goToRecord(r: MedicalRecord) {
        void navigate({
            to: '/patients/$patientId/records/$recordId',
            params: {patientId: patient.id, recordId: r.id},
        });
    }

    return (
        <div className={styles.pageRoot}>
            <div className={styles.pageInner}>
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
                                <Link to="/patients/$patientId" params={{patientId: patient.id}}>
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
                <header className={styles.headerRoot}>
                    <div>
                        <div className={styles.headerEyebrow}>Evolução clínica</div>
                        <div className={styles.headerTitleRow}>
                            <span className={styles.headerTitleType}>{typeLabel}</span>
                            <span className={styles.headerTitleDot}>·</span>
                            <span className={styles.headerTitleDate}>{formatFullDate(eventDate)}</span>
                        </div>
                        <div className={styles.headerMeta}>
                            <span className={styles.headerMetaItem}>
                                <Clock className="size-[13px]" />
                                {formatTime(eventDate)}
                            </span>
                            <span className={styles.headerMetaSep} />
                            {isAI ? (
                                <Badge origin="ai" className={styles.badgeOrigin}>
                                    <Sparkles className="size-[11px]" />
                                    Aprovado a partir de IA
                                </Badge>
                            ) : (
                                <Badge origin="manual" className={styles.badgeOrigin}>
                                    <Pencil className="size-[11px]" />
                                    Registro manual
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className={styles.headerAside}>
                        <div
                            className={styles.headerPatCard}
                            onClick={() => navigate({to: '/patients/$patientId', params: {patientId: patient.id}})}
                        >
                            <AvatarInitials
                                name={patient.name}
                                colorIndex={getAvatarColorIndex(patient.id)}
                                size="sm"
                            />
                            <div className={styles.headerPatBody}>
                                <div className={styles.headerPatName}>{patient.name}</div>
                                <div className={styles.headerPatMeta}>{age !== null ? `${age} anos` : '—'}</div>
                            </div>
                            <ChevronRight className={styles.chevronIcon} />
                        </div>
                        <div className={styles.headerActions}>
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
                <div className={styles.body}>
                    <SoapSection record={record} />
                    <TagsSection record={record} />
                    <NotesSection record={record} />
                    <FilesSection record={record} />
                    <TraceabilitySection record={record} />
                </div>

                {/* Bottom navigation */}
                <nav className={styles.navRoot}>
                    <button
                        type="button"
                        className={styles.navBtn}
                        disabled={!prev}
                        onClick={() => prev && goToRecord(prev)}
                    >
                        <ChevronLeft className={styles.navChevron} />
                        <span className={styles.navStack}>
                            <span className={styles.navLabel}>Evolução anterior</span>
                            {prev && (
                                <span className={styles.navSub}>
                                    {formatShortDate(prev.eventDate ?? prev.createdAt)} ·{' '}
                                    {attendanceLabel(prev.attendanceType)}
                                </span>
                            )}
                        </span>
                    </button>

                    <button
                        type="button"
                        className={styles.navCenter}
                        onClick={() => navigate({to: '/patients/$patientId', params: {patientId: patient.id}})}
                    >
                        Ver todas as evoluções
                    </button>

                    <button
                        type="button"
                        className={clsx(styles.navBtn, styles.navBtnEnd)}
                        disabled={!next}
                        onClick={() => next && goToRecord(next)}
                    >
                        <span className={styles.navStack}>
                            <span className={styles.navLabel}>Evolução seguinte</span>
                            {next && (
                                <span className={styles.navSub}>
                                    {formatShortDate(next.eventDate ?? next.createdAt)} ·{' '}
                                    {attendanceLabel(next.attendanceType)}
                                </span>
                            )}
                        </span>
                        <ChevronRight className={styles.navChevron} />
                    </button>
                </nav>
            </div>
        </div>
    );
}

// ── Entry ──────────────────────────────────────────────────────────────────────

export function RecordDetailPage() {
    const {patientId, recordId} = Route.useParams();
    const navigate = useNavigate();

    const {data: record, isLoading: loadingRecord, isError: errorRecord} = useGetRecord(recordId);
    const {data: patient, isLoading: loadingPatient, isError: errorPatient} = useGetPatient(patientId);

    const siblingsQuery = useSearchRecords({
        patientId,
        term: '',
        cursor: null,
        limit: 100,
        sort: {eventDate: 'desc' as SearchRecordsSortEventDate},
        attendanceType: '' as SearchRecordsAttendanceType,
        clinicalStatus: '' as SearchRecordsClinicalStatus,
        dateStart: '',
        dateEnd: '',
        source: '' as SearchRecordsSource,
    }) as unknown as UseQueryResult<PaginatedPage<MedicalRecord>>;

    if (loadingRecord || loadingPatient) return <DetailSkeleton />;

    if (errorRecord || errorPatient || !record || !patient) {
        return (
            <div className={styles.pageErrorState}>
                <p className="text-sm">Evolução não encontrada ou erro ao carregar.</p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate({to: '/patients/$patientId', params: {patientId}})}
                >
                    Voltar para o paciente
                </Button>
            </div>
        );
    }

    return <RecordDetailView record={record} patient={patient} siblings={siblingsQuery.data?.data ?? []} />;
}
