import {css, cva} from '@/styled-system/css';
import {styled} from '@/styled-system/jsx';

export {cx} from '@/styled-system/css';

// ── Variantes dinâmicas (cva) ──────────────────────────────────────────────────

export const sideNavItem = cva({
    base: {
        display: 'flex',
        alignItems: 'center',
        gap: '2.5',
        flexShrink: '0',
        w: {base: 'auto', lg: 'full'},
        px: '2',
        py: '2',
        rounded: '[6px]',
        fontSize: 'sm',
        whiteSpace: 'nowrap',
        transitionProperty: 'color, background-color',
        textAlign: 'left',
    },
    variants: {
        active: {
            true: {bg: 'primary/10', color: 'primary', fontWeight: 'medium'},
            false: {
                color: 'text.secondary',
                _hover: {bg: 'bg.card', color: 'text.primary'},
            },
        },
    },
    defaultVariants: {active: false},
});

export const tabButton = cva({
    base: {
        display: 'flex',
        alignItems: 'center',
        gap: '2',
        px: '4',
        py: '3.5',
        fontSize: 'sm',
        borderBottomWidth: '2px',
        marginBottom: '-1px',
        transitionProperty: 'color, border-color',
        whiteSpace: 'nowrap',
    },
    variants: {
        active: {
            true: {borderBottomColor: 'primary', color: 'primary', fontWeight: 'medium'},
            false: {
                borderBottomColor: 'transparent',
                color: 'text.secondary',
                _hover: {color: 'text.primary'},
            },
        },
    },
    defaultVariants: {active: false},
});

export const tabNum = cva({
    base: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        w: '5',
        h: '5',
        rounded: 'full',
        fontSize: '2xs',
        fontWeight: 'medium',
        flexShrink: '0',
    },
    variants: {
        active: {
            true: {bg: 'primary', color: 'white'},
            false: {bg: 'text.tertiary/20', color: 'text.secondary'},
        },
        filled: {
            true: {bg: 'success/15', color: 'success'},
            false: {},
        },
    },
    defaultVariants: {active: false, filled: false},
});

export const pwdBarFill = cva({
    base: {h: 'full', rounded: 'full', transitionProperty: 'all'},
    variants: {
        level: {
            weak: {bg: 'danger'},
            med: {bg: 'warning'},
            strong: {bg: 'success'},
        },
    },
});

export const pwdLabel = cva({
    base: {fontSize: '2xs', mt: '1'},
    variants: {
        level: {
            weak: {color: 'danger'},
            med: {color: 'warning'},
            strong: {color: 'success'},
        },
    },
});

export const sessionRow = cva({
    base: {
        display: 'flex',
        alignItems: 'center',
        gap: '3',
        p: '3',
        rounded: '[8px]',
        borderWidth: '1px',
        borderStyle: 'solid',
    },
    variants: {
        current: {
            true: {bg: 'primary/5', borderColor: 'primary/20'},
            false: {bg: 'bg.surface', borderColor: 'border'},
        },
    },
    defaultVariants: {current: false},
});

// ── Helpers de página (CSS isolado) ─────────────────────────────────────────────

export const fieldLabel = css({
    display: 'flex',
    alignItems: 'center',
    gap: '1',
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'text.secondary',
    mb: '1.5',
});

export const fieldRequired = css({color: 'warning', fontSize: 'xs'});
export const fieldOptional = css({color: 'text.tertiary', fontSize: '[10px]', fontWeight: 'normal'});
export const fieldHint = css({fontSize: '2xs', color: 'text.tertiary', mt: '1'});
export const fieldError = css({fontSize: '2xs', color: 'warning', mt: '1'});

export const sectionTitle = css({fontSize: 'sm', fontWeight: 'medium', color: 'text.primary', lineHeight: 'snug'});
export const sectionSub = css({fontSize: 'xs', color: 'text.secondary', mt: '0.5', lineHeight: 'relaxed'});

export const monoInput = css({fontFamily: 'mono'});

export const sessionBadge = css({
    fontSize: '[10px]',
    bg: 'primary/10',
    color: 'primary',
    rounded: 'full',
    px: '2',
    py: '0.5',
});
export const sessionSub = css({fontSize: '2xs', color: 'text.tertiary'});
export const sessionWhen = css({ml: 'auto', fontSize: 'xs', color: 'text.tertiary', flexShrink: '0'});
export const sessionEndBtn = css({color: 'text.tertiary', _hover: {color: 'danger'}});
export const sessionDevice = css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'text.primary',
    display: 'flex',
    alignItems: 'center',
    gap: '2',
});

export const placeholderIcon = css({color: 'text.tertiary'});

// ── Componentes styled (raiz com selectors aninhados `&`) ──────────────────────

export const PageShell = styled('div', {
    base: {
        display: 'flex',
        flexDirection: 'column',
        h: 'full',

        '& > .breadcrumb': {
            display: 'flex',
            alignItems: 'center',
            gap: '1.5',
            fontSize: 'xs',
            color: 'text.tertiary',
            px: '6',
            pt: '5',
            pb: '0',

            '& .crumb-link': {
                cursor: 'pointer',
                transitionProperty: 'color',
                transitionDuration: 'base',
                _hover: {color: 'text.secondary'},
            },
            '& .crumb-sep': {color: 'text.tertiary'},
            '& .crumb-current': {color: 'text.primary'},
        },

        '& > .layout': {
            display: 'flex',
            flexDirection: {base: 'column', lg: 'row'},
            flex: '1',

            '& > .side-nav': {
                w: {base: 'full', lg: '52'},
                flexShrink: '0',
                borderRightWidth: {base: '0', lg: '1px'},
                borderRightStyle: 'solid',
                borderRightColor: 'border',
                borderBottomWidth: {base: '1px', lg: '0'},
                borderBottomStyle: 'solid',
                borderBottomColor: 'border',
                py: {base: '3', lg: '6'},
                px: '4',
                display: 'flex',
                flexDirection: {base: 'row', lg: 'column'},
                overflowX: {base: 'auto', lg: 'visible'},
                gap: '1',

                '& > .nav-title': {
                    display: {base: 'none', lg: 'block'},
                    fontSize: '2xs',
                    fontWeight: 'medium',
                    color: 'text.tertiary',
                    textTransform: 'uppercase',
                    letterSpacing: 'wider',
                    px: '2',
                    mb: '2',
                },
            },

            '& > .content': {
                flex: '1',
                minW: '0',
                px: {base: '4', lg: '8'},
                py: '6',
                overflowY: 'auto',
            },
        },
    },
});

export const PageHeading = styled('div', {
    base: {
        '& > .title': {fontSize: '[20px]', fontWeight: 'medium', color: 'text.primary', lineHeight: 'snug'},
        '& > .sub': {
            fontSize: 'sm',
            color: 'text.secondary',
            mt: '1',
            maxWidth: '[560px]',
            lineHeight: 'relaxed',
        },
    },
});

export const ProfileHeader = styled('div', {
    base: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '4',
        mb: '1',
    },
});

export const FormCard = styled('div', {
    base: {
        mt: '5',
        rounded: 'card',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'border',
        bg: 'bg.card',
        overflow: 'hidden',
    },
});

export const TabList = styled('div', {
    base: {
        display: 'flex',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'border',
        bg: 'bg.surface',
        px: '5',
        gap: '1',
        overflowX: 'auto',
    },
});

export const FormSection = styled('section', {
    base: {
        p: '6',

        '& > .sec-head': {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '3',
            mb: '5',

            '& > .sec-num': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                w: '7',
                h: '7',
                rounded: 'full',
                flexShrink: '0',
                bg: 'primary/10',
                color: 'primary',
                fontSize: 'sm',
                fontWeight: 'medium',
            },
        },

        '& > .photo-row': {
            display: 'flex',
            alignItems: 'center',
            gap: '5',
            mb: '6',

            '& > .circle': {
                w: '20',
                h: '20',
                rounded: 'full',
                overflow: 'hidden',
                flexShrink: '0',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'border',
                bg: 'bg.surface',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                '& > .initials': {fontSize: '2xl', fontWeight: 'medium', color: 'text.tertiary'},
            },
            '& > .photo-actions': {display: 'flex', flexDirection: 'column', gap: '2'},
            '& > .photo-actions .photo-hint': {fontSize: '2xs', color: 'text.tertiary'},
        },

        '& > .grid-12': {display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '4'},

        '& > .ai-nudge': {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '3',
            mt: '5',
            p: '4',
            rounded: 'card',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'ai.border',
            bg: 'ai.bg',

            '& > .ai-icon': {flexShrink: '0', color: 'ai.border', mt: '0.5'},
            '& .ai-title': {
                display: 'flex',
                alignItems: 'center',
                gap: '2',
                fontSize: 'xs',
                fontWeight: 'medium',
                color: 'text.primary',
            },
            '& .ai-sub': {fontSize: '2xs', color: 'text.secondary', mt: '1', lineHeight: 'relaxed'},
            '& .ai-badge': {
                display: 'inline-flex',
                alignItems: 'center',
                px: '1.5',
                py: '0.5',
                rounded: '[3px]',
                fontSize: '[9px]',
                fontWeight: 'medium',
                textTransform: 'uppercase',
                letterSpacing: 'wider',
                bg: 'ai.badgeBg',
                color: 'ai.badgeText',
            },
            '& .agent-name': {color: 'text.primary', fontWeight: 'medium'},
        },

        '& > .sub-section': {
            borderTopWidth: '1px',
            borderTopStyle: 'solid',
            borderTopColor: 'border',
            pt: '5',
            mt: '5',
            _first: {borderTopWidth: '0', pt: '0', mt: '0'},

            '& > .sub-head': {
                display: 'flex',
                alignItems: 'center',
                gap: '2',
                mb: '4',
                fontSize: 'sm',
                fontWeight: 'medium',
                color: 'text.primary',

                '& .sub-icon': {color: 'text.secondary'},
                '& .sub-tag': {
                    fontSize: '2xs',
                    color: 'text.tertiary',
                    fontWeight: 'normal',
                    bg: 'bg.surface',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'border',
                    rounded: 'full',
                    px: '2',
                    py: '0.5',
                },
            },

            '& > .pwd-wrap': {
                position: 'relative',

                '& > .reveal': {
                    position: 'absolute',
                    right: '3',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'text.tertiary',
                    _hover: {color: 'text.secondary'},
                },
            },
            '& .pwd-meter': {mt: '2'},
            '& .pwd-bar': {h: '1', rounded: 'full', bg: 'border', overflow: 'hidden'},
        },

        '& > .session-list': {
            display: 'flex',
            flexDirection: 'column',
            gap: '2',

            '& .session-icon': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                w: '9',
                h: '9',
                rounded: '[6px]',
                bg: 'bg.card',
                color: 'text.secondary',
                flexShrink: '0',
            },
            '& .session-name-cell': {flex: '1', minW: '0'},
        },
    },
});

export const FooterBar = styled('div', {
    base: {
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: 'border',
        px: '8',
        py: '4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '4',
        bg: 'bg.surface',

        '& > .meta': {
            display: 'flex',
            alignItems: 'center',
            gap: '2',
            fontSize: 'xs',
            color: 'text.tertiary',

            '& .step': {ml: '4', fontSize: 'xs', color: 'text.tertiary'},
        },
        '& > .actions': {display: 'flex', alignItems: 'center', gap: '2'},
    },
});

export const Placeholder = styled('div', {
    base: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '3',
        py: '16',
        textAlign: 'center',

        '& > .ph-title': {fontSize: 'sm', fontWeight: 'medium', color: 'text.primary'},
        '& > .ph-sub': {fontSize: 'xs', color: 'text.secondary'},
    },
});

export const SkeletonTabContent = styled('div', {
    base: {
        p: '8',
        display: 'flex',
        flexDirection: 'column',
        gap: '4',

        '& > .sk-grid': {display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '4'},
    },
});

// ── Inline Tailwind migrations ────────────────────────────────────────────────

export const formCardP16 = css({p: '16'});
export const shrink0 = css({flexShrink: '0'});
export const pr10 = css({pr: '10'});
export const mt4 = css({mt: '4'});
// Panda extrai classes estaticamente — não é possível gerar `gridColumn` a partir de um
// template string com variável, por isso cada span precisa de sua própria chamada `css()`.
const gridSpanMap: Record<number, string> = {
    1: css({gridColumn: '[span 1 / span 1]'}),
    2: css({gridColumn: '[span 2 / span 2]'}),
    3: css({gridColumn: '[span 3 / span 3]'}),
    4: css({gridColumn: '[span 4 / span 4]'}),
    5: css({gridColumn: '[span 5 / span 5]'}),
    6: css({gridColumn: '[span 6 / span 6]'}),
    7: css({gridColumn: '[span 7 / span 7]'}),
    8: css({gridColumn: '[span 8 / span 8]'}),
    9: css({gridColumn: '[span 9 / span 9]'}),
    10: css({gridColumn: '[span 10 / span 10]'}),
    11: css({gridColumn: '[span 11 / span 11]'}),
    12: css({gridColumn: '[span 12 / span 12]'}),
};

export const gridSpan = (span: number) => gridSpanMap[span];
export const skeletonH4W48 = css({h: '4', w: '48'});
export const skeletonH10 = css({h: '10'});

