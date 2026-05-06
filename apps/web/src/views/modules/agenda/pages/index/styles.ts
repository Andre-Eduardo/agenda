import {cva} from 'class-variance-authority';
import {cn} from '@/lib/utils';

// ── Page layout ───────────────────────────────────────────────────────────

export const agPage = cn('flex flex-col');

export const agHeader = cn(
    'flex items-center justify-between border-b border-(--color-border) bg-(--color-bg-card) px-6 py-4'
);
export const agHeaderTitle = cn('text-xl font-medium text-(--color-text-primary)');
export const agHeaderRight = cn('flex items-center gap-2');

export const agPeriod = cn(
    'flex flex-wrap items-center justify-between gap-3 border-b border-(--color-border) bg-(--color-bg-card) px-6 py-3'
);
export const agPeriodLeft = cn('flex items-center gap-2');
export const agPeriodLabel = cn('text-sm font-medium text-(--color-text-primary)');

export const agArrowBtn = cn(
    'flex size-7 items-center justify-center rounded-[6px] border border-(--color-border) text-(--color-text-secondary) transition-colors duration-(--duration-fast) hover:bg-(--color-bg-surface) hover:text-(--color-text-primary)'
);

export const statusFiltersRow = cn('flex flex-wrap items-center gap-1.5');

export const agLayout = cn('flex');
export const agSide = cn('w-56 shrink-0 border-r border-(--color-border) bg-(--color-bg-card)');
export const agBody = cn('min-w-0 flex-1 bg-(--color-bg-page)');

// ── Segmented control ─────────────────────────────────────────────────────

export const segmented = {
    root: cn('inline-flex rounded-[8px] border border-(--color-border) bg-(--color-bg-surface) p-0.5'),
};

export const segmentedBtn = cva(
    'rounded-[6px] px-3 py-1.5 text-[13px] font-medium leading-[1.3] transition-all duration-(--duration-fast) ease-out',
    {
        variants: {
            active: {
                true: 'bg-(--color-bg-card) text-(--color-text-primary) shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
                false: 'text-(--color-text-tertiary) hover:text-(--color-text-secondary)',
            },
        },
        defaultVariants: {active: false},
    }
);

// ── Status filter chips ───────────────────────────────────────────────────

export const statusChip = cva(
    'inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-(--duration-fast)',
    {
        variants: {
            status: {
                scheduled: 'border-(--color-primary-border) bg-(--color-primary-surface) text-(--color-primary-text)',
                confirmed: 'border-(--color-success)/30 bg-(--color-success-surface) text-(--color-success)',
                done: 'border-(--color-border) bg-(--color-bg-surface) text-(--color-text-secondary)',
                cancelled: 'border-(--color-danger)/30 bg-(--color-danger-surface) text-(--color-danger)',
                noshow: 'border-(--color-warning)/30 bg-(--color-warning-surface) text-(--color-warning)',
            },
            off: {
                true: 'opacity-40',
                false: '',
            },
        },
        defaultVariants: {off: false},
    }
);

export const statusDotCls: Record<string, string> = {
    scheduled: 'bg-(--color-primary)',
    confirmed: 'bg-(--color-success)',
    done: 'bg-(--color-text-tertiary)',
    cancelled: 'bg-(--color-danger)',
    noshow: 'bg-(--color-warning)',
};

export const chipDot = cn('size-1.5 rounded-full');

// ── Avatar helpers ────────────────────────────────────────────────────────

export const avatarVariants = [
    'bg-(--color-primary-surface) text-(--color-primary-text)',
    'bg-(--color-info-surface) text-(--color-info)',
    'bg-(--color-success-surface) text-(--color-success)',
    'bg-(--color-warning-surface) text-(--color-warning)',
    'bg-(--color-danger-surface) text-(--color-danger)',
    'bg-(--color-ai-bg) text-(--color-ai-text)',
    'bg-(--color-bg-surface) text-(--color-text-secondary)',
] as const;

export const avatarSm = cn('flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium');

// ── Mini calendar ─────────────────────────────────────────────────────────

export const miniCal = {
    root: cn('p-3'),
    head: cn('mb-2 flex items-center justify-between'),
    monthLabel: cn('text-sm font-medium text-(--color-text-primary)'),
    arrowsRow: cn('flex items-center gap-0.5'),
    arrowBtn: cn(
        'flex size-6 items-center justify-center rounded-[5px] text-(--color-text-tertiary) transition-colors duration-(--duration-fast) hover:bg-(--color-bg-surface) hover:text-(--color-text-primary)'
    ),
    dowRow: cn('mb-1 grid grid-cols-7 text-center'),
    dowCell: cn('py-0.5 text-[11px] font-medium text-(--color-text-tertiary)'),
    grid: cn('grid grid-cols-7'),
    todayBtn: cn(
        'mt-2 flex w-full items-center justify-center gap-1.5 rounded-[6px] border border-(--color-border) py-1.5 text-xs text-(--color-text-secondary) transition-colors duration-(--duration-fast) hover:bg-(--color-bg-surface)'
    ),
};

export const miniCalCell = cva(
    'relative flex cursor-pointer flex-col items-center rounded-[5px] py-0.5 transition-colors duration-(--duration-fast)',
    {
        variants: {
            state: {
                default: 'text-(--color-text-secondary) hover:bg-(--color-bg-surface)',
                off: 'text-(--color-text-tertiary)/40 hover:bg-(--color-bg-surface)',
                today: 'font-medium text-(--color-primary) hover:bg-(--color-bg-surface)',
                selected: 'bg-(--color-primary) text-white',
                inWeek: 'bg-(--color-primary-surface) text-(--color-primary-text)',
            },
        },
        defaultVariants: {state: 'default'},
    }
);

export const miniCalNum = cn('text-[12px] leading-[20px] tabular-nums');
export const miniCalDot = cn('absolute bottom-0.5 size-1 rounded-full bg-(--color-primary)');

// ── Week / Day grid ───────────────────────────────────────────────────────

export const weekGrid = cn('min-w-[600px]');

export const weekHead = cn('sticky top-0 z-10 flex border-b border-(--color-border) bg-(--color-bg-card)');
export const timeColHead = cn('w-14 shrink-0 border-r border-(--color-border)/0');

export const dayHead = cva(
    'flex flex-1 flex-col items-center border-l border-(--color-border)/50 py-2 text-center first:border-l-0',
    {
        variants: {
            today: {true: 'bg-(--color-primary-surface)', false: ''},
        },
    }
);
export const dayHeadDow = cn('text-[11px] font-medium uppercase tracking-[0.06em] text-(--color-text-tertiary)');
export const dayHeadNum = cva('mt-0.5 flex size-7 items-center justify-center rounded-full text-sm tabular-nums', {
    variants: {
        today: {
            true: 'bg-(--color-primary) font-medium text-white',
            false: 'font-medium text-(--color-text-primary)',
        },
    },
});

export const weekBody = cn('flex');
export const timeCol = cn('w-14 shrink-0');
export const timeRow = cn('flex items-start justify-end border-t border-(--color-border)/40 pr-2 first:border-t-0');
export const timeLbl = cn('text-[10px] tabular-nums text-(--color-text-tertiary) -mt-[6px]');

export const dayCol = cva('relative flex-1 border-l border-(--color-border)/40 first:border-l-0', {
    variants: {
        today: {true: 'bg-(--color-primary-surface)/10', false: ''},
    },
});

export const hourSlot = cn(
    'absolute inset-x-0 cursor-pointer border-t border-(--color-border)/40 transition-colors duration-(--duration-fast) hover:bg-(--color-primary-surface)/20'
);

export const nowLine = cn('absolute left-0 right-0 z-10 flex items-center');
export const nowDot = cn('size-2.5 shrink-0 rounded-full bg-(--color-primary)');
export const nowBar = cn('flex-1 border-t-2 border-(--color-primary)');
export const nowTime = cn('ml-1 font-mono text-[10px] tabular-nums text-(--color-primary)');

// ── Day view specific ──────────────────────────────────────────────────────

export const dayViewHead = cn('border-b border-(--color-border) bg-(--color-bg-card) px-6 py-4');
export const dayViewDow = cn('text-xs font-medium uppercase tracking-[0.06em] text-(--color-text-tertiary)');
export const dayViewNumRow = cn('mt-0.5 flex items-baseline gap-3');
export const dayViewNum = cn('text-[36px] font-medium leading-[1.1] tabular-nums text-(--color-text-primary)');
export const dayViewMonth = cn('text-sm text-(--color-text-secondary)');
export const dayViewCount = cn(
    'ml-1 rounded-full bg-(--color-primary-surface) px-2 py-0.5 text-xs font-medium text-(--color-primary-text)'
);
export const dayColSolo = cn('relative flex-1');

export const emptyDay = cn(
    'absolute inset-0 flex flex-col items-center justify-center gap-2 text-(--color-text-tertiary)'
);
export const emptyDayTitle = cn('text-sm font-medium text-(--color-text-secondary)');
export const emptyDaySub = cn('max-w-[200px] text-center text-xs text-(--color-text-tertiary)');

// ── Month view ─────────────────────────────────────────────────────────────

export const monthWrapper = cn('');
export const monthHead = cn('grid grid-cols-7 border-b border-(--color-border) bg-(--color-bg-card)');
export const monthHeadCell = cn(
    'py-2 text-center text-[11px] font-medium uppercase tracking-[0.06em] text-(--color-text-tertiary)'
);
export const monthCells = cn('grid grid-cols-7 auto-rows-[minmax(90px,1fr)]');

export const monthCell = cva(
    'cursor-pointer border-b border-r border-(--color-border)/50 p-1 last:border-r-0 transition-colors duration-(--duration-fast)',
    {
        variants: {
            off: {
                true: 'bg-(--color-bg-page) opacity-60',
                false: 'bg-(--color-bg-card) hover:bg-(--color-bg-surface)',
            },
        },
        defaultVariants: {off: false},
    }
);

export const monthCellNum = cva(
    'mb-0.5 flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums',
    {
        variants: {
            today: {
                true: 'bg-(--color-primary) text-white',
                false: 'text-(--color-text-secondary)',
            },
        },
        defaultVariants: {today: false},
    }
);

export const monthEvtBase = cn(
    'mb-0.5 flex w-full cursor-pointer items-center gap-1 truncate rounded-[4px] px-1 py-0.5 text-[11px] font-medium transition-all duration-(--duration-fast)'
);

export const monthEvtCls: Record<string, string> = {
    scheduled: 'bg-(--color-primary-surface) text-(--color-primary-text)',
    confirmed: 'bg-(--color-success-surface) text-(--color-success)',
    done: 'bg-(--color-bg-surface) text-(--color-text-secondary)',
    cancelled: 'bg-(--color-danger-surface) text-(--color-danger)',
    noshow: 'bg-(--color-warning-surface) text-(--color-warning)',
    ARRIVED: 'bg-(--color-info-surface) text-(--color-info)',
    IN_PROGRESS: 'bg-(--color-success-surface) text-(--color-success)',
};

export const monthMoreBtn = cn(
    'rounded-[4px] px-1 py-0.5 text-[11px] text-(--color-text-tertiary) hover:bg-(--color-bg-surface) hover:text-(--color-text-secondary)'
);

// ── Appointment block ──────────────────────────────────────────────────────

export const apptBlock = cva(
    'absolute cursor-pointer overflow-hidden rounded-[6px] px-1.5 py-1 text-left transition-all duration-(--duration-fast) hover:brightness-95',
    {
        variants: {
            status: {
                SCHEDULED: 'bg-(--color-primary-surface)',
                CONFIRMED: 'bg-(--color-success-surface)',
                COMPLETED: 'bg-(--color-bg-surface)',
                CANCELLED: 'bg-(--color-danger-surface)',
                NO_SHOW: 'bg-(--color-warning-surface)',
                ARRIVED: 'bg-(--color-info-surface)',
                IN_PROGRESS: 'bg-(--color-success-surface)',
            },
            highlight: {
                true: 'ring-2 ring-(--color-primary) ring-offset-1',
                false: '',
            },
        },
        defaultVariants: {highlight: false},
    }
);

// Left bar (replaces border-l-[3px] for compat)
export const apptBarCls: Record<string, string> = {
    SCHEDULED: 'bg-(--color-primary)',
    CONFIRMED: 'bg-(--color-success)',
    COMPLETED: 'bg-(--color-text-tertiary)',
    CANCELLED: 'bg-(--color-danger)',
    NO_SHOW: 'bg-(--color-warning)',
    ARRIVED: 'bg-(--color-info)',
    IN_PROGRESS: 'bg-(--color-success)',
};

export const apptBar = cn('absolute bottom-0 left-0 top-0 w-[3px]');
export const apptContent = cn('ml-2 min-w-0');

export const apptTimeCls: Record<string, string> = {
    SCHEDULED: 'text-(--color-primary)',
    CONFIRMED: 'text-(--color-success)',
    COMPLETED: 'text-(--color-text-tertiary)',
    CANCELLED: 'text-(--color-danger)',
    NO_SHOW: 'text-(--color-warning)',
    ARRIVED: 'text-(--color-info)',
    IN_PROGRESS: 'text-(--color-success)',
};

export const apptTimeBase = cn('font-mono text-[10px] tabular-nums leading-[1.2]');
export const apptNameBase = cn('truncate text-[11px] font-medium leading-[1.3]');

export const apptNameCls: Record<string, string> = {
    SCHEDULED: 'text-(--color-primary-text)',
    CONFIRMED: 'text-(--color-success)',
    COMPLETED: 'text-(--color-text-secondary)',
    CANCELLED: 'text-(--color-danger)',
    NO_SHOW: 'text-(--color-warning)',
    ARRIVED: 'text-(--color-info)',
    IN_PROGRESS: 'text-(--color-success)',
};

export const apptTypeLbl = cn('truncate text-[10px] text-(--color-text-tertiary)');

// ── Day popover (month overflow) ───────────────────────────────────────────

export const popOverlay = cn('fixed inset-0 z-50 flex items-center justify-center bg-black/30');
export const popContent = cn(
    'w-72 overflow-hidden rounded-(--radius-modal) border border-(--color-border) bg-(--color-bg-card)',
    'shadow-[var(--shadow-dropdown)]'
);
export const popHead = cn('flex items-center justify-between border-b border-(--color-border) px-4 py-3');
export const popDow = cn('text-xs font-medium uppercase tracking-[0.06em] text-(--color-text-tertiary)');
export const popDate = cn('text-sm font-medium text-(--color-text-primary)');
export const popList = cn('max-h-72 overflow-y-auto p-2');
export const popRow = cn(
    'flex w-full items-center gap-2 rounded-[6px] px-2 py-2 text-left text-xs transition-colors duration-(--duration-fast) hover:bg-(--color-bg-surface)'
);
export const popTime = cn('w-24 shrink-0 font-mono tabular-nums text-(--color-text-tertiary)');
export const popName = cn('flex-1 truncate font-medium text-(--color-text-primary)');

// ── Appointment sheet ─────────────────────────────────────────────────────

export const sheetOverlay = cn('fixed inset-0 z-40 bg-black/20');
export const sheetPanel = cn(
    'fixed bottom-0 right-0 top-0 z-50 flex w-[400px] flex-col border-l border-(--color-border) bg-(--color-bg-card)',
    'shadow-[0_0_30px_rgba(0,0,0,0.1)]'
);
export const shHead = cn('flex shrink-0 items-center justify-between border-b border-(--color-border) px-5 py-4');
export const shTitleBlock = cn('flex flex-col gap-0.5');
export const shEyebrow = cn('text-xs font-medium uppercase tracking-[0.06em] text-(--color-text-tertiary)');
export const shH = cn('text-sm font-medium text-(--color-text-primary)');
export const shBody = cn('flex-1 space-y-5 overflow-y-auto px-5 py-5');
export const shFoot = cn('flex shrink-0 items-center justify-end gap-2 border-t border-(--color-border) px-5 py-4');

export const statusBadge = cva('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', {
    variants: {
        status: {
            SCHEDULED: 'bg-(--color-primary-surface) text-(--color-primary-text)',
            CONFIRMED: 'bg-(--color-success-surface) text-(--color-success)',
            COMPLETED: 'bg-(--color-bg-surface) text-(--color-text-secondary)',
            CANCELLED: 'bg-(--color-danger-surface) text-(--color-danger)',
            NO_SHOW: 'bg-(--color-warning-surface) text-(--color-warning)',
            ARRIVED: 'bg-(--color-info-surface) text-(--color-info)',
            IN_PROGRESS: 'bg-(--color-success-surface) text-(--color-success)',
        },
    },
});

export const shPatientCard = cn('flex items-start gap-3 rounded-(--radius-card-sm) bg-(--color-bg-surface) p-3');
export const shPatientInfo = cn('min-w-0 flex-1');
export const shPatientName = cn('text-sm font-medium text-(--color-text-primary)');
export const shPatientMeta = cn('mt-0.5 text-xs text-(--color-text-secondary)');
export const shPatientLink = cn(
    'flex shrink-0 items-center gap-0.5 text-xs text-(--color-primary-text) transition-colors duration-(--duration-fast) hover:underline'
);

export const shSection = cn('');
export const shSecHead = cn('mb-2 text-xs font-medium uppercase tracking-[0.06em] text-(--color-text-tertiary)');

export const shInfoGrid = cn('grid grid-cols-2 gap-3');
export const shKV = cn('flex flex-col gap-0.5');
export const shK = cn('text-xs text-(--color-text-tertiary)');
export const shV = cn('text-sm text-(--color-text-primary)');
export const shVMono = cn('font-mono text-sm tabular-nums text-(--color-text-primary)');

export const shNotes = cva('text-sm', {
    variants: {
        empty: {
            true: 'italic text-(--color-text-tertiary)',
            false: 'text-(--color-text-primary)',
        },
    },
});

export const shHistGrid = cn('space-y-3');
export const shHistRow = cn('flex items-start justify-between gap-2');
export const shHistK = cn('text-xs text-(--color-text-tertiary)');
export const shHistV = cn('flex flex-wrap items-center gap-1.5 text-xs text-(--color-text-primary)');
export const shHistTag = cn(
    'rounded-full bg-(--color-bg-surface) px-2 py-0.5 text-[10px] text-(--color-text-secondary)'
);
export const shHistNum = cn('font-mono text-sm font-medium tabular-nums text-(--color-text-primary)');
export const shHistMuted = cn('text-(--color-text-tertiary)');
export const shHistLink = cn('flex items-center gap-1 text-xs text-(--color-primary-text) hover:underline');

// ── Form fields ────────────────────────────────────────────────────────────

export const fieldLabel = cn('mb-1 block text-xs font-medium text-(--color-text-secondary)');
export const fieldHint = cn('mt-0.5 text-[11px] text-(--color-text-tertiary)');
export const fieldErr = cn('mt-0.5 flex items-center gap-1 text-[11px] text-(--color-warning)');

export const formGrid = cn('grid grid-cols-2 gap-3');

export const inputBase = cn(
    'w-full rounded-(--radius-input) border border-(--color-border) bg-(--color-bg-card) px-3 py-[9px] text-sm text-(--color-text-primary)',
    'placeholder:text-(--color-text-tertiary) focus:border-(--color-primary) focus:outline-none',
    'transition-colors duration-(--duration-fast)'
);
export const inputErr = cn('border-(--color-warning)');

export const selectBase = cn(
    'w-full rounded-(--radius-input) border border-(--color-border) bg-(--color-bg-card) px-3 py-[9px] text-sm text-(--color-text-primary)',
    'focus:border-(--color-primary) focus:outline-none transition-colors duration-(--duration-fast)'
);
export const textareaBase = cn(
    'w-full resize-none rounded-(--radius-input) border border-(--color-border) bg-(--color-bg-card) px-3 py-2 text-sm text-(--color-text-primary)',
    'placeholder:text-(--color-text-tertiary) focus:border-(--color-primary) focus:outline-none',
    'transition-colors duration-(--duration-fast)'
);

// ── Patient search / pill (new appointment sheet) ─────────────────────────

export const patientPill = cn(
    'flex items-center gap-2 rounded-(--radius-input) border border-(--color-border) bg-(--color-bg-surface) p-2'
);
export const ppInfo = cn('min-w-0 flex-1');
export const ppName = cn('truncate text-sm font-medium text-(--color-text-primary)');
export const ppMeta = cn('text-xs text-(--color-text-tertiary)');
export const ppClear = cn(
    'flex size-6 items-center justify-center rounded-[4px] text-(--color-text-tertiary) transition-colors duration-(--duration-fast) hover:bg-(--color-bg-card) hover:text-(--color-text-primary)'
);

export const searchWrap = cn('relative');
export const searchBox = cva(
    'flex items-center gap-2 rounded-(--radius-input) border bg-(--color-bg-card) px-3 py-[9px] transition-colors duration-(--duration-fast) focus-within:border-(--color-primary)',
    {
        variants: {
            error: {
                true: 'border-(--color-warning)',
                false: 'border-(--color-border)',
            },
        },
        defaultVariants: {error: false},
    }
);
export const searchInput = cn(
    'flex-1 bg-transparent text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none'
);

export const suggList = cn(
    'absolute left-0 right-0 top-[calc(100%+4px)] z-20 overflow-hidden rounded-(--radius-dropdown) border border-(--color-border) bg-(--color-bg-card)',
    'shadow-[var(--shadow-dropdown)]'
);
export const suggRow = cn(
    'flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-(--duration-fast) hover:bg-(--color-bg-surface)'
);
export const suggName = cn('text-sm font-medium text-(--color-text-primary)');
export const suggMeta = cn('text-xs text-(--color-text-tertiary)');
export const suggEmpty = cn('px-3 py-4 text-center text-sm text-(--color-text-tertiary)');

// ── Conflict banner ────────────────────────────────────────────────────────

export const conflictBanner = cn(
    'flex items-start gap-2.5 rounded-(--radius-card-sm) bg-(--color-warning-surface) px-3 py-2.5'
);
export const conflictTitle = cn('text-xs font-medium text-(--color-warning)');
export const conflictDesc = cn('mt-0.5 text-xs text-(--color-text-secondary)');

// ── Misc ───────────────────────────────────────────────────────────────────

export const shCloseBtn = cn(
    'flex size-7 items-center justify-center rounded-[6px] text-(--color-text-tertiary) hover:bg-(--color-bg-surface)'
);
export const apptTimeLabel = cn('shrink-0 text-[10px] text-(--color-text-tertiary)');
export const apptMonoTime = cn('font-mono text-[10px] tabular-nums');
export const statusDot = cn('size-1.5 rounded-full bg-current');
export const searchIcon = cn('size-3.5 shrink-0 text-(--color-text-tertiary)');
export const conflictIcon = cn('mt-0.5 size-4 shrink-0 text-(--color-warning)');
export const skeletonRoot = cn('flex flex-col gap-2 p-6');

// ── Cancel confirm modal ───────────────────────────────────────────────────

export const modalOverlay = cn('fixed inset-0 z-[60] flex items-center justify-center bg-black/40');
export const modal = cn(
    'w-[420px] rounded-(--radius-modal) border border-(--color-border) bg-(--color-bg-card) p-6',
    'shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
);
export const modalHead = cn('mb-4 flex items-start gap-3');
export const modalIcon = cn(
    'flex size-10 shrink-0 items-center justify-center rounded-full bg-(--color-warning-surface) text-(--color-warning)'
);
export const modalTitle = cn('text-sm font-medium text-(--color-text-primary)');
export const modalDesc = cn('mt-0.5 text-xs text-(--color-text-secondary)');
export const modalActions = cn('mt-4 flex items-center justify-end gap-2');
export const shStatusRow = cn('flex items-center gap-2');
export const arrowBtnRow = cn('flex items-center gap-0.5');
export const skeletonDayCard = cn('h-12 w-full rounded-(--radius-card-sm)');
