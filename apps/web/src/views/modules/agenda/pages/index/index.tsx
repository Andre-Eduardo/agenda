import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSearchAppointments,
  useSearchPatients,
  useCreateAppointment,
  useUpdateAppointment,
  useCancelAppointment,
  useCheckinAppointment,
  useCallAppointment,
} from "@agenda-app/client";
import type {
  Appointment,
  Patient,
  AppointmentStatus,
  AppointmentType,
  SearchAppointmentsSortStartAt,
  CreateAppointmentDtoType,
  UpdateAppointmentInputDtoType,
} from "@agenda-app/client";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  ArrowUpRight,
  CalendarX2,
  Search,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  CalendarPlus,
  Stethoscope,
  XCircle,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/componentes/button";
import { Skeleton } from "@/components/ui/componentes/skeleton";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";
import * as S from "./styles";

export const Route = createFileRoute("/_stackedLayout/appointments")({
  component: AgendaPage,
});

// ── Constants ─────────────────────────────────────────────────────────────

const WEEKDAYS_LONG = [
  "domingo", "segunda-feira", "terça-feira", "quarta-feira",
  "quinta-feira", "sexta-feira", "sábado",
];
const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const MONTH_NAMES_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const WEEK_HOUR_H = 56; // px per hour in week view
const DAY_HOUR_H  = 64; // px per hour in day view
const START_HOUR  = 7;
const END_HOUR    = 20;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

const DURATIONS = [
  { v: 30,  label: "30 minutos" },
  { v: 45,  label: "45 minutos" },
  { v: 60,  label: "1 hora" },
  { v: 90,  label: "1h 30min" },
  { v: 120, label: "2 horas" },
];

const TYPES: AppointmentType[] = ["FIRST_VISIT", "RETURN", "WALK_IN", "TELEMEDICINE", "PROCEDURE"];

const TYPE_LABELS: Record<AppointmentType, string> = {
  FIRST_VISIT:  "Primeira consulta",
  RETURN:       "Retorno",
  WALK_IN:      "Urgência",
  TELEMEDICINE: "Teleconsulta",
  PROCEDURE:    "Procedimento",
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED:   "Agendado",
  CONFIRMED:   "Confirmado",
  COMPLETED:   "Realizado",
  CANCELLED:   "Cancelado",
  NO_SHOW:     "Faltou",
  ARRIVED:     "Chegou",
  IN_PROGRESS: "Em atendimento",
};

// ── Types ─────────────────────────────────────────────────────────────────

type View = "day" | "week" | "month";
type DisplayStatus = "scheduled" | "confirmed" | "done" | "cancelled" | "noshow";

interface AppointmentPage { totalCount: number; data: Appointment[] }
interface PatientPage    { totalCount: number; data: Patient[]      }

interface SlotPrefill { dateStr: string; timeStr: string }

// ── Status mapping ────────────────────────────────────────────────────────

const API_TO_DISPLAY: Record<AppointmentStatus, DisplayStatus> = {
  SCHEDULED:   "scheduled",
  CONFIRMED:   "confirmed",
  ARRIVED:     "confirmed",
  IN_PROGRESS: "confirmed",
  COMPLETED:   "done",
  CANCELLED:   "cancelled",
  NO_SHOW:     "noshow",
};

const DISPLAY_STATUS_DEF: Array<{ key: DisplayStatus; label: string }> = [
  { key: "scheduled", label: "Agendado" },
  { key: "confirmed", label: "Confirmado" },
  { key: "done",      label: "Realizado" },
  { key: "cancelled", label: "Cancelado" },
  { key: "noshow",    label: "Faltou" },
];

// ── Date helpers ──────────────────────────────────────────────────────────

function toDateStr(iso: string): string {
  const d = new Date(iso);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toTimeStr(iso: string): string {
  const d = new Date(iso);

  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toISO(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}`).toISOString();
}

function todayDateStr(): string {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);

  return h * 60 + m;
}

function minToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);

  r.setDate(d.getDate() + n);

  return r;
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  const r = new Date(d);

  r.setDate(d.getDate() + diff);
  r.setHours(0, 0, 0, 0);

  return r;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtRelDate(iso: string): string {
  const d = new Date(iso);
  const t = new Date();

  t.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - t.getTime()) / 86400000);
  const abs = `${String(d.getDate()).padStart(2, "0")} ${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getFullYear()}`;

  if (diff === 0) return `Hoje · ${abs}`;

  if (diff === -1) return `Ontem · ${abs}`;

  if (diff === 1) return `Amanhã · ${abs}`;

  if (diff < 0 && diff > -7) return `há ${Math.abs(diff)} dias · ${abs}`;

  return abs;
}

// ── Overlap layout ────────────────────────────────────────────────────────

interface PositionedAppt {
  apt: Appointment;
  s: number;
  e: number;
  lane: number;
  lanes: number;
}

function layoutOverlaps(appts: Appointment[], hourH: number): PositionedAppt[] {
  const sorted = [...appts].sort((a, b) =>
    timeToMin(toTimeStr(a.startAt)) - timeToMin(toTimeStr(b.startAt)),
  );
  const items: PositionedAppt[] = sorted.map((apt) => ({
    apt,
    s: timeToMin(toTimeStr(apt.startAt)),
    e: timeToMin(toTimeStr(apt.endAt)),
    lane: 0,
    lanes: 1,
  }));

  const groups: PositionedAppt[][] = [];
  let current: PositionedAppt[] = [];
  let curEnd = -1;

  for (const it of items) {
    if (it.s >= curEnd) {
      if (current.length) groups.push(current);
      current = [it];
      curEnd = it.e;
    } else {
      current.push(it);
      curEnd = Math.max(curEnd, it.e);
    }
  }

  if (current.length) groups.push(current);

  for (const g of groups) {
    const laneEnds: number[] = [];

    for (const it of g) {
      let placed = false;

      for (let li = 0; li < laneEnds.length; li++) {
        if (laneEnds[li] <= it.s) {
          it.lane = li;
          laneEnds[li] = it.e;
          placed = true;

          break;
        }
      }

      if (!placed) {
        it.lane = laneEnds.length;
        laneEnds.push(it.e);
      }
    }

    const total = laneEnds.length;

    for (const it of g) it.lanes = total;
  }

  return items;
}

function patientEmail(p: Patient): string | null {
  return typeof p.email === "string" ? p.email : null;
}

function apptNote(apt: Appointment): string | null {
  return typeof apt.note === "string" ? apt.note : null;
}

// ── Avatar helper ─────────────────────────────────────────────────────────

function getAvatarVariant(id: string): string {
  let hash = 0;

  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;

  return S.avatarVariants[hash % S.avatarVariants.length];
}

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

// ── ApptBlock ─────────────────────────────────────────────────────────────

function ApptBlock({
  apt,
  patient,
  style,
  compact,
  highlight,
  onClick,
}: {
  apt: Appointment;
  patient: Patient | undefined;
  style: React.CSSProperties;
  compact?: boolean;
  highlight?: boolean;
  onClick: () => void;
}) {
  const timeStr = `${toTimeStr(apt.startAt)} – ${toTimeStr(apt.endAt)}`;
  const name = patient?.name ?? "—";

  return (
    <button
      className={S.apptBlock({ status: apt.status as AppointmentStatus, highlight })}
      style={style}
      onClick={onClick}
    >
      <div className={cn(S.apptBar, S.apptBarCls[apt.status as AppointmentStatus])} />
      <div className={S.apptContent}>
        <div className={cn(S.apptTimeBase, S.apptTimeCls[apt.status as AppointmentStatus])}>
          {timeStr}
        </div>
        <div className={cn(S.apptNameBase, S.apptNameCls[apt.status as AppointmentStatus])}>
          {name}
        </div>
        {!compact && (
          <div className={S.apptTypeLbl}>{TYPE_LABELS[apt.type as AppointmentType]}</div>
        )}
      </div>
    </button>
  );
}

// ── MiniCalendar ──────────────────────────────────────────────────────────

function MiniCalendar({
  cursor,
  view,
  appts,
  onPickDay,
}: {
  cursor: Date;
  view: View;
  appts: Appointment[];
  onPickDay: (d: Date) => void;
}) {
  const [monthCursor, setMonthCursor] = useState(
    () => new Date(cursor.getFullYear(), cursor.getMonth(), 1),
  );

  useEffect(() => {
    if (
      cursor.getMonth() !== monthCursor.getMonth() ||
      cursor.getFullYear() !== monthCursor.getFullYear()
    ) {
      setMonthCursor(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
    }
  }, [cursor, monthCursor]);

  const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const gridStart  = startOfWeek(monthStart);
  const cells      = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today      = new Date();

  const weekSt = view === "week" ? startOfWeek(cursor) : null;
  const weekEd = weekSt ? addDays(weekSt, 6) : null;

  const apptDates = useMemo(() => {
    const m = new Map<string, number>();

    appts.forEach((a) => {
      const k = toDateStr(a.startAt);

      m.set(k, (m.get(k) ?? 0) + 1);
    });

    return m;
  }, [appts]);

  const label = `${MONTH_NAMES_SHORT[monthCursor.getMonth()]} ${monthCursor.getFullYear()}`;

  return (
    <div className={S.miniCal.root}>
      <div className={S.miniCal.head}>
        <span className={S.miniCal.monthLabel}>{label}</span>
        <div className={S.miniCal.arrowsRow}>
          <button
            className={S.miniCal.arrowBtn}
            onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            className={S.miniCal.arrowBtn}
            onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      <div className={S.miniCal.dowRow}>
        {WEEKDAYS_SHORT.map((w) => (
          <div key={w} className={S.miniCal.dowCell}>{w[0]}</div>
        ))}
      </div>

      <div className={S.miniCal.grid}>
        {cells.map((d, i) => {
          const inMonth   = d.getMonth() === monthCursor.getMonth();
          const isToday   = sameDay(d, today);
          const isSelected = view === "day" && sameDay(d, cursor);
          const inWeek    = view === "week" && weekSt && weekEd && d >= weekSt && d <= weekEd;
          const hasAppt   = (apptDates.get(dateToStr(d)) ?? 0) > 0;

          let state: "default" | "off" | "today" | "selected" | "inWeek" = "default";

          if (!inMonth)   state = "off";
          else if (isSelected) state = "selected";
          else if (inWeek) state = "inWeek";
          else if (isToday) state = "today";

          return (
            <button key={i} className={S.miniCalCell({ state })} onClick={() => onPickDay(d)}>
              <span className={S.miniCalNum}>{d.getDate()}</span>
              {hasAppt && state !== "selected" && <span className={S.miniCalDot} />}
            </button>
          );
        })}
      </div>

      <button className={S.miniCal.todayBtn} onClick={() => onPickDay(new Date())}>
        <Calendar className="size-3" />
        Voltar para hoje
      </button>
    </div>
  );
}

// ── DayView ───────────────────────────────────────────────────────────────

function DayView({
  cursor,
  appts,
  patientMap,
  highlightId,
  onSlotClick,
  onApptClick,
}: {
  cursor: Date;
  appts: Appointment[];
  patientMap: Map<string, Patient>;
  highlightId: string | null;
  onSlotClick: (prefill: SlotPrefill) => void;
  onApptClick: (id: string) => void;
}) {
  const today   = new Date();
  const isToday = sameDay(cursor, today);
  const now     = { h: today.getHours(), m: today.getMinutes() };
  const nowTop  = isToday ? ((now.h + now.m / 60) - START_HOUR) * DAY_HOUR_H : null;

  const dayAppts = appts.filter((a) => toDateStr(a.startAt) === dateToStr(cursor));
  const positioned = layoutOverlaps(dayAppts, DAY_HOUR_H);

  return (
    <div>
      {/* Day header */}
      <div className={S.dayViewHead}>
        <div className={S.dayViewDow}>{WEEKDAYS_LONG[cursor.getDay()]}</div>
        <div className={S.dayViewNumRow}>
          <span className={S.dayViewNum}>{cursor.getDate()}</span>
          <span className={S.dayViewMonth}>
            {MONTH_NAMES[cursor.getMonth()]} · {cursor.getFullYear()}
          </span>
          {dayAppts.length > 0 && (
            <span className={S.dayViewCount}>
              {dayAppts.length} {dayAppts.length === 1 ? "consulta" : "consultas"}
            </span>
          )}
        </div>
      </div>

      {/* Time grid */}
      <div className="flex">
        {/* Time labels */}
        <div className={S.timeCol}>
          {HOURS.map((h) => (
            <div key={h} className={S.timeRow} style={{ height: DAY_HOUR_H }}>
              <span className={S.timeLbl}>{String(h).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>

        {/* Day column */}
        <div
          className={S.dayColSolo}
          style={{ height: DAY_HOUR_H * HOURS.length }}
        >
          {HOURS.map((h, hi) => (
            <div
              key={h}
              className={S.hourSlot}
              style={{ top: hi * DAY_HOUR_H, height: DAY_HOUR_H }}
              onClick={() =>
                onSlotClick({
                  dateStr: dateToStr(cursor),
                  timeStr: `${String(h).padStart(2, "0")}:00`,
                })
              }
            />
          ))}

          {nowTop != null && nowTop >= 0 && nowTop <= DAY_HOUR_H * HOURS.length && (
            <div className={S.nowLine} style={{ top: nowTop }}>
              <span className={S.nowDot} />
              <div className={S.nowBar} />
              <span className={S.nowTime}>
                {String(now.h).padStart(2, "0")}:{String(now.m).padStart(2, "0")}
              </span>
            </div>
          )}

          {positioned.map(({ apt, lane, lanes }) => {
            const s   = timeToMin(toTimeStr(apt.startAt)) - START_HOUR * 60;
            const e   = timeToMin(toTimeStr(apt.endAt)) - START_HOUR * 60;
            const top = (s / 60) * DAY_HOUR_H;
            const h   = Math.max(((e - s) / 60) * DAY_HOUR_H - 4, 36);
            const w   = 100 / lanes;
            const l   = lane * w;

            return (
              <ApptBlock
                key={apt.id}
                apt={apt}
                patient={patientMap.get(apt.patientId)}
                style={{
                  top,
                  height: h,
                  left: `calc(${l}% + 4px)`,
                  width: `calc(${w}% - 8px)`,
                }}
                compact={(e - s) < 40}
                highlight={apt.id === highlightId}
                onClick={() => onApptClick(apt.id)}
              />
            );
          })}

          {dayAppts.length === 0 && (
            <div className={S.emptyDay}>
              <CalendarX2 className="size-7" strokeWidth={1.5} />
              <div className={S.emptyDayTitle}>Sem consultas neste dia</div>
              <div className={S.emptyDaySub}>
                Clique em qualquer horário ou use "Novo agendamento" acima.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── WeekView ──────────────────────────────────────────────────────────────

function WeekView({
  cursor,
  appts,
  patientMap,
  highlightId,
  onSlotClick,
  onApptClick,
}: {
  cursor: Date;
  appts: Appointment[];
  patientMap: Map<string, Patient>;
  highlightId: string | null;
  onSlotClick: (prefill: SlotPrefill) => void;
  onApptClick: (id: string) => void;
}) {
  const weekStart = startOfWeek(cursor);
  const days      = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today     = new Date();
  const now       = { h: today.getHours(), m: today.getMinutes() };

  return (
    <div className={S.weekGrid}>
      {/* Header */}
      <div className={S.weekHead}>
        <div className={S.timeColHead} />
        {days.map((d, i) => {
          const isToday = sameDay(d, today);

          return (
            <div key={i} className={S.dayHead({ today: isToday })}>
              <span className={S.dayHeadDow}>{WEEKDAYS_SHORT[d.getDay()]}</span>
              <span className={S.dayHeadNum({ today: isToday })}>{d.getDate()}</span>
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div className={S.weekBody}>
        {/* Time column */}
        <div className={S.timeCol}>
          {HOURS.map((h) => (
            <div key={h} className={S.timeRow} style={{ height: WEEK_HOUR_H }}>
              <span className={S.timeLbl}>{String(h).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((d, di) => {
          const isToday  = sameDay(d, today);
          const dayAppts = appts.filter((a) => toDateStr(a.startAt) === dateToStr(d));
          const positioned = layoutOverlaps(dayAppts, WEEK_HOUR_H);
          const nowTop = isToday
            ? ((now.h + now.m / 60) - START_HOUR) * WEEK_HOUR_H
            : null;

          return (
            <div
              key={di}
              className={S.dayCol({ today: isToday })}
              style={{ height: WEEK_HOUR_H * HOURS.length }}
            >
              {HOURS.map((h, hi) => (
                <div
                  key={h}
                  className={S.hourSlot}
                  style={{ top: hi * WEEK_HOUR_H, height: WEEK_HOUR_H }}
                  onClick={() =>
                    onSlotClick({
                      dateStr: dateToStr(d),
                      timeStr: `${String(h).padStart(2, "0")}:00`,
                    })
                  }
                />
              ))}

              {nowTop != null && nowTop >= 0 && nowTop <= WEEK_HOUR_H * HOURS.length && (
                <div className={S.nowLine} style={{ top: nowTop }}>
                  <span className={S.nowDot} />
                  <div className={S.nowBar} />
                </div>
              )}

              {positioned.map(({ apt, lane, lanes }) => {
                const s   = timeToMin(toTimeStr(apt.startAt)) - START_HOUR * 60;
                const e   = timeToMin(toTimeStr(apt.endAt)) - START_HOUR * 60;
                const top = (s / 60) * WEEK_HOUR_H;
                const h   = Math.max(((e - s) / 60) * WEEK_HOUR_H - 2, 22);
                const w   = 100 / lanes;
                const l   = lane * w;

                return (
                  <ApptBlock
                    key={apt.id}
                    apt={apt}
                    patient={patientMap.get(apt.patientId)}
                    style={{
                      top,
                      height: h,
                      left: `calc(${l}% + 2px)`,
                      width: `calc(${w}% - 4px)`,
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

// ── DayPopover (month overflow) ───────────────────────────────────────────

function DayPopover({
  dateStr,
  appts,
  patientMap,
  onClose,
  onApptClick,
}: {
  dateStr: string;
  appts: Appointment[];
  patientMap: Map<string, Patient>;
  onClose: () => void;
  onApptClick: (id: string) => void;
}) {
  const dayAppts = appts
    .filter((a) => toDateStr(a.startAt) === dateStr)
    .sort((a, b) => timeToMin(toTimeStr(a.startAt)) - timeToMin(toTimeStr(b.startAt)));
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };

    window.addEventListener("keydown", h);

    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className={S.popOverlay} onClick={onClose}>
      <div className={S.popContent} onClick={(e) => e.stopPropagation()}>
        <div className={S.popHead}>
          <div>
            <div className={S.popDow}>{WEEKDAYS_LONG[date.getDay()]}</div>
            <div className={S.popDate}>
              {date.getDate()} de {MONTH_NAMES[date.getMonth()]}
            </div>
          </div>
          <button
            onClick={onClose}
            className={S.shCloseBtn}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className={S.popList}>
          {dayAppts.map((a) => {
            const p = patientMap.get(a.patientId);

            return (
              <button
                key={a.id}
                className={S.popRow}
                onClick={() => { onApptClick(a.id); onClose(); }}
              >
                <span className={S.popTime}>
                  {toTimeStr(a.startAt)} – {toTimeStr(a.endAt)}
                </span>
                <span className={S.popName}>{p?.name ?? "—"}</span>
                <span className={S.apptTimeLabel}>
                  {TYPE_LABELS[a.type as AppointmentType]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── MonthView ─────────────────────────────────────────────────────────────

function MonthView({
  cursor,
  appts,
  patientMap,
  highlightId,
  onSlotClick,
  onApptClick,
  onGotoDay,
}: {
  cursor: Date;
  appts: Appointment[];
  patientMap: Map<string, Patient>;
  highlightId: string | null;
  onSlotClick: (prefill: SlotPrefill) => void;
  onApptClick: (id: string) => void;
  onGotoDay: (d: Date) => void;
}) {
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart  = startOfWeek(monthStart);
  const cells      = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today      = new Date();
  const [expandDay, setExpandDay] = useState<string | null>(null);

  return (
    <div className={S.monthWrapper}>
      <div className={S.monthHead}>
        {WEEKDAYS_SHORT.map((w) => (
          <div key={w} className={S.monthHeadCell}>{w}</div>
        ))}
      </div>
      <div className={S.monthCells}>
        {cells.map((d, i) => {
          const inMonth  = d.getMonth() === cursor.getMonth();
          const isToday  = sameDay(d, today);
          const dStr     = dateToStr(d);
          const dayAppts = appts
            .filter((a) => toDateStr(a.startAt) === dStr)
            .sort((a, b) => timeToMin(toTimeStr(a.startAt)) - timeToMin(toTimeStr(b.startAt)));
          const visible  = dayAppts.slice(0, 3);
          const more     = dayAppts.length - visible.length;

          return (
            <div
              key={i}
              className={S.monthCell({ off: !inMonth })}
              onClick={() => onSlotClick({ dateStr: dStr, timeStr: "09:00" })}
            >
              <button
                className={S.monthCellNum({ today: isToday })}
                onClick={(e) => { e.stopPropagation(); onGotoDay(d); }}
              >
                {d.getDate()}
              </button>
              {visible.map((a) => {
                const displayStatus = API_TO_DISPLAY[a.status as AppointmentStatus];
                const evtCls = S.monthEvtCls[displayStatus] ?? S.monthEvtCls[a.status as string];

                return (
                  <button
                    key={a.id}
                    className={cn(S.monthEvtBase, evtCls, a.id === highlightId && "ring-1 ring-(--color-primary)")}
                    onClick={(e) => { e.stopPropagation(); onApptClick(a.id); }}
                  >
                    <span className={S.apptMonoTime}>
                      {toTimeStr(a.startAt)}
                    </span>
                    <span className="truncate">{patientMap.get(a.patientId)?.name ?? "—"}</span>
                  </button>
                );
              })}
              {more > 0 && (
                <button
                  className={S.monthMoreBtn}
                  onClick={(e) => { e.stopPropagation(); setExpandDay(dStr); }}
                >
                  + {more} mais
                </button>
              )}
            </div>
          );
        })}
      </div>
      {expandDay && (
        <DayPopover
          dateStr={expandDay}
          appts={appts}
          patientMap={patientMap}
          onClose={() => setExpandDay(null)}
          onApptClick={onApptClick}
        />
      )}
    </div>
  );
}

// ── AppointmentDetailSheet ────────────────────────────────────────────────

function AppointmentDetailSheet({
  apt,
  patientMap,
  onClose,
  onNavigateToPatient,
}: {
  apt: Appointment;
  patientMap: Map<string, Patient>;
  onClose: () => void;
  onNavigateToPatient: (patientId: string) => void;
}) {
  const queryClient = useQueryClient();
  const patient  = patientMap.get(apt.patientId);

  const durMin   = timeToMin(toTimeStr(apt.endAt)) - timeToMin(toTimeStr(apt.startAt));
  const durLabel = durMin >= 60
    ? `${Math.floor(durMin / 60)}h${durMin % 60 ? ` ${durMin % 60}min` : ""}`
    : `${durMin} min`;

  const aptDate  = new Date(apt.startAt);
  const dateLabel = `${WEEKDAYS_LONG[aptDate.getDay()]}, ${aptDate.getDate()} de ${MONTH_NAMES[aptDate.getMonth()]} de ${aptDate.getFullYear()}`;

  const [editing, setEditing] = useState(false);
  const [editDate, setEditDate] = useState(toDateStr(apt.startAt));
  const [editStart, setEditStart] = useState(toTimeStr(apt.startAt));
  const [editDuration, setEditDuration] = useState(durMin);
  const [editType, setEditType] = useState<AppointmentType>(apt.type as AppointmentType);
  const [editNote, setEditNote] = useState(apptNote(apt) ?? "");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const updateMutation  = useUpdateAppointment();
  const cancelMutation  = useCancelAppointment();
  const checkinMutation = useCheckinAppointment();
  const callMutation    = useCallAppointment();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/v1/appointments"] });

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editing) setEditing(false);
        else if (showCancel) setShowCancel(false);
        else onClose();
      }
    };

    window.addEventListener("keydown", h);

    return () => window.removeEventListener("keydown", h);
  }, [editing, showCancel, onClose]);

  function startEdit() {
    setEditDate(toDateStr(apt.startAt));
    setEditStart(toTimeStr(apt.startAt));
    setEditDuration(durMin);
    setEditType(apt.type as AppointmentType);
    setEditNote(apptNote(apt) ?? "");
    setEditing(true);
  }

  function saveEdit() {
    const sMin = timeToMin(editStart);
    const eMin = sMin + editDuration;

    updateMutation.mutate(
      {
        id: apt.id,
        data: {
          startAt: toISO(editDate, editStart),
          endAt:   toISO(editDate, minToTime(eMin)),
          type:    editType as UpdateAppointmentInputDtoType,
          note:    editNote || null,
        },
      },
      {
        onSuccess: () => {
          invalidate();
          setEditing(false);
          onClose();
        },
      },
    );
  }

  function doCancel() {
    if (!cancelReason.trim()) return;
    cancelMutation.mutate(
      { id: apt.id, data: { reason: cancelReason } },
      {
        onSuccess: () => {
          invalidate();
          setShowCancel(false);
          onClose();
        },
      },
    );
  }

  function doCheckin() {
    checkinMutation.mutate(
      { id: apt.id },
      { onSuccess: () => { invalidate(); onClose(); } },
    );
  }

  function doCall() {
    callMutation.mutate(
      { id: apt.id },
      { onSuccess: () => { invalidate(); onClose(); } },
    );
  }

  const status = apt.status as AppointmentStatus;

  return (
    <>
      <div className={S.sheetOverlay} onClick={onClose} />
      <div className={S.sheetPanel}>
        {/* Head */}
        <div className={S.shHead}>
          <div className={S.shTitleBlock}>
            <span className={S.shEyebrow}>{editing ? "Editar agendamento" : "Agendamento"}</span>
            {!editing && (
              <div className={S.shStatusRow}>
                <span className={S.statusBadge({ status })}>
                  <span className={S.statusDot} />
                  {STATUS_LABELS[status]}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className={S.shCloseBtn}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className={S.shBody}>
          {/* Patient */}
          <div className={S.shPatientCard}>
            {patient && (
              <div className={cn(S.avatarSm, getAvatarVariant(patient.id))}>
                {getInitials(patient.name)}
              </div>
            )}
            <div className={S.shPatientInfo}>
              <div className={S.shPatientName}>{patient?.name ?? "—"}</div>
              {patient && patientEmail(patient) && (
                <div className={S.shPatientMeta}>{patientEmail(patient)}</div>
              )}
            </div>
            {patient && (
              <button
                className={S.shPatientLink}
                onClick={() => onNavigateToPatient(patient.id)}
              >
                Ver perfil <ArrowUpRight className="size-3" />
              </button>
            )}
          </div>

          {/* Schedule — view or edit */}
          {!editing ? (
            <div className={S.shSection}>
              <div className={S.shSecHead}>Horário</div>
              <div className={S.shInfoGrid}>
                <div className={S.shKV}>
                  <span className={S.shK}>Data</span>
                  <span className={S.shV}>{dateLabel}</span>
                </div>
                <div className={S.shKV}>
                  <span className={S.shK}>Horário</span>
                  <span className={S.shVMono}>
                    {toTimeStr(apt.startAt)} – {toTimeStr(apt.endAt)}
                  </span>
                </div>
                <div className={S.shKV}>
                  <span className={S.shK}>Duração</span>
                  <span className={S.shV}>{durLabel}</span>
                </div>
                <div className={S.shKV}>
                  <span className={S.shK}>Tipo</span>
                  <span className={S.shV}>{TYPE_LABELS[apt.type as AppointmentType]}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={S.shSection}>
              <div className={S.shSecHead}>Editar horário</div>
              <div className={S.formGrid}>
                <div>
                  <label className={S.fieldLabel}>Data</label>
                  <input
                    type="date"
                    className={S.inputBase}
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className={S.fieldLabel}>Horário de início</label>
                  <input
                    type="time"
                    className={S.inputBase}
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className={S.fieldLabel}>Duração</label>
                  <select
                    className={S.selectBase}
                    value={editDuration}
                    onChange={(e) => setEditDuration(Number(e.target.value))}
                  >
                    {DURATIONS.map((d) => (
                      <option key={d.v} value={d.v}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={S.fieldLabel}>Tipo</label>
                  <select
                    className={S.selectBase}
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as AppointmentType)}
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {!editing ? (
            <div className={S.shSection}>
              <div className={S.shSecHead}>Observações</div>
              <p className={S.shNotes({ empty: !apptNote(apt) })}>
                {apptNote(apt) || "Sem observações registradas."}
              </p>
            </div>
          ) : (
            <div>
              <label className={S.fieldLabel}>
                Observações <span className="text-(--color-text-tertiary)">opcional</span>
              </label>
              <textarea
                className={S.textareaBase}
                rows={3}
                placeholder="Informações adicionais..."
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className={S.shFoot}>
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Descartar
              </Button>
              <Button
                size="sm"
                onClick={saveEdit}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Salvando…" : "Salvar alterações"}
              </Button>
            </>
          ) : (
            <>
              {(status === "SCHEDULED" || status === "CONFIRMED") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancel(true)}
                >
                  <XCircle className="size-3.5" />
                  Cancelar
                </Button>
              )}
              {(status === "SCHEDULED" || status === "CONFIRMED") && (
                <Button variant="outline" size="sm" onClick={startEdit}>
                  Reagendar
                </Button>
              )}
              {status === "SCHEDULED" && (
                <Button size="sm" onClick={doCheckin} disabled={checkinMutation.isPending}>
                  <CheckCircle2 className="size-3.5" />
                  Check-in
                </Button>
              )}
              {status === "ARRIVED" && (
                <Button size="sm" onClick={doCall} disabled={callMutation.isPending}>
                  <Stethoscope className="size-3.5" />
                  Chamar
                </Button>
              )}
              {(status === "CANCELLED" || status === "NO_SHOW") && (
                <Button size="sm" onClick={startEdit}>
                  <RotateCcw className="size-3.5" />
                  Reagendar
                </Button>
              )}
              {status === "NO_SHOW" && (
                <Button variant="outline" size="sm">
                  <Phone className="size-3.5" />
                  Contatar
                </Button>
              )}
              {status === "COMPLETED" && (
                <Button variant="outline" size="sm">
                  <CalendarPlus className="size-3.5" />
                  Agendar retorno
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Cancel confirm */}
      {showCancel && (
        <div className={S.modalOverlay} onClick={(e) => { e.stopPropagation(); setShowCancel(false); }}>
          <div className={S.modal} onClick={(e) => e.stopPropagation()}>
            <div className={S.modalHead}>
              <div className={S.modalIcon}>
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className={S.modalTitle}>Cancelar agendamento?</p>
                <p className={S.modalDesc}>
                  A consulta de {patient?.name ?? "—"} em {toTimeStr(apt.startAt)} será marcada como cancelada.
                </p>
              </div>
            </div>
            <div>
              <label className={S.fieldLabel}>
                Motivo do cancelamento <span className="text-(--color-danger)">*</span>
              </label>
              <textarea
                className={S.textareaBase}
                rows={2}
                placeholder="Informe o motivo..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div className={S.modalActions}>
              <Button variant="ghost" size="sm" onClick={() => setShowCancel(false)}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!cancelReason.trim() || cancelMutation.isPending}
                onClick={doCancel}
              >
                Confirmar cancelamento
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── NewAppointmentSheet ───────────────────────────────────────────────────

function NewAppointmentSheet({
  prefill,
  allAppts,
  onClose,
}: {
  prefill: SlotPrefill | null;
  allAppts: Appointment[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const userId = useAppStore((s) => s.userId);

  const [patientQuery, setPatientQuery]     = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [patient, setPatient]               = useState<Patient | null>(null);
  const [showSugg, setShowSugg]             = useState(false);
  const [date, setDate]     = useState(prefill?.dateStr ?? todayDateStr());
  const [start, setStart]   = useState(prefill?.timeStr ?? "09:00");
  const [duration, setDur]  = useState(45);
  const [type, setType]     = useState<AppointmentType>("RETURN");
  const [note, setNote]     = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(patientQuery), 250);

    return () => clearTimeout(t);
  }, [patientQuery]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };

    window.addEventListener("keydown", h);

    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const patientsQuery = useSearchPatients({
    term: debouncedQuery,
    limit: 8,
    cursor: null,
    sort: null,
  }) as unknown as UseQueryResult<PatientPage>;

  const suggestions = patientsQuery.data?.data ?? [];

  const conflict = useMemo(() => {
    if (!date || !start) return null;
    const sMin = timeToMin(start);
    const eMin = sMin + duration;
    const same = allAppts.find((a) => {
      if (toDateStr(a.startAt) !== date) return false;

      if (a.status === "CANCELLED" || a.status === "NO_SHOW") return false;
      const as_ = timeToMin(toTimeStr(a.startAt));
      const ae  = timeToMin(toTimeStr(a.endAt));

      return sMin < ae && eMin > as_;
    });

    return same ?? null;
  }, [date, start, duration, allAppts]);

  const createMutation = useCreateAppointment();

  function submit() {
    const err: Record<string, string> = {};

    if (!patient) err.patient = "Selecione um paciente";

    if (!date)   err.date    = "Informe a data";

    if (!start)  err.start   = "Informe o horário";
    setErrors(err);

    if (Object.keys(err).length) return;

    const sMin = timeToMin(start);
    const eMin = sMin + duration;

    createMutation.mutate(
      {
        data: {
          patientId:          patient!.id,
          attendedByMemberId: userId ?? "",
          startAt:            toISO(date, start),
          endAt:              toISO(date, minToTime(eMin)),
          type:               type as CreateAppointmentDtoType,
          note:               note || null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/v1/appointments"] });
          onClose();
        },
      },
    );
  }

  const dateLabel = (() => {
    if (!date) return "";
    const [y, m, d] = date.split("-").map(Number);
    const dt = new Date(y, m - 1, d);

    return `${WEEKDAYS_LONG[dt.getDay()]}, ${dt.getDate()} de ${MONTH_NAMES[dt.getMonth()]}`;
  })();

  return (
    <>
      <div className={S.sheetOverlay} onClick={onClose} />
      <div className={S.sheetPanel}>
        {/* Head */}
        <div className={S.shHead}>
          <div className={S.shTitleBlock}>
            <span className={S.shEyebrow}>Novo</span>
            <span className={S.shH}>Novo agendamento</span>
          </div>
          <button
            onClick={onClose}
            className={S.shCloseBtn}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className={S.shBody}>
          {/* Patient */}
          <div>
            <label className={S.fieldLabel}>
              Paciente <span className="text-(--color-danger)">*</span>
            </label>
            {patient ? (
              <div className={S.patientPill}>
                <div className={cn(S.avatarSm, getAvatarVariant(patient.id))}>
                  {getInitials(patient.name)}
                </div>
                <div className={S.ppInfo}>
                  <div className={S.ppName}>{patient.name}</div>
                  {patientEmail(patient) && (
                    <div className={S.ppMeta}>{patientEmail(patient)}</div>
                  )}
                </div>
                <button
                  className={S.ppClear}
                  onClick={() => { setPatient(null); setPatientQuery(""); }}
                  aria-label="Remover paciente"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <div className={S.searchWrap}>
                <div className={S.searchBox({ error: !!errors.patient })}>
                  <Search className={S.searchIcon} />
                  <input
                    ref={inputRef}
                    className={S.searchInput}
                    placeholder="Buscar pelo nome..."
                    value={patientQuery}
                    onFocus={() => setShowSugg(true)}
                    onChange={(e) => { setPatientQuery(e.target.value); setShowSugg(true); }}
                  />
                </div>
                {showSugg && patientQuery && (
                  <div className={S.suggList}>
                    {suggestions.length > 0 ? (
                      suggestions.map((p) => (
                        <button
                          key={p.id}
                          className={S.suggRow}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setPatient(p);
                            setShowSugg(false);
                            setPatientQuery("");
                            setErrors((prev) => { const n = { ...prev };

 delete n.patient;

 return n; });
                          }}
                        >
                          <div className={cn(S.avatarSm, getAvatarVariant(p.id))}>
                            {getInitials(p.name)}
                          </div>
                          <div>
                            <div className={S.suggName}>{p.name}</div>
                            {patientEmail(p) && (
                              <div className={S.suggMeta}>{patientEmail(p)}</div>
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className={S.suggEmpty}>Nenhum paciente encontrado.</div>
                    )}
                  </div>
                )}
              </div>
            )}
            {errors.patient && (
              <p className={S.fieldErr}>
                <AlertCircle className="size-3" /> {errors.patient}
              </p>
            )}
          </div>

          {/* Date / time / duration / type */}
          <div className={S.formGrid}>
            <div>
              <label className={S.fieldLabel}>
                Data <span className="text-(--color-danger)">*</span>
              </label>
              <input
                type="date"
                className={cn(S.inputBase, errors.date && S.inputErr)}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {dateLabel && !errors.date && <p className={S.fieldHint}>{dateLabel}</p>}
              {errors.date && (
                <p className={S.fieldErr}>
                  <AlertCircle className="size-3" /> {errors.date}
                </p>
              )}
            </div>
            <div>
              <label className={S.fieldLabel}>
                Horário <span className="text-(--color-danger)">*</span>
              </label>
              <input
                type="time"
                className={cn(S.inputBase, errors.start && S.inputErr)}
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
              {errors.start && (
                <p className={S.fieldErr}>
                  <AlertCircle className="size-3" /> {errors.start}
                </p>
              )}
            </div>
            <div>
              <label className={S.fieldLabel}>Duração</label>
              <select
                className={S.selectBase}
                value={duration}
                onChange={(e) => setDur(Number(e.target.value))}
              >
                {DURATIONS.map((d) => (
                  <option key={d.v} value={d.v}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={S.fieldLabel}>Tipo</label>
              <select
                className={S.selectBase}
                value={type}
                onChange={(e) => setType(e.target.value as AppointmentType)}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conflict warning */}
          {conflict && (
            <div className={S.conflictBanner}>
              <AlertTriangle className={S.conflictIcon} />
              <div>
                <p className={S.conflictTitle}>Conflito de horário</p>
                <p className={S.conflictDesc}>
                  Já existe consulta das {toTimeStr(conflict.startAt)} às{" "}
                  {toTimeStr(conflict.endAt)} nesse dia.
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className={S.fieldLabel}>
              Observações <span className="text-(--color-text-tertiary)">opcional</span>
            </label>
            <textarea
              className={S.textareaBase}
              rows={3}
              placeholder="Informações adicionais sobre a consulta..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={S.shFoot}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={submit}
            disabled={createMutation.isPending}
          >
            <CalendarPlus className="size-3.5" />
            {createMutation.isPending ? "Agendando…" : "Agendar"}
          </Button>
        </div>
      </div>
    </>
  );
}

// ── AgendaPage ────────────────────────────────────────────────────────────

export function AgendaPage() {
  const navigate = useNavigate();
  const [view, setView]                 = useState<View>("week");
  const [cursor, setCursor]             = useState(() => new Date());
  const [statusFilters, setStatusFilters] = useState<Set<DisplayStatus>>(
    () => new Set(["scheduled", "confirmed", "done", "cancelled", "noshow"]),
  );
  const [detailId, setDetailId]     = useState<string | null>(null);
  const [showNew, setShowNew]       = useState(false);
  const [slotPrefill, setSlotPrefill] = useState<SlotPrefill | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const apptQuery = useSearchAppointments({
    term:   "",
    limit:  300,
    cursor: null,
    sort:   { startAt: "asc" as SearchAppointmentsSortStartAt },
  }) as unknown as UseQueryResult<AppointmentPage>;

  const patientQuery = useSearchPatients({
    term:   "",
    limit:  300,
    cursor: null,
    sort:   null,
  }) as unknown as UseQueryResult<PatientPage>;

  const allAppts = apptQuery.data?.data ?? [];
  const patientMap = useMemo(() => {
    const m = new Map<string, Patient>();

    (patientQuery.data?.data ?? []).forEach((p) => m.set(p.id, p));

    return m;
  }, [patientQuery.data]);

  const filteredAppts = useMemo(
    () => allAppts.filter((a) => statusFilters.has(API_TO_DISPLAY[a.status as AppointmentStatus])),
    [allAppts, statusFilters],
  );

  const detailApt = detailId ? allAppts.find((a) => a.id === detailId) : null;

  function toggleStatus(k: DisplayStatus) {
    setStatusFilters((prev) => {
      const n = new Set(prev);

      if (n.has(k)) n.delete(k);
      else n.add(k);

      return n;
    });
  }

  function goPrev() {
    if (view === "day")   setCursor(addDays(cursor, -1));

    if (view === "week")  setCursor(addDays(cursor, -7));

    if (view === "month") setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  }

  function goNext() {
    if (view === "day")   setCursor(addDays(cursor, 1));

    if (view === "week")  setCursor(addDays(cursor, 7));

    if (view === "month") setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  }

  function goToday() { setCursor(new Date()); }

  const periodLabel = (() => {
    if (view === "day") {
      return `${cursor.getDate()} de ${MONTH_NAMES[cursor.getMonth()]} de ${cursor.getFullYear()}, ${WEEKDAYS_LONG[cursor.getDay()]}`;
    }

    if (view === "week") {
      const ws = startOfWeek(cursor);
      const we = addDays(ws, 6);

      if (ws.getMonth() === we.getMonth()) {
        return `${ws.getDate()} – ${we.getDate()} de ${MONTH_NAMES[ws.getMonth()]} de ${ws.getFullYear()}`;
      }

      return `${ws.getDate()} ${MONTH_NAMES_SHORT[ws.getMonth()]} – ${we.getDate()} ${MONTH_NAMES_SHORT[we.getMonth()]} de ${we.getFullYear()}`;
    }

    const m = MONTH_NAMES[cursor.getMonth()];

    return `${m.charAt(0).toUpperCase() + m.slice(1)} ${cursor.getFullYear()}`;
  })();

  const sharedCalProps = {
    cursor,
    appts:      filteredAppts,
    patientMap,
    highlightId,
    onSlotClick: (prefill: SlotPrefill) => {
      setSlotPrefill(prefill);
      setShowNew(true);
    },
    onApptClick: (id: string) => setDetailId(id),
  };

  return (
    <div className={S.agPage}>
      {/* Header */}
      <div className={S.agHeader}>
        <h1 className={S.agHeaderTitle}>Agenda</h1>
        <div className={S.agHeaderRight}>
          <div className={S.segmented.root}>
            {(["day", "week", "month"] as View[]).map((v) => (
              <button
                key={v}
                className={S.segmentedBtn({ active: view === v })}
                onClick={() => setView(v)}
              >
                {v === "day" ? "Dia" : v === "week" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => { setSlotPrefill(null); setShowNew(true); }}>
            <Plus className="size-4" />
            Novo agendamento
          </Button>
        </div>
      </div>

      {/* Period nav */}
      <div className={S.agPeriod}>
        <div className={S.agPeriodLeft}>
          <Button variant="outline" size="sm" onClick={goToday}>
            Hoje
          </Button>
          <div className={S.arrowBtnRow}>
            <button className={S.agArrowBtn} onClick={goPrev} aria-label="Anterior">
              <ChevronLeft className="size-3.5" />
            </button>
            <button className={S.agArrowBtn} onClick={goNext} aria-label="Próximo">
              <ChevronRight className="size-3.5" />
            </button>
          </div>
          <span className={S.agPeriodLabel}>{periodLabel}</span>
        </div>

        <div className={S.statusFiltersRow}>
          {DISPLAY_STATUS_DEF.map(({ key, label }) => {
            const on = statusFilters.has(key);

            return (
              <button
                key={key}
                className={S.statusChip({ status: key, off: !on })}
                onClick={() => toggleStatus(key)}
              >
                <span className={cn(S.chipDot, S.statusDotCls[key])} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar layout */}
      <div className={S.agLayout}>
        {/* Sidebar mini calendar */}
        <aside className={S.agSide}>
          <MiniCalendar
            cursor={cursor}
            view={view}
            appts={filteredAppts}
            onPickDay={(d) => {
              setCursor(d);

              if (view === "month") setView("day");
            }}
          />
        </aside>

        {/* Main view */}
        <div className={S.agBody}>
          {apptQuery.isLoading ? (
            <div className={S.skeletonRoot}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className={S.skeletonDayCard} />
              ))}
            </div>
          ) : (
            <>
              {view === "day" && <DayView {...sharedCalProps} />}
              {view === "week" && <WeekView {...sharedCalProps} />}
              {view === "month" && (
                <MonthView
                  {...sharedCalProps}
                  onGotoDay={(d) => { setCursor(d); setView("day"); }}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Appointment detail sheet */}
      {detailApt && (
        <AppointmentDetailSheet
          apt={detailApt}
          patientMap={patientMap}
          onClose={() => setDetailId(null)}
          onNavigateToPatient={(patientId) => {
            setDetailId(null);
            navigate({ to: "/patients/$patientId", params: { patientId } });
          }}
        />
      )}

      {/* New appointment sheet */}
      {showNew && (
        <NewAppointmentSheet
          prefill={slotPrefill}
          allAppts={allAppts}
          onClose={() => { setShowNew(false); setSlotPrefill(null); }}
        />
      )}
    </div>
  );
}
