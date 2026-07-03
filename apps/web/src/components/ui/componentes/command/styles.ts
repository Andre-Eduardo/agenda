import {css} from '@/styled-system/css';

// ── Command ───────────────────────────────────────────────────────────────────

export const command = css({
    display: 'flex',
    h: 'full',
    w: 'full',
    flexDirection: 'column',
    overflow: 'hidden',
    rounded: 'md',
    bg: 'popover',
    color: 'popover-foreground',
});

// CommandDialog passes this class to <Command> to configure cmdk internals
export const commandDialog = css({
    '& [cmdk-group-heading]': {
        px: '2',
        fontWeight: 'medium',
        color: 'muted-foreground',
    },

    '& [cmdk-group]:not([hidden]) ~ [cmdk-group]': {
        pt: '0',
    },

    '& [cmdk-group]': {
        px: '2',
    },

    '& [cmdk-input-wrapper] svg': {
        w: '5',
        h: '5',
    },

    '& [cmdk-input]': {
        h: '12',
    },

    '& [cmdk-item]': {
        px: '2',
        py: '3',
    },

    '& [cmdk-item] svg': {
        w: '5',
        h: '5',
    },
});

// ── CommandInput ──────────────────────────────────────────────────────────────

export const commandInputWrapper = css({
    display: 'flex',
    alignItems: 'center',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    px: '3',
});

export const commandInput = css({
    display: 'flex',
    h: '11',
    w: 'full',
    rounded: 'md',
    bg: 'transparent',
    py: '3',
    fontSize: 'sm',
    outline: 'none',

    _placeholder: {
        color: 'muted-foreground',
    },

    _disabled: {
        cursor: 'not-allowed',
        opacity: '0.5',
    },
});

// ── CommandList ───────────────────────────────────────────────────────────────

export const commandList = css({
    maxH: '[300px]',
    overflowY: 'auto',
    overflowX: 'hidden',
});

// ── CommandEmpty ──────────────────────────────────────────────────────────────

export const commandEmpty = css({
    py: '6',
    textAlign: 'center',
    fontSize: 'sm',
});

// ── CommandGroup ──────────────────────────────────────────────────────────────

export const commandGroup = css({
    overflow: 'hidden',
    p: '1',
    color: 'foreground',

    '& [cmdk-group-heading]': {
        px: '2',
        py: '1.5',
        fontSize: 'xs',
        fontWeight: 'medium',
        color: 'muted-foreground',
    },
});

// ── CommandSeparator ──────────────────────────────────────────────────────────

export const commandSeparator = css({
    mx: '-1',
    h: '1px',
    bg: 'border',
});

// ── CommandItem ───────────────────────────────────────────────────────────────

export const commandItem = css({
    position: 'relative',
    display: 'flex',
    cursor: 'default',
    userSelect: 'none',
    alignItems: 'center',
    gap: '2',
    rounded: 'sm',
    px: '2',
    py: '1.5',
    fontSize: 'sm',
    outline: 'none',

    '&[data-selected="true"]': {
        bg: 'accent',
        color: 'accent-foreground',
    },

    '&[data-disabled="true"]': {
        pointerEvents: 'none',
        opacity: '0.5',
    },

    '& svg': {
        pointerEvents: 'none',
        w: '4',
        h: '4',
        flexShrink: '0',
    },
});

// ── CommandShortcut ───────────────────────────────────────────────────────────

export const commandShortcut = css({
    ml: 'auto',
    fontSize: 'xs',
    letterSpacing: 'widest',
    color: 'muted-foreground',
});
