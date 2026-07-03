import type {ReactNode} from 'react';
import {
    useGetPatient,
    useGetClinicalProfile,
    useSearchPatientAlerts,
    useSearchRecords,
    useSearchPatientForms,
} from '@agenda-app/client';
import type {
    Patient,
    PatientGender,
    PatientAlert,
    Record as MedicalRecord,
    RecordAttendanceType,
    PatientForm,
    PatientFormStatus,
    SearchRecordsParams,
    SearchRecordsSortEventDate,
} from '@agenda-app/client';
import type {UseQueryResult} from '@tanstack/react-query';
import {createFileRoute, useNavigate, Link} from '@tanstack/react-router';
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
} from 'lucide-react';
import {AvatarInitials, avatarColorVariants} from '@/components/ui/componentes/avatar';
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
import {
    SectionCard as UISectionCard,
    SectionCardHeader,
    SectionCardTitle,
    SectionCardBody,
} from '@/components/ui/componentes/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/componentes/dropdown-menu';
import {EmptyState} from '@/components/ui/componentes/empty-state';
import {KV as UIKv, KVGrid} from '@/components/ui/componentes/kv';
import {EntityHeader} from '@/components/ui/componentes/page-header';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {StatTile} from '@/components/ui/componentes/stat-tile';
import {css, cx} from '@/styled-system/css';
import {
    emptySectionPy,
    errorText,
    flexCol,
    icon10,
    icon11,
    icon18,
    icon3,
    icon4,
    metaDot,
    minW0,
    skeletonH10Full,
    skeletonH16Full,
    skeletonH4W48,
    skeletonH4W72,
    skeletonH6W48,
    skeletonH9W32,
    skeletonH9W9,
    textRight,
} from './styles';

export const Route = createFileRoute('/_stackedLayout/patients/$patientId')({
    component: PatientDetailPage,
});

// ── Paginated wrapper ────────────────────────────────────────────────────────

interface PaginatedPage<T> {
    totalCount: number;
    data: T[];
}

// ── Styles ────────────────────────────────────────────────────────────────────

const pageRoot = css({display: 'flex', flexDirection: 'column', gap: '[18px]', p: '6', bg: 'bg.page'});

const pageErrorState = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4',
    p: '12',
    color: 'text.secondary',
});

const actionGrid = css({display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '[10px]'});

const actionTileRoot = css({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: '3',
    rounded: '[12px]',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    px: '4',
    py: '[14px]',
    textAlign: 'left',
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
    _hover: {borderColor: 'border.hover', bg: 'bg.surface'},
});

const actionTileIconBase = css({
    display: 'inline-flex',
    w: '[38px]',
    h: '[38px]',
    flexShrink: '0',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: '[10px]',
});

const actionTileIconAI = css({bg: 'ai.bg', color: 'ai.text'});
const actionTileIconDefault = css({bg: 'primary.surface', color: 'primary.text'});
const actionTileBody = css({minW: '0', flex: '1'});
const actionTileLabel = css({fontSize: 'sm-body', fontWeight: 'medium', lineHeight: '[1.3]', color: 'text.primary'});
const actionTileSub = css({mt: '[3px]', fontSize: 'xs', lineHeight: '[1.4]', color: 'text.secondary'});
const actionTileChevron = css({w: '[14px]', h: '[14px]', flexShrink: '0', color: 'text.tertiary'});

const statsGrid = css({display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '3'});

const twoCol = css({
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '[14px]',
    '@media (max-width: 1100px)': {gridTemplateColumns: 'repeat(1, minmax(0, 1fr))'},
});

const infoGroupRoot = css({
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    py: '[14px]',
    _first: {pt: '0'},
    _last: {borderBottomWidth: '0', pb: '0'},
});

const infoGroupTitle = css({
    mb: '3',
    fontSize: 'xs',
    fontWeight: 'medium',
    textTransform: 'uppercase',
    letterSpacing: '[0.06em]',
    color: 'text.tertiary',
});

const emergencyBox = css({mt: '3', rounded: '[8px]', bg: 'bg.surface', px: '3', py: '[10px]'});

const emergencyLabel = css({
    mb: '2',
    fontSize: '[11px]',
    fontWeight: 'medium',
    textTransform: 'uppercase',
    letterSpacing: '[0.06em]',
    color: 'text.tertiary',
});

const allergyBox = css({
    display: 'flex',
    gap: '[10px]',
    rounded: '[8px]',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'danger/30',
    bg: 'danger.surface',
    p: '3',
});

const allergyIcon = css({mt: '[1px]', w: '[14px]', h: '[14px]', flexShrink: '0', color: 'danger'});
const allergyText = css({fontSize: 'sm', lineHeight: '[1.4]', color: 'danger'});

const profileText = css({fontSize: 'sm', lineHeight: '[1.5]', color: 'text.primary'});
const profileTextSecondary = css({fontSize: 'sm', lineHeight: '[1.5]', color: 'text.secondary'});
const profileTextEmpty = css({fontSize: 'sm', fontStyle: 'italic', color: 'text.tertiary'});

const recordRow = css({
    display: 'grid',
    cursor: 'pointer',
    gridTemplateColumns: '80px 12px 1fr auto',
    alignItems: 'flex-start',
    gap: '[14px]',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    py: '[14px]',
    _first: {pt: '0'},
    _last: {borderBottomWidth: '0', pb: '0'},
});

const recordDateText = css({fontSize: 'sm', fontWeight: 'medium', lineHeight: '[1.2]', color: 'text.primary'});
const recordTime = css({mt: '[2px]', fontFamily: 'mono', fontSize: 'xs', fontVariantNumeric: 'tabular-nums', color: 'text.tertiary'});

const recordDotBase = css({mt: '[5px]', w: '[10px]', h: '[10px]', rounded: 'full', bg: 'primary'});

const recordTags = css({mb: '[6px]', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '[6px]'});

const recordTypeTag = css({
    display: 'inline-flex',
    alignItems: 'center',
    rounded: 'badge',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.surface',
    px: '2',
    py: '[1px]',
    fontSize: 'xs',
    color: 'text.secondary',
});

const recordAiTag = css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1',
    rounded: 'badge',
    bg: 'ai.bg',
    px: '2',
    py: '[1px]',
    fontSize: 'xs',
    color: 'ai.text',
});

const recordSummary = css({
    lineClamp: '2',
    fontSize: 'sm',
    lineHeight: '[1.5]',
    color: 'text.secondary',
    transitionProperty: 'color',
    transitionDuration: '[120ms]',
    '[data-record-row]:hover &': {color: 'text.primary'},
});

const recordChevron = css({mt: '[3px]', w: '[14px]', h: '[14px]', flexShrink: '0', color: 'text.tertiary'});

const formItemRootBase = css({
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    rounded: '[10px]',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    px: '[14px]',
    py: '3',
});
const formItemRootDone = css({bg: 'bg.surface'});
const formItemIconBase = css({w: '4', h: '4', flexShrink: '0'});
const formItemIconDone = css({color: 'success'});
const formItemIconNotDone = css({color: 'text.tertiary'});
const formBadgeBase = css({
    display: 'inline-flex',
    alignItems: 'center',
    rounded: 'badge',
    borderWidth: '1px',
    borderStyle: 'solid',
    px: '2',
    py: '[2px]',
    fontSize: 'xs',
    fontWeight: 'medium',
});
const formBadgeDone = css({borderColor: 'success/30', bg: 'success.surface', color: 'success'});
const formBadgeNotDone = css({borderColor: 'border', bg: 'bg.surface', color: 'text.secondary'});
const formItemBody = css({minW: '0', flex: '1'});
const formItemTitle = css({fontSize: 'sm', fontWeight: 'medium', color: 'text.primary'});
const formItemMeta = css({mt: '[2px]', fontSize: 'xs', color: 'text.tertiary'});

const skeletonRoot = css({display: 'flex', flexDirection: 'column', gap: '[18px]', p: '6'});

const skeletonHeaderShell = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '[18px]',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    px: '5',
    py: '[18px]',
});

const skeletonHeaderLeft = css({display: 'flex', alignItems: 'center', gap: '[18px]'});
const skeletonHeaderRight = css({display: 'flex', gap: '2'});
const skeletonActionGrid = css({display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '[10px]'});
const skeletonHeaderAvatar = css({w: '12', h: '12', rounded: 'full'});
const skeletonNameStack = css({display: 'flex', flexDirection: 'column', gap: '2'});
const skeletonActionCard = css({h: '[82px]', rounded: '[12px]'});
const skeletonRecordCard = css({h: '[160px]', rounded: 'card'});
const skeletonListStack = css({display: 'flex', flexDirection: 'column', gap: '3'});
const skeletonFormItem = css({h: '14', w: 'full', rounded: '[10px]'});

const alertBadge = css({rounded: 'badge', px: '2', py: '[3px]', fontSize: 'xs', gap: '[5px]'});
const dangerItem = css({color: 'danger', _hover: {bg: 'danger.surface'}, _focus: {bg: 'danger.surface'}});
const monoTertiary = css({fontFamily: 'mono', fontVariantNumeric: 'tabular-nums', color: 'text.tertiary'});
const monoDate = css({fontFamily: 'mono', fontVariantNumeric: 'tabular-nums'});
const secLinkBtn = css({h: 'auto', p: '0', fontSize: 'xs'});

// ── Helpers ──────────────────────────────────────────────────────────────────

function asStr(v: unknown): string | null {
    return typeof v === 'string' && v ? v : null;
}

function asDisplayStr(v: unknown): string | null {
    if (!v) return null;

    if (typeof v === 'string') return v || null;

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

    if (!s) return '—';

    return new Date(s).toLocaleDateString('pt-BR', opts ?? {day: '2-digit', month: '2-digit', year: 'numeric'});
}

function formatRelativeDate(v: unknown): string {
    const s = asStr(v);

    if (!s) return '—';
    const d = new Date(s);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);

    if (diffDays === 0) return 'hoje';

    if (diffDays === 1) return 'ontem';

    if (diffDays < 30) return `${diffDays} dias atrás`;

    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;

    return `${Math.floor(diffDays / 365)} anos atrás`;
}

function formatDateShort(v: unknown): string {
    const s = asStr(v);

    if (!s) return '—';

    return new Date(s).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'});
}

function formatTime(v: unknown): string {
    const s = asStr(v);

    if (!s) return '—';

    return new Date(s).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
}

function genderLabel(gender: PatientGender): string {
    if (gender === 'FEMALE') return 'Feminino';

    if (gender === 'MALE') return 'Masculino';

    if (gender === 'OTHER') return 'Outro';

    return '—';
}

function attendanceTypeLabel(type: RecordAttendanceType): string {
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

function formStatusLabel(status: PatientFormStatus): string {
    const map: Record<string, string> = {
        DRAFT: 'Rascunho',
        IN_PROGRESS: 'Em andamento',
        COMPLETED: 'Concluído',
        CANCELLED: 'Cancelado',
    };

    return map[status] ?? status;
}

function getAvatarColorIndex(id: string): number {
    let h = 0;

    // eslint-disable-next-line no-bitwise -- standard string-hash uint32 pattern
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;

    return h % avatarColorVariants.length;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PatientAvatar({name, id}: {name: string; id: string}) {
    return <AvatarInitials name={name} colorIndex={getAvatarColorIndex(id)} size="lg" />;
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
        <UISectionCard>
            <SectionCardHeader action={action}>
                <SectionCardTitle>{title}</SectionCardTitle>
            </SectionCardHeader>
            <SectionCardBody appearance={noPad ? 'flush' : 'default'}>{children}</SectionCardBody>
        </UISectionCard>
    );
}

function SecLink({children, onClick}: {children: ReactNode; onClick?: () => void}) {
    return (
        <Button variant="link" size="sm" onClick={onClick} className={secLinkBtn}>
            {children}
        </Button>
    );
}

function KV({label, value, mono = false}: {label: string; value?: string | null; mono?: boolean}) {
    return <UIKv label={label} value={value ?? undefined} mono={mono} emptyText="Não informado" />;
}

function InfoGroup({title, children}: {title: string; children: ReactNode}) {
    return (
        <div className={infoGroupRoot}>
            <h4 className={infoGroupTitle}>{title}</h4>
            {children}
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
        <button type="button" onClick={onClick} className={actionTileRoot}>
            <span className={cx(actionTileIconBase, ai ? actionTileIconAI : actionTileIconDefault)}>{icon}</span>
            <div className={actionTileBody}>
                <div className={actionTileLabel}>{label}</div>
                <div className={actionTileSub}>{sub}</div>
            </div>
            <ChevronRight className={actionTileChevron} />
        </button>
    );
}

function AlertBadge({alert}: {alert: PatientAlert}) {
    return (
        <Badge severity={alert.severity as 'HIGH' | 'MEDIUM' | 'LOW'} className={alertBadge}>
            <TriangleAlert className={icon10} />
            {alert.title}
        </Badge>
    );
}

function MoreMenu() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Mais opções">
                    <MoreHorizontal className={icon4} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>
                    <Download />
                    Exportar dados
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Printer />
                    Imprimir resumo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className={dangerItem}>
                    <Archive />
                    Arquivar paciente
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function EmptySection({label}: {label: string}) {
    return <EmptyState title={label} className={emptySectionPy} />;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
    return (
        <div className={skeletonRoot}>
            <Skeleton className={skeletonH4W48} />
            <div className={skeletonHeaderShell}>
                <div className={skeletonHeaderLeft}>
                    <Skeleton className={skeletonHeaderAvatar} />
                    <div className={skeletonNameStack}>
                        <Skeleton className={skeletonH6W48} />
                        <Skeleton className={skeletonH4W72} />
                    </div>
                </div>
                <div className={skeletonHeaderRight}>
                    <Skeleton className={skeletonH9W32} />
                    <Skeleton className={skeletonH9W9} />
                </div>
            </div>
            <div className={skeletonActionGrid}>
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className={skeletonActionCard} />
                ))}
            </div>
            <Skeleton className={skeletonRecordCard} />
        </div>
    );
}

// ── Section content helpers ───────────────────────────────────────────────────

function RecordsContent({
    isLoading,
    records,
    patientId,
}: {
    isLoading: boolean;
    records: MedicalRecord[];
    patientId: string;
}) {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className={skeletonListStack}>
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className={skeletonH16Full} />
                ))}
            </div>
        );
    }

    if (records.length === 0) return <EmptySection label="Nenhuma evolução registrada" />;

    return (
        <div className={flexCol}>
            {records.map((r) => {
                const eventDate = asStr(r.eventDate) ?? r.createdAt;
                const description = asDisplayStr(r.description);
                const title = asDisplayStr(r.title);
                const isAI = r.source === 'IMPORT';

                return (
                    <div
                        key={r.id}
                        data-record-row
                        className={recordRow}
                        onClick={() =>
                            navigate({
                                to: '/patients/$patientId/records/$recordId',
                                params: {patientId, recordId: r.id},
                            })
                        }
                    >
                        <div className={textRight}>
                            <div className={recordDateText}>{formatDateShort(eventDate)}</div>
                            <div className={recordTime}>{formatTime(eventDate)}</div>
                        </div>
                        <div
                            className={recordDotBase}
                            style={{boxShadow: '0 0 0 3px var(--color-primary-surface)'}}
                        />
                        <div className={minW0}>
                            <div className={recordTags}>
                                <span className={recordTypeTag}>
                                    {r.attendanceType ? attendanceTypeLabel(r.attendanceType) : 'Consulta'}
                                </span>
                                {isAI && (
                                    <span className={recordAiTag}>
                                        <Sparkles className={icon11} />
                                        Origem IA
                                    </span>
                                )}
                            </div>
                            <p className={recordSummary}>{title ?? description ?? 'Sem descrição'}</p>
                        </div>
                        <ChevronRight className={recordChevron} />
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
            <div className={skeletonListStack}>
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className={skeletonH10Full} />
                ))}
            </div>
        );
    }

    if (!hasData) return <EmptySection label="Perfil clínico ainda não preenchido" />;

    return (
        <>
            {allergiesText && (
                <InfoGroup title="Alergias conhecidas">
                    <div className={allergyBox}>
                        <TriangleAlert className={allergyIcon} />
                        <p className={allergyText}>{allergiesText}</p>
                    </div>
                </InfoGroup>
            )}
            {conditionsText && (
                <InfoGroup title="Condições crônicas">
                    <p className={profileText}>{conditionsText}</p>
                </InfoGroup>
            )}
            {medicationsText && (
                <InfoGroup title="Medicações em uso">
                    <p className={profileText}>{medicationsText}</p>
                </InfoGroup>
            )}
            {surgicalHistoryText && (
                <InfoGroup title="Histórico cirúrgico">
                    <p className={profileText}>{surgicalHistoryText}</p>
                </InfoGroup>
            )}
            {familyHistoryText && (
                <InfoGroup title="Histórico familiar">
                    <p className={profileText}>{familyHistoryText}</p>
                </InfoGroup>
            )}
            {socialHistoryText && (
                <InfoGroup title="Histórico social">
                    <p className={profileText}>{socialHistoryText}</p>
                </InfoGroup>
            )}
            {generalNotesText && (
                <InfoGroup title="Observações gerais">
                    <p className={profileTextSecondary}>{generalNotesText}</p>
                </InfoGroup>
            )}
        </>
    );
}

function FormsContent({isLoading, forms}: {isLoading: boolean; forms: PatientForm[]}) {
    if (isLoading) {
        return (
            <div className={skeletonNameStack}>
                {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className={skeletonFormItem} />
                ))}
            </div>
        );
    }

    if (forms.length === 0) return <EmptySection label="Nenhum formulário disponível" />;

    return (
        <div className={cx(flexCol, css({gap: '2'}))}>
            {forms.map((f) => {
                const isDone = f.status === 'COMPLETED';
                const dateField = isDone ? f.completedAt : f.appliedAt;
                const dateLabel = isDone ? 'Concluído em' : 'Iniciado em';

                return (
                    <div key={f.id} className={cx(formItemRootBase, isDone && formItemRootDone)}>
                        <ClipboardList className={cx(formItemIconBase, isDone ? formItemIconDone : formItemIconNotDone)} />
                        <div className={formItemBody}>
                            <div className={formItemTitle}>Formulário clínico</div>
                            <div className={formItemMeta}>
                                {dateLabel} <span className={monoDate}>{formatDate(dateField)}</span>
                                {' · '}
                                {formStatusLabel(f.status)}
                            </div>
                        </div>
                        <span className={cx(formBadgeBase, isDone ? formBadgeDone : formBadgeNotDone)}>
                            {formStatusLabel(f.status)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function PatientDetailPage() {
    const {patientId} = Route.useParams();
    const navigate = useNavigate();

    const {data: patient, isLoading, isError} = useGetPatient(patientId);

    if (isLoading) return <DetailSkeleton />;

    if (isError || !patient) {
        return (
            <div className={pageErrorState}>
                <p className={errorText}>Paciente não encontrado ou erro ao carregar.</p>
                <Button variant="outline" size="sm" onClick={() => navigate({to: '/patients'})}>
                    Voltar para pacientes
                </Button>
            </div>
        );
    }

    return <PatientProfile patient={patient} />;
}

function PatientProfile({patient}: {patient: Patient}) {
    const navigate = useNavigate();
    const age = getAge(patient.birthDate);
    const dob = formatDate(patient.birthDate);
    const gender = genderLabel(patient.gender);

    const clinicalProfile = useGetClinicalProfile(patient.id);

    const alertsQuery = useSearchPatientAlerts(patient.id, {
        cursor: null,
        limit: 10,
        isActive: 'true',
        sort: {severity: 'desc' as const},
    }) as unknown as UseQueryResult<PaginatedPage<PatientAlert>>;

    // The generated SearchRecordsParams type marks attendanceType/clinicalStatus/source/
    // dateStart/dateEnd as required strings, but the server schema treats them as optional
    // filters — sending '' for "no filter" fails enum/datetime validation. Omit them instead.
    const baseRecordParams = {
        patientId: patient.id,
        term: '',
        cursor: null,
    };

    const recordsQuery = useSearchRecords({
        ...baseRecordParams,
        limit: 3,
        sort: {eventDate: 'desc' as SearchRecordsSortEventDate},
    } as SearchRecordsParams) as unknown as UseQueryResult<PaginatedPage<MedicalRecord>>;

    const recordsTotalQuery = useSearchRecords({
        ...baseRecordParams,
        limit: 1,
        sort: null,
    } as SearchRecordsParams) as unknown as UseQueryResult<PaginatedPage<MedicalRecord>>;

    const formsQuery = useSearchPatientForms(patient.id, {
        cursor: null,
        limit: 10,
    }) as unknown as UseQueryResult<PaginatedPage<PatientForm>>;

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
              asStr(addr.city) && asStr(addr.state) ? `${asStr(addr.city)} / ${asStr(addr.state)}` : asStr(addr.city),
              asStr(addr.zipCode),
          ].filter(Boolean)
        : [];
    const addrLine = addrParts.length > 0 ? addrParts.join(' · ') : null;
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
        <div className={pageRoot}>
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
                        <BreadcrumbPage>{patient.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Patient header */}
            <EntityHeader
                avatar={<PatientAvatar name={patient.name} id={patient.id} />}
                name={patient.name}
                meta={
                    <>
                        {age !== null && <span>{age} anos</span>}
                        {age !== null && <span className={metaDot}>·</span>}
                        <span className={monoDate}>nasc. {dob}</span>
                        <span className={metaDot}>·</span>
                        <span className={monoDate}>{patient.documentId}</span>
                        {patient.gender && (
                            <>
                                <span className={metaDot}>·</span>
                                <span>{gender}</span>
                            </>
                        )}
                        {patient.insurancePlan && (
                            <>
                                <span className={metaDot}>·</span>
                                <span>{patient.insurancePlan.name}</span>
                            </>
                        )}
                        <span className={metaDot}>·</span>
                        <span className={monoTertiary}>ID {patient.id.slice(0, 8).toUpperCase()}</span>
                    </>
                }
                actions={
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                navigate({
                                    to: '/patients/$patientId/edit',
                                    params: {patientId: patient.id},
                                })
                            }
                        >
                            <Pencil className={icon4} />
                            Editar cadastro
                        </Button>
                        <MoreMenu />
                    </>
                }
                alerts={alerts.length > 0 ? alerts.map((a) => <AlertBadge key={a.id} alert={a} />) : undefined}
            />

            {/* Action grid */}
            <div className={actionGrid}>
                <ActionTile
                    icon={<FilePlus className={icon18} />}
                    label="Nova evolução"
                    sub="Registrar SOAP"
                    onClick={() => navigate({to: '/patients/$patientId/records/new', params: {patientId: patient.id}})}
                />
                <ActionTile
                    icon={<FileUp className={icon18} />}
                    label="Importar documento"
                    sub="Foto ou PDF · IA extrai dados"
                />
                <ActionTile
                    icon={<CalendarPlus className={icon18} />}
                    label="Agendar consulta"
                    sub="Já com paciente preenchido"
                />
                <ActionTile
                    icon={<MessagesSquare className={icon18} />}
                    label="Chat clínico com IA"
                    sub="Contexto do prontuário"
                    ai
                />
            </div>

            {/* Resumo clínico */}
            <div className={statsGrid}>
                <StatTile label="Próxima consulta" value="—" icon={<CalendarClock className={icon4} />} />
                <StatTile
                    label="Última consulta"
                    value={
                        records.length > 0 ? formatRelativeDate(records[0]?.eventDate ?? records[0]?.createdAt) : '—'
                    }
                    icon={<History className={icon4} />}
                />
                <StatTile
                    label="Total de evoluções"
                    value={totalRecords !== undefined ? String(totalRecords) : '—'}
                    loading={recordsTotalQuery.isLoading}
                    icon={<FileText className={icon4} />}
                />
                <StatTile
                    label="Formulários"
                    value={totalForms !== undefined ? String(totalForms) : '—'}
                    loading={formsQuery.isLoading}
                    icon={<ClipboardList className={icon4} />}
                />
            </div>

            {/* Vitais recentes */}
            <SectionCard
                title="Vitais recentes"
                action={
                    <SecLink>
                        Ver evolução de origem <ArrowUpRight className={icon3} />
                    </SecLink>
                }
            >
                <EmptySection label="Nenhum vital registrado" />
            </SectionCard>

            {/* Últimas evoluções */}
            <SectionCard
                title="Últimas evoluções"
                action={
                    <SecLink>
                        Ver prontuário completo <ArrowUpRight className={icon3} />
                    </SecLink>
                }
            >
                <RecordsContent isLoading={recordsQuery.isLoading} records={records} patientId={patient.id} />
            </SectionCard>

            {/* Two-col */}
            <div className={twoCol}>
                {/* Informações do paciente */}
                <SectionCard
                    title="Informações do paciente"
                    action={
                        <SecLink
                            onClick={() =>
                                navigate({
                                    to: '/patients/$patientId/edit',
                                    params: {patientId: patient.id},
                                })
                            }
                        >
                            Editar <Pencil className={icon3} />
                        </SecLink>
                    }
                >
                    <InfoGroup title="Dados pessoais">
                        <KVGrid>
                            <KV label="Nome completo" value={patient.name} />
                            <KV label="Data de nascimento" value={dob} mono />
                            <KV label="Sexo biológico" value={patient.gender ? gender : null} />
                            <KV label="Documento (CPF/ID)" value={patient.documentId} mono />
                        </KVGrid>
                    </InfoGroup>

                    <InfoGroup title="Contato">
                        <KVGrid>
                            <KV label="Celular / WhatsApp" value={phone} mono />
                            <KV label="E-mail" value={email} />
                        </KVGrid>
                        {(emergencyName ?? emergencyPhone) && (
                            <div className={emergencyBox}>
                                <p className={emergencyLabel}>Responsável</p>
                                <KVGrid>
                                    <KV label="Nome" value={emergencyName} />
                                    <KV label="Telefone" value={emergencyPhone} mono />
                                </KVGrid>
                            </div>
                        )}
                    </InfoGroup>

                    <InfoGroup title="Endereço">
                        {addrLine ? (
                            <p className={profileText}>{addrLine}</p>
                        ) : (
                            <p className={profileTextEmpty}>Não informado</p>
                        )}
                    </InfoGroup>
                </SectionCard>

                {/* Saúde inicial */}
                <SectionCard
                    title="Saúde inicial"
                    action={
                        <SecLink
                            onClick={() =>
                                navigate({
                                    to: '/patients/$patientId/edit',
                                    params: {patientId: patient.id},
                                })
                            }
                        >
                            Editar <Pencil className={icon3} />
                        </SecLink>
                    }
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
                        <FileUp className={icon4} />
                        Importar
                    </Button>
                }
            >
                <EmptySection label="Nenhum documento importado" />
            </SectionCard>
        </div>
    );
}
