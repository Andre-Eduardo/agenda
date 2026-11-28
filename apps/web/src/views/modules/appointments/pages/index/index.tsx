import {useCallback, useEffect, useMemo, useState, type ReactNode} from 'react';
import type {Appointment, AppointmentStatus, Patient} from '@agenda-app/client';
import {
    useGetClinic,
    useGetCurrentClinicMember,
    useListManageableProfessionals,
    useListRooms,
    useSearchAppointments,
    useSearchPatients,
} from '@agenda-app/client';
import {useQueryClient, type UseQueryResult} from '@tanstack/react-query';
import {createFileRoute, Link, useNavigate} from '@tanstack/react-router';
import {CalendarDays, CalendarX2, Plus} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {Badge} from '@/components/ui/componentes/badge';
import {Button} from '@/components/ui/componentes/button';
import {EmptyStateCard} from '@/components/ui/componentes/empty-state';
import {Input} from '@/components/ui/componentes/input';
import {NativeSelect} from '@/components/ui/componentes/native-select';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/componentes/table';
import {invalidateAppointmentRevenue} from '@/utils/appointment-revenue';
import {
    AppointmentDetailSheet,
    CancelDialog,
    EditAppointmentDialog,
    NewAppointmentDialog,
    RecordFollowUpDialog,
} from '../../components/AppointmentDialogs';
import {ProcedureColorDot} from '../../components/ProcedureFields';
import {
    addDays,
    ALL_STATUSES,
    fmtDate,
    type NewAppointmentPrefill,
    type PaginatedPage,
    parseCalendarDate,
    startOfWeek,
    toApptView,
} from '../../shared/appointment-helpers';
import {statusChip, statusDot} from '../../styles';
import * as styles from './styles';

// ── Route ─────────────────────────────────────────────────────────
interface AgendaSearch {
    from?: string;
    to?: string;
    date?: string;
    appointmentId?: string;
    followUpFromRecordId?: string;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function dateParam(value: unknown): string | undefined {
    return typeof value === 'string' && DATE_PATTERN.test(value) ? value : undefined;
}

export const Route = createFileRoute('/_stackedLayout/appointments')({
    validateSearch: (search: Record<string, unknown>): AgendaSearch => ({
        from: dateParam(search.from),
        to: dateParam(search.to),
        date: dateParam(search.date),
        appointmentId: typeof search.appointmentId === 'string' ? search.appointmentId : undefined,
        followUpFromRecordId: typeof search.followUpFromRecordId === 'string' ? search.followUpFromRecordId : undefined,
    }),
    component: AgendaTablePage,
});

/** The list endpoint also returns the patient and professional names next to each appointment. */
type AgendaListItem = Appointment & {patientName?: string | null; attendedByName?: string | null};

/** Upper bound of appointments loaded for one period; the server caps the page anyway. */
const PAGE_LIMIT = 500;

type Preset = 'today' | 'tomorrow' | 'week' | 'month' | 'next7';

const PRESETS: Preset[] = ['today', 'tomorrow', 'next7', 'week', 'month'];

function todayDate(): Date {
    const d = new Date();

    d.setHours(0, 0, 0, 0);

    return d;
}

function presetRange(preset: Preset, today: Date): {from: string; to: string} {
    switch (preset) {
        case 'today':
            return {from: fmtDate(today), to: fmtDate(today)};
        case 'tomorrow':
            return {from: fmtDate(addDays(today, 1)), to: fmtDate(addDays(today, 1))};
        case 'next7':
            return {from: fmtDate(today), to: fmtDate(addDays(today, 6))};
        case 'week': {
            const start = startOfWeek(today);

            return {from: fmtDate(start), to: fmtDate(addDays(start, 6))};
        }
        case 'month':
        default:
            return {
                from: fmtDate(new Date(today.getFullYear(), today.getMonth(), 1)),
                to: fmtDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
            };
    }
}

function normalizeText(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
}

export function AgendaTablePage() {
    const {t, i18n} = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const search = Route.useSearch();
    const today = useMemo(todayDate, []);

    // ── Filters ──────────────────────────────────────────────────
    const defaultRange = presetRange('next7', today);
    const from = search.from ?? search.date ?? defaultRange.from;
    const to = search.to ?? search.date ?? (search.from ? search.from : defaultRange.to);
    const rangeStart = parseCalendarDate(from) ?? today;
    const rangeEndDay = parseCalendarDate(to) ?? rangeStart;
    const rangeEnd = useMemo(() => {
        const end = new Date(rangeEndDay < rangeStart ? rangeStart : rangeEndDay);

        end.setHours(23, 59, 59, 999);

        return end;
    }, [rangeEndDay, rangeStart]);

    const [statusFilters, setStatusFilters] = useState<Set<AppointmentStatus>>(new Set(ALL_STATUSES));
    const [professionalId, setProfessionalId] = useState('');
    const [term, setTerm] = useState('');

    const setRange = (next: {from: string; to: string}) =>
        void navigate({to: '/appointments', search: {from: next.from, to: next.to}, replace: true});

    const toggleStatus = useCallback((status: AppointmentStatus) => {
        setStatusFilters((prev) => {
            const next = new Set(prev);

            if (next.has(status)) next.delete(status);
            else next.add(status);

            return next;
        });
    }, []);

    // ── Data ─────────────────────────────────────────────────────
    const apptQ = useSearchAppointments({
        term: '',
        limit: PAGE_LIMIT,
        cursor: null,
        sort: {startAt: 'asc'},
        dateFrom: rangeStart.toISOString(),
        dateTo: rangeEnd.toISOString(),
    }) as unknown as UseQueryResult<PaginatedPage<AgendaListItem>>;
    const rawAppts = useMemo(() => apptQ.data?.data ?? [], [apptQ.data]);
    const totalCount = apptQ.data?.totalCount ?? 0;

    const patQ = useSearchPatients({term: '', limit: 300, cursor: null, sort: null}) as unknown as UseQueryResult<
        PaginatedPage<Patient>
    >;
    const patients = useMemo(() => patQ.data?.data ?? [], [patQ.data]);
    const patientNames = useMemo(() => new Map(patients.map((p) => [p.id, p.name])), [patients]);

    const professionalsQ = useListManageableProfessionals();
    const professionals = useMemo(
        () => (professionalsQ.data ?? []).filter((member) => member.isActive),
        [professionalsQ.data]
    );
    const professionalNames = useMemo(
        () => new Map(professionals.map((member) => [member.id, member.displayName ?? null])),
        [professionals]
    );

    const meQuery = useGetCurrentClinicMember();
    const clinicQuery = useGetClinic(meQuery.data?.clinicId ?? '', {query: {enabled: !!meQuery.data?.clinicId}});
    const roomManagementEnabled = clinicQuery.data?.roomManagementEnabled ?? false;
    const roomsQuery = useListRooms({query: {enabled: roomManagementEnabled}});
    const roomsById = useMemo(() => new Map((roomsQuery.data ?? []).map((r) => [r.id, r.name])), [roomsQuery.data]);
    const showRooms = roomManagementEnabled && roomsById.size > 0;

    const clinicId = meQuery.data?.clinicId;
    const refreshAppointments = useCallback(
        () => invalidateAppointmentRevenue(queryClient, clinicId),
        [queryClient, clinicId]
    );

    const allAppts = useMemo(() => rawAppts.map(toApptView), [rawAppts]);
    const listItemsById = useMemo(() => new Map(rawAppts.map((item) => [item.id, item])), [rawAppts]);

    const patientNameOf = useCallback(
        (appointment: Appointment) =>
            listItemsById.get(appointment.id)?.patientName ?? patientNames.get(appointment.patientId) ?? '—',
        [listItemsById, patientNames]
    );

    const rows = useMemo(() => {
        const needle = normalizeText(term.trim());

        return allAppts.filter((apt) => {
            if (!statusFilters.has(apt.status)) return false;

            if (professionalId && apt.attendedByMemberId !== professionalId) return false;

            if (!needle) return true;

            const haystack = normalizeText(
                [patientNameOf(apt.raw), apt.raw.procedure?.name ?? '', apt.note ?? ''].join(' ')
            );

            return haystack.includes(needle);
        });
    }, [allAppts, patientNameOf, professionalId, statusFilters, term]);

    const groupedRows = useMemo(() => {
        const groups: Array<{date: string; items: typeof rows}> = [];

        for (const apt of rows) {
            const last = groups[groups.length - 1];

            if (last?.date === apt.date) last.items.push(apt);
            else groups.push({date: apt.date, items: [apt]});
        }

        return groups;
    }, [rows]);

    // ── Dialog state (same flows as the calendar) ────────────────
    const [detailId, setDetailId] = useState<string | null>(search.appointmentId ?? null);
    const [editId, setEditId] = useState<string | null>(null);
    const [cancelId, setCancelId] = useState<string | null>(null);
    const [newAppt, setNewAppt] = useState<NewAppointmentPrefill | true | null>(null);

    useEffect(() => {
        setDetailId(search.appointmentId ?? null);
    }, [search.appointmentId]);

    const keepFilters = {from: search.from, to: search.to, date: search.date};

    const closeDetail = () => {
        setDetailId(null);

        if (search.appointmentId) {
            void navigate({to: '/appointments', search: keepFilters, replace: true});
        }
    };

    const detailApt = allAppts.find((a) => a.id === detailId) ?? null;
    const editApt = allAppts.find((a) => a.id === editId) ?? null;
    const cancelApt = allAppts.find((a) => a.id === cancelId) ?? null;

    const dayFormatter = useMemo(
        () => new Intl.DateTimeFormat(i18n.language, {weekday: 'long', day: '2-digit', month: 'long'}),
        [i18n.language]
    );

    const formatDay = (date: string) => {
        const parsed = parseCalendarDate(date);

        return parsed ? dayFormatter.format(parsed) : date;
    };

    const columnCount = showRooms ? 7 : 6;
    const isLoading = apptQ.isPending;

    const renderBody = () => {
        if (isLoading) {
            return (
                <div className={styles.skeletonStack}>
                    {Array.from({length: 6}, (_, i) => (
                        <Skeleton key={i} className={styles.skeletonRow} />
                    ))}
                </div>
            );
        }

        if (rows.length === 0) {
            return (
                <EmptyStateCard
                    icon={<CalendarX2 aria-hidden />}
                    title={t('agenda.empty')}
                    description={t('agenda.emptyDescription')}
                />
            );
        }

        return (
            <div className={styles.tableCard}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('agenda.columns.time')}</TableHead>
                            <TableHead>{t('agenda.columns.patient')}</TableHead>
                            <TableHead>{t('agenda.columns.professional')}</TableHead>
                            <TableHead>{t('agenda.columns.type')}</TableHead>
                            <TableHead>{t('agenda.columns.procedure')}</TableHead>
                            {showRooms && <TableHead>{t('agenda.columns.room')}</TableHead>}
                            <TableHead>{t('agenda.columns.status')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groupedRows.map((group) => (
                            <GroupRows key={group.date} label={formatDay(group.date)} columnCount={columnCount}>
                                {group.items.map((apt) => {
                                    const professionalName =
                                        listItemsById.get(apt.id)?.attendedByName ??
                                        professionalNames.get(apt.attendedByMemberId) ??
                                        t('agenda.professionalFallback');

                                    return (
                                        <TableRow
                                            key={apt.id}
                                            className={styles.row}
                                            onClick={() => setDetailId(apt.id)}
                                        >
                                            <TableCell className={styles.mono}>
                                                {apt.start} – {apt.end}
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    type="button"
                                                    className={styles.rowButton}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setDetailId(apt.id);
                                                    }}
                                                >
                                                    {patientNameOf(apt.raw)}
                                                </button>
                                                {apt.note && <div className={styles.truncatedNote}>{apt.note}</div>}
                                            </TableCell>
                                            <TableCell>{professionalName}</TableCell>
                                            <TableCell>{t(`reception.types.${apt.type}`)}</TableCell>
                                            <TableCell>
                                                {apt.raw.procedure ? (
                                                    <span className={styles.procedureCell}>
                                                        <ProcedureColorDot color={apt.raw.procedure.color} decorative />
                                                        {apt.raw.procedure.name}
                                                    </span>
                                                ) : (
                                                    <span className={styles.muted}>—</span>
                                                )}
                                            </TableCell>
                                            {showRooms && (
                                                <TableCell>
                                                    {(apt.roomId && roomsById.get(apt.roomId)) ?? (
                                                        <span className={styles.muted}>—</span>
                                                    )}
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <Badge status={apt.status}>{t(`reception.status.${apt.status}`)}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </GroupRows>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <h1 className={styles.title}>{t('agenda.title')}</h1>
                    <p className={styles.subtitle}>{t('agenda.subtitle')}</p>
                </div>
                <div className={styles.headerActions}>
                    <Button asChild size="sm" variant="outline">
                        <Link to="/calendar" search={{date: from}}>
                            <CalendarDays aria-hidden className={styles.icon4} />
                            {t('agenda.openCalendar')}
                        </Link>
                    </Button>
                    <Button size="sm" onClick={() => setNewAppt(true)}>
                        <Plus aria-hidden className={styles.icon4} />
                        {t('agenda.new')}
                    </Button>
                </div>
            </header>

            <section className={styles.filters} aria-label={t('agenda.filters')}>
                <div className={styles.presetRow}>
                    {PRESETS.map((preset) => {
                        const range = presetRange(preset, today);
                        const active = range.from === from && range.to === to;

                        return (
                            <Button
                                key={preset}
                                type="button"
                                size="sm"
                                variant={active ? 'default' : 'outline'}
                                aria-pressed={active}
                                onClick={() => setRange(range)}
                            >
                                {t(`agenda.presets.${preset}`)}
                            </Button>
                        );
                    })}
                </div>
                <div className={styles.filterRow}>
                    <label className={styles.field}>
                        <span className={styles.fieldLabel}>{t('agenda.from')}</span>
                        <Input
                            type="date"
                            value={from}
                            onChange={(e) => {
                                if (DATE_PATTERN.test(e.target.value)) {
                                    setRange({from: e.target.value, to: e.target.value > to ? e.target.value : to});
                                }
                            }}
                        />
                    </label>
                    <label className={styles.field}>
                        <span className={styles.fieldLabel}>{t('agenda.to')}</span>
                        <Input
                            type="date"
                            value={to}
                            min={from}
                            onChange={(e) => {
                                if (DATE_PATTERN.test(e.target.value)) {
                                    setRange({from: e.target.value < from ? e.target.value : from, to: e.target.value});
                                }
                            }}
                        />
                    </label>
                    {professionals.length > 1 && (
                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>{t('agenda.professional')}</span>
                            <NativeSelect value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}>
                                <option value="">{t('agenda.allProfessionals')}</option>
                                {professionals.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.displayName ?? t('agenda.professionalFallback')}
                                    </option>
                                ))}
                            </NativeSelect>
                        </label>
                    )}
                    <label className={styles.fieldGrow}>
                        <span className={styles.fieldLabel}>{t('agenda.search')}</span>
                        <Input
                            type="search"
                            value={term}
                            placeholder={t('agenda.searchPlaceholder')}
                            onChange={(e) => setTerm(e.target.value)}
                        />
                    </label>
                </div>
                <div className={styles.statusRow} role="group" aria-label={t('agenda.statusFilter')}>
                    {ALL_STATUSES.map((status) => (
                        <button
                            key={status}
                            type="button"
                            aria-pressed={statusFilters.has(status)}
                            className={statusChip({status, active: statusFilters.has(status)})}
                            onClick={() => toggleStatus(status)}
                        >
                            <span className={statusDot({status})} />
                            {t(`reception.status.${status}`)}
                        </button>
                    ))}
                </div>
            </section>

            <div className={styles.summary}>
                <span>
                    <span className={styles.count}>{rows.length}</span> {t('agenda.count', {count: rows.length})}
                </span>
            </div>

            {renderBody()}

            {totalCount > rawAppts.length && (
                <p className={styles.warning}>{t('agenda.truncated', {shown: rawAppts.length, total: totalCount})}</p>
            )}

            {detailApt && (
                <AppointmentDetailSheet
                    key={detailApt.patientId}
                    apt={detailApt}
                    patients={patients}
                    onClose={closeDetail}
                    onEdit={() => {
                        setEditId(detailId);
                        closeDetail();
                    }}
                    onCancel={() => {
                        setCancelId(detailId);
                        closeDetail();
                    }}
                    onOpenPatient={(id) => navigate({to: '/patients/$patientId', params: {patientId: id}})}
                    onStatusChanged={refreshAppointments}
                />
            )}

            {editApt && (
                <EditAppointmentDialog apt={editApt} onClose={() => setEditId(null)} onSaved={refreshAppointments} />
            )}

            {cancelApt && (
                <CancelDialog apt={cancelApt} onClose={() => setCancelId(null)} onCancelled={refreshAppointments} />
            )}

            {search.followUpFromRecordId && (
                <RecordFollowUpDialog
                    key={search.followUpFromRecordId}
                    recordId={search.followUpFromRecordId}
                    onDismiss={() => void navigate({to: '/appointments', search: keepFilters, replace: true})}
                />
            )}
            {newAppt && !search.followUpFromRecordId && (
                <NewAppointmentDialog
                    prefill={typeof newAppt === 'object' ? newAppt : null}
                    defaultMemberId={professionalId || (professionals[0]?.id ?? '')}
                    onClose={() => setNewAppt(null)}
                    onSaved={() => {
                        setNewAppt(null);
                        refreshAppointments();
                    }}
                />
            )}
        </div>
    );
}

function GroupRows({label, columnCount, children}: {label: string; columnCount: number; children: ReactNode}) {
    return (
        <>
            <TableRow className={styles.dayRow}>
                <TableCell colSpan={columnCount} className={styles.dayCell}>
                    {label}
                </TableCell>
            </TableRow>
            {children}
        </>
    );
}
