import {css, cva} from '@/styled-system/css';
import {styled} from '@/styled-system/jsx';

export {cx} from '@/styled-system/css';

// ── Variantes dinâmicas (cva) ──────────────────────────────────────────────────

export const soapLetter = cva({
    base: {
        display: 'inline-flex',
        w: '9',
        h: '9',
        flexShrink: '0',
        alignItems: 'center',
        justifyContent: 'center',
        rounded: '[8px]',
        fontSize: '[15px]',
        fontWeight: 'medium',
    },
    variants: {
        v: {
            s: {bg: 'primary.surface', color: 'primary.text'},
            o: {bg: 'success.surface', color: 'success'},
            a: {bg: 'warning.surface', color: 'warning'},
            p: {bg: 'primary.surface', color: 'primary.text'},
        },
    },
});

// ── Helpers de página (CSS isolado) ─────────────────────────────────────────────

export const pageErrorState = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4',
    p: '12',
    color: 'text.secondary',
});

export const monoDate = css({fontFamily: 'mono', fontVariantNumeric: 'tabular-nums'});

// ── Componentes styled (raiz com selectors aninhados `&`) ──────────────────────

export const PageShell = styled('div', {
    base: {
        pb: '[60px]',
        bg: 'bg.page',

        '& > .inner': {
            px: '6',
            pt: '6',

            // Header card
            '& > .header': {
                mb: '[22px]',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'flex-start',
                gap: '7',
                rounded: '[14px]',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'border',
                bg: 'bg.card',
                px: '[26px]',
                py: '[22px]',

                '& > .left .eyebrow': {
                    mb: '[6px]',
                    fontSize: '2xs',
                    fontWeight: 'medium',
                    textTransform: 'uppercase',
                    letterSpacing: '[0.08em]',
                    color: 'text.tertiary',
                },
                '& > .left .title-row': {
                    mb: '3',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'baseline',
                    gap: '[10px]',

                    '& > .title-type': {
                        fontSize: '[28px]',
                        fontWeight: 'medium',
                        lineHeight: '[1.2]',
                        letterSpacing: '[-0.02em]',
                        color: 'text.primary',
                    },
                    '& > .title-dot': {fontSize: '[28px]', lineHeight: '[1.2]', color: 'text.tertiary'},
                    '& > .title-date': {fontSize: '[28px]', lineHeight: '[1.2]', color: 'text.secondary'},
                },
                '& > .left .meta': {
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '3',
                    fontSize: 'sm',
                    color: 'text.secondary',

                    '& > .meta-item': {display: 'inline-flex', alignItems: 'center', gap: '[6px]'},
                    '& > .meta-sep': {
                        display: 'inline-block',
                        w: '1',
                        h: '1',
                        flexShrink: '0',
                        rounded: 'full',
                        bg: 'border.hover',
                    },
                },

                '& > .aside': {
                    display: 'flex',
                    minW: '[280px]',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '3',

                    '& > .pat-card': {
                        display: 'flex',
                        w: 'full',
                        cursor: 'pointer',
                        alignItems: 'center',
                        gap: '3',
                        rounded: '[10px]',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: 'border',
                        bg: 'bg.surface',
                        px: '[14px]',
                        py: '[10px]',
                        transitionProperty: 'border-color, background-color',
                        transitionDuration: 'base',
                        _hover: {borderColor: 'primary', bg: 'primary.surface'},

                        '& > .pat-body': {minW: '0', flex: '1'},
                        '& .pat-name': {fontSize: 'sm', fontWeight: 'medium', color: 'text.primary'},
                        '& .pat-meta': {mt: '[2px]', fontSize: '2xs', color: 'text.tertiary'},
                    },
                    '& > .header-actions': {display: 'flex', gap: '2'},
                },
            },

            // Body
            '& > .body': {
                display: 'flex',
                flexDirection: 'column',
                gap: '[18px]',
            },

            // Bottom nav
            '& > .nav': {
                mt: '6',
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'stretch',
                gap: '[14px]',
                rounded: '[12px]',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'border',
                bg: 'bg.card',
                p: '[14px]',

                '& > .nav-btn': {
                    display: 'flex',
                    cursor: 'pointer',
                    alignItems: 'center',
                    gap: '3',
                    rounded: '[10px]',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'border',
                    bg: 'transparent',
                    px: '4',
                    py: '3',
                    fontSize: 'sm',
                    fontWeight: 'medium',
                    color: 'text.primary',
                    transitionProperty: 'border-color, background-color, color',
                    transitionDuration: 'base',
                    _hover: {borderColor: 'primary', bg: 'primary.surface', color: 'primary.text'},
                    _disabled: {cursor: 'not-allowed', opacity: '0.4'},
                    '&:disabled:hover': {borderColor: 'border', bg: 'transparent', color: 'text.primary'},

                    '& > .nav-stack': {display: 'flex', flexDirection: 'column', gap: '[2px]'},
                    '& .nav-label': {fontSize: 'sm', fontWeight: 'medium', lineHeight: '[1.3]'},
                    '& .nav-sub': {fontSize: '2xs', lineHeight: '[1.3]', color: 'text.tertiary'},
                },
                '& > .nav-btn-end': {justifyContent: 'flex-end', textAlign: 'right'},
                '& > .nav-center': {
                    display: 'inline-flex',
                    cursor: 'pointer',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                    rounded: '[8px]',
                    borderWidth: '0',
                    bg: 'transparent',
                    px: '[18px]',
                    py: '[10px]',
                    fontSize: 'sm',
                    fontWeight: 'medium',
                    color: 'text.secondary',
                    transitionProperty: 'background-color, color',
                    transitionDuration: 'base',
                    _hover: {bg: 'bg.surface', color: 'primary.text'},
                },
            },
        },
    },
});

export const SectionCard = styled('section', {
    base: {
        rounded: '[12px]',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'border',
        bg: 'bg.card',
        px: '[26px]',
        pb: '[24px]',
        pt: '[22px]',

        '& > .head': {
            mb: '[18px]',
            borderBottomWidth: '1px',
            borderBottomStyle: 'solid',
            borderBottomColor: 'border',
            pb: '[14px]',

            '& > .title': {
                display: 'flex',
                alignItems: 'center',
                gap: '2',
                fontSize: '[15px]',
                fontWeight: 'medium',
                lineHeight: '[1.3]',
                letterSpacing: '[-0.01em]',
                color: 'text.primary',
            },
            '& > .sub': {mt: '[3px]', fontSize: 'xs', color: 'text.tertiary'},
        },
        '& > .empty': {
            display: 'flex',
            alignItems: 'center',
            gap: '2',
            rounded: '[8px]',
            bg: 'bg.surface',
            px: '4',
            py: '[14px]',
            fontSize: 'sm',
            fontStyle: 'italic',
            color: 'text.tertiary',
        },
    },
});

export const TraceCard = styled('section', {
    base: {
        position: 'relative',
        rounded: '[12px]',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'border',
        bg: 'bg.card',
        pb: '[24px]',
        pl: '[32px]',
        pr: '[26px]',
        pt: '[22px]',

        '& > .bar': {
            position: 'absolute',
            bottom: '0',
            left: '0',
            top: '0',
            w: '[3px]',
            borderTopLeftRadius: '[12px]',
            borderBottomLeftRadius: '[12px]',
            bg: 'primary',
        },
        '& > .head': {
            mb: '[18px]',
            borderBottomWidth: '1px',
            borderBottomStyle: 'solid',
            borderBottomColor: 'border',
            pb: '[14px]',

            '& > .title': {
                display: 'flex',
                alignItems: 'center',
                gap: '2',
                fontSize: '[15px]',
                fontWeight: 'medium',
                lineHeight: '[1.3]',
                letterSpacing: '[-0.01em]',
                color: 'text.primary',

                '& > .shield-icon': {w: '4', h: '4', color: 'primary'},
            },
            '& > .sub': {mt: '[3px]', fontSize: 'xs', color: 'text.tertiary'},
        },
        '& > .trace-grid': {
            display: 'flex',
            flexDirection: 'column',

            '& > .trace-row': {
                display: 'grid',
                gridTemplateColumns: '220px 1fr',
                alignItems: 'center',
                gap: '6',
                borderBottomWidth: '1px',
                borderBottomStyle: 'solid',
                borderBottomColor: 'border',
                py: '3',
                _first: {pt: '0'},
                _last: {borderBottomWidth: '0', pb: '0'},

                '& > .key': {
                    fontSize: '2xs',
                    fontWeight: 'medium',
                    textTransform: 'uppercase',
                    letterSpacing: '[0.04em]',
                    color: 'text.tertiary',
                },
                '& > .val': {
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '[10px]',
                    fontSize: 'sm',
                    fontWeight: 'medium',
                    color: 'text.primary',

                    '& .mono': {fontFamily: 'mono', fontVariantNumeric: 'tabular-nums'},
                    '& > .muted': {fontSize: 'sm', fontWeight: 'normal', color: 'text.tertiary'},
                    '& .status-dot': {w: '[6px]', h: '[6px]', rounded: 'full', bg: 'currentColor'},
                },
            },
        },
    },
});

export const SoapStack = styled('div', {
    base: {
        display: 'flex',
        flexDirection: 'column',
        gap: '[18px]',

        '& > .soap-item .head': {
            mb: '[10px]',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '3',

            '& > .meta-title': {
                fontSize: 'sm-body',
                fontWeight: 'medium',
                lineHeight: '[1.3]',
                color: 'text.primary',
            },
            '& > .meta-desc': {mt: '[2px]', fontSize: 'xs', color: 'text.tertiary'},
        },
        '& > .soap-item .body': {
            pl: '[48px]',
            fontSize: 'sm-body',
            lineHeight: '[1.6]',
            color: 'text.primary',
            whiteSpace: 'pre-wrap',
        },
        '& > .soap-item .body-empty': {
            pl: '[48px]',
            fontSize: 'sm-body',
            lineHeight: '[1.6]',
            fontStyle: 'italic',
            color: 'text.tertiary',
        },
    },
});

export const TagsGrid = styled('div', {
    base: {
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        alignItems: 'flex-start',
        columnGap: '7',
        rowGap: '[14px]',

        '& > .tag-label': {
            pt: '1',
            fontSize: 'xs',
            fontWeight: 'medium',
            textTransform: 'uppercase',
            letterSpacing: '[0.04em]',
            color: 'text.tertiary',
        },
        '& > .tag-list': {display: 'flex', flexWrap: 'wrap', gap: '[6px]'},
        '& .tag-dot': {w: '[6px]', h: '[6px]', rounded: 'full', bg: 'currentColor'},
    },
});

export const Notes = styled('p', {
    base: {
        whiteSpace: 'pre-wrap',
        fontSize: 'sm-body',
        lineHeight: '[1.6]',
        color: 'text.primary',
    },
});

export const FilesList = styled('div', {
    base: {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        rounded: '[10px]',
        bg: 'bg.surface',

        '& > .row': {
            display: 'grid',
            gridTemplateColumns: '36px 1fr auto',
            alignItems: 'center',
            gap: '[14px]',
            borderBottomWidth: '1px',
            borderBottomStyle: 'solid',
            borderBottomColor: 'border',
            px: '4',
            py: '3',
            _last: {borderBottomWidth: '0'},

            '& > .icon': {
                display: 'flex',
                w: '9',
                h: '9',
                flexShrink: '0',
                alignItems: 'center',
                justifyContent: 'center',
                rounded: '[8px]',
                bg: 'bg.card',
                color: 'text.secondary',
            },
            '& > .body-wrap': {minW: '0'},
            '& > .body-wrap .name': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'text.primary',
            },
            '& > .body-wrap .sub': {
                mt: '[2px]',
                display: 'flex',
                alignItems: 'center',
                gap: '[10px]',
                fontSize: 'xs',
                color: 'text.tertiary',
            },
            '& > .actions': {display: 'flex', gap: '1'},
        },
    },
});

export const SkeletonRoot = styled('div', {
    base: {
        display: 'flex',
        flexDirection: 'column',
        gap: '[18px]',
        px: '6',
        pt: '6',
        pb: '[60px]',
    },
});

// ── Badges overrides (cva-like simples via css) ─────────────────────────────────

export const badgeStatus = css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '[6px]',
    rounded: 'full',
    px: '[10px]',
    py: '1',
    fontSize: 'xs',
});

export const badgeConduct = css({
    display: 'inline-flex',
    alignItems: 'center',
    rounded: 'full',
    bg: 'bg.surface',
    px: '[10px]',
    py: '1',
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'text.secondary',
});

export const badgeOrigin = css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '[6px]',
    rounded: 'full',
    px: '[11px]',
    py: '[5px]',
    fontSize: 'xs',
});

export const signedBadge = css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '[6px]',
    rounded: 'full',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'success',
    bg: 'success.surface',
    px: '[10px]',
    py: '1',
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'success',
});

export const draftBadge = css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '[6px]',
    rounded: 'full',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.surface',
    px: '[10px]',
    py: '1',
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'text.secondary',
});

export const traceEditedChip = css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1',
    rounded: 'full',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'warning',
    bg: 'warning.surface',
    px: '2',
    py: '[3px]',
    fontSize: '2xs',
    fontWeight: 'medium',
    color: 'warning',
});

export const traceValMono = css({fontFamily: 'mono', fontVariantNumeric: 'tabular-nums'});

export const filesAiTag = css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1',
    fontSize: '2xs',
    fontWeight: 'medium',
    color: 'ai.text',
});

export const traceMutedInline = css({fontSize: 'sm', fontWeight: 'normal', color: 'text.tertiary'});

export const traceIdVal = css({
    fontFamily: 'mono',
    fontVariantNumeric: 'tabular-nums',
    fontSize: 'xs',
    fontWeight: 'normal',
    color: 'text.tertiary',
});

// ── Inline Tailwind migrations ────────────────────────────────────────────────

export const icon4 = css({w: '4', h: '4'});
export const icon13 = css({w: '[13px]', h: '[13px]'});
export const icon11 = css({w: '[11px]', h: '[11px]'});
export const chevronNav = css({w: '[14px]', h: '[14px]', flexShrink: '0'});
export const chevronPatCard = css({w: '[14px]', h: '[14px]', flexShrink: '0', color: 'text.tertiary'});
export const errorText = css({fontSize: 'sm'});
export const breadcrumbMb3 = css({mb: '3'});
export const skeletonH4W64 = css({h: '4', w: '64'});
export const skeletonH120Rounded14 = css({h: '[120px]', rounded: '[14px]'});
export const skeletonH200Rounded12 = css({h: '[200px]', rounded: '[12px]'});
export const skeletonH160Rounded12 = css({h: '[160px]', rounded: '[12px]'});
export const btnIconSize8 = css({w: '8', h: '8'});
