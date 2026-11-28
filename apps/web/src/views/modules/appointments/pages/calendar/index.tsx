import {useCallback, useEffect, useMemo, useState} from 'react';
import type {
    Appointment,
    AppointmentStatus,
    ClinicMember,
    MemberBlock,
    Patient,
    Room,
    UpdateAppointmentInputDtoType,
    WorkingHours,
} from '@agenda-app/client';
import {
    useGetClinic,
    useGetCurrentClinicMember,
    getListMemberBlocksQueryOptions,
    getListWorkingHoursQueryOptions,
    useListManageableProfessionals,
    useListRooms,
    useSearchAppointments,
    useSearchPatients,
    useUpdateAppointment,
} from '@agenda-app/client';
import {useQueries, useQueryClient, type UseQueryResult} from '@tanstack/react-query';
import {createFileRoute, useNavigate} from '@tanstack/react-router';
import {CalendarDays, CalendarX2, ChevronLeft, ChevronRight, Plus} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/componentes/button';
import {useCan} from '@/hooks/useCan';
import {cx} from '@/styled-system/css';
import {invalidateAppointmentRevenue} from '@/utils/appointment-revenue';
import {ConfirmDialog} from '@/views/components/ConfirmDialog';
import {
    AppointmentDetailSheet,
    CancelDialog,
    EditAppointmentDialog,
    NewAppointmentDialog,
    RecordFollowUpDialog,
} from '../../components/AppointmentDialogs';
import {ProcedureColorDot} from '../../components/ProcedureFields';
import {
    MONTH_NAMES,
    WEEKDAYS_LONG,
    WEEKDAYS_SHORT,
    STATUS_LABELS,
    TYPE_LABELS,
    ALL_STATUSES,
    getAvailabilityWarning,
    getApiErrorDetail,
    type ApptView,
    type PaginatedPage,
    type NewAppointmentPrefill,
    startOfWeek,
    addDays,
    endOfDay,
    fmtDate,
    parseCalendarDate,
    sameDay,
    timeToMin,
    minToTime,
    localDateTimeToISO,
    toApptView,
    getPatientName,
} from '../../shared/appointment-helpers';
import * as styles from '../../styles';
import {
    apptBar,
    apptBlock,
    blockOverlay,
    blockOverlayLabel,
    gap1_5,
    gridDayCol,
    gridDayHead,
    gridDayHeadNum,
    highlightRing,
    icon3,
    icon4,
    miniCell,
    miniCellTextPrimary,
    miniCellTextTertiary,
    miniCellTextWhite,
    monthGridCell,
    monthGridCellNum,
    monthGridEvt,
    noRoomColHead,
    offHoursOverlay,
    roomColHead,
    roomDotColorClass,
    roomDotOnBlock,
    roomLegend,
    roomLegendDot,
    roomLegendItem,
    roomsHeaderMin,
    segmentBtn,
    statusChip,
    statusDot,
} from '../../styles';

// ── Route ─────────────────────────────────────────────────────────
export const Route = createFileRoute('/_stackedLayout/calendar')({
    validateSearch: (
        search: Record<string, unknown>
    ): {date?: string; appointmentId?: string; followUpFromRecordId?: string} => ({
        date: typeof search.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(search.date) ? search.date : undefined,
        appointmentId: typeof search.appointmentId === 'string' ? search.appointmentId : undefined,
        followUpFromRecordId: typeof search.followUpFromRecordId === 'string' ? search.followUpFromRecordId : undefined,
    }),
    component: CalendarPage,
});

// ── Grid constants ────────────────────────────────────────────────
const HOUR_H_WEEK = 56;
const HOUR_H_DAY = 64;
const GRID_START = 7;
const GRID_END = 20;
const SLOT_MINUTES = 15;
const HOURS = Array.from({length: GRID_END - GRID_START}, (_, i) => i + GRID_START);

type ViewMode = 'day' | 'week' | 'month' | 'professionals' | 'rooms';

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
    day: 'Dia',
    week: 'Semana',
    month: 'Mês',
    professionals: 'Profissionais',
    rooms: 'Salas',
};

interface ProfessionalAvailability {
    workingHoursByDay: Map<number, WorkingHours>;
    blocks: MemberBlock[];
}

interface AppointmentPlacement {
    apt: ApptView;
    attendedByMemberId: string;
    start: string;
    end: string;
}

function snapToSlot(minutes: number): number {
    return Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES;
}

// ── Overlap layout ─────────────────────────────────────────────────
interface PositionedAppt {
    apt: ApptView;
    lane: number;
    lanes: number;
}

function layoutOverlaps(appts: ApptView[]): PositionedAppt[] {
    const sorted = [...appts].sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
    const items: Array<PositionedAppt & {s: number; e: number}> = sorted.map((apt) => ({
        apt,
        s: timeToMin(apt.start),
        e: timeToMin(apt.end),
        lane: 0,
        lanes: 1,
    }));
    const groups: Array<typeof items> = [];
    let cur: typeof items = [];
    let curEnd = -1;

    for (const it of items) {
        if (it.s >= curEnd) {
            if (cur.length) groups.push(cur);
            cur = [it];
            curEnd = it.e;
        } else {
            cur.push(it);
            curEnd = Math.max(curEnd, it.e);
        }
    }

    if (cur.length) groups.push(cur);

    for (const g of groups) {
        const ends: number[] = [];

        for (const it of g) {
            let placed = false;

            for (let li = 0; li < ends.length; li++) {
                if (ends[li] <= it.s) {
                    it.lane = li;
                    ends[li] = it.e;
                    placed = true;

                    break;
                }
            }

            if (!placed) {
                it.lane = ends.length;
                ends.push(it.e);
            }
        }

        const total = ends.length;

        for (const it of g) it.lanes = total;
    }

    return items;
}

// ─────────────────────────────────────────────────────────────────
//   ApptBlock
// ─────────────────────────────────────────────────────────────────
interface ApptBlockProps {
    apt: ApptView;
    patients: Patient[];
    style: React.CSSProperties;
    compact?: boolean;
    highlight?: boolean;
    roomLabel?: string | null;
    roomColorIndex?: number;
    onClick: () => void;
    draggable?: boolean;
    onDragStart?: (event: React.DragEvent<HTMLButtonElement>) => void;
    onResizeStart?: (event: React.PointerEvent<HTMLSpanElement>) => void;
}

function ApptBlock({
    apt,
    patients,
    style,
    compact,
    highlight,
    roomLabel,
    roomColorIndex,
    onClick,
    draggable = false,
    onDragStart,
    onResizeStart,
}: ApptBlockProps) {
    return (
        <button
            type="button"
            className={apptBlock({status: apt.status, highlight: highlight ?? false})}
            style={style}
            onClick={onClick}
            draggable={draggable}
            onDragStart={onDragStart}
        >
            <span className={apptBar({status: apt.status})} />
            {roomLabel && (
                <span
                    className={cx(roomDotOnBlock, roomDotColorClass(roomColorIndex ?? 0))}
                    title={`Sala: ${roomLabel}`}
                />
            )}
            <div className={styles.apptContent}>
                <div className={styles.apptTime}>
                    {apt.start} – {apt.end}
                </div>
                <div className={styles.apptName}>
                    {apt.raw.procedure && (
                        <>
                            <ProcedureColorDot color={apt.raw.procedure.color} />{' '}
                        </>
                    )}
                    {getPatientName(patients, apt.patientId)}
                </div>
                {!compact && <div className={styles.apptType}>{apt.raw.procedure?.name ?? TYPE_LABELS[apt.type]}</div>}
            </div>
            {onResizeStart && (
                <span
                    aria-label="Redimensionar duração"
                    className={styles.apptResizeHandle}
                    onPointerDown={onResizeStart}
                />
            )}
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────
//   Availability overlay (expediente + bloqueios) — Fase 4
// ─────────────────────────────────────────────────────────────────

/** Minutos desde 00:00 até o início/fim visível da grade. */
const GRID_START_MIN = GRID_START * 60;
const GRID_END_MIN = GRID_END * 60;

interface AvailabilityOverlayProps {
    day: Date;
    workingHoursByDay: Map<number, WorkingHours>;
    blocks: MemberBlock[];
    hourHeight: number;
}

function AvailabilityOverlay({day, workingHoursByDay, blocks, hourHeight}: AvailabilityOverlayProps) {
    const toPx = (minutesFromGridStart: number) => (minutesFromGridStart / 60) * hourHeight;
    const gridHeight = toPx(GRID_END_MIN - GRID_START_MIN);

    const hours = workingHoursByDay.get(day.getDay());
    const rects: Array<{top: number; height: number}> = [];

    if (hours && !hours.active) {
        rects.push({top: 0, height: gridHeight});
    } else if (hours) {
        const startMin = Math.max(timeToMin(hours.startTime), GRID_START_MIN);
        const endMin = Math.min(timeToMin(hours.endTime), GRID_END_MIN);

        if (startMin > GRID_START_MIN) {
            rects.push({top: 0, height: toPx(startMin - GRID_START_MIN)});
        }

        if (endMin < GRID_END_MIN) {
            rects.push({top: toPx(endMin - GRID_START_MIN), height: toPx(GRID_END_MIN - endMin)});
        }
    }

    const dayStart = new Date(day);

    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = addDays(dayStart, 1);

    const dayBlocks = blocks
        .map((block) => {
            const blockStart = new Date(block.startAt);
            const blockEnd = new Date(block.endAt);

            if (blockEnd <= dayStart || blockStart >= dayEnd) return null;

            const clippedStart = blockStart < dayStart ? dayStart : blockStart;
            const clippedEnd = blockEnd > dayEnd ? dayEnd : blockEnd;
            const startMin = Math.max(clippedStart.getHours() * 60 + clippedStart.getMinutes(), GRID_START_MIN);
            const endMinRaw =
                clippedEnd.getTime() === dayEnd.getTime()
                    ? 24 * 60
                    : clippedEnd.getHours() * 60 + clippedEnd.getMinutes();
            const endMin = Math.min(endMinRaw, GRID_END_MIN);

            if (endMin <= startMin) return null;

            return {
                id: block.id,
                reason: block.reason,
                top: toPx(startMin - GRID_START_MIN),
                height: toPx(endMin - startMin),
            };
        })
        .filter((b) => b !== null);

    return (
        <>
            {rects.map((rect, index) => (
                <div
                    key={`off-${index}`}
                    role="note"
                    aria-label="Fora do expediente cadastrado"
                    className={offHoursOverlay}
                    style={{top: rect.top, height: rect.height}}
                >
                    {rect.height >= 24 && <span className={blockOverlayLabel}>Fora do expediente</span>}
                </div>
            ))}
            {dayBlocks.map((block) => {
                const label = block.reason ? `Bloqueado: ${block.reason}` : 'Bloqueio de agenda';

                return (
                    <div
                        key={block.id}
                        role="note"
                        aria-label={label}
                        className={blockOverlay}
                        style={{top: block.top, height: block.height}}
                    >
                        <span className={blockOverlayLabel}>{label}</span>
                    </div>
                );
            })}
        </>
    );
}

// ─────────────────────────────────────────────────────────────────
//   Week View
// ─────────────────────────────────────────────────────────────────
interface CalViewProps {
    appts: ApptView[];
    workingHoursByDay: Map<number, WorkingHours>;
    blocks: MemberBlock[];
    roomsById: Map<string, Room>;
    roomIndexById: Map<string, number>;
    patients: Patient[];
    cursor: Date;
    today: Date;
    now: {h: number; m: number};
    highlightId: string | null;
    onSlotClick: (d: Date, time: string, roomId?: string | null) => void;
    onApptClick: (id: string) => void;
}

/** Resolve o rótulo e a cor estável de uma sala pra desenhar o selo no bloco de consulta. */
function makeRoomBadgeResolver(roomsById: Map<string, Room>, roomIndexById: Map<string, number>) {
    return (apt: ApptView) => {
        if (!apt.roomId) return {roomLabel: null, roomColorIndex: undefined};

        return {
            roomLabel: roomsById.get(apt.roomId)?.name ?? null,
            roomColorIndex: roomIndexById.get(apt.roomId),
        };
    };
}

function WeekView({
    appts,
    patients,
    cursor,
    today,
    now,
    highlightId,
    onSlotClick,
    onApptClick,
    workingHoursByDay,
    blocks,
    roomsById,
    roomIndexById,
}: CalViewProps) {
    const ws = startOfWeek(cursor);
    const days = Array.from({length: 7}, (_, i) => addDays(ws, i));
    const resolveRoomBadge = makeRoomBadgeResolver(roomsById, roomIndexById);

    return (
        <div className={styles.weekHeaderMin}>
            {/* Header row */}
            <div className={styles.gridWeekHead}>
                <div className={styles.gridTimeColHead} />
                {days.map((d, i) => {
                    const isToday = sameDay(d, today);

                    return (
                        <div key={i} className={gridDayHead({isToday})}>
                            <div className={styles.dayOfWeekText}>{WEEKDAYS_SHORT[d.getDay()]}</div>
                            <div className={gridDayHeadNum({isToday})}>{d.getDate()}</div>
                        </div>
                    );
                })}
            </div>

            {/* Body */}
            <div className={styles.gridBody}>
                <div className={styles.gridTimeCol}>
                    {HOURS.map((h) => (
                        <div key={h} className={styles.gridTimeRow} style={{height: HOUR_H_WEEK}}>
                            <span className={styles.gridTimeLabel}>{String(h).padStart(2, '0')}:00</span>
                        </div>
                    ))}
                </div>
                {days.map((d, di) => {
                    const dayAppts = appts.filter((a) => a.date === fmtDate(d));
                    const isToday = sameDay(d, today);
                    const nowTop = isToday ? (now.h + now.m / 60 - GRID_START) * HOUR_H_WEEK : null;
                    const positioned = layoutOverlaps(dayAppts);

                    return (
                        <div key={di} className={gridDayCol({isToday})} style={{height: HOUR_H_WEEK * HOURS.length}}>
                            <AvailabilityOverlay
                                day={d}
                                workingHoursByDay={workingHoursByDay}
                                blocks={blocks}
                                hourHeight={HOUR_H_WEEK}
                            />
                            {HOURS.map((h, hi) => (
                                <div
                                    key={h}
                                    className={styles.gridSlot}
                                    style={{top: hi * HOUR_H_WEEK, height: HOUR_H_WEEK}}
                                    onClick={() => onSlotClick(d, `${String(h).padStart(2, '0')}:00`)}
                                />
                            ))}
                            {nowTop != null && nowTop >= 0 && (
                                <div className={styles.gridNowLine} style={{top: nowTop}}>
                                    <span className={styles.gridNowDot} />
                                </div>
                            )}
                            {positioned.map(({apt, lane, lanes}) => {
                                const s = timeToMin(apt.start) - GRID_START * 60;
                                const e = timeToMin(apt.end) - GRID_START * 60;
                                const top = (s / 60) * HOUR_H_WEEK;
                                const h = Math.max(((e - s) / 60) * HOUR_H_WEEK - 2, 22);
                                const wPct = 100 / lanes;
                                const lPct = lane * wPct;

                                const {roomLabel, roomColorIndex} = resolveRoomBadge(apt);

                                return (
                                    <ApptBlock
                                        key={apt.id}
                                        apt={apt}
                                        patients={patients}
                                        style={{
                                            top,
                                            height: h,
                                            left: `calc(${lPct}% + 2px)`,
                                            width: `calc(${wPct}% - 4px)`,
                                        }}
                                        compact={lanes > 1}
                                        highlight={apt.id === highlightId}
                                        roomLabel={roomLabel}
                                        roomColorIndex={roomColorIndex}
                                        onClick={() => onApptClick(apt.id)}
                                    />
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
//   Day View
// ─────────────────────────────────────────────────────────────────
function DayView({
    appts,
    patients,
    cursor,
    today,
    now,
    highlightId,
    onSlotClick,
    onApptClick,
    workingHoursByDay,
    blocks,
    roomsById,
    roomIndexById,
}: CalViewProps) {
    const isToday = sameDay(cursor, today);
    const nowTop = isToday ? (now.h + now.m / 60 - GRID_START) * HOUR_H_DAY : null;
    const dayAppts = appts.filter((a) => a.date === fmtDate(cursor));
    const positioned = layoutOverlaps(dayAppts);
    const resolveRoomBadge = makeRoomBadgeResolver(roomsById, roomIndexById);

    return (
        <div className={styles.dayHeaderMin}>
            <div className={styles.dayColHead}>
                <div className={styles.dayHeaderText}>{WEEKDAYS_LONG[cursor.getDay()]}</div>
                <div className={styles.dayHeadBaseline}>
                    <span className={styles.dayDateNum}>{cursor.getDate()}</span>
                    <span className={styles.dayHeaderText}>
                        {MONTH_NAMES[cursor.getMonth()]} · {cursor.getFullYear()}
                    </span>
                    {dayAppts.length > 0 && (
                        <span className={styles.apptCountText}>
                            {dayAppts.length} {dayAppts.length === 1 ? 'consulta' : 'consultas'}
                        </span>
                    )}
                </div>
            </div>
            <div className={styles.gridBody}>
                <div className={styles.gridTimeCol}>
                    {HOURS.map((h) => (
                        <div key={h} className={styles.gridTimeRow} style={{height: HOUR_H_DAY}}>
                            <span className={styles.gridTimeLabel}>{String(h).padStart(2, '0')}:00</span>
                        </div>
                    ))}
                </div>
                <div className={styles.dayBodyCol} style={{height: HOUR_H_DAY * HOURS.length}}>
                    <AvailabilityOverlay
                        day={cursor}
                        workingHoursByDay={workingHoursByDay}
                        blocks={blocks}
                        hourHeight={HOUR_H_DAY}
                    />
                    {HOURS.map((h, hi) => (
                        <div
                            key={h}
                            className={styles.gridSlot}
                            style={{top: hi * HOUR_H_DAY, height: HOUR_H_DAY}}
                            onClick={() => onSlotClick(cursor, `${String(h).padStart(2, '0')}:00`)}
                        />
                    ))}
                    {nowTop != null && nowTop >= 0 && (
                        <div className={styles.gridNowLine} style={{top: nowTop}}>
                            <span className={styles.gridNowDot} />
                            <span className={styles.nowTimeLabel}>
                                {String(now.h).padStart(2, '0')}:{String(now.m).padStart(2, '0')}
                            </span>
                        </div>
                    )}
                    {positioned.map(({apt, lane, lanes}) => {
                        const s = timeToMin(apt.start) - GRID_START * 60;
                        const e = timeToMin(apt.end) - GRID_START * 60;
                        const top = (s / 60) * HOUR_H_DAY;
                        const h = Math.max(((e - s) / 60) * HOUR_H_DAY - 4, 36);
                        const wPct = 100 / lanes;
                        const lPct = lane * wPct;
                        const isShort = e - s < 40;
                        const {roomLabel, roomColorIndex} = resolveRoomBadge(apt);

                        return (
                            <ApptBlock
                                key={apt.id}
                                apt={apt}
                                patients={patients}
                                style={{top, height: h, left: `calc(${lPct}% + 4px)`, width: `calc(${wPct}% - 8px)`}}
                                roomLabel={roomLabel}
                                roomColorIndex={roomColorIndex}
                                compact={isShort}
                                highlight={apt.id === highlightId}
                                onClick={() => onApptClick(apt.id)}
                            />
                        );
                    })}
                    {dayAppts.length === 0 && (
                        <div className={styles.gridEmptyDay}>
                            <CalendarX2 className={styles.emptyDayCalIcon} />
                            <div className={styles.gridEmptyDayTitle}>Sem consultas neste dia</div>
                            <div className={styles.gridEmptyDaySub}>
                                Clique em qualquer horário ou use &quot;Novo agendamento&quot;.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
//   Professionals View — agenda diária por profissional
// ─────────────────────────────────────────────────────────────────
interface ProfessionalsViewProps {
    appts: ApptView[];
    patients: Patient[];
    cursor: Date;
    now: {h: number; m: number};
    highlightId: string | null;
    professionals: ClinicMember[];
    availabilityByMember: Map<string, ProfessionalAvailability>;
    roomsById: Map<string, Room>;
    roomIndexById: Map<string, number>;
    onSlotClick: (date: Date, time: string, memberId: string) => void;
    onApptClick: (id: string) => void;
    onApptMove: (apt: ApptView, memberId: string, start: string) => void;
    onApptResize: (apt: ApptView, end: string) => void;
}

function ProfessionalsView({
    appts,
    patients,
    cursor,
    now,
    highlightId,
    professionals,
    availabilityByMember,
    roomsById,
    roomIndexById,
    onSlotClick,
    onApptClick,
    onApptMove,
    onApptResize,
}: ProfessionalsViewProps) {
    const canOverrideProcedure = useCan({has: 'procedure:override'});
    const [resizePreview, setResizePreview] = useState<{id: string; endMin: number} | null>(null);
    const dayAppts = appts.filter((apt) => apt.date === fmtDate(cursor));
    const nowTop = (now.h + now.m / 60 - GRID_START) * HOUR_H_DAY;
    const resolveRoomBadge = makeRoomBadgeResolver(roomsById, roomIndexById);

    const canMove = (apt: ApptView) => !['COMPLETED', 'CANCELLED'].includes(apt.status);

    const handleDrop = (event: React.DragEvent<HTMLDivElement>, memberId: string) => {
        event.preventDefault();

        const appointmentId = event.dataTransfer.getData('application/x-agenda-appointment');
        const apt = dayAppts.find((item) => item.id === appointmentId);

        if (!apt || !canMove(apt)) return;

        const rect = event.currentTarget.getBoundingClientRect();
        const duration = apt.raw.durationMinutes;
        const minuteAtPointer = GRID_START_MIN + ((event.clientY - rect.top) / HOUR_H_DAY) * 60;
        const startMin = Math.max(GRID_START_MIN, Math.min(snapToSlot(minuteAtPointer), GRID_END_MIN - duration));

        onApptMove(apt, memberId, minToTime(startMin));
    };

    const handleResizeStart = (event: React.PointerEvent<HTMLSpanElement>, apt: ApptView) => {
        event.preventDefault();
        event.stopPropagation();

        const column = event.currentTarget.closest<HTMLElement>('[data-professional-column]');

        if (!column) return;

        const startMin = timeToMin(apt.start);
        const rect = column.getBoundingClientRect();
        let currentEnd = timeToMin(apt.end);

        const getEndAtPointer = (clientY: number) => {
            const minuteAtPointer = GRID_START_MIN + ((clientY - rect.top) / HOUR_H_DAY) * 60;

            return Math.max(startMin + SLOT_MINUTES, Math.min(snapToSlot(minuteAtPointer), GRID_END_MIN));
        };

        const handlePointerMove = (moveEvent: PointerEvent) => {
            currentEnd = getEndAtPointer(moveEvent.clientY);
            setResizePreview({id: apt.id, endMin: currentEnd});
        };

        const handlePointerUp = () => {
            setResizePreview(null);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);

            if (currentEnd !== timeToMin(apt.end)) {
                onApptResize(apt, minToTime(currentEnd));
            }
        };

        setResizePreview({id: apt.id, endMin: currentEnd});
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp, {once: true});
    };

    if (professionals.length === 0) {
        return (
            <div className={styles.professionalsEmpty}>Nenhum profissional com agenda disponível para este acesso.</div>
        );
    }

    return (
        <div className={styles.professionalsGridMin}>
            <div className={styles.gridWeekHead}>
                <div className={styles.gridTimeColHead} />
                {professionals.map((professional) => {
                    const count = dayAppts.filter((apt) => apt.attendedByMemberId === professional.id).length;

                    return (
                        <div key={professional.id} className={styles.professionalHead}>
                            <span
                                className={styles.professionalColorDot}
                                style={{backgroundColor: professional.color ?? undefined}}
                            />
                            <span className={styles.professionalHeadName}>
                                {professional.displayName ?? 'Profissional'}
                            </span>
                            <span className={styles.professionalHeadCount}>{count}</span>
                        </div>
                    );
                })}
            </div>
            <div className={styles.gridBody}>
                <div className={styles.gridTimeCol}>
                    {HOURS.map((hour) => (
                        <div key={hour} className={styles.gridTimeRow} style={{height: HOUR_H_DAY}}>
                            <span className={styles.gridTimeLabel}>{String(hour).padStart(2, '0')}:00</span>
                        </div>
                    ))}
                </div>
                {professionals.map((professional) => {
                    const professionalAppts = dayAppts.filter((apt) => apt.attendedByMemberId === professional.id);
                    const positioned = layoutOverlaps(professionalAppts);
                    const availability = availabilityByMember.get(professional.id);

                    return (
                        <div
                            key={professional.id}
                            data-professional-column
                            className={styles.professionalColumn}
                            style={{height: HOUR_H_DAY * HOURS.length}}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => handleDrop(event, professional.id)}
                        >
                            <AvailabilityOverlay
                                day={cursor}
                                workingHoursByDay={availability?.workingHoursByDay ?? new Map()}
                                blocks={availability?.blocks ?? []}
                                hourHeight={HOUR_H_DAY}
                            />
                            {HOURS.map((hour, index) => (
                                <div
                                    key={hour}
                                    className={styles.gridSlot}
                                    style={{top: index * HOUR_H_DAY, height: HOUR_H_DAY}}
                                    onClick={() =>
                                        onSlotClick(cursor, `${String(hour).padStart(2, '0')}:00`, professional.id)
                                    }
                                />
                            ))}
                            {nowTop >= 0 && (
                                <div className={styles.gridNowLine} style={{top: nowTop}}>
                                    <span className={styles.gridNowDot} />
                                </div>
                            )}
                            {positioned.map(({apt, lane, lanes}) => {
                                const start = timeToMin(apt.start) - GRID_START_MIN;
                                const previewEnd =
                                    resizePreview?.id === apt.id ? resizePreview.endMin : timeToMin(apt.end);
                                const end = previewEnd - GRID_START_MIN;
                                const top = (start / 60) * HOUR_H_DAY;
                                const height = Math.max(((end - start) / 60) * HOUR_H_DAY - 2, 22);
                                const width = 100 / lanes;
                                const left = lane * width;
                                const displayApt =
                                    previewEnd === timeToMin(apt.end) ? apt : {...apt, end: minToTime(previewEnd)};
                                const {roomLabel, roomColorIndex} = resolveRoomBadge(apt);

                                return (
                                    <ApptBlock
                                        key={apt.id}
                                        apt={displayApt}
                                        patients={patients}
                                        style={{
                                            top,
                                            height,
                                            left: `calc(${left}% + 2px)`,
                                            width: `calc(${width}% - 4px)`,
                                        }}
                                        compact={lanes > 1 || end - start < 40}
                                        highlight={apt.id === highlightId}
                                        roomLabel={roomLabel}
                                        roomColorIndex={roomColorIndex}
                                        draggable={canMove(apt)}
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/x-agenda-appointment', apt.id);
                                        }}
                                        onResizeStart={
                                            canMove(apt) && (!apt.raw.procedure || canOverrideProcedure)
                                                ? (event) => handleResizeStart(event, apt)
                                                : undefined
                                        }
                                        onClick={() => onApptClick(apt.id)}
                                    />
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
//   Rooms View — mostra ocupação de sala num único dia (Fase 5)
// ─────────────────────────────────────────────────────────────────
interface RoomsViewProps extends CalViewProps {
    rooms: Room[];
}

interface RoomColumn {
    id: string | null;
    label: string;
    appts: ApptView[];
}

function RoomsView({
    appts,
    patients,
    cursor,
    now,
    highlightId,
    onSlotClick,
    onApptClick,
    rooms,
    roomsById,
    roomIndexById,
}: RoomsViewProps) {
    const nowTop = (now.h + now.m / 60 - GRID_START) * HOUR_H_DAY;
    const dayAppts = appts.filter((a) => a.date === fmtDate(cursor));
    const noRoomAppts = dayAppts.filter((a) => !a.roomId || !roomsById.has(a.roomId));

    const columns: RoomColumn[] = [
        ...rooms.map((room) => ({
            id: room.id,
            label: room.name,
            appts: dayAppts.filter((a) => a.roomId === room.id),
        })),
        ...(noRoomAppts.length > 0 ? [{id: null, label: 'Sem sala', appts: noRoomAppts}] : []),
    ];

    return (
        <div className={roomsHeaderMin}>
            <div className={styles.gridWeekHead}>
                <div className={styles.gridTimeColHead} />
                {columns.map((col, i) => (
                    <div key={col.id ?? '__no_room__'} className={cx(roomColHead, col.id === null && noRoomColHead)}>
                        {col.id !== null && (
                            <span className={cx(roomLegendDot, roomDotColorClass(roomIndexById.get(col.id) ?? i))} />
                        )}
                        {col.label}
                    </div>
                ))}
            </div>
            <div className={styles.gridBody}>
                <div className={styles.gridTimeCol}>
                    {HOURS.map((h) => (
                        <div key={h} className={styles.gridTimeRow} style={{height: HOUR_H_DAY}}>
                            <span className={styles.gridTimeLabel}>{String(h).padStart(2, '0')}:00</span>
                        </div>
                    ))}
                </div>
                {columns.map((col) => {
                    const positioned = layoutOverlaps(col.appts);

                    return (
                        <div
                            key={col.id ?? '__no_room__'}
                            className={gridDayCol({isToday: false})}
                            style={{height: HOUR_H_DAY * HOURS.length}}
                        >
                            {HOURS.map((h, hi) => (
                                <div
                                    key={h}
                                    className={styles.gridSlot}
                                    style={{top: hi * HOUR_H_DAY, height: HOUR_H_DAY}}
                                    onClick={() => onSlotClick(cursor, `${String(h).padStart(2, '0')}:00`, col.id)}
                                />
                            ))}
                            {nowTop >= 0 && (
                                <div className={styles.gridNowLine} style={{top: nowTop}}>
                                    <span className={styles.gridNowDot} />
                                </div>
                            )}
                            {positioned.map(({apt, lane, lanes}) => {
                                const s = timeToMin(apt.start) - GRID_START * 60;
                                const e = timeToMin(apt.end) - GRID_START * 60;
                                const top = (s / 60) * HOUR_H_DAY;
                                const h = Math.max(((e - s) / 60) * HOUR_H_DAY - 2, 22);
                                const wPct = 100 / lanes;
                                const lPct = lane * wPct;

                                return (
                                    <ApptBlock
                                        key={apt.id}
                                        apt={apt}
                                        patients={patients}
                                        style={{
                                            top,
                                            height: h,
                                            left: `calc(${lPct}% + 2px)`,
                                            width: `calc(${wPct}% - 4px)`,
                                        }}
                                        compact={lanes > 1}
                                        highlight={apt.id === highlightId}
                                        onClick={() => onApptClick(apt.id)}
                                    />
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
//   Month View
// ─────────────────────────────────────────────────────────────────
interface MonthViewProps extends CalViewProps {
    onGotoDay: (d: Date) => void;
}

function MonthView({appts, patients, cursor, today, highlightId, onSlotClick, onApptClick, onGotoDay}: MonthViewProps) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeek(monthStart);
    const cells = Array.from({length: 42}, (_, i) => addDays(gridStart, i));

    return (
        <div>
            <div className={styles.monthGridHead}>
                {WEEKDAYS_SHORT.map((w, i) => (
                    <div key={i} className={styles.monthGridHeadCell}>
                        {w.charAt(0).toUpperCase() + w.slice(1, 3)}
                    </div>
                ))}
            </div>
            <div className={styles.monthGridGrid}>
                {cells.map((d, i) => {
                    const inMonth = d.getMonth() === cursor.getMonth();
                    const isToday = sameDay(d, today);
                    const dayAppts = appts
                        .filter((a) => a.date === fmtDate(d))
                        .sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
                    const visible = dayAppts.slice(0, 3);
                    const more = dayAppts.length - visible.length;

                    return (
                        <div
                            key={i}
                            className={monthGridCell({inMonth, isToday})}
                            onClick={() => onSlotClick(d, '09:00')}
                        >
                            <div className={styles.monthGridCellHead}>
                                <button
                                    type="button"
                                    className={monthGridCellNum({isToday, inMonth})}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onGotoDay(d);
                                    }}
                                >
                                    {d.getDate()}
                                </button>
                            </div>
                            {visible.map((a) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    className={cx(
                                        monthGridEvt({status: a.status}),
                                        a.id === highlightId && highlightRing
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onApptClick(a.id);
                                    }}
                                >
                                    {a.raw.procedure && <ProcedureColorDot color={a.raw.procedure.color} />}
                                    <span className={styles.apptTimeMono}>{a.start}</span>
                                    {getPatientName(patients, a.patientId).split(' ').slice(0, 2).join(' ')}
                                </button>
                            ))}
                            {more > 0 && <div className={styles.monthGridMoreBtn}>+{more} mais</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
//   Mini Calendar
// ─────────────────────────────────────────────────────────────────
interface MiniCalProps {
    cursor: Date;
    view: ViewMode;
    appts: ApptView[];
    today: Date;
    onPickDay: (d: Date) => void;
}

function MiniCalendar({cursor, view, appts, today, onPickDay}: MiniCalProps) {
    const [mc, setMc] = useState(new Date(cursor.getFullYear(), cursor.getMonth(), 1));

    useEffect(() => {
        setMc((prev) => {
            if (cursor.getMonth() !== prev.getMonth() || cursor.getFullYear() !== prev.getFullYear()) {
                return new Date(cursor.getFullYear(), cursor.getMonth(), 1);
            }

            return prev;
        });
    }, [cursor]);

    const monthStart = new Date(mc.getFullYear(), mc.getMonth(), 1);
    const gridStart = startOfWeek(monthStart);
    const cells = Array.from({length: 42}, (_, i) => addDays(gridStart, i));
    const ws = view === 'week' ? startOfWeek(cursor) : null;
    const we = ws ? addDays(ws, 6) : null;

    const apptDates = useMemo(() => {
        const m = new Map<string, number>();

        appts.forEach((a) => m.set(a.date, (m.get(a.date) ?? 0) + 1));

        return m;
    }, [appts]);

    const label = `${MONTH_NAMES[mc.getMonth()].slice(0, 3)} ${mc.getFullYear()}`;

    return (
        <div className={styles.miniRoot}>
            <div className={styles.miniHead}>
                <span className={styles.miniMonthLabel}>{label}</span>
                <div className={styles.miniArrows}>
                    <button
                        type="button"
                        className={styles.miniArrowBtn}
                        onClick={() => setMc(new Date(mc.getFullYear(), mc.getMonth() - 1, 1))}
                    >
                        <ChevronLeft className={icon3} />
                    </button>
                    <button
                        type="button"
                        className={styles.miniArrowBtn}
                        onClick={() => setMc(new Date(mc.getFullYear(), mc.getMonth() + 1, 1))}
                    >
                        <ChevronRight className={icon3} />
                    </button>
                </div>
            </div>
            <div className={styles.miniDowRow}>
                {WEEKDAYS_SHORT.map((w, i) => (
                    <div key={i} className={styles.miniDowCell}>
                        {w.charAt(0).toUpperCase()}
                    </div>
                ))}
            </div>
            <div className={styles.miniGrid}>
                {cells.map((d, i) => {
                    const inMonth = d.getMonth() === mc.getMonth();
                    const isToday = sameDay(d, today);
                    const isSelected =
                        (view === 'day' || view === 'professionals' || view === 'rooms') && sameDay(d, cursor);
                    const inWeek = view === 'week' && ws != null && we != null && d >= ws && d <= we;
                    const has = (apptDates.get(fmtDate(d)) ?? 0) > 0;

                    return (
                        <button
                            key={i}
                            type="button"
                            className={miniCell({
                                inMonth,
                                isToday: isToday && !isSelected,
                                isSelected,
                                inWeek,
                                hasAppts: has,
                            })}
                            onClick={() => onPickDay(d)}
                        >
                            {isToday && !isSelected ? (
                                <span className={styles.miniTodayNum}>{d.getDate()}</span>
                            ) : (
                                <span
                                    className={cx(
                                        styles.miniCellNum,
                                        // eslint-disable-next-line no-nested-ternary -- conditional class chain is clearest as nested
                                        isSelected
                                            ? miniCellTextWhite
                                            : inMonth
                                              ? miniCellTextPrimary
                                              : miniCellTextTertiary
                                    )}
                                >
                                    {d.getDate()}
                                </span>
                            )}
                            {has && !isSelected && <span className={styles.miniDot} />}
                        </button>
                    );
                })}
            </div>
            <button type="button" className={styles.miniTodayBtn} onClick={() => onPickDay(today)}>
                Voltar para hoje
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
//   Main Page
// ─────────────────────────────────────────────────────────────────
export function CalendarPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const search = Route.useSearch();

    const today = useMemo(() => {
        const d = new Date();

        d.setHours(0, 0, 0, 0);

        return d;
    }, []);
    const [now, setNow] = useState({h: new Date().getHours(), m: new Date().getMinutes()});

    useEffect(() => {
        const iv = setInterval(() => {
            const d = new Date();

            setNow({h: d.getHours(), m: d.getMinutes()});
        }, 60_000);

        return () => clearInterval(iv);
    }, []);

    const [view, setView] = useState<ViewMode>('week');
    const [cursor, setCursor] = useState(() => parseCalendarDate(search.date) ?? today);
    const [statusFilters, setStatusFilters] = useState<Set<AppointmentStatus>>(new Set(ALL_STATUSES));
    const [detailId, setDetailId] = useState<string | null>(search.appointmentId ?? null);
    const [editId, setEditId] = useState<string | null>(null);
    const [cancelId, setCancelId] = useState<string | null>(null);
    const [newAppt, setNewAppt] = useState<NewAppointmentPrefill | true | null>(null);
    const [highlightId, setHighlightId] = useState<string | null>(null);
    const [pendingPlacement, setPendingPlacement] = useState<AppointmentPlacement | null>(null);
    const [placementWarning, setPlacementWarning] = useState<string | null>(null);

    useEffect(() => {
        setDetailId(search.appointmentId ?? null);

        const targetDate = parseCalendarDate(search.date);

        if (targetDate) setCursor(targetDate);
    }, [search.appointmentId, search.date]);

    const closeDetail = () => {
        setDetailId(null);

        if (search.appointmentId) {
            void navigate({to: '/calendar', search: {date: search.date}, replace: true});
        }
    };

    const visibleRange = useMemo(() => {
        if (view === 'month') {
            const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
            const rangeStart = startOfWeek(monthStart);

            return {start: rangeStart, end: endOfDay(addDays(rangeStart, 41))};
        }

        if (view === 'week') {
            const rangeStart = startOfWeek(cursor);

            return {start: rangeStart, end: endOfDay(addDays(rangeStart, 6))};
        }

        return {start: cursor, end: endOfDay(cursor)};
    }, [cursor, view]);

    // Load only the visible interval. The grid is now usable with long-running clinic schedules.
    const apptQ = useSearchAppointments({
        term: '',
        limit: 300,
        cursor: null,
        sort: {startAt: 'asc'},
        dateFrom: visibleRange.start.toISOString(),
        dateTo: visibleRange.end.toISOString(),
    }) as unknown as UseQueryResult<PaginatedPage<Appointment>>;
    const rawAppts = useMemo(() => apptQ.data?.data ?? [], [apptQ.data]);

    // Load patients
    const patQ = useSearchPatients({term: '', limit: 300, cursor: null, sort: null}) as unknown as UseQueryResult<
        PaginatedPage<Patient>
    >;
    const patients = patQ.data?.data ?? [];

    // Every visible professional gets their own availability overlay. These calls are
    // advisory for the user; the server remains the source of truth on every change.
    const manageableProfessionalsQuery = useListManageableProfessionals();
    const manageableProfessionals = useMemo(
        () => (manageableProfessionalsQuery.data ?? []).filter((member) => member.isActive),
        [manageableProfessionalsQuery.data]
    );
    const professionalIds = useMemo(
        () => manageableProfessionals.map((member) => member.id),
        [manageableProfessionals]
    );
    const availabilityWindow = useMemo(
        () => ({
            startAt: addDays(visibleRange.start, -1).toISOString(),
            endAt: addDays(visibleRange.end, 1).toISOString(),
        }),
        [visibleRange]
    );
    const workingHoursQueries = useQueries({
        queries: professionalIds.map((memberId) => getListWorkingHoursQueryOptions(memberId)),
    });
    const memberBlockQueries = useQueries({
        queries: professionalIds.map((memberId) => getListMemberBlocksQueryOptions(memberId, availabilityWindow)),
    });
    const availabilityByMember = useMemo(() => {
        const availability = new Map<string, ProfessionalAvailability>();

        professionalIds.forEach((memberId, index) => {
            const workingHoursByDay = new Map<number, WorkingHours>();

            for (const hours of workingHoursQueries[index]?.data ?? []) {
                workingHoursByDay.set(hours.dayOfWeek, hours);
            }

            availability.set(memberId, {
                workingHoursByDay,
                blocks: memberBlockQueries[index]?.data ?? [],
            });
        });

        return availability;
    }, [memberBlockQueries, professionalIds, workingHoursQueries]);
    const defaultMemberId = manageableProfessionals[0]?.id ?? '';
    const defaultAvailability = availabilityByMember.get(defaultMemberId);
    const workingHoursByDay = defaultAvailability?.workingHoursByDay ?? new Map<number, WorkingHours>();
    const blocks = defaultAvailability?.blocks ?? [];

    // Salas da clínica, para o selo de sala nas consultas e a visão "Salas" (Fase 5).
    const meQuery = useGetCurrentClinicMember();
    const clinicQuery = useGetClinic(meQuery.data?.clinicId ?? '', {query: {enabled: !!meQuery.data?.clinicId}});
    const roomManagementEnabled = clinicQuery.data?.roomManagementEnabled ?? false;
    const roomsQuery = useListRooms({query: {enabled: roomManagementEnabled}});
    const rooms = useMemo(() => roomsQuery.data ?? [], [roomsQuery.data]);

    const roomsById = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);
    const roomIndexById = useMemo(() => new Map(rooms.map((r, i) => [r.id, i])), [rooms]);

    const clinicId = meQuery.data?.clinicId;
    const refreshAppointments = useCallback(
        () => invalidateAppointmentRevenue(queryClient, clinicId),
        [queryClient, clinicId]
    );

    const allAppts = useMemo(() => rawAppts.map(toApptView), [rawAppts]);
    const filteredAppts = useMemo(() => allAppts.filter((a) => statusFilters.has(a.status)), [allAppts, statusFilters]);

    const toggleStatus = useCallback((s: AppointmentStatus) => {
        setStatusFilters((prev) => {
            const n = new Set(prev);

            if (n.has(s)) n.delete(s);
            else n.add(s);

            return n;
        });
    }, []);

    const goToday = () => setCursor(today);

    const goPrev = () => {
        if (view === 'day' || view === 'professionals' || view === 'rooms') setCursor(addDays(cursor, -1));
        else if (view === 'week') setCursor(addDays(cursor, -7));
        else setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
    };

    const goNext = () => {
        if (view === 'day' || view === 'professionals' || view === 'rooms') setCursor(addDays(cursor, 1));
        else if (view === 'week') setCursor(addDays(cursor, 7));
        else setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
    };

    const periodLabel = useMemo(() => {
        if (view === 'day' || view === 'professionals' || view === 'rooms')
            return `${cursor.getDate()} de ${MONTH_NAMES[cursor.getMonth()]} de ${cursor.getFullYear()}, ${WEEKDAYS_LONG[cursor.getDay()]}`;

        if (view === 'week') {
            const ws = startOfWeek(cursor);
            const we = addDays(ws, 6);

            if (ws.getMonth() === we.getMonth())
                return `${ws.getDate()} – ${we.getDate()} de ${MONTH_NAMES[ws.getMonth()]} de ${ws.getFullYear()}`;

            return `${ws.getDate()} ${MONTH_NAMES[ws.getMonth()].slice(0, 3)} – ${we.getDate()} ${MONTH_NAMES[we.getMonth()].slice(0, 3)} de ${we.getFullYear()}`;
        }

        const m = MONTH_NAMES[cursor.getMonth()];

        return `${m.charAt(0).toUpperCase() + m.slice(1)} ${cursor.getFullYear()}`;
    }, [view, cursor]);

    const highlightFor = (id: string) => {
        setHighlightId(id);
        setTimeout(() => setHighlightId(null), 2400);
    };

    const updateAppointment = useUpdateAppointment();
    const submitPlacement = useCallback(
        (placement: AppointmentPlacement, confirmOutsideAvailability: boolean) => {
            updateAppointment.mutate(
                {
                    id: placement.apt.id,
                    data: {
                        startAt: localDateTimeToISO(placement.apt.date, placement.start),
                        endAt:
                            !placement.apt.raw.procedure ||
                            (placement.start === placement.apt.start && placement.end !== placement.apt.end)
                                ? localDateTimeToISO(placement.apt.date, placement.end)
                                : undefined,
                        type: placement.apt.type as unknown as UpdateAppointmentInputDtoType,
                        note: placement.apt.note,
                        attendedByMemberId: placement.attendedByMemberId,
                        roomId: placement.apt.roomId,
                        confirmOutsideAvailability,
                    },
                },
                {
                    onSuccess: () => {
                        setPendingPlacement(null);
                        setPlacementWarning(null);
                        toast.success('Agendamento atualizado');
                        refreshAppointments();
                    },
                    onError: (error) => {
                        const warning = getAvailabilityWarning(error);

                        if (warning && !confirmOutsideAvailability) {
                            setPendingPlacement(placement);
                            setPlacementWarning(warning);

                            return;
                        }

                        setPendingPlacement(null);
                        setPlacementWarning(null);
                        toast.error(getApiErrorDetail(error) ?? 'Não foi possível atualizar o agendamento.');
                    },
                }
            );
        },
        [refreshAppointments, updateAppointment]
    );

    const moveAppointment = useCallback(
        (apt: ApptView, attendedByMemberId: string, start: string) => {
            const duration = apt.raw.durationMinutes;
            const end = minToTime(timeToMin(start) + duration);

            if (apt.attendedByMemberId === attendedByMemberId && apt.start === start) return;

            submitPlacement({apt, attendedByMemberId, start, end}, false);
        },
        [submitPlacement]
    );

    const resizeAppointment = useCallback(
        (apt: ApptView, end: string) => {
            if (apt.end === end) return;

            submitPlacement({apt, attendedByMemberId: apt.attendedByMemberId, start: apt.start, end}, false);
        },
        [submitPlacement]
    );

    const detailApt = allAppts.find((a) => a.id === detailId) ?? null;
    const editApt = allAppts.find((a) => a.id === editId) ?? null;
    const cancelApt = allAppts.find((a) => a.id === cancelId) ?? null;

    const sharedProps = {
        appts: filteredAppts,
        patients,
        cursor,
        today,
        now,
        highlightId,
        workingHoursByDay,
        blocks,
        roomsById,
        roomIndexById,
        onSlotClick: (d: Date, time: string, roomId?: string | null) =>
            setNewAppt({date: fmtDate(d), start: time, roomId}),
        onApptClick: setDetailId,
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <CalendarDays className={styles.headerCalIcon} />
                    <h1 className={styles.pageTitle}>Calendário</h1>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.segmented}>
                        {(
                            [
                                'day',
                                'week',
                                'month',
                                ...(manageableProfessionals.length > 1 ? (['professionals'] as const) : []),
                                ...(roomManagementEnabled && rooms.length > 0 ? (['rooms'] as const) : []),
                            ] as ViewMode[]
                        ).map((v) => (
                            <button
                                key={v}
                                type="button"
                                className={segmentBtn({active: view === v})}
                                onClick={() => setView(v)}
                            >
                                {VIEW_MODE_LABELS[v]}
                            </button>
                        ))}
                    </div>
                    <Button size="sm" className={gap1_5} onClick={() => setNewAppt(true)}>
                        <Plus className={icon4} /> Novo agendamento
                    </Button>
                </div>
            </div>

            {/* Period nav + status filters */}
            <div className={styles.periodBar}>
                <div className={styles.periodLeft}>
                    <Button size="sm" variant="outline" onClick={goToday}>
                        Hoje
                    </Button>
                    <div className={styles.arrowsGroup}>
                        <button type="button" className={styles.arrowBtn} onClick={goPrev}>
                            <ChevronLeft className={icon4} />
                        </button>
                        <button type="button" className={styles.arrowBtn} onClick={goNext}>
                            <ChevronRight className={icon4} />
                        </button>
                    </div>
                    <span className={styles.periodLabel}>{periodLabel}</span>
                </div>
                <div className={styles.statusFilterRow}>
                    {ALL_STATUSES.map((s) => (
                        <button
                            key={s}
                            type="button"
                            className={statusChip({status: s, active: statusFilters.has(s)})}
                            onClick={() => toggleStatus(s)}
                        >
                            <span className={statusDot({status: s})} />
                            {STATUS_LABELS[s]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main layout */}
            <div className={styles.mainLayout}>
                <aside className={styles.sidebar}>
                    <MiniCalendar
                        cursor={cursor}
                        view={view}
                        appts={filteredAppts}
                        today={today}
                        onPickDay={(d) => {
                            setCursor(d);

                            if (view === 'month') setView('day');
                        }}
                    />
                </aside>
                <div className={styles.calBody}>
                    {roomManagementEnabled &&
                        rooms.length > 0 &&
                        (view === 'day' || view === 'week' || view === 'professionals') && (
                            <div className={roomLegend}>
                                {rooms.map((room, i) => (
                                    <span key={room.id} className={roomLegendItem}>
                                        <span className={cx(roomLegendDot, roomDotColorClass(i))} />
                                        {room.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    {view === 'day' && <DayView {...sharedProps} />}
                    {view === 'week' && (
                        <>
                            <div className={styles.weekScrollHint}>Deslize para ver os outros dias</div>
                            <WeekView {...sharedProps} />
                        </>
                    )}
                    {view === 'professionals' && (
                        <ProfessionalsView
                            appts={filteredAppts}
                            patients={patients}
                            cursor={cursor}
                            now={now}
                            highlightId={highlightId}
                            professionals={manageableProfessionals}
                            availabilityByMember={availabilityByMember}
                            roomsById={roomsById}
                            roomIndexById={roomIndexById}
                            onSlotClick={(date, time, attendedByMemberId) =>
                                setNewAppt({date: fmtDate(date), start: time, attendedByMemberId})
                            }
                            onApptClick={setDetailId}
                            onApptMove={moveAppointment}
                            onApptResize={resizeAppointment}
                        />
                    )}
                    {view === 'rooms' && <RoomsView {...sharedProps} rooms={rooms} />}
                    {view === 'month' && (
                        <MonthView
                            {...sharedProps}
                            onGotoDay={(d) => {
                                setCursor(d);
                                setView('day');
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Detail Sheet */}
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

            {/* Edit Dialog */}
            {editApt && (
                <EditAppointmentDialog
                    apt={editApt}
                    onClose={() => setEditId(null)}
                    onSaved={() => {
                        highlightFor(editApt.id);
                        refreshAppointments();
                    }}
                />
            )}

            {/* Cancel Dialog */}
            {cancelApt && (
                <CancelDialog apt={cancelApt} onClose={() => setCancelId(null)} onCancelled={refreshAppointments} />
            )}

            {/* New Appointment Dialog */}
            {search.followUpFromRecordId && (
                <RecordFollowUpDialog
                    key={search.followUpFromRecordId}
                    recordId={search.followUpFromRecordId}
                    onDismiss={() => void navigate({to: '/calendar', search: {date: search.date}, replace: true})}
                />
            )}
            {newAppt && !search.followUpFromRecordId && (
                <NewAppointmentDialog
                    prefill={typeof newAppt === 'object' ? newAppt : null}
                    defaultMemberId={defaultMemberId}
                    onClose={() => setNewAppt(null)}
                    onSaved={() => {
                        setNewAppt(null);
                        refreshAppointments();
                    }}
                />
            )}
            <ConfirmDialog
                opened={!!pendingPlacement && !!placementWarning}
                title="Fora da disponibilidade do profissional"
                message={placementWarning ?? undefined}
                confirmLabel="Atualizar mesmo assim"
                isLoading={updateAppointment.isPending}
                onConfirm={() => {
                    if (pendingPlacement) submitPlacement(pendingPlacement, true);
                }}
                onCancel={() => {
                    setPendingPlacement(null);
                    setPlacementWarning(null);
                }}
            />
        </div>
    );
}
