import {css, cva} from '@/styled-system/css';
import {styled} from '@/styled-system/jsx';

export {cx} from '@/styled-system/css';

// ── Variantes dinâmicas (cva aplicadas em className de elementos nativos) ──────

export const imcTag = cva({
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        ml: '2',
        rounded: 'badge',
        px: '2',
        py: '[2px]',
        fontSize: '2xs',
        fontWeight: 'medium',
    },
    variants: {
        tone: {
            ok: {bg: 'success.surface', color: 'success'},
            warn: {bg: 'warning.surface', color: 'warning'},
            bad: {bg: 'danger.surface', color: 'danger'},
        },
    },
});

export const soapLetter = cva({
    base: {
        display: 'inline-flex',
        w: '[26px]',
        h: '[26px]',
        flexShrink: '0',
        alignItems: 'center',
        justifyContent: 'center',
        rounded: '[6px]',
        fontSize: 'sm',
        fontWeight: 'medium',
    },
    variants: {
        v: {
            s: {bg: 'primary.surface', color: 'primary.text'},
            o: {bg: 'primary.surface', color: 'primary.text'},
            a: {bg: 'success.surface', color: 'success'},
            p: {bg: 'warning.surface', color: 'warning'},
        },
    },
});

export const conductChip = cva({
    base: {
        display: 'inline-flex',
        cursor: 'pointer',
        alignItems: 'center',
        gap: '[6px]',
        rounded: 'badge',
        borderWidth: '1px',
        borderStyle: 'solid',
        px: '3',
        py: '[6px]',
        fontSize: 'sm',
        transitionProperty: 'color, background-color, border-color',
        transitionDuration: 'base',
    },
    variants: {
        on: {
            true: {borderColor: 'primary', bg: 'primary.surface', color: 'primary.text'},
            false: {
                borderColor: 'border',
                bg: 'bg.card',
                color: 'text.secondary',
                _hover: {borderColor: 'border.hover', color: 'text.primary'},
            },
        },
    },
    defaultVariants: {on: false},
});

export const modalIcon = cva({
    base: {
        display: 'inline-flex',
        w: '[38px]',
        h: '[38px]',
        flexShrink: '0',
        alignItems: 'center',
        justifyContent: 'center',
        rounded: '[10px]',
    },
    variants: {
        tone: {
            ok: {bg: 'success.surface', color: 'success'},
            warn: {bg: 'warning.surface', color: 'warning'},
        },
    },
});

// ── Helpers de página (CSS isolado, sem árvore) ────────────────────────────────

export const pageErrorState = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4',
    p: '12',
    color: 'text.secondary',
});

export const pageErrorLink = css({fontSize: 'sm', color: 'primary.text', textDecoration: 'underline'});

export const monoDate = css({fontFamily: 'mono', fontVariantNumeric: 'tabular-nums'});

// ── Componentes styled (raiz com selectors aninhados `&`) ──────────────────────

export const RecordForm = styled('div', {
    base: {
        display: 'flex',
        flexDirection: 'column',
        pb: '[80px]',
        bg: 'bg.page',

        '& > .topbar': {
            px: '6',
            pt: '6',

            '& > .patient-card': {
                mt: '4',
                display: 'flex',
                alignItems: 'center',
                gap: '3',
                rounded: 'card',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'border',
                bg: 'bg.card',
                px: '4',
                py: '[10px]',

                '& > .info': {minW: '0'},
                '& .name': {
                    cursor: 'pointer',
                    fontSize: 'sm-body',
                    fontWeight: 'medium',
                    color: 'text.primary',
                    transitionProperty: 'color',
                    transitionDuration: 'base',
                    _hover: {color: 'primary.text'},
                },
                '& .meta': {mt: '[2px]', fontSize: 'xs', color: 'text.tertiary'},
            },
        },

        '& > .layout': {
            mx: '6',
            mt: '[18px]',
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gap: '7',
            alignItems: 'flex-start',

            '& > .toc': {
                position: 'sticky',
                top: '6',
                display: 'flex',
                flexDirection: 'column',
                gap: '[2px]',

                '& > .toc-title': {
                    px: '[10px]',
                    pb: '2',
                    fontSize: '2xs',
                    fontWeight: 'medium',
                    textTransform: 'uppercase',
                    letterSpacing: '[0.06em]',
                    color: 'text.tertiary',
                },
                '& > .toc-item': {
                    display: 'flex',
                    cursor: 'pointer',
                    alignItems: 'center',
                    gap: '[10px]',
                    rounded: '[8px]',
                    borderWidth: '0',
                    borderStyle: 'solid',
                    bg: 'transparent',
                    px: '[10px]',
                    py: '2',
                    fontSize: 'sm',
                    color: 'text.secondary',
                    transitionProperty: 'color, background-color',
                    transitionDuration: 'base',
                    _hover: {bg: 'bg.surface', color: 'text.primary'},
                },
                '& > .toc-item-active': {bg: 'primary.surface', color: 'primary.text'},
                '& > .toc-foot': {
                    mt: '2',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '[6px]',
                    borderTopWidth: '1px',
                    borderTopStyle: 'solid',
                    borderTopColor: 'border',
                    px: '[10px]',
                    pt: '2',
                    fontSize: '2xs',
                    color: 'text.tertiary',
                },
            },

            '& > .content': {minW: '0'},
        },
    },
});

export const SectionCard = styled('section', {
    base: {
        mb: '[18px]',
        rounded: '[12px]',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'border',
        bg: 'bg.card',
        px: '[24px]',
        pb: '[24px]',
        pt: '[22px]',

        '& > .head': {
            mb: '[18px]',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '3',
            borderBottomWidth: '1px',
            borderBottomStyle: 'dashed',
            borderBottomColor: 'border',
            pb: '[14px]',

            '& > .icon': {
                display: 'inline-flex',
                w: '[28px]',
                h: '[28px]',
                flexShrink: '0',
                alignItems: 'center',
                justifyContent: 'center',
                rounded: '[8px]',
                bg: 'primary.surface',
                color: 'primary.text',
            },
            '& > .right': {flex: '1', minW: '0'},
            '& > .aside': {ml: 'auto', flexShrink: '0'},
            '& .title': {
                fontSize: 'base',
                fontWeight: 'medium',
                lineHeight: '[1.3]',
                letterSpacing: '[-0.01em]',
                color: 'text.primary',
            },
            '& .sub': {mt: '[2px]', fontSize: 'xs', color: 'text.tertiary'},
        },
    },
});

export const VitalsGrid = styled('div', {
    base: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '3',
    },
});

export const VitalCell = styled('div', {
    base: {
        rounded: '[10px]',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'border',
        bg: 'bg.surface',
        p: '3',

        '& .vital-head': {
            mb: '[6px]',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',

            '& > .label': {
                fontSize: '2xs',
                textTransform: 'uppercase',
                letterSpacing: '[0.04em]',
                color: 'text.tertiary',
            },
            '& > .unit': {fontSize: '2xs', color: 'text.tertiary'},
        },
        '& .vital-input': {
            w: 'full',
            borderWidth: '0',
            bg: 'transparent',
            p: '0',
            fontFamily: 'mono',
            fontVariantNumeric: 'tabular-nums',
            fontSize: '[15px]',
            color: 'text.primary',
            _placeholder: {color: 'text.tertiary'},
            _focus: {outline: 'none'},
        },
        '& > .pa-row': {display: 'flex', alignItems: 'center', gap: '1'},
        '& .pa-sep': {fontFamily: 'mono', fontSize: '[15px]', color: 'text.tertiary'},
        '& > .vital-warn': {
            mt: '1',
            display: 'flex',
            alignItems: 'center',
            gap: '1',
            fontSize: '2xs',
            color: 'warning',
        },
        '& .imc-value': {
            fontSize: 'base',
            fontWeight: 'medium',
            fontFamily: 'mono',
            fontVariantNumeric: 'tabular-nums',
            color: 'text.primary',
        },
        '& .imc-empty': {fontSize: 'sm', fontStyle: 'italic', color: 'text.tertiary'},
    },
    variants: {
        wide: {true: {gridColumn: 'span 2 / span 2'}},
        readonly: {true: {bg: 'bg.page'}},
    },
});

export const VitalsPrevBox = styled('div', {
    base: {
        mb: '3',
        rounded: '[8px]',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'border',
        bg: 'bg.surface',
        p: '3',

        '& > .head': {
            mb: '[10px]',
            display: 'flex',
            alignItems: 'center',
            gap: '[6px]',
            fontSize: 'xs',
            color: 'text.tertiary',
        },
        '& > .empty': {fontSize: 'xs', fontStyle: 'italic', color: 'text.tertiary'},
    },
});

export const VitalsPrevToggle = styled('button', {
    base: {
        display: 'inline-flex',
        cursor: 'pointer',
        alignItems: 'center',
        gap: '1',
        borderWidth: '0',
        bg: 'transparent',
        fontSize: 'xs',
        color: 'text.secondary',
        _hover: {color: 'primary.text'},
    },
});

export const SoapStack = styled('div', {
    base: {
        display: 'flex',
        flexDirection: 'column',
        '& > * + *': {borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: 'border'},
    },
});

export const SoapFieldShell = styled('div', {
    base: {
        py: '[16px]',
        _first: {pt: '0'},
        _last: {pb: '0'},

        '& > .head': {
            mb: '[10px]',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '3',

            '& > .title': {fontSize: 'sm-body', fontWeight: 'medium', lineHeight: '[1.3]', color: 'text.primary'},
            '& > .hint-wrap .hint': {mt: '[1px]', fontSize: 'xs', color: 'text.tertiary'},
        },
        '& > .vitals-ref': {
            mb: '2',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '[6px]',
            rounded: '[6px]',
            bg: 'bg.surface',
            px: '3',
            py: '[6px]',
            fontSize: 'xs',
            color: 'text.secondary',
        },
        '& > .textarea': {
            mt: '2',
            w: 'full',
            resize: 'none',
            overflow: 'hidden',
            rounded: 'input',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'border',
            bg: 'bg.card',
            px: '3',
            py: '[9px]',
            fontSize: 'sm',
            lineHeight: '[1.6]',
            color: 'text.primary',
            _placeholder: {color: 'text.tertiary'},
            _hover: {borderColor: 'border.hover'},
            _focus: {borderColor: 'primary', outline: 'none'},
        },
    },
});

export const ConductGrid = styled('div', {base: {display: 'flex', flexWrap: 'wrap', gap: '2'}});

export const UploadZone = styled('button', {
    base: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2',
        rounded: '[10px]',
        borderWidth: '[1.5px]',
        borderStyle: 'dashed',
        borderColor: 'border',
        cursor: 'pointer',
        py: '[28px]',
        color: 'text.tertiary',
        transitionProperty: 'border-color, background-color, color',
        transitionDuration: 'base',
        _hover: {borderColor: 'primary', bg: 'primary.surface', color: 'primary.text'},

        '& > .title': {fontSize: 'sm', fontWeight: 'medium', color: 'text.primary'},
        '& > .sub': {fontSize: 'xs', color: 'text.tertiary'},
    },
});

export const UploadList = styled('div', {
    base: {
        mt: '3',
        display: 'flex',
        flexDirection: 'column',
        gap: '2',

        '& > .row': {
            display: 'flex',
            alignItems: 'center',
            gap: '3',
            rounded: '[8px]',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'border',
            bg: 'bg.surface',
            px: '3',
            py: '[10px]',

            '& > .icon': {w: '4', h: '4', flexShrink: '0', color: 'text.tertiary'},
            '& > .body': {minW: '0', flex: '1'},
            '& > .body .name': {
                minW: '0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 'sm',
                color: 'text.primary',
            },
            '& > .body .size': {fontSize: '2xs', color: 'text.tertiary'},
            '& > .remove': {
                display: 'flex',
                w: '7',
                h: '7',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
                rounded: '[6px]',
                borderWidth: '0',
                bg: 'transparent',
                color: 'text.tertiary',
                transitionProperty: 'color, background-color',
                transitionDuration: 'base',
                _hover: {bg: 'bg.card', color: 'danger'},
            },
        },
    },
});

export const FooterBar = styled('div', {
    base: {
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        zIndex: '30',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '4',
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: 'border',
        bg: 'bg.card',
        px: '8',
        py: '[14px]',

        '& > .meta': {
            display: 'flex',
            alignItems: 'center',
            gap: '[10px]',
            fontSize: 'xs',
            color: 'text.tertiary',
        },
        '& > .actions': {display: 'flex', alignItems: 'center', gap: '[10px]'},
    },
});

export const ModalBackdrop = styled('div', {
    base: {
        position: 'fixed',
        inset: '0',
        zIndex: '50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bg: 'black/50',
        backdropFilter: 'blur(4px)',
    },
});

export const ModalPanel = styled('div', {
    base: {
        w: '[420px]',
        maxWidth: '[calc(100vw-32px)]',
        rounded: '[16px]',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'border',
        bg: 'bg.card',
        p: '6',
        boxShadow: 'xl',

        '& > .head': {
            mb: '4',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '3',

            '& > .title': {fontSize: 'base', fontWeight: 'medium', color: 'text.primary'},
            '& > .sub': {mt: '[2px]', fontSize: 'sm', color: 'text.secondary'},
        },
        '& > .summary': {
            mb: '5',
            overflow: 'hidden',
            rounded: '[8px]',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'border',
            bg: 'bg.surface',
            '& > * + *': {borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: 'border'},

            '& > .row': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '2',
                px: '4',
                py: '[10px]',
                fontSize: 'sm',

                '& > .label': {color: 'text.secondary'},
                '& > .value': {fontWeight: 'medium', color: 'text.primary'},
                '& > .date-value': {
                    fontWeight: 'medium',
                    color: 'text.primary',
                    fontFamily: 'mono',
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: 'sm',
                },
                '& > .chips': {display: 'flex', flexWrap: 'wrap', gap: '1'},
                '& > .chips .chip': {
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '1',
                    rounded: 'badge',
                    bg: 'primary.surface',
                    px: '[6px]',
                    py: '[2px]',
                    fontSize: '2xs',
                    fontWeight: 'medium',
                    color: 'primary.text',
                },
            },
        },
        '& > .actions': {
            mt: '4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '3',
        },
    },
});

export const SkeletonRoot = styled('div', {
    base: {
        display: 'flex',
        flexDirection: 'column',
        gap: '[18px]',
        p: '6',

        '& > .skeleton-grid': {
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gap: '7',

            '& > .nav-stack': {display: 'flex', flexDirection: 'column', gap: '2'},
            '& > .content-stack': {display: 'flex', flexDirection: 'column', gap: '[18px]'},
        },
    },
});

// ── Inline Tailwind migrations ────────────────────────────────────────────────

export const icon13 = css({w: '[13px]', h: '[13px]'});
export const icon14 = css({w: '[14px]', h: '[14px]'});
export const icon12 = css({w: '[12px]', h: '[12px]'});
export const icon10 = css({w: '[10px]', h: '[10px]'});
export const icon18 = css({w: '[18px]', h: '[18px]'});
export const icon4 = css({w: '4', h: '4'});
export const icon11 = css({w: '[11px]', h: '[11px]'});
export const icon3 = css({w: '3', h: '3'});
export const icon35 = css({w: '3.5', h: '3.5'});
export const icon5 = css({w: '5', h: '5'});
export const icon22 = css({w: '[22px]', h: '[22px]'});

export const flexItemsBaselineGap1 = css({display: 'flex', alignItems: 'baseline', gap: '1'});
export const textareaResizeY = css({resize: 'vertical', minH: '[80px]'});
export const pageHeaderMt5 = css({mt: '5'});
export const errorText = css({fontSize: 'sm'});

export const skeletonH60RoundedCard = css({h: '[60px]', rounded: 'card'});
export const skeletonH9Rounded8 = css({h: '9', rounded: '[8px]'});
export const skeletonH160Rounded12 = css({h: '[160px]', rounded: '[12px]'});
export const skeletonH4W64 = css({h: '4', w: '64'});
export const skeletonH8W48 = css({h: '8', w: '48'});

export const spin = css({animation: 'spin'});

