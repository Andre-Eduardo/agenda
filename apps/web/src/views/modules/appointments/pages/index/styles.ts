import {cva} from 'class-variance-authority';
import {cn} from '@/lib/utils';

// ── Page layout ────────────────────────────────────────────────────
export const page = cn('flex flex-col h-full');

export const header = cn('flex items-center justify-between px-6 py-4 border-b border-(--color-border) shrink-0');

export const headerLeft = cn('flex items-center gap-3');
export const headerRight = cn('flex items-center gap-2');
export const pageTitle = cn('text-2xl leading-[1.2] font-medium text-(--color-text-primary)');

// ── Period navigation ──────────────────────────────────────────────
export const periodBar = cn(
    'flex items-center justify-between px-6 py-3 border-b border-(--color-border) shrink-0 gap-4 flex-wrap'
);

export const periodLeft = cn('flex items-center gap-2');
export const periodLabel = cn('text-sm font-medium text-(--color-text-primary) tabular-nums font-mono');
export const arrowsGroup = cn('flex items-center');
export const arrowBtn = cn(
    'p-1.5 rounded-(--radius-button) text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-surface) transition-colors'
);

// ── Status filter chips ────────────────────────────────────────────
export const statusFilterRow = cn('flex items-center gap-1.5 flex-wrap');

export const statusChip = cva(
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer select-none',
    {
        variants: {
            status: {
                SCHEDULED: 'border-(--color-primary-border) text-(--color-primary-text)',
                CONFIRMED: 'border-(--color-success)/30 text-(--color-success)',
                COMPLETED: 'border-(--color-border) text-(--color-text-secondary)',
                CANCELLED: 'border-(--color-danger)/30 text-(--color-danger)',
                NO_SHOW: 'border-(--color-warning)/30 text-(--color-warning)',
                ARRIVED: 'border-(--color-primary-border) text-(--color-primary-text)',
                IN_PROGRESS: 'border-(--color-info)/30 text-(--color-info)',
            },
            active: {
                true: '',
                false: 'opacity-40',
            },
        },
    }
);

export const statusDot = cva('w-1.5 h-1.5 rounded-full shrink-0', {
    variants: {
        status: {
            SCHEDULED: 'bg-(--color-primary)',
            CONFIRMED: 'bg-(--color-success)',
            COMPLETED: 'bg-(--color-text-tertiary)',
            CANCELLED: 'bg-(--color-danger)',
            NO_SHOW: 'bg-(--color-warning)',
            ARRIVED: 'bg-(--color-primary)',
            IN_PROGRESS: 'bg-(--color-info)',
        },
    },
});

// ── Main layout (sidebar + body) ──────────────────────────────────
export const mainLayout = cn('flex flex-1 overflow-hidden');
export const sidebar = cn('w-[220px] shrink-0 border-r border-(--color-border) overflow-y-auto p-3 hidden lg:block');
export const calBody = cn('flex-1 overflow-auto');

// ── Segmented control (Day/Week/Month) ────────────────────────────
export const segmented = cn(
    'flex items-center rounded-(--radius-button) border border-(--color-border) bg-(--color-bg-surface) p-0.5 gap-0.5'
);
export const segmentBtn = cva('px-3 py-1 text-xs font-medium rounded-[6px] transition-colors', {
    variants: {
        active: {
            true: 'bg-(--color-bg-card) text-(--color-text-primary) shadow-sm',
            false: 'text-(--color-text-secondary) hover:text-(--color-text-primary)',
        },
    },
});

// ── Mini calendar ─────────────────────────────────────────────────
export const mini = {
    root: cn('select-none'),
    head: cn('flex items-center justify-between mb-2'),
    monthLabel: cn('text-xs font-medium text-(--color-text-primary)'),
    arrows: cn('flex items-center gap-0.5'),
    arrowBtn: cn(
        'p-0.5 rounded text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-surface) transition-colors'
    ),
    dowRow: cn('grid grid-cols-7 mb-1'),
    dowCell: cn('text-center text-[10px] text-(--color-text-tertiary) py-0.5'),
    grid: cn('grid grid-cols-7'),
    cell: cva('relative flex flex-col items-center justify-start py-0.5 cursor-pointer rounded', {
        variants: {
            inMonth: {true: '', false: 'opacity-30'},
            isToday: {true: '', false: ''},
            isSelected: {true: 'bg-(--color-primary) !text-white', false: ''},
            inWeek: {
                true: 'bg-(--color-primary)/10',
                false: '',
            },
            hasAppts: {true: '', false: ''},
        },
    }),
    cellNum: cn('text-[11px] leading-5 w-5 h-5 flex items-center justify-center rounded-full'),
    todayNum: cn(
        'text-[11px] leading-5 w-5 h-5 flex items-center justify-center rounded-full bg-(--color-primary) text-white font-medium'
    ),
    dot: cn('w-1 h-1 rounded-full bg-(--color-primary) mt-[1px]'),
    todayBtn: cn(
        'mt-2 w-full text-[10px] text-(--color-text-secondary) hover:text-(--color-text-primary) text-center py-1 rounded transition-colors'
    ),
};

// ── Week/Day grid ─────────────────────────────────────────────────
export const grid = {
    weekHead: cn('flex border-b border-(--color-border) sticky top-0 z-10 bg-(--color-bg-page)'),
    timeColHead: cn('w-14 shrink-0'),
    dayHead: cva('flex-1 text-center py-2 text-xs font-medium border-l border-(--color-border)', {
        variants: {
            isToday: {
                true: 'text-(--color-primary)',
                false: 'text-(--color-text-secondary)',
            },
        },
    }),
    dayHeadNum: cva('text-base font-medium leading-7 w-7 h-7 flex items-center justify-center rounded-full mx-auto', {
        variants: {
            isToday: {
                true: 'bg-(--color-primary) text-white',
                false: '',
            },
        },
    }),
    body: cn('flex'),
    timeCol: cn('w-14 shrink-0'),
    timeRow: cn('border-b border-(--color-border) flex items-start justify-end pr-2'),
    timeLabel: cn('text-[10px] text-(--color-text-tertiary) tabular-nums font-mono -mt-[6px]'),
    dayCol: cva('flex-1 relative border-l border-(--color-border) border-b border-(--color-border)', {
        variants: {
            isToday: {
                true: 'bg-(--color-primary)/[0.02]',
                false: '',
            },
        },
    }),
    slot: cn(
        'absolute inset-x-0 border-b border-(--color-border)/40 cursor-pointer hover:bg-(--color-bg-surface) transition-colors'
    ),
    nowLine: cn('absolute left-0 right-0 z-10 border-t-2 border-(--color-primary) pointer-events-none'),
    nowDot: cn('absolute -left-[5px] -top-[5px] w-[10px] h-[10px] rounded-full bg-(--color-primary)'),
    emptyDay: cn(
        'absolute inset-0 flex flex-col items-center justify-center gap-2 text-(--color-text-tertiary) pointer-events-none'
    ),
    emptyDayTitle: cn('text-sm font-medium text-(--color-text-secondary)'),
    emptyDaySub: cn('text-xs text-(--color-text-tertiary) text-center max-w-[200px]'),
};

// ── Appointment block ─────────────────────────────────────────────
export const apptBlock = cva(
    'absolute rounded-(--radius-data) border overflow-hidden cursor-pointer transition-all hover:shadow-sm group',
    {
        variants: {
            status: {
                SCHEDULED: 'bg-(--color-primary-surface) border-(--color-primary-border)',
                CONFIRMED: 'bg-(--color-success-surface) border-(--color-success)/30',
                COMPLETED: 'bg-(--color-bg-surface) border-(--color-border)',
                CANCELLED: 'bg-(--color-danger-surface) border-(--color-danger)/30 opacity-60',
                NO_SHOW: 'bg-(--color-warning-surface) border-(--color-warning)/30 opacity-60',
                ARRIVED: 'bg-(--color-primary-surface) border-(--color-primary-border)',
                IN_PROGRESS: 'bg-(--color-info-surface) border-(--color-info)/30',
            },
            highlight: {
                true: 'ring-2 ring-(--color-primary) ring-offset-1',
                false: '',
            },
        },
    }
);

export const apptBar = cva('absolute left-0 top-0 bottom-0 w-0.5', {
    variants: {
        status: {
            SCHEDULED: 'bg-(--color-primary)',
            CONFIRMED: 'bg-(--color-success)',
            COMPLETED: 'bg-(--color-text-tertiary)',
            CANCELLED: 'bg-(--color-danger)',
            NO_SHOW: 'bg-(--color-warning)',
            ARRIVED: 'bg-(--color-primary)',
            IN_PROGRESS: 'bg-(--color-info)',
        },
    },
});

export const apptContent = cn('pl-2 pr-1 py-0.5 overflow-hidden');
export const apptTime = cn('text-[10px] font-mono tabular-nums text-(--color-text-secondary) truncate');
export const apptName = cn('text-xs font-medium text-(--color-text-primary) truncate leading-4');
export const apptType = cn('text-[10px] text-(--color-text-tertiary) truncate');

// ── Month grid ────────────────────────────────────────────────────
export const monthGrid = {
    head: cn('grid grid-cols-7 border-b border-(--color-border) bg-(--color-bg-page) sticky top-0 z-10'),
    headCell: cn(
        'text-center py-2 text-xs font-medium text-(--color-text-secondary) border-l border-(--color-border) first:border-l-0'
    ),
    grid: cn('grid grid-cols-7'),
    cell: cva(
        'min-h-[100px] border-b border-r border-(--color-border) p-1 cursor-pointer hover:bg-(--color-bg-surface)/50 transition-colors',
        {
            variants: {
                inMonth: {true: '', false: 'bg-(--color-bg-surface)/30'},
                isToday: {true: 'bg-(--color-primary)/5', false: ''},
            },
        }
    ),
    cellHead: cn('flex items-center justify-between mb-1'),
    cellNum: cva('w-6 h-6 flex items-center justify-center rounded-full text-xs cursor-pointer transition-colors', {
        variants: {
            isToday: {
                true: 'bg-(--color-primary) text-white font-medium',
                false: 'text-(--color-text-secondary) hover:bg-(--color-bg-surface)',
            },
            inMonth: {
                true: 'text-(--color-text-secondary)',
                false: 'text-(--color-text-tertiary)',
            },
        },
    }),
    evt: cva('w-full text-left px-1.5 py-0.5 rounded text-[10px] truncate mb-0.5 font-medium', {
        variants: {
            status: {
                SCHEDULED: 'bg-(--color-primary-surface) text-(--color-primary-text)',
                CONFIRMED: 'bg-(--color-success-surface) text-(--color-success)',
                COMPLETED: 'bg-(--color-bg-surface) text-(--color-text-secondary)',
                CANCELLED: 'bg-(--color-danger-surface) text-(--color-danger) opacity-60',
                NO_SHOW: 'bg-(--color-warning-surface) text-(--color-warning)',
                ARRIVED: 'bg-(--color-primary-surface) text-(--color-primary-text)',
                IN_PROGRESS: 'bg-(--color-info-surface) text-(--color-info)',
            },
        },
    }),
    moreBtn: cn('text-[10px] text-(--color-text-secondary) hover:text-(--color-text-primary) cursor-pointer'),
};

// ── Day column (sidebar detail panel) ────────────────────────────
export const dayColHead = cn('px-6 py-3 border-b border-(--color-border) sticky top-0 bg-(--color-bg-page) z-10');
export const dayHeadBaseline = cn('flex items-baseline gap-2');
export const dayDateNum = cn('text-3xl font-medium tabular-nums font-mono text-(--color-text-primary)');
export const dayBodyCol = cn('flex-1 relative border-l border-(--color-border)');
export const nowTimeLabel = cn('absolute left-3 -top-[8px] text-[10px] font-mono tabular-nums text-(--color-primary)');
export const apptTimeMono = cn('font-mono tabular-nums mr-1');

// ── Dialog forms ──────────────────────────────────────────────────
export const formBody = cn('grid gap-4 py-2');
export const formRow = cn('grid grid-cols-2 gap-3');
export const formField = cn('flex flex-col gap-1.5');
export const formFooter = cn('flex justify-end gap-2 pt-2');
export const optionalLabel = cn('text-(--color-text-tertiary) font-normal text-xs');
export const sheetInfoRow = cn('flex flex-col gap-1');
export const cancelBtn = cn('gap-1.5 text-(--color-danger) border-(--color-danger)/30 hover:bg-(--color-danger)/5');

// ── Patient selection (search + pill) ────────────────────────────
export const patSearchPill = cn(
    'flex items-center gap-2 p-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg-surface)'
);
export const patAvatarSm = cn(
    'w-6 h-6 rounded-full bg-(--color-primary)/10 flex items-center justify-center text-[10px] font-medium text-(--color-primary) shrink-0'
);
export const patAvatarLg = cn(
    'w-10 h-10 rounded-full bg-(--color-primary)/10 flex items-center justify-center text-sm font-medium text-(--color-primary) shrink-0'
);
export const patSearchName = cn('text-sm text-(--color-text-primary) flex-1 truncate');
export const patSearchDrop = cn(
    'absolute top-full left-0 right-0 z-50 mt-1 rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card) shadow-lg overflow-hidden max-h-48 overflow-y-auto'
);
export const patSearchRow = cn(
    'w-full text-left px-3 py-2 text-sm hover:bg-(--color-bg-surface) flex items-center gap-2 transition-colors'
);
export const patProfileLink = cn('flex items-center gap-1 text-xs text-(--color-primary) hover:underline shrink-0');

// ── Sheet (detail + new) ──────────────────────────────────────────
export const sheet = {
    eyebrow: cn('text-xs text-(--color-text-tertiary) font-medium uppercase tracking-wide'),
    statusBadge: cva('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', {
        variants: {
            status: {
                SCHEDULED: 'bg-(--color-primary-surface) text-(--color-primary-text)',
                CONFIRMED: 'bg-(--color-success-surface) text-(--color-success)',
                COMPLETED: 'bg-(--color-bg-surface) text-(--color-text-secondary)',
                CANCELLED: 'bg-(--color-danger-surface) text-(--color-danger)',
                NO_SHOW: 'bg-(--color-warning-surface) text-(--color-warning)',
                ARRIVED: 'bg-(--color-primary-surface) text-(--color-primary-text)',
                IN_PROGRESS: 'bg-(--color-info-surface) text-(--color-info)',
            },
        },
    }),
    patientCard: cn(
        'flex items-center gap-3 p-3 rounded-(--radius-card) bg-(--color-bg-surface) border border-(--color-border)'
    ),
    patientName: cn('text-sm font-medium text-(--color-text-primary)'),
    patientMeta: cn('text-xs text-(--color-text-secondary)'),
    section: cn('border-t border-(--color-border) pt-4 mt-4'),
    sectionTitle: cn('text-xs font-medium text-(--color-text-tertiary) uppercase tracking-wide mb-3'),
    kvGrid: cn('grid grid-cols-2 gap-3'),
    kv: cn('flex flex-col gap-0.5'),
    kvKey: cn('text-xs text-(--color-text-tertiary)'),
    kvVal: cn('text-sm text-(--color-text-primary) font-mono tabular-nums'),
    notes: cn('text-sm text-(--color-text-secondary) leading-relaxed'),
    notesEmpty: cn('text-sm text-(--color-text-tertiary) italic'),
    actions: cn('flex items-center gap-2 pt-4 border-t border-(--color-border) mt-4'),
    patientBody: cn('flex-1 min-w-0'),
};
export const weekHeaderMin = cn('min-w-[560px]');
export const dayOfWeekText = cn('text-[10px] uppercase');
export const dayHeaderMin = cn('min-w-[280px]');
export const dayHeaderText = cn('text-sm text-(--color-text-secondary)');
export const apptCountText = cn('text-xs text-(--color-primary)');
export const emptyDayCalIcon = cn('size-7 text-(--color-text-tertiary)');
export const sheetKvText = cn('text-sm text-(--color-text-primary)');
export const patSearchWrap = cn('relative');
export const cancelDialogText = cn('text-sm text-(--color-text-secondary)');
export const detailSheetPanel = cn('w-[400px] sm:w-[480px] overflow-y-auto');
export const editDialogWidth = cn('sm:max-w-[480px]');
export const newApptDialogWidth = cn('sm:max-w-[520px]');
export const cancelDialogWidth = cn('sm:max-w-[400px]');
export const patClearBtn = cn('text-(--color-text-tertiary) hover:text-(--color-text-primary)');
export const headerCalIcon = cn('size-5 text-(--color-text-secondary)');
