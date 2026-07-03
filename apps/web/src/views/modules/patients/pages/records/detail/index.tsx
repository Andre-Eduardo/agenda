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
import {
    FilesList,
    Notes,
    PageShell,
    SectionCard,
    SkeletonRoot,
    SoapStack,
    TagsGrid,
    TraceCard,
    badgeConduct,
    badgeOrigin,
    badgeStatus,
    breadcrumbMb3,
    btnIconSize8,
    chevronNav,
    chevronPatCard,
    draftBadge,
    errorText,
    icon11,
    icon13,
    icon4,
    pageErrorState,
    signedBadge,
    skeletonH120Rounded14,
    skeletonH160Rounded12,
    skeletonH200Rounded12,
    skeletonH4W64,
    soapLetter,
    traceEditedChip,
    traceIdVal,
    traceMutedInline,
    traceValMono,
} from './styles';

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

function DetailSkeleton(): ReactNode {
    return (
        <SkeletonRoot>
            <Skeleton className={skeletonH4W64} />
            <Skeleton className={skeletonH120Rounded14} />
            <Skeleton className={skeletonH200Rounded12} />
            <Skeleton className={skeletonH160Rounded12} />
        </SkeletonRoot>
    );
}

// ── SOAP section ───────────────────────────────────────────────────────────────

const SOAP_DEFS: Array<{key: 's' | 'o' | 'a' | 'p'; letter: string; title: string; desc: string}> = [
    {key: 's', letter: 'S', title: 'Subjetivo', desc: 'Queixas, história e contexto relatado pelo paciente'},
    {key: 'o', letter: 'O', title: 'Objetivo', desc: 'Achados de exame, vitais e dados objetivos'},
    {key: 'a', letter: 'A', title: 'Avaliação', desc: 'Diagnósticos, hipóteses e raciocínio clínico'},
    {key: 'p', letter: 'P', title: 'Plano', desc: 'Conduta, prescrições, exames e retorno'},
];

function SoapSection({record}: {record: MedicalRecord}): ReactNode {
    const contents: Record<'s' | 'o' | 'a' | 'p', string | null> = {
        s: asStr(record.subjective),
        o: asStr(record.objective),
        a: asStr(record.assessment),
        p: asStr(record.plan),
    };

    return (
        <SectionCard>
            <div className="head">
                <div className="title">Evolução clínica (SOAP)</div>
                <div className="sub">Registro estruturado do atendimento</div>
            </div>
            <SoapStack>
                {SOAP_DEFS.map((def) => {
                    const content = contents[def.key];

                    return (
                        <div key={def.key} className="soap-item">
                            <div className="head">
                                <span className={soapLetter({v: def.key})}>{def.letter}</span>
                                <div>
                                    <div className="meta-title">{def.title}</div>
                                    <div className="meta-desc">{def.desc}</div>
                                </div>
                            </div>
                            {content ? <p className="body">{content}</p> : <p className="body-empty">Não registrado</p>}
                        </div>
                    );
                })}
            </SoapStack>
        </SectionCard>
    );
}

// ── Tags section ───────────────────────────────────────────────────────────────

function TagsSection({record}: {record: MedicalRecord}): ReactNode {
    const hasStatus = record.clinicalStatus != null;
    const hasTags = record.conductTags.length > 0;

    if (!hasStatus && !hasTags) return null;

    return (
        <SectionCard>
            <div className="head">
                <div className="title">Classificações</div>
            </div>
            <TagsGrid>
                {hasStatus && (
                    <>
                        <div className="tag-label">Status clínico</div>
                        <div>
                            <Badge
                                clinicalStatus={record.clinicalStatus as NonNullable<RecordClinicalStatus>}
                                className={badgeStatus}
                            >
                                <span className="tag-dot" />
                                {clinicalStatusLabel(record.clinicalStatus)}
                            </Badge>
                        </div>
                    </>
                )}
                {hasTags && (
                    <>
                        <div className="tag-label">Condutas</div>
                        <div className="tag-list">
                            {record.conductTags.map((t) => (
                                <Badge key={t} variant="outline" className={badgeConduct}>
                                    {conductLabel(t)}
                                </Badge>
                            ))}
                        </div>
                    </>
                )}
            </TagsGrid>
        </SectionCard>
    );
}

// ── Notes section ──────────────────────────────────────────────────────────────

function NotesSection({record}: {record: MedicalRecord}): ReactNode {
    const freeNotes = asStr(record.freeNotes);

    if (!freeNotes) return null;

    return (
        <SectionCard>
            <div className="head">
                <div className="title">Observações complementares</div>
            </div>
            <Notes>{freeNotes}</Notes>
        </SectionCard>
    );
}

// ── Files section ──────────────────────────────────────────────────────────────

function FilesSection({record}: {record: MedicalRecord}): ReactNode {
    return (
        <SectionCard>
            <div className="head">
                <div className="title">
                    <Paperclip className={icon4} />
                    Anexos
                </div>
                {record.files.length > 0 && (
                    <div className="sub">
                        {record.files.length} {record.files.length === 1 ? 'arquivo' : 'arquivos'}
                    </div>
                )}
            </div>
            {record.files.length === 0 ? (
                <div className="empty">
                    <Paperclip className={icon4} />
                    Nenhum anexo nessa evolução.
                </div>
            ) : (
                <FilesList>
                    {record.files.map((f) => (
                        <div key={f.id} className="row">
                            <span className="icon">
                                <FileText className={icon4} />
                            </span>
                            <div className="body-wrap">
                                <div className="name">{f.fileName}</div>
                                {f.description && <div className="sub">{f.description}</div>}
                            </div>
                            <div className="actions">
                                <Button variant="ghost" size="icon" className={btnIconSize8} asChild>
                                    <a href={f.url} target="_blank" rel="noreferrer" aria-label="Visualizar">
                                        <Eye className={icon14} />
                                    </a>
                                </Button>
                                <Button variant="ghost" size="icon" className={btnIconSize8} asChild>
                                    <a href={f.url} download={f.fileName} aria-label="Baixar">
                                        <Download className={icon14} />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    ))}
                </FilesList>
            )}
        </SectionCard>
    );
}

// ── Traceability section ───────────────────────────────────────────────────────

function TraceabilitySection({record}: {record: MedicalRecord}): ReactNode {
    const isAI = record.source === 'IMPORT';
    const publishedAt = asStr(record.signedAt) ?? record.createdAt;

    return (
        <TraceCard>
            <div className="bar" />
            <div className="head">
                <div className="title">
                    <ShieldCheck className="shield-icon" />
                    Rastreabilidade do registro
                </div>
                <div className="sub">Auditoria, origem e revisão humana</div>
            </div>
            <div className="trace-grid">
                <div className="trace-row">
                    <div className="key">Publicado em</div>
                    <div className={traceValMono}>{formatDateTime(publishedAt)}</div>
                </div>
                <div className="trace-row">
                    <div className="key">Status</div>
                    <div className="val">
                        {record.isLocked ? (
                            <span className={signedBadge}>
                                <span className="status-dot" />
                                Assinado e imutável
                            </span>
                        ) : (
                            <span className={draftBadge}>
                                <span className="status-dot" />
                                Rascunho
                            </span>
                        )}
                    </div>
                </div>
                <div className="trace-row">
                    <div className="key">Origem do conteúdo</div>
                    <div className="val">
                        {isAI ? (
                            <Badge origin="ai" className={badgeOrigin}>
                                <Sparkles className={icon11} />
                                Gerado por IA e aprovado
                            </Badge>
                        ) : (
                            <Badge origin="manual" className={badgeOrigin}>
                                <Pencil className={icon11} />
                                Registro manual
                            </Badge>
                        )}
                    </div>
                </div>
                {isAI && (
                    <div className="trace-row">
                        <div className="key">Revisão humana</div>
                        <div className="val">
                            {record.wasHumanEdited ? (
                                <span className={traceEditedChip}>
                                    <Pencil className={icon11} />
                                    Conteúdo editado pelo profissional
                                </span>
                            ) : (
                                <span className={traceMutedInline}>
                                    Nenhum campo alterado — sugestão da IA aprovada integralmente.
                                </span>
                            )}
                        </div>
                    </div>
                )}
                <div className="trace-row">
                    <div className="key">ID do registro</div>
                    <div className={traceIdVal}>{record.id}</div>
                </div>
            </div>
        </TraceCard>
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
        <PageShell>
            <div className="inner">
                {/* Breadcrumb */}
                <Breadcrumb className={breadcrumbMb3}>
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
                <header className="header">
                    <div className="left">
                        <div className="eyebrow">Evolução clínica</div>
                        <div className="title-row">
                            <span className="title-type">{typeLabel}</span>
                            <span className="title-dot">·</span>
                            <span className="title-date">{formatFullDate(eventDate)}</span>
                        </div>
                        <div className="meta">
                            <span className="meta-item">
                                <Clock className={icon13} />
                                {formatTime(eventDate)}
                            </span>
                            <span className="meta-sep" />
                            {isAI ? (
                                <Badge origin="ai" className={badgeOrigin}>
                                    <Sparkles className={icon11} />
                                    Aprovado a partir de IA
                                </Badge>
                            ) : (
                                <Badge origin="manual" className={badgeOrigin}>
                                    <Pencil className={icon11} />
                                    Registro manual
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="aside">
                        <div
                            className="pat-card"
                            onClick={() => navigate({to: '/patients/$patientId', params: {patientId: patient.id}})}
                        >
                            <AvatarInitials
                                name={patient.name}
                                colorIndex={getAvatarColorIndex(patient.id)}
                                size="sm"
                            />
                            <div className="pat-body">
                                <div className="pat-name">{patient.name}</div>
                                <div className="pat-meta">{age !== null ? `${age} anos` : '—'}</div>
                            </div>
                            <ChevronRight className={chevronPatCard} />
                        </div>
                        <div className="header-actions">
                            <Button variant="outline" size="sm">
                                <Printer className={icon4} />
                                Imprimir
                            </Button>
                            <Button variant="outline" size="sm">
                                <Download className={icon4} />
                                Exportar PDF
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Body */}
                <div className="body">
                    <SoapSection record={record} />
                    <TagsSection record={record} />
                    <NotesSection record={record} />
                    <FilesSection record={record} />
                    <TraceabilitySection record={record} />
                </div>

                {/* Bottom navigation */}
                <nav className="nav">
                    <button type="button" className="nav-btn" disabled={!prev} onClick={() => prev && goToRecord(prev)}>
                        <ChevronLeft className={chevronNav} />
                        <span className="nav-stack">
                            <span className="nav-label">Evolução anterior</span>
                            {prev && (
                                <span className="nav-sub">
                                    {formatShortDate(prev.eventDate ?? prev.createdAt)} ·{' '}
                                    {attendanceLabel(prev.attendanceType)}
                                </span>
                            )}
                        </span>
                    </button>

                    <button
                        type="button"
                        className="nav-center"
                        onClick={() => navigate({to: '/patients/$patientId', params: {patientId: patient.id}})}
                    >
                        Ver todas as evoluções
                    </button>

                    <button
                        type="button"
                        className="nav-btn nav-btn-end"
                        disabled={!next}
                        onClick={() => next && goToRecord(next)}
                    >
                        <span className="nav-stack">
                            <span className="nav-label">Evolução seguinte</span>
                            {next && (
                                <span className="nav-sub">
                                    {formatShortDate(next.eventDate ?? next.createdAt)} ·{' '}
                                    {attendanceLabel(next.attendanceType)}
                                </span>
                            )}
                        </span>
                        <ChevronRight className={chevronNav} />
                    </button>
                </nav>
            </div>
        </PageShell>
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
            <div className={pageErrorState}>
                <p className={errorText}>Evolução não encontrada ou erro ao carregar.</p>
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
