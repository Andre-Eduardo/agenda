import {cva} from 'class-variance-authority';
import {cn} from '@/lib/utils';

// Page
export const page = cn('flex flex-col gap-6 p-6 max-w-[1200px] mx-auto w-full');

// Header
export const header = cn('flex items-start justify-between gap-4 flex-wrap');
export const greeting = cn('text-[22px] font-medium text-(--color-text-primary) leading-snug');
export const dateLabel = cn('text-sm text-(--color-text-secondary) mt-0.5');
export const agentBadge = cn(
    'flex items-center gap-2 px-3 py-1.5 rounded-(--radius-card)',
    'border border-(--color-ai-border) bg-(--color-ai-bg)',
    'text-xs text-(--color-ai-text)'
);
export const agentDot = cn('w-1.5 h-1.5 rounded-full bg-(--color-ai-badge-bg)');

// Alerts bar
export const alertsBar = cn('rounded-(--radius-card) border border-(--color-warning)/30 bg-(--color-warning)/5 p-4');
export const alertsHead = cn('flex items-center gap-2 text-sm font-medium text-(--color-warning) mb-3');
export const alertsList = cn('flex flex-col gap-2');
export const alertRow = cva('flex items-start gap-3 rounded-[6px] p-3', {
    variants: {
        tone: {
            primary: 'bg-(--color-primary)/8',
            warning: 'bg-(--color-warning)/8',
        },
    },
    defaultVariants: {tone: 'warning'},
});
export const alertTitle = cn('text-sm font-medium text-(--color-text-primary) leading-snug');
export const alertDesc = cn('text-xs text-(--color-text-secondary) mt-0.5');
export const alertBtn = cn(
    'ml-auto shrink-0 flex items-center gap-1 text-xs text-(--color-primary)',
    'hover:text-(--color-primary)/80 transition-colors whitespace-nowrap self-center'
);

// Stats
export const statsGrid = cn('grid grid-cols-2 sm:grid-cols-4 gap-3');
export const statCard = cn(
    'flex items-center gap-3 p-4 rounded-(--radius-card)',
    'border border-(--color-border) bg-(--color-bg-card)'
);
export const statIcon = cva('flex items-center justify-center w-9 h-9 rounded-[8px] shrink-0', {
    variants: {
        tone: {
            neutral: 'bg-(--color-text-secondary)/10 text-(--color-text-secondary)',
            success: 'bg-(--color-success)/10 text-(--color-success)',
            muted: 'bg-(--color-text-tertiary)/10 text-(--color-text-tertiary)',
            primary: 'bg-(--color-primary)/10 text-(--color-primary)',
        },
    },
    defaultVariants: {tone: 'neutral'},
});
export const statValue = cn('text-2xl font-medium text-(--color-text-primary) font-mono tabular-nums leading-none');
export const statLabel = cn('text-xs text-(--color-text-secondary) mt-1');

// Two-column grid
export const cols = cn('grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start');
export const colMain = cn('flex flex-col gap-6');
export const colSide = cn('flex flex-col gap-6');

// Section cards
export const sectionCard = cn('rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card)');
export const sectionHead = cn('flex items-center justify-between gap-4 px-5 pt-5 pb-4');
export const sectionTitle = cn('text-sm font-medium text-(--color-text-primary)');
export const sectionSub = cn('text-[11px] text-(--color-text-tertiary) mt-0.5');
export const sectionBody = cn('px-5 pb-5');
export const secLink = cn(
    'flex items-center gap-1 text-xs text-(--color-primary)',
    'hover:text-(--color-primary)/80 transition-colors'
);

// Today's appointments
export const apptList = cn('flex flex-col divide-y divide-(--color-border)');
export const apptRow = cn('flex items-center gap-3 py-3.5 first:pt-0 last:pb-0');
export const apptTime = cn('flex flex-col items-end w-12 shrink-0');
export const apptTimeStart = cn('text-sm font-medium font-mono tabular-nums text-(--color-text-primary) leading-none');
export const apptTimeEnd = cn('text-[11px] text-(--color-text-tertiary) font-mono tabular-nums mt-0.5');
export const apptPatBtn = cn('flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-75 transition-opacity text-left');
export const apptPatName = cn('text-sm font-medium text-(--color-text-primary) truncate leading-none');
export const apptPatType = cn('flex items-center gap-1 text-[11px] text-(--color-text-tertiary) mt-0.5');

// Appointment status badge
export const statusBadge = cva(
    'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0',
    {
        variants: {
            status: {
                SCHEDULED: 'bg-(--color-text-tertiary)/10 text-(--color-text-secondary)',
                CONFIRMED: 'bg-(--color-primary)/10 text-(--color-primary)',
                COMPLETED: 'bg-(--color-success)/10 text-(--color-success)',
                CANCELLED: 'bg-(--color-danger)/10 text-(--color-danger)',
                NO_SHOW: 'bg-(--color-warning)/10 text-(--color-warning)',
                ARRIVED: 'bg-(--color-primary)/15 text-(--color-primary)',
                IN_PROGRESS: 'bg-(--color-primary)/15 text-(--color-primary)',
            },
        },
        defaultVariants: {status: 'SCHEDULED'},
    }
);
export const statusDot = cn('w-1.5 h-1.5 rounded-full bg-current shrink-0');

// Empty state (inside section)
export const empty = cn('flex flex-col items-center gap-3 py-8 text-center');
export const emptyIcon = cn('text-(--color-text-tertiary)');
export const emptyTitle = cn('text-sm font-medium text-(--color-text-primary)');
export const emptySub = cn('text-xs text-(--color-text-secondary) max-w-[220px]');

// Recent records
export const evolList = cn('flex flex-col gap-4');
export const evolRow = cn('flex items-start gap-3');
export const evolBody = cn('flex-1 min-w-0');
export const evolMeta = cn('flex items-center gap-2 flex-wrap text-[11px] text-(--color-text-tertiary)');
export const evolName = cn(
    'text-sm font-medium text-(--color-text-primary) leading-snug',
    'hover:underline underline-offset-2 cursor-pointer'
);
export const evolExcerpt = cn('text-xs text-(--color-text-secondary) mt-1 line-clamp-2 leading-relaxed');
export const aiBadge = cn(
    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px]',
    'bg-(--color-ai-bg) text-(--color-ai-text) text-[10px]'
);

// Quick actions
export const qaGrid = cn('grid grid-cols-2 gap-2');
export const qaBtn = cn(
    'flex items-center gap-3 p-3 rounded-[8px] text-left',
    'border border-(--color-border) bg-(--color-bg-surface)',
    'hover:bg-(--color-bg-card) hover:border-(--color-primary)/30',
    'transition-all cursor-pointer'
);
export const qaIcon = cn(
    'flex items-center justify-center w-8 h-8 rounded-[6px] shrink-0',
    'bg-(--color-primary)/10 text-(--color-primary)'
);
export const qaLabel = cn('text-xs font-medium text-(--color-text-primary) leading-snug');
export const qaSub = cn('text-[10px] text-(--color-text-tertiary) mt-0.5');

// Upcoming appointments
export const upList = cn('flex flex-col divide-y divide-(--color-border)');
export const upRow = cn(
    'flex items-center gap-3 py-3 first:pt-0 last:pb-0',
    'hover:opacity-75 transition-opacity cursor-pointer'
);
export const upDate = cn('flex flex-col w-14 shrink-0');
export const upDay = cn('text-xs font-medium text-(--color-text-primary)');
export const upTime = cn('text-[11px] text-(--color-text-tertiary) font-mono tabular-nums mt-0.5');
export const upInfo = cn('flex-1 min-w-0');
export const upName = cn('text-sm font-medium text-(--color-text-primary) truncate');
export const upType = cn('text-[11px] text-(--color-text-secondary) mt-0.5 truncate');

export const agentLabel = cn('text-(--color-text-secondary)');
export const skeletonGreeting = cn('h-7 w-48 mb-1');
export const skeletonStatValue = cn('h-6 w-8 mb-1');
export const skeletonListCol = cn('flex flex-col gap-4');
export const skeletonListRow = cn('flex items-start gap-3');
export const skeletonApptCol = cn('flex flex-col gap-3');
export const skeletonApptRow = cn('flex items-center gap-3');
export const skeletonAvatar = cn('h-8 w-8 rounded-full shrink-0');
export const skeletonNameMd = cn('h-3.5 w-32 mb-1.5');
export const skeletonNameSm = cn('h-3.5 w-28 mb-1.5');
export const skeletonStatusBadge = cn('h-5 w-20 rounded-full');
export const patientInitialsAvatar = cn(
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
    'bg-(--color-text-tertiary)/15 text-[11px] font-medium text-(--color-text-secondary)'
);
export const upChevron = cn('text-(--color-text-tertiary) shrink-0');
export const evolDate = cn('font-mono tabular-nums');
export const apptStartBtn = cn('shrink-0 gap-1.5');

// Skeleton loader
export const skeletonRow = cn('flex items-center gap-3 py-3.5');
