import {useMemo, useState} from 'react';
import {
    useGetAppointmentReport,
    useListManageableProfessionals,
    type AppointmentReport,
    type AppointmentStatus,
} from '@agenda-app/client';
import {createFileRoute, useNavigate} from '@tanstack/react-router';
import {AlertTriangle, BarChart3, Lock} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {Button} from '@/components/ui/componentes/button';
import {Input} from '@/components/ui/componentes/input';
import {NativeSelect} from '@/components/ui/componentes/native-select';
import {Skeleton} from '@/components/ui/componentes/skeleton';
import {StatTile} from '@/components/ui/componentes/stat-tile';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/componentes/table';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/componentes/tabs';
import {useAccount} from '@/hooks/useAccount';
import {useCanState} from '@/hooks/useCan';
import {EmptyState} from '@/views/components/EmptyState';
import {LoadingSkeleton} from '@/views/components/LoadingSkeleton';
import {Page} from '@/views/components/Page';
import * as styles from './styles';

// ── Route ─────────────────────────────────────────────────────────
export const REPORT_TABS = ['overview', 'professionals', 'absences', 'occupancy'] as const;

export type ReportTab = (typeof REPORT_TABS)[number];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface ReportsSearch {
    report?: ReportTab;
    from?: string;
    to?: string;
}

function isReportTab(value: unknown): value is ReportTab {
    return typeof value === 'string' && REPORT_TABS.some((tab) => tab === value);
}

function dateParam(value: unknown): string | undefined {
    return typeof value === 'string' && DATE_PATTERN.test(value) ? value : undefined;
}

export const Route = createFileRoute('/_stackedLayout/reports')({
    validateSearch: (search: Record<string, unknown>): ReportsSearch => ({
        report: isReportTab(search.report) ? search.report : undefined,
        from: dateParam(search.from),
        to: dateParam(search.to),
    }),
    component: ReportsPage,
});

// ── Period helpers ────────────────────────────────────────────────
type Preset = 'thisMonth' | 'lastMonth' | 'last30' | 'last90' | 'thisYear';

const PRESETS: Preset[] = ['thisMonth', 'lastMonth', 'last30', 'last90', 'thisYear'];

function fmtDate(d: Date): string {
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

function parseDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);

    return new Date(year, month - 1, day);
}

function presetRange(preset: Preset, today: Date): {from: string; to: string} {
    const y = today.getFullYear();
    const m = today.getMonth();

    switch (preset) {
        case 'lastMonth':
            return {from: fmtDate(new Date(y, m - 1, 1)), to: fmtDate(new Date(y, m, 0))};
        case 'last30':
            return {from: fmtDate(new Date(y, m, today.getDate() - 29)), to: fmtDate(today)};
        case 'last90':
            return {from: fmtDate(new Date(y, m, today.getDate() - 89)), to: fmtDate(today)};
        case 'thisYear':
            return {from: fmtDate(new Date(y, 0, 1)), to: fmtDate(new Date(y, 11, 31))};
        case 'thisMonth':
        default:
            return {from: fmtDate(new Date(y, m, 1)), to: fmtDate(new Date(y, m + 1, 0))};
    }
}

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'muted';

const STATUS_TONE: Record<AppointmentStatus, Tone> = {
    SCHEDULED: 'primary',
    CONFIRMED: 'primary',
    ARRIVED: 'primary',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
    NO_SHOW: 'warning',
    CANCELLED: 'danger',
};

// ── Page ──────────────────────────────────────────────────────────
export function ReportsPage() {
    const {t} = useTranslation();
    const access = useCanState({has: 'clinic-report:view'});

    if (access.isLoading) {
        return (
            <Page title={t('reports.title')}>
                <LoadingSkeleton rows={4} />
            </Page>
        );
    }

    if (!access.allowed) {
        return (
            <Page title={t('reports.title')}>
                <EmptyState icon={Lock} title={t('reports.accessDenied')} message={t('reports.accessDeniedMessage')} />
            </Page>
        );
    }

    return <ReportsContent />;
}

function ReportsContent() {
    const {t, i18n} = useTranslation();
    const navigate = useNavigate();
    const search = Route.useSearch();
    const {isSolo} = useAccount();
    const today = useMemo(() => new Date(), []);

    const tabs = REPORT_TABS.filter((tab) => !(isSolo && tab === 'professionals'));
    const tab: ReportTab = search.report && tabs.includes(search.report) ? search.report : 'overview';
    const defaultRange = presetRange('thisMonth', today);
    const from = search.from ?? defaultRange.from;
    const to = search.to && search.to >= from ? search.to : (search.from ?? defaultRange.to);
    const [professionalId, setProfessionalId] = useState('');

    const professionalsQ = useListManageableProfessionals({query: {enabled: !isSolo}});
    const professionals = (professionalsQ.data ?? []).filter((member) => member.isActive);

    const setSearch = (next: ReportsSearch) =>
        void navigate({to: '/reports', search: {report: tab, from, to, ...next}, replace: true});

    const rangeEnd = parseDate(to);

    rangeEnd.setHours(23, 59, 59, 999);

    const reportQ = useGetAppointmentReport({
        startDate: parseDate(from).toISOString(),
        endDate: rangeEnd.toISOString(),
        professionalMemberId: professionalId || undefined,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    const percent = useMemo(
        () => new Intl.NumberFormat(i18n.language, {style: 'percent', maximumFractionDigits: 1}),
        [i18n.language]
    );
    const formatRate = (value: number | null) => (value === null ? '—' : percent.format(value));

    return (
        <Page title={t('reports.title')} subtitle={t('reports.subtitle')}>
            <section className={styles.filters} aria-label={t('reports.filters')}>
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
                                onClick={() => setSearch(range)}
                            >
                                {t(`reports.presets.${preset}`)}
                            </Button>
                        );
                    })}
                </div>
                <div className={styles.filterRow}>
                    <label className={styles.field}>
                        <span className={styles.fieldLabel}>{t('reports.from')}</span>
                        <Input
                            type="date"
                            value={from}
                            onChange={(e) => {
                                if (DATE_PATTERN.test(e.target.value)) {
                                    setSearch({from: e.target.value, to: e.target.value > to ? e.target.value : to});
                                }
                            }}
                        />
                    </label>
                    <label className={styles.field}>
                        <span className={styles.fieldLabel}>{t('reports.to')}</span>
                        <Input
                            type="date"
                            value={to}
                            min={from}
                            onChange={(e) => {
                                if (DATE_PATTERN.test(e.target.value)) setSearch({to: e.target.value});
                            }}
                        />
                    </label>
                    {professionals.length > 1 && (
                        <label className={styles.field}>
                            <span className={styles.fieldLabel}>{t('reports.professional')}</span>
                            <NativeSelect value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}>
                                <option value="">{t('reports.allProfessionals')}</option>
                                {professionals.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.displayName ?? t('agenda.professionalFallback')}
                                    </option>
                                ))}
                            </NativeSelect>
                        </label>
                    )}
                </div>
            </section>

            <Tabs value={tab} onValueChange={(value) => isReportTab(value) && setSearch({report: value})}>
                <TabsList className={styles.tabs}>
                    {tabs.map((item) => (
                        <TabsTrigger key={item} value={item}>
                            {t(`reports.tabs.${item}`)}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {reportQ.isError ? (
                    <EmptyState icon={AlertTriangle} title={t('reports.loadError')} />
                ) : (
                    tabs.map((item) => (
                        <TabsContent key={item} value={item}>
                            {reportQ.data ? (
                                <ReportTabContent tab={item} report={reportQ.data} formatRate={formatRate} />
                            ) : (
                                <div className={styles.tiles}>
                                    {Array.from({length: 4}, (_, i) => (
                                        <Skeleton key={i} className={styles.skeletonTiles} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    ))
                )}
            </Tabs>
        </Page>
    );
}

interface TabProps {
    report: AppointmentReport;
    formatRate: (value: number | null) => string;
}

function ReportTabContent({tab, ...props}: TabProps & {tab: ReportTab}) {
    const {t} = useTranslation();

    if (props.report.summary.total === 0) {
        return <EmptyState icon={BarChart3} title={t('reports.empty')} message={t('reports.emptyMessage')} />;
    }

    switch (tab) {
        case 'professionals':
            return <ProfessionalsReport {...props} />;
        case 'absences':
            return <AbsencesReport {...props} />;
        case 'occupancy':
            return <OccupancyReport {...props} />;
        case 'overview':
        default:
            return <OverviewReport {...props} />;
    }
}

// ── Overview ──────────────────────────────────────────────────────
function OverviewReport({report, formatRate}: TabProps) {
    const {t} = useTranslation();
    const {summary} = report;
    const maxStatus = Math.max(...report.byStatus.map((entry) => entry.count), 1);
    const maxType = Math.max(...report.byType.map((entry) => entry.count), 1);

    return (
        <>
            <div className={styles.tiles}>
                <StatTile label={t('reports.kpi.total')} value={summary.total} />
                <StatTile label={t('reports.kpi.completed')} value={summary.completed} />
                <StatTile label={t('reports.kpi.attendanceRate')} value={formatRate(summary.attendanceRate)} />
                <StatTile label={t('reports.kpi.noShowRate')} value={formatRate(summary.noShowRate)} />
                <StatTile label={t('reports.kpi.cancellationRate')} value={formatRate(summary.cancellationRate)} />
                <StatTile label={t('reports.kpi.uniquePatients')} value={summary.uniquePatients} />
                <StatTile label={t('reports.kpi.newPatients')} value={summary.newPatients} />
                <StatTile
                    label={t('reports.kpi.avgWait')}
                    value={
                        summary.avgWaitMinutes === null
                            ? '—'
                            : t('reports.minutes', {count: Math.round(summary.avgWaitMinutes)})
                    }
                />
            </div>

            <DailyChart report={report} />

            <div className={styles.grid2}>
                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>{t('reports.byStatus')}</h2>
                    <ul className={styles.barList}>
                        {report.byStatus
                            .filter((entry) => entry.count > 0)
                            .map((entry) => (
                                <Bar
                                    key={entry.status}
                                    label={t(`reception.status.${entry.status}`)}
                                    value={entry.count}
                                    max={maxStatus}
                                    tone={STATUS_TONE[entry.status]}
                                />
                            ))}
                    </ul>
                </section>
                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>{t('reports.byType')}</h2>
                    <ul className={styles.barList}>
                        {report.byType.map((entry) => (
                            <Bar
                                key={entry.type}
                                label={t(`reception.types.${entry.type}`)}
                                value={entry.count}
                                max={maxType}
                            />
                        ))}
                    </ul>
                </section>
            </div>
        </>
    );
}

function DailyChart({report}: {report: AppointmentReport}) {
    const {t, i18n} = useTranslation();
    const max = Math.max(...report.byDay.map((day) => day.total), 1);
    const dayLabel = new Intl.DateTimeFormat(i18n.language, {day: '2-digit', month: '2-digit'});
    const series: Array<{key: 'completed' | 'noShow' | 'cancelled' | 'pending'; tone: Tone}> = [
        {key: 'completed', tone: 'success'},
        {key: 'pending', tone: 'primary'},
        {key: 'noShow', tone: 'warning'},
        {key: 'cancelled', tone: 'danger'},
    ];

    return (
        <section className={styles.card}>
            <h2 className={styles.cardTitle}>{t('reports.byDay')}</h2>
            <div className={styles.legend}>
                {series.map(({key, tone}) => (
                    <span key={key} className={styles.legendItem}>
                        <span className={styles.legendDot({tone})} />
                        {t(`reports.series.${key}`)}
                    </span>
                ))}
            </div>
            <div className={styles.columns} role="img" aria-label={t('reports.byDay')}>
                {report.byDay.map((day) => (
                    <div
                        key={day.date}
                        className={styles.column}
                        title={t('reports.dayTooltip', {date: dayLabel.format(parseDate(day.date)), count: day.total})}
                    >
                        <div className={styles.columnStack} style={{height: `${(day.total / max) * 100}%`}}>
                            {series.map(({key, tone}) =>
                                day[key] > 0 ? (
                                    <span
                                        key={key}
                                        className={styles.barFill({tone})}
                                        style={{flexBasis: `${(day[key] / day.total) * 100}%`}}
                                    />
                                ) : null
                            )}
                        </div>
                        <span className={styles.columnLabel}>{dayLabel.format(parseDate(day.date))}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ── Professionals ─────────────────────────────────────────────────
function ProfessionalsReport({report, formatRate}: TabProps) {
    const {t} = useTranslation();

    return (
        <section className={styles.card}>
            <h2 className={styles.cardTitle}>{t('reports.byProfessional')}</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('reports.columns.professional')}</TableHead>
                        <TableHead className={styles.right}>{t('reports.columns.total')}</TableHead>
                        <TableHead className={styles.right}>{t('reports.columns.completed')}</TableHead>
                        <TableHead className={styles.right}>{t('reports.columns.noShow')}</TableHead>
                        <TableHead className={styles.right}>{t('reports.columns.cancelled')}</TableHead>
                        <TableHead className={styles.right}>{t('reports.columns.pending')}</TableHead>
                        <TableHead className={styles.right}>{t('reports.columns.attendanceRate')}</TableHead>
                        <TableHead className={styles.right}>{t('reports.columns.patients')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {report.byProfessional.map((row) => (
                        <TableRow key={row.memberId}>
                            <TableCell>{row.displayName}</TableCell>
                            <NumberCell value={row.total} />
                            <NumberCell value={row.completed} />
                            <NumberCell value={row.noShow} />
                            <NumberCell value={row.cancelled} />
                            <NumberCell value={row.pending} />
                            <TableCell className={styles.cx(styles.mono, styles.right)}>
                                {formatRate(row.attendanceRate)}
                            </TableCell>
                            <NumberCell value={row.uniquePatients} />
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </section>
    );
}

// ── Absences (no-shows and cancellations) ─────────────────────────
function AbsencesReport({report, formatRate}: TabProps) {
    const {t, i18n} = useTranslation();
    const {summary} = report;
    const dayLabel = new Intl.DateTimeFormat(i18n.language, {weekday: 'short', day: '2-digit', month: '2-digit'});
    const days = report.byDay.filter((day) => day.noShow > 0 || day.cancelled > 0);
    const professionals = report.byProfessional.filter((row) => row.noShow > 0 || row.cancelled > 0);

    return (
        <>
            <div className={styles.tiles}>
                <StatTile label={t('reports.kpi.noShow')} value={summary.noShow} />
                <StatTile label={t('reports.kpi.noShowRate')} value={formatRate(summary.noShowRate)} />
                <StatTile label={t('reports.kpi.cancelled')} value={summary.cancelled} />
                <StatTile label={t('reports.kpi.cancellationRate')} value={formatRate(summary.cancellationRate)} />
            </div>
            <div className={styles.grid2}>
                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>{t('reports.absencesByDay')}</h2>
                    {days.length === 0 ? (
                        <p className={styles.muted}>{t('reports.noAbsences')}</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('reports.columns.day')}</TableHead>
                                    <TableHead className={styles.right}>{t('reports.columns.noShow')}</TableHead>
                                    <TableHead className={styles.right}>{t('reports.columns.cancelled')}</TableHead>
                                    <TableHead className={styles.right}>{t('reports.columns.total')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {days.map((day) => (
                                    <TableRow key={day.date}>
                                        <TableCell>{dayLabel.format(parseDate(day.date))}</TableCell>
                                        <NumberCell value={day.noShow} />
                                        <NumberCell value={day.cancelled} />
                                        <NumberCell value={day.total} />
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </section>
                {professionals.length > 0 && report.byProfessional.length > 1 && (
                    <section className={styles.card}>
                        <h2 className={styles.cardTitle}>{t('reports.absencesByProfessional')}</h2>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('reports.columns.professional')}</TableHead>
                                    <TableHead className={styles.right}>{t('reports.columns.noShow')}</TableHead>
                                    <TableHead className={styles.right}>{t('reports.columns.cancelled')}</TableHead>
                                    <TableHead className={styles.right}>
                                        {t('reports.columns.attendanceRate')}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {professionals.map((row) => (
                                    <TableRow key={row.memberId}>
                                        <TableCell>{row.displayName}</TableCell>
                                        <NumberCell value={row.noShow} />
                                        <NumberCell value={row.cancelled} />
                                        <TableCell className={styles.cx(styles.mono, styles.right)}>
                                            {formatRate(row.attendanceRate)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </section>
                )}
            </div>
        </>
    );
}

// ── Occupancy (procedures, weekday, hour) ─────────────────────────
function OccupancyReport({report}: TabProps) {
    const {t, i18n} = useTranslation();
    const weekdayFormat = new Intl.DateTimeFormat(i18n.language, {weekday: 'long'});
    // 2023-01-01 was a Sunday: offsets give each weekday's name in the current language.
    const weekdayName = (weekday: number) => weekdayFormat.format(new Date(2023, 0, 1 + weekday));
    const maxWeekday = Math.max(...report.byWeekday.map((entry) => entry.count), 1);
    const hours = report.byHour.filter((entry) => entry.count > 0);
    const maxHour = Math.max(...hours.map((entry) => entry.count), 1);
    const maxProcedure = Math.max(...report.byProcedure.map((entry) => entry.count), 1);
    const bookedHours = new Intl.NumberFormat(i18n.language, {maximumFractionDigits: 1}).format(
        report.summary.bookedMinutes / 60
    );
    const namedProcedures = report.byProcedure.filter((entry) => entry.procedureName !== null).length;

    return (
        <>
            <div className={styles.tiles}>
                <StatTile label={t('reports.kpi.bookedHours')} value={bookedHours} />
                <StatTile label={t('reports.kpi.total')} value={report.summary.total} />
                <StatTile label={t('reports.kpi.pending')} value={report.summary.pending} />
                <StatTile label={t('reports.kpi.procedures')} value={namedProcedures} />
            </div>
            <div className={styles.grid2}>
                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>{t('reports.byWeekday')}</h2>
                    <p className={styles.cardHint}>{t('reports.cancelledExcluded')}</p>
                    <ul className={styles.barList}>
                        {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
                            const count = report.byWeekday.find((entry) => entry.weekday === weekday)?.count ?? 0;

                            return <Bar key={weekday} label={weekdayName(weekday)} value={count} max={maxWeekday} />;
                        })}
                    </ul>
                </section>
                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>{t('reports.byHour')}</h2>
                    <p className={styles.cardHint}>{t('reports.cancelledExcluded')}</p>
                    <ul className={styles.barList}>
                        {hours.map((entry) => (
                            <Bar
                                key={entry.hour}
                                label={`${String(entry.hour).padStart(2, '0')}:00`}
                                value={entry.count}
                                max={maxHour}
                            />
                        ))}
                    </ul>
                </section>
            </div>
            <section className={styles.card}>
                <h2 className={styles.cardTitle}>{t('reports.byProcedure')}</h2>
                <ul className={styles.barList}>
                    {report.byProcedure.map((entry) => (
                        <Bar
                            key={entry.procedureName ?? '__none'}
                            label={entry.procedureName ?? t('reports.noProcedure')}
                            value={entry.count}
                            max={maxProcedure}
                        />
                    ))}
                </ul>
            </section>
        </>
    );
}

// ── Building blocks ───────────────────────────────────────────────
function Bar({label, value, max, tone = 'primary'}: {label: string; value: number; max: number; tone?: Tone}) {
    return (
        <li className={styles.barItem}>
            <span className={styles.barLabel} title={label}>
                {label}
            </span>
            <span className={styles.barTrack} aria-hidden>
                <span className={styles.barFill({tone})} style={{width: `${(value / max) * 100}%`}} />
            </span>
            <span className={styles.barValue}>{value}</span>
        </li>
    );
}

function NumberCell({value}: {value: number}) {
    return <TableCell className={styles.cx(styles.mono, styles.right)}>{value}</TableCell>;
}
