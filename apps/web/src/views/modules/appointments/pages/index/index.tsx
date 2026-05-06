import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UseQueryResult } from "@tanstack/react-query";
import {
  CalendarDays,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  ArrowUpRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  CreateAppointmentDtoType,
  Patient,
  useCancelAppointment,
  useCreateAppointment,
  useSearchAppointments,
  useSearchPatients,
  useUpdateAppointment,
} from "@agenda-app/client";

import { Button } from "@/components/ui/componentes/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/componentes/dialog";
import { Input } from "@/components/ui/componentes/input";
import { Label } from "@/components/ui/componentes/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/componentes/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/componentes/sheet";
import { Textarea } from "@/components/ui/componentes/textarea";
import { cn } from "@/lib/utils";

import * as S from "./styles";

// ── Route ─────────────────────────────────────────────────────────
export const Route = createFileRoute("/_stackedLayout/appointments")({
  component: AppointmentsPage,
});

// ── i18n constants ────────────────────────────────────────────────
const MONTH_NAMES = [
  "janeiro","fevereiro","março","abril","maio","junho",
  "julho","agosto","setembro","outubro","novembro","dezembro",
];
const WEEKDAYS_LONG = [
  "domingo","segunda-feira","terça-feira","quarta-feira",
  "quinta-feira","sexta-feira","sábado",
];
const WEEKDAYS_SHORT = ["dom","seg","ter","qua","qui","sex","sáb"];

// ── Grid constants ────────────────────────────────────────────────
const HOUR_H_WEEK = 56;
const HOUR_H_DAY = 64;
const GRID_START = 7;
const GRID_END = 20;
const HOURS = Array.from({ length: GRID_END - GRID_START }, (_, i) => i + GRID_START);

// ── Labels ────────────────────────────────────────────────────────
const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED:   "Agendado",
  CONFIRMED:   "Confirmado",
  COMPLETED:   "Realizado",
  CANCELLED:   "Cancelado",
  NO_SHOW:     "Faltou",
  ARRIVED:     "Chegou",
  IN_PROGRESS: "Em atendimento",
};

const TYPE_LABELS: Record<AppointmentType, string> = {
  FIRST_VISIT:  "Primeira consulta",
  RETURN:       "Retorno",
  WALK_IN:      "Urgência",
  TELEMEDICINE: "Teleconsulta",
  PROCEDURE:    "Procedimento",
};

const ALL_STATUSES = Object.keys(STATUS_LABELS) as AppointmentStatus[];
const DURATIONS = [15, 30, 45, 60, 90, 120];

type ViewMode = "day" | "week" | "month";

// ── Internal view model ───────────────────────────────────────────
interface ApptView {
  id: string;
  patientId: string;
  attendedByMemberId: string;
  clinicId: string;
  date: string;   // YYYY-MM-DD
  start: string;  // HH:mm
  end: string;    // HH:mm
  type: AppointmentType;
  status: AppointmentStatus;
  note: string | null;
  raw: Appointment;
}

// ── Paginated response shape ───────────────────────────────────────
interface PaginatedPage<T> { data: T[]; totalCount: number; }

// ── Date helpers ──────────────────────────────────────────────────
function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const r = new Date(d); r.setDate(d.getDate() + diff); r.setHours(0,0,0,0);
  return r;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(d.getDate() + n); return r;
}
function fmtDate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth()+1).padStart(2,"0"),
    String(d.getDate()).padStart(2,"0"),
  ].join("-");
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}
function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number); return h*60+m;
}
function minToTime(min: number): string {
  return `${String(Math.floor(min/60)).padStart(2,"0")}:${String(min%60).padStart(2,"0")}`;
}

/** Extract YYYY-MM-DD from an ISO datetime string, adjusting to local time */
function isoToLocalDate(iso: string): string {
  const d = new Date(iso);
  return fmtDate(d);
}
/** Extract HH:mm from an ISO datetime string in local time */
function isoToLocalTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
/** Build ISO datetime from local date (YYYY-MM-DD) + time (HH:mm) */
function localDateTimeToISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

/**
 * Orval generates nullable string fields from Prisma as `{ [key: string]: unknown } | null`.
 * At runtime they are plain strings. This helper extracts the string value safely.
 */
function asStr(val: unknown): string | null {
  if (val == null) return null;
  if (typeof val === "string") return val || null;
  return null;
}

/** AppointmentNote is typed as JSON by Orval, but is actually a string value */
function noteToString(note: Appointment["note"]): string | null {
  return asStr(note);
}

function toApptView(a: Appointment): ApptView {
  return {
    id: a.id,
    patientId: a.patientId,
    attendedByMemberId: a.attendedByMemberId,
    clinicId: a.clinicId,
    date: isoToLocalDate(a.startAt),
    start: isoToLocalTime(a.startAt),
    end: isoToLocalTime(a.endAt),
    type: a.type,
    status: a.status,
    note: noteToString(a.note),
    raw: a,
  };
}

// ── Patient helper ────────────────────────────────────────────────
function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();
}
function getPatientName(patients: Patient[], id: string): string {
  return patients.find(p=>p.id===id)?.name ?? "—";
}

// ── Overlap layout ─────────────────────────────────────────────────
interface PositionedAppt { apt: ApptView; lane: number; lanes: number; }

function layoutOverlaps(appts: ApptView[]): PositionedAppt[] {
  const sorted = [...appts].sort((a,b)=>timeToMin(a.start)-timeToMin(b.start));
  const items: (PositionedAppt & {s:number;e:number})[] = sorted.map(apt=>({
    apt, s:timeToMin(apt.start), e:timeToMin(apt.end), lane:0, lanes:1,
  }));
  const groups: typeof items[] = [];
  let cur: typeof items = []; let curEnd = -1;
  for (const it of items) {
    if (it.s >= curEnd) { if (cur.length) groups.push(cur); cur=[it]; curEnd=it.e; }
    else { cur.push(it); curEnd=Math.max(curEnd,it.e); }
  }
  if (cur.length) groups.push(cur);
  for (const g of groups) {
    const ends: number[] = [];
    for (const it of g) {
      let placed=false;
      for (let li=0; li<ends.length; li++) {
        if (ends[li]<=it.s) { it.lane=li; ends[li]=it.e; placed=true; break; }
      }
      if (!placed) { it.lane=ends.length; ends.push(it.e); }
    }
    const total=ends.length; for (const it of g) it.lanes=total;
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
  onClick: () => void;
}
function ApptBlock({ apt, patients, style, compact, highlight, onClick }: ApptBlockProps) {
  return (
    <button
      type="button"
      className={S.apptBlock({ status: apt.status, highlight: highlight ?? false })}
      style={style}
      onClick={onClick}
    >
      <span className={S.apptBar({ status: apt.status })} />
      <div className={S.apptContent}>
        <div className={S.apptTime}>{apt.start} – {apt.end}</div>
        <div className={S.apptName}>{getPatientName(patients, apt.patientId)}</div>
        {!compact && <div className={S.apptType}>{TYPE_LABELS[apt.type]}</div>}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
//   Week View
// ─────────────────────────────────────────────────────────────────
interface CalViewProps {
  appts: ApptView[];
  patients: Patient[];
  cursor: Date;
  today: Date;
  now: { h: number; m: number };
  highlightId: string | null;
  onSlotClick: (d: Date, time: string) => void;
  onApptClick: (id: string) => void;
}

function WeekView({ appts, patients, cursor, today, now, highlightId, onSlotClick, onApptClick }: CalViewProps) {
  const ws = startOfWeek(cursor);
  const days = Array.from({length:7}, (_,i)=>addDays(ws,i));

  return (
    <div className={S.weekHeaderMin}>
      {/* Header row */}
      <div className={S.grid.weekHead}>
        <div className={S.grid.timeColHead} />
        {days.map((d,i) => {
          const isToday = sameDay(d, today);
          return (
            <div key={i} className={S.grid.dayHead({ isToday })}>
              <div className={S.dayOfWeekText}>{WEEKDAYS_SHORT[d.getDay()]}</div>
              <div className={S.grid.dayHeadNum({ isToday })}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div className={S.grid.body}>
        <div className={S.grid.timeCol}>
          {HOURS.map(h=>(
            <div key={h} className={S.grid.timeRow} style={{height:HOUR_H_WEEK}}>
              <span className={S.grid.timeLabel}>{String(h).padStart(2,"0")}:00</span>
            </div>
          ))}
        </div>
        {days.map((d,di)=>{
          const dayAppts = appts.filter(a=>a.date===fmtDate(d));
          const isToday = sameDay(d,today);
          const nowTop = isToday ? ((now.h+now.m/60)-GRID_START)*HOUR_H_WEEK : null;
          const positioned = layoutOverlaps(dayAppts);
          return (
            <div key={di} className={S.grid.dayCol({isToday})} style={{height:HOUR_H_WEEK*HOURS.length}}>
              {HOURS.map((h,hi)=>(
                <div key={h} className={S.grid.slot} style={{top:hi*HOUR_H_WEEK,height:HOUR_H_WEEK}}
                  onClick={()=>onSlotClick(d,`${String(h).padStart(2,"0")}:00`)} />
              ))}
              {nowTop!=null && nowTop>=0 && (
                <div className={S.grid.nowLine} style={{top:nowTop}}>
                  <span className={S.grid.nowDot} />
                </div>
              )}
              {positioned.map(({apt,lane,lanes})=>{
                const s=timeToMin(apt.start)-GRID_START*60;
                const e=timeToMin(apt.end)-GRID_START*60;
                const top=(s/60)*HOUR_H_WEEK;
                const h=Math.max(((e-s)/60)*HOUR_H_WEEK-2,22);
                const wPct=100/lanes; const lPct=lane*wPct;
                return (
                  <ApptBlock key={apt.id} apt={apt} patients={patients}
                    style={{top,height:h,left:`calc(${lPct}% + 2px)`,width:`calc(${wPct}% - 4px)`}}
                    compact={lanes>1} highlight={apt.id===highlightId}
                    onClick={()=>onApptClick(apt.id)} />
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
function DayView({ appts, patients, cursor, today, now, highlightId, onSlotClick, onApptClick }: CalViewProps) {
  const isToday = sameDay(cursor,today);
  const nowTop = isToday ? ((now.h+now.m/60)-GRID_START)*HOUR_H_DAY : null;
  const dayAppts = appts.filter(a=>a.date===fmtDate(cursor));
  const positioned = layoutOverlaps(dayAppts);

  return (
    <div className={S.dayHeaderMin}>
      <div className={S.dayColHead}>
        <div className={S.dayHeaderText}>{WEEKDAYS_LONG[cursor.getDay()]}</div>
        <div className={S.dayHeadBaseline}>
          <span className={S.dayDateNum}>{cursor.getDate()}</span>
          <span className={S.dayHeaderText}>{MONTH_NAMES[cursor.getMonth()]} · {cursor.getFullYear()}</span>
          {dayAppts.length>0 && <span className={S.apptCountText}>{dayAppts.length} {dayAppts.length===1?"consulta":"consultas"}</span>}
        </div>
      </div>
      <div className={S.grid.body}>
        <div className={S.grid.timeCol}>
          {HOURS.map(h=>(
            <div key={h} className={S.grid.timeRow} style={{height:HOUR_H_DAY}}>
              <span className={S.grid.timeLabel}>{String(h).padStart(2,"0")}:00</span>
            </div>
          ))}
        </div>
        <div className={S.dayBodyCol} style={{height:HOUR_H_DAY*HOURS.length}}>
          {HOURS.map((h,hi)=>(
            <div key={h} className={S.grid.slot} style={{top:hi*HOUR_H_DAY,height:HOUR_H_DAY}}
              onClick={()=>onSlotClick(cursor,`${String(h).padStart(2,"0")}:00`)} />
          ))}
          {nowTop!=null && nowTop>=0 && (
            <div className={S.grid.nowLine} style={{top:nowTop}}>
              <span className={S.grid.nowDot} />
              <span className={S.nowTimeLabel}>
                {String(now.h).padStart(2,"0")}:{String(now.m).padStart(2,"0")}
              </span>
            </div>
          )}
          {positioned.map(({apt,lane,lanes})=>{
            const s=timeToMin(apt.start)-GRID_START*60;
            const e=timeToMin(apt.end)-GRID_START*60;
            const top=(s/60)*HOUR_H_DAY;
            const h=Math.max(((e-s)/60)*HOUR_H_DAY-4,36);
            const wPct=100/lanes; const lPct=lane*wPct;
            const isShort=(e-s)<40;
            return (
              <ApptBlock key={apt.id} apt={apt} patients={patients}
                style={{top,height:h,left:`calc(${lPct}% + 4px)`,width:`calc(${wPct}% - 8px)`}}
                compact={isShort} highlight={apt.id===highlightId}
                onClick={()=>onApptClick(apt.id)} />
            );
          })}
          {dayAppts.length===0 && (
            <div className={S.grid.emptyDay}>
              <CalendarX2 className={S.emptyDayCalIcon} />
              <div className={S.grid.emptyDayTitle}>Sem consultas neste dia</div>
              <div className={S.grid.emptyDaySub}>Clique em qualquer horário ou use &quot;Novo agendamento&quot;.</div>
            </div>
          )}
        </div>
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
function MonthView({ appts, patients, cursor, today, highlightId, onSlotClick, onApptClick, onGotoDay }: MonthViewProps) {
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  const cells = Array.from({length:42}, (_,i)=>addDays(gridStart,i));

  return (
    <div>
      <div className={S.monthGrid.head}>
        {WEEKDAYS_SHORT.map((w,i)=>(
          <div key={i} className={S.monthGrid.headCell}>{w.charAt(0).toUpperCase()+w.slice(1,3)}</div>
        ))}
      </div>
      <div className={S.monthGrid.grid}>
        {cells.map((d,i)=>{
          const inMonth = d.getMonth()===cursor.getMonth();
          const isToday = sameDay(d,today);
          const dayAppts = appts.filter(a=>a.date===fmtDate(d)).sort((a,b)=>timeToMin(a.start)-timeToMin(b.start));
          const visible = dayAppts.slice(0,3);
          const more = dayAppts.length-visible.length;
          return (
            <div key={i} className={S.monthGrid.cell({inMonth,isToday})} onClick={()=>onSlotClick(d,"09:00")}>
              <div className={S.monthGrid.cellHead}>
                <button type="button" className={S.monthGrid.cellNum({isToday,inMonth})}
                  onClick={e=>{e.stopPropagation();onGotoDay(d);}}>
                  {d.getDate()}
                </button>
              </div>
              {visible.map(a=>(
                <button key={a.id} type="button"
                  className={cn(S.monthGrid.evt({status:a.status}), a.id===highlightId?"ring-1 ring-(--color-primary)":"")}
                  onClick={e=>{e.stopPropagation();onApptClick(a.id);}}>
                  <span className={S.apptTimeMono}>{a.start}</span>
                  {getPatientName(patients,a.patientId).split(" ").slice(0,2).join(" ")}
                </button>
              ))}
              {more>0 && <div className={S.monthGrid.moreBtn}>+{more} mais</div>}
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
  cursor: Date; view: ViewMode; appts: ApptView[]; today: Date; onPickDay: (d:Date)=>void;
}
function MiniCalendar({ cursor, view, appts, today, onPickDay }: MiniCalProps) {
  const [mc, setMc] = useState(new Date(cursor.getFullYear(), cursor.getMonth(), 1));

  useEffect(()=>{
    if (cursor.getMonth()!==mc.getMonth() || cursor.getFullYear()!==mc.getFullYear())
      setMc(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
  },[cursor]);

  const monthStart = new Date(mc.getFullYear(), mc.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  const cells = Array.from({length:42}, (_,i)=>addDays(gridStart,i));
  const ws = view==="week" ? startOfWeek(cursor) : null;
  const we = ws ? addDays(ws,6) : null;

  const apptDates = useMemo(()=>{
    const m = new Map<string,number>();
    appts.forEach(a=>m.set(a.date,(m.get(a.date)??0)+1));
    return m;
  },[appts]);

  const label = `${MONTH_NAMES[mc.getMonth()].slice(0,3)} ${mc.getFullYear()}`;

  return (
    <div className={S.mini.root}>
      <div className={S.mini.head}>
        <span className={S.mini.monthLabel}>{label}</span>
        <div className={S.mini.arrows}>
          <button type="button" className={S.mini.arrowBtn} onClick={()=>setMc(new Date(mc.getFullYear(),mc.getMonth()-1,1))}>
            <ChevronLeft className="size-3" />
          </button>
          <button type="button" className={S.mini.arrowBtn} onClick={()=>setMc(new Date(mc.getFullYear(),mc.getMonth()+1,1))}>
            <ChevronRight className="size-3" />
          </button>
        </div>
      </div>
      <div className={S.mini.dowRow}>
        {WEEKDAYS_SHORT.map((w,i)=><div key={i} className={S.mini.dowCell}>{w.charAt(0).toUpperCase()}</div>)}
      </div>
      <div className={S.mini.grid}>
        {cells.map((d,i)=>{
          const inMonth = d.getMonth()===mc.getMonth();
          const isToday = sameDay(d,today);
          const isSelected = view==="day" && sameDay(d,cursor);
          const inWeek = view==="week" && ws!=null && we!=null && d>=ws && d<=we;
          const has = (apptDates.get(fmtDate(d))??0)>0;
          return (
            <button key={i} type="button"
              className={S.mini.cell({inMonth,isToday:isToday&&!isSelected,isSelected,inWeek,hasAppts:has})}
              onClick={()=>onPickDay(d)}>
              {isToday&&!isSelected
                ? <span className={S.mini.todayNum}>{d.getDate()}</span>
                : <span className={cn(S.mini.cellNum, isSelected?"text-white":inMonth?"text-(--color-text-primary)":"text-(--color-text-tertiary)")}>{d.getDate()}</span>
              }
              {has && !isSelected && <span className={S.mini.dot}/>}
            </button>
          );
        })}
      </div>
      <button type="button" className={S.mini.todayBtn} onClick={()=>onPickDay(today)}>
        Voltar para hoje
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//   Appointment Detail Sheet
// ─────────────────────────────────────────────────────────────────
interface DetailSheetProps {
  apt: ApptView; patients: Patient[];
  onClose: ()=>void; onEdit: ()=>void; onCancel: ()=>void; onOpenPatient: (id:string)=>void;
}
function AppointmentDetailSheet({ apt, patients, onClose, onEdit, onCancel, onOpenPatient }: DetailSheetProps) {
  const patient = patients.find(p=>p.id===apt.patientId);
  const durMin = timeToMin(apt.end)-timeToMin(apt.start);
  const durLabel = durMin>=60 ? `${Math.floor(durMin/60)}h${durMin%60?` ${durMin%60}min`:""}` : `${durMin} min`;
  const [y,mo,da] = apt.date.split("-").map(Number);
  const date = new Date(y,mo-1,da);
  const isDone = ["COMPLETED","CANCELLED","NO_SHOW"].includes(apt.status);

  return (
    <Sheet open onOpenChange={o=>!o&&onClose()}>
      <SheetContent className={S.detailSheetPanel}>
        <SheetHeader>
          <SheetTitle className="sr-only">Detalhes do agendamento</SheetTitle>
          <div className={S.sheetInfoRow}>
            <span className={S.sheet.eyebrow}>Agendamento</span>
            <span className={S.sheet.statusBadge({status:apt.status})}>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0",{
                "bg-blue-500":    apt.status==="SCHEDULED",
                "bg-emerald-500": apt.status==="CONFIRMED",
                "bg-slate-400":   apt.status==="COMPLETED",
                "bg-red-500":     apt.status==="CANCELLED",
                "bg-amber-500":   apt.status==="NO_SHOW",
                "bg-violet-500":  apt.status==="ARRIVED",
                "bg-cyan-500":    apt.status==="IN_PROGRESS",
              })}/>
              {STATUS_LABELS[apt.status]}
            </span>
          </div>
        </SheetHeader>

        <div className="mt-6">
          {/* Patient card */}
          <div className={S.sheet.patientCard}>
            <div className={S.patAvatarLg}>
              {patient ? getInitials(patient.name) : "?"}
            </div>
            <div className={S.sheet.patientBody}>
              <div className={S.sheet.patientName}>{patient?.name ?? "—"}</div>
              {asStr(patient?.email) && <div className={S.sheet.patientMeta}>{asStr(patient?.email)}</div>}
            </div>
            <button type="button"
              className={S.patProfileLink}
              onClick={()=>onOpenPatient(apt.patientId)}>
              Ver perfil <ArrowUpRight className="size-3"/>
            </button>
          </div>

          {/* Schedule */}
          <div className={S.sheet.section}>
            <div className={S.sheet.sectionTitle}>Horário</div>
            <div className={S.sheet.kvGrid}>
              <div className={S.sheet.kv}>
                <span className={S.sheet.kvKey}>Data</span>
                <span className={S.sheetKvText}>
                  {WEEKDAYS_LONG[date.getDay()]}, {da} de {MONTH_NAMES[mo-1]} de {y}
                </span>
              </div>
              <div className={S.sheet.kv}>
                <span className={S.sheet.kvKey}>Horário</span>
                <span className={S.sheet.kvVal}>{apt.start} – {apt.end}</span>
              </div>
              <div className={S.sheet.kv}>
                <span className={S.sheet.kvKey}>Duração</span>
                <span className={S.sheet.kvVal}>{durLabel}</span>
              </div>
              <div className={S.sheet.kv}>
                <span className={S.sheet.kvKey}>Tipo</span>
                <span className={S.sheetKvText}>{TYPE_LABELS[apt.type]}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className={S.sheet.section}>
            <div className={S.sheet.sectionTitle}>Observações</div>
            {apt.note
              ? <p className={S.sheet.notes}>{apt.note}</p>
              : <p className={S.sheet.notesEmpty}>Sem observações registradas.</p>}
          </div>

          {/* Actions */}
          {!isDone && (
            <div className={S.sheet.actions}>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={onEdit}>
                <Pencil className="size-3.5"/> Editar
              </Button>
              <Button size="sm" variant="outline"
                className={S.cancelBtn}
                onClick={onCancel}>
                <Trash2 className="size-3.5"/> Cancelar consulta
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─────────────────────────────────────────────────────────────────
//   Edit Dialog
// ─────────────────────────────────────────────────────────────────
interface EditDialogProps { apt: ApptView; onClose: ()=>void; onSaved: ()=>void; }
function EditAppointmentDialog({ apt, onClose, onSaved }: EditDialogProps) {
  const [date, setDate] = useState(apt.date);
  const [startTime, setStartTime] = useState(apt.start);
  const [durMin, setDurMin] = useState(timeToMin(apt.end)-timeToMin(apt.start));
  const [type, setType] = useState<AppointmentType>(apt.type);
  const [note, setNote] = useState(apt.note ?? "");
  const update = useUpdateAppointment();

  const handleSave = () => {
    const endTime = minToTime(timeToMin(startTime)+durMin);
    update.mutate({
      id: apt.id,
      data: {
        startAt: localDateTimeToISO(date, startTime),
        endAt:   localDateTimeToISO(date, endTime),
        type:    type as unknown as import("@agenda-app/client").UpdateAppointmentInputDtoType,
        note:    note || null,
      },
    },{
      onSuccess: () => { toast.success("Consulta atualizada"); onSaved(); onClose(); },
      onError:   () => toast.error("Erro ao atualizar consulta"),
    });
  };

  return (
    <Dialog open onOpenChange={o=>!o&&onClose()}>
      <DialogContent className={S.editDialogWidth}>
        <DialogHeader><DialogTitle>Editar agendamento</DialogTitle></DialogHeader>
        <div className={S.formBody}>
          <div className={S.formRow}>
            <div className={S.formField}>
              <Label>Data</Label>
              <Input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
            </div>
            <div className={S.formField}>
              <Label>Horário</Label>
              <Input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)}/>
            </div>
          </div>
          <div className={S.formRow}>
            <div className={S.formField}>
              <Label>Duração</Label>
              <Select value={String(durMin)} onValueChange={v=>setDurMin(Number(v))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  {DURATIONS.map(d=>(
                    <SelectItem key={d} value={String(d)}>
                      {d>=60?`${Math.floor(d/60)}h${d%60?` ${d%60}min`:""}`:`${d} min`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={S.formField}>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={v=>setType(v as AppointmentType)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className={S.formField}>
            <Label>Observações <span className={S.optionalLabel}>opcional</span></Label>
            <Textarea rows={3} placeholder="Informações adicionais..." value={note} onChange={e=>setNote(e.target.value)}/>
          </div>
        </div>
        <div className={S.formFooter}>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending?"Salvando…":"Salvar alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────
//   New Appointment Dialog
// ─────────────────────────────────────────────────────────────────
interface NewApptDialogProps {
  prefill: {date:string;start:string} | null;
  defaultMemberId: string;
  onClose: ()=>void;
  onSaved: ()=>void;
}
function NewAppointmentDialog({ prefill, defaultMemberId, onClose, onSaved }: NewApptDialogProps) {
  const today = fmtDate(new Date());
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient|null>(null);
  const [date, setDate] = useState(prefill?.date ?? today);
  const [startTime, setStartTime] = useState(prefill?.start ?? "09:00");
  const [durMin, setDurMin] = useState(60);
  const [type, setType] = useState<CreateAppointmentDtoType>("RETURN");
  const [note, setNote] = useState("");
  const [showDrop, setShowDrop] = useState(false);

  const patientsQ = (useSearchPatients({ term:patientSearch, limit:20, cursor:null, sort:null })) as unknown as UseQueryResult<PaginatedPage<Patient>>;
  const patientsList = patientsQ.data?.data ?? [];

  const create = useCreateAppointment();

  const handleSave = () => {
    if (!selectedPatient) { toast.error("Selecione um paciente"); return; }
    const endTime = minToTime(timeToMin(startTime)+durMin);
    create.mutate({
      data: {
        patientId: selectedPatient.id,
        attendedByMemberId: defaultMemberId,
        startAt: localDateTimeToISO(date, startTime),
        endAt:   localDateTimeToISO(date, endTime),
        type,
        note: note || null,
        retroactive: true, // allow past dates too
      },
    },{
      onSuccess: () => { toast.success("Consulta agendada"); onSaved(); onClose(); },
      onError:   () => toast.error("Erro ao criar consulta"),
    });
  };

  return (
    <Dialog open onOpenChange={o=>!o&&onClose()}>
      <DialogContent className={S.newApptDialogWidth}>
        <DialogHeader><DialogTitle>Novo agendamento</DialogTitle></DialogHeader>
        <div className={S.formBody}>
          {/* Patient */}
          <div className={cn(S.formField, "relative")}>
            <Label>Paciente</Label>
            {selectedPatient ? (
              <div className={S.patSearchPill}>
                <div className={S.patAvatarSm}>
                  {getInitials(selectedPatient.name)}
                </div>
                <span className={S.patSearchName}>{selectedPatient.name}</span>
                <button type="button" className={S.patClearBtn}
                  onClick={()=>setSelectedPatient(null)}>
                  <X className="size-3.5"/>
                </button>
              </div>
            ) : (
              <div className={S.patSearchWrap}>
                <Input placeholder="Buscar paciente..." value={patientSearch}
                  onChange={e=>{setPatientSearch(e.target.value);setShowDrop(true);}}
                  onFocus={()=>setShowDrop(true)} onBlur={()=>setTimeout(()=>setShowDrop(false),200)}/>
                {showDrop && patientsList.length>0 && (
                  <div className={S.patSearchDrop}>
                    {patientsList.map(p=>(
                      <button key={p.id} type="button"
                        className={S.patSearchRow}
                        onMouseDown={()=>{setSelectedPatient(p);setPatientSearch("");setShowDrop(false);}}>
                        <div className={S.patAvatarSm}>
                          {getInitials(p.name)}
                        </div>
                        <span className="truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={S.formRow}>
            <div className={S.formField}>
              <Label>Data</Label>
              <Input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
            </div>
            <div className={S.formField}>
              <Label>Horário</Label>
              <Input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)}/>
            </div>
          </div>

          <div className={S.formRow}>
            <div className={S.formField}>
              <Label>Duração</Label>
              <Select value={String(durMin)} onValueChange={v=>setDurMin(Number(v))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  {DURATIONS.map(d=>(
                    <SelectItem key={d} value={String(d)}>
                      {d>=60?`${Math.floor(d/60)}h${d%60?` ${d%60}min`:""}`:`${d} min`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={S.formField}>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={v=>setType(v as CreateAppointmentDtoType)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={S.formField}>
            <Label>Observações <span className={S.optionalLabel}>opcional</span></Label>
            <Textarea rows={2} placeholder="Informações adicionais..." value={note} onChange={e=>setNote(e.target.value)}/>
          </div>
        </div>
        <div className={S.formFooter}>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={create.isPending || !selectedPatient}>
            {create.isPending?"Salvando…":"Agendar consulta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────
//   Cancel Confirm Dialog
// ─────────────────────────────────────────────────────────────────
interface CancelDialogProps { apt: ApptView; onClose: ()=>void; onCancelled: ()=>void; }
function CancelDialog({ apt, onClose, onCancelled }: CancelDialogProps) {
  const [reason, setReason] = useState("");
  const cancel = useCancelAppointment();
  const handleConfirm = () => {
    cancel.mutate({ id:apt.id, data:{ reason: reason || "Cancelado pelo profissional" } },{
      onSuccess: () => { toast.success("Consulta cancelada"); onCancelled(); onClose(); },
      onError:   () => toast.error("Erro ao cancelar consulta"),
    });
  };
  return (
    <Dialog open onOpenChange={o=>!o&&onClose()}>
      <DialogContent className={S.cancelDialogWidth}>
        <DialogHeader><DialogTitle>Cancelar consulta</DialogTitle></DialogHeader>
        <p className={S.cancelDialogText}>
          Tem certeza que deseja cancelar esta consulta?
        </p>
        <div className={cn(S.formField, "mt-2")}>
          <Label>Motivo <span className={S.optionalLabel}>opcional</span></Label>
          <Textarea rows={2} placeholder="Informe o motivo do cancelamento..." value={reason} onChange={e=>setReason(e.target.value)}/>
        </div>
        <div className={S.formFooter}>
          <Button variant="outline" onClick={onClose}>Voltar</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={cancel.isPending}>
            {cancel.isPending?"Cancelando…":"Confirmar cancelamento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────
//   Main Page
// ─────────────────────────────────────────────────────────────────
export function AppointmentsPage() {
  const navigate = useNavigate();

  const today = useMemo(()=>{ const d=new Date(); d.setHours(0,0,0,0); return d; },[]);
  const [now, setNow] = useState({h:new Date().getHours(), m:new Date().getMinutes()});
  useEffect(()=>{
    const iv=setInterval(()=>{ const d=new Date(); setNow({h:d.getHours(),m:d.getMinutes()}); },60_000);
    return ()=>clearInterval(iv);
  },[]);

  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState(today);
  const [statusFilters, setStatusFilters] = useState<Set<AppointmentStatus>>(new Set(ALL_STATUSES));
  const [detailId, setDetailId] = useState<string|null>(null);
  const [editId, setEditId] = useState<string|null>(null);
  const [cancelId, setCancelId] = useState<string|null>(null);
  const [newAppt, setNewAppt] = useState<{date:string;start:string}|true|null>(null);
  const [highlightId, setHighlightId] = useState<string|null>(null);

  // Load appointments
  const apptQ = (useSearchAppointments({ term:"", limit:500, cursor:null, sort:{ startAt:"asc" } })) as unknown as UseQueryResult<PaginatedPage<Appointment>>;
  const rawAppts = apptQ.data?.data ?? [];

  // Load patients
  const patQ = (useSearchPatients({ term:"", limit:300, cursor:null, sort:null })) as unknown as UseQueryResult<PaginatedPage<Patient>>;
  const patients = patQ.data?.data ?? [];

  // Derive memberId from existing appointments (current professional's member ID)
  const defaultMemberId = rawAppts[0]?.attendedByMemberId ?? "";

  const allAppts = useMemo(()=>rawAppts.map(toApptView),[rawAppts]);
  const filteredAppts = useMemo(()=>allAppts.filter(a=>statusFilters.has(a.status)),[allAppts,statusFilters]);

  const toggleStatus = useCallback((s: AppointmentStatus)=>{
    setStatusFilters(prev=>{ const n=new Set(prev); if(n.has(s))n.delete(s); else n.add(s); return n; });
  },[]);

  const goToday = ()=>setCursor(today);
  const goPrev = ()=>{
    if (view==="day") setCursor(addDays(cursor,-1));
    else if (view==="week") setCursor(addDays(cursor,-7));
    else setCursor(new Date(cursor.getFullYear(),cursor.getMonth()-1,1));
  };
  const goNext = ()=>{
    if (view==="day") setCursor(addDays(cursor,1));
    else if (view==="week") setCursor(addDays(cursor,7));
    else setCursor(new Date(cursor.getFullYear(),cursor.getMonth()+1,1));
  };

  const periodLabel = useMemo(()=>{
    if (view==="day") return `${cursor.getDate()} de ${MONTH_NAMES[cursor.getMonth()]} de ${cursor.getFullYear()}, ${WEEKDAYS_LONG[cursor.getDay()]}`;
    if (view==="week") {
      const ws=startOfWeek(cursor); const we=addDays(ws,6);
      if (ws.getMonth()===we.getMonth())
        return `${ws.getDate()} – ${we.getDate()} de ${MONTH_NAMES[ws.getMonth()]} de ${ws.getFullYear()}`;
      return `${ws.getDate()} ${MONTH_NAMES[ws.getMonth()].slice(0,3)} – ${we.getDate()} ${MONTH_NAMES[we.getMonth()].slice(0,3)} de ${we.getFullYear()}`;
    }
    const m=MONTH_NAMES[cursor.getMonth()];
    return `${m.charAt(0).toUpperCase()+m.slice(1)} ${cursor.getFullYear()}`;
  },[view,cursor]);

  const highlightFor = (id: string)=>{ setHighlightId(id); setTimeout(()=>setHighlightId(null),2400); };

  const detailApt = allAppts.find(a=>a.id===detailId)??null;
  const editApt   = allAppts.find(a=>a.id===editId)??null;
  const cancelApt = allAppts.find(a=>a.id===cancelId)??null;

  const sharedProps = {
    appts: filteredAppts, patients, cursor, today, now, highlightId,
    onSlotClick: (d:Date,time:string)=>setNewAppt({date:fmtDate(d),start:time}),
    onApptClick: setDetailId,
  };

  return (
    <div className={S.page}>
      {/* Header */}
      <div className={S.header}>
        <div className={S.headerLeft}>
          <CalendarDays className={S.headerCalIcon}/>
          <h1 className={S.pageTitle}>Agenda</h1>
        </div>
        <div className={S.headerRight}>
          <div className={S.segmented}>
            {(["day","week","month"] as ViewMode[]).map(v=>(
              <button key={v} type="button" className={S.segmentBtn({active:view===v})} onClick={()=>setView(v)}>
                {v==="day"?"Dia":v==="week"?"Semana":"Mês"}
              </button>
            ))}
          </div>
          <Button size="sm" className="gap-1.5" onClick={()=>setNewAppt(true)}>
            <Plus className="size-4"/> Novo agendamento
          </Button>
        </div>
      </div>

      {/* Period nav + status filters */}
      <div className={S.periodBar}>
        <div className={S.periodLeft}>
          <Button size="sm" variant="outline" onClick={goToday}>Hoje</Button>
          <div className={S.arrowsGroup}>
            <button type="button" className={S.arrowBtn} onClick={goPrev}><ChevronLeft className="size-4"/></button>
            <button type="button" className={S.arrowBtn} onClick={goNext}><ChevronRight className="size-4"/></button>
          </div>
          <span className={S.periodLabel}>{periodLabel}</span>
        </div>
        <div className={S.statusFilterRow}>
          {ALL_STATUSES.map(s=>(
            <button key={s} type="button" className={S.statusChip({status:s,active:statusFilters.has(s)})} onClick={()=>toggleStatus(s)}>
              <span className={S.statusDot({status:s})}/>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div className={S.mainLayout}>
        <aside className={S.sidebar}>
          <MiniCalendar cursor={cursor} view={view} appts={filteredAppts} today={today}
            onPickDay={d=>{ setCursor(d); if(view==="month")setView("day"); }}/>
        </aside>
        <div className={S.calBody}>
          {view==="day"   && <DayView   {...sharedProps}/>}
          {view==="week"  && <WeekView  {...sharedProps}/>}
          {view==="month" && <MonthView {...sharedProps} onGotoDay={d=>{ setCursor(d); setView("day"); }}/>}
        </div>
      </div>

      {/* Detail Sheet */}
      {detailApt && (
        <AppointmentDetailSheet apt={detailApt} patients={patients}
          onClose={()=>setDetailId(null)}
          onEdit={()=>{ setEditId(detailId); setDetailId(null); }}
          onCancel={()=>{ setCancelId(detailId); setDetailId(null); }}
          onOpenPatient={id=>navigate({to:"/patients/$patientId",params:{patientId:id}})}/>
      )}

      {/* Edit Dialog */}
      {editApt && (
        <EditAppointmentDialog apt={editApt}
          onClose={()=>setEditId(null)}
          onSaved={()=>{ highlightFor(editApt.id); apptQ.refetch(); }}/>
      )}

      {/* Cancel Dialog */}
      {cancelApt && (
        <CancelDialog apt={cancelApt}
          onClose={()=>setCancelId(null)}
          onCancelled={()=>apptQ.refetch()}/>
      )}

      {/* New Appointment Dialog */}
      {newAppt && (
        <NewAppointmentDialog
          prefill={typeof newAppt==="object"?newAppt:null}
          defaultMemberId={defaultMemberId}
          onClose={()=>setNewAppt(null)}
          onSaved={()=>apptQ.refetch()}/>
      )}
    </div>
  );
}
