import {css, cva} from '@/styled-system/css';

export {cx} from '@/styled-system/css';

// ── Variantes de status (cva prontos) ──────────────────────────────────────────

export const statusChip = cva({
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '1.5',
        px: '2.5',
        py: '1',
        rounded: 'full',
        fontSize: 'xs',
        fontWeight: 'medium',
        borderWidth: '1px',
        borderStyle: 'solid',
        transitionProperty: 'color, background-color, border-color',
        cursor: 'pointer',
        userSelect: 'none',
    },
    variants: {
        status: {
            SCHEDULED: {borderColor: 'primary.border', color: 'primary.text'},
            CONFIRMED: {borderColor: 'success/30', color: 'success'},
            COMPLETED: {borderColor: 'border', color: 'text.secondary'},
            CANCELLED: {borderColor: 'danger/30', color: 'danger'},
            NO_SHOW: {borderColor: 'warning/30', color: 'warning'},
            ARRIVED: {borderColor: 'primary.border', color: 'primary.text'},
            IN_PROGRESS: {borderColor: 'info/30', color: 'info'},
        },
        active: {true: {}, false: {opacity: '0.4'}},
    },
    defaultVariants: {active: true},
});

export const statusDot = cva({
    base: {w: '1.5', h: '1.5', rounded: 'full', flexShrink: '0'},
    variants: {
        status: {
            SCHEDULED: {bg: 'primary'},
            CONFIRMED: {bg: 'success'},
            COMPLETED: {bg: 'text.tertiary'},
            CANCELLED: {bg: 'danger'},
            NO_SHOW: {bg: 'warning'},
            ARRIVED: {bg: 'primary'},
            IN_PROGRESS: {bg: 'info'},
        },
    },
});

export const segmentBtn = cva({
    base: {
        px: '3',
        py: '1',
        fontSize: 'xs',
        fontWeight: 'medium',
        rounded: '[6px]',
        transitionProperty: 'color, background-color',
    },
    variants: {
        active: {
            true: {bg: 'bg.card', color: 'text.primary', boxShadow: 'sm'},
            false: {color: 'text.secondary', _hover: {color: 'text.primary'}},
        },
    },
});

export const miniCell = cva({
    base: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        py: '0.5',
        cursor: 'pointer',
        rounded: 'default',
    },
    variants: {
        inMonth: {true: {}, false: {opacity: '0.3'}},
        isToday: {true: {}, false: {}},
        isSelected: {true: {bg: 'primary'}, false: {}},
        inWeek: {true: {bg: 'primary/10'}, false: {}},
        hasAppts: {true: {}, false: {}},
    },
    compoundVariants: [],
});

export const gridDayHead = cva({
    base: {
        flex: '1',
        textAlign: 'center',
        py: '2',
        fontSize: 'xs',
        fontWeight: 'medium',
        borderLeftWidth: '1px',
        borderLeftStyle: 'solid',
        borderLeftColor: 'border',
    },
    variants: {
        isToday: {true: {color: 'primary'}, false: {color: 'text.secondary'}},
    },
    defaultVariants: {isToday: false},
});

export const gridDayHeadNum = cva({
    base: {
        fontSize: 'base',
        fontWeight: 'medium',
        lineHeight: '7',
        w: '7',
        h: '7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        rounded: 'full',
        mx: 'auto',
    },
    variants: {
        isToday: {true: {bg: 'primary', color: 'white'}, false: {}},
    },
});

export const gridDayCol = cva({
    base: {
        flex: '1',
        position: 'relative',
        borderLeftWidth: '1px',
        borderLeftStyle: 'solid',
        borderLeftColor: 'border',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'border',
    },
    variants: {
        isToday: {true: {bg: 'primary/[0.02]'}, false: {}},
    },
});

export const apptBlock = cva({
    base: {
        position: 'absolute',
        rounded: 'data',
        borderWidth: '1px',
        borderStyle: 'solid',
        overflow: 'hidden',
        cursor: 'pointer',
        transitionProperty: 'all',
        _hover: {boxShadow: 'sm'},
    },
    variants: {
        status: {
            SCHEDULED: {bg: 'primary.surface', borderColor: 'primary.border'},
            CONFIRMED: {bg: 'success.surface', borderColor: 'success/30'},
            COMPLETED: {bg: 'bg.surface', borderColor: 'border'},
            CANCELLED: {bg: 'danger.surface', borderColor: 'danger/30', opacity: '0.6'},
            NO_SHOW: {bg: 'warning.surface', borderColor: 'warning/30', opacity: '0.6'},
            ARRIVED: {bg: 'primary.surface', borderColor: 'primary.border'},
            IN_PROGRESS: {bg: 'info.surface', borderColor: 'info/30'},
        },
        highlight: {true: {boxShadow: 'focus'}, false: {}},
    },
});

export const apptBar = cva({
    base: {position: 'absolute', left: '0', top: '0', bottom: '0', w: '0.5'},
    variants: {
        status: {
            SCHEDULED: {bg: 'primary'},
            CONFIRMED: {bg: 'success'},
            COMPLETED: {bg: 'text.tertiary'},
            CANCELLED: {bg: 'danger'},
            NO_SHOW: {bg: 'warning'},
            ARRIVED: {bg: 'primary'},
            IN_PROGRESS: {bg: 'info'},
        },
    },
});

export const monthGridCell = cva({
    base: {
        minHeight: '[100px]',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'border',
        borderRightWidth: '1px',
        borderRightStyle: 'solid',
        borderRightColor: 'border',
        p: '1',
        cursor: 'pointer',
        transitionProperty: 'background-color',
        _hover: {bg: 'bg.surface/50'},
    },
    variants: {
        inMonth: {true: {}, false: {bg: 'bg.surface/30'}},
        isToday: {true: {bg: 'primary/5'}, false: {}},
    },
});

export const monthGridCellNum = cva({
    base: {
        w: '6',
        h: '6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        rounded: 'full',
        fontSize: 'xs',
        cursor: 'pointer',
        transitionProperty: 'background-color, color',
    },
    variants: {
        inMonth: {true: {color: 'text.secondary'}, false: {color: 'text.tertiary'}},
        isToday: {
            true: {bg: 'primary', color: 'white', fontWeight: 'medium', _hover: {bg: 'primary'}},
            false: {_hover: {bg: 'bg.surface'}},
        },
    },
});

export const monthGridEvt = cva({
    base: {
        w: 'full',
        textAlign: 'left',
        px: '1.5',
        py: '0.5',
        rounded: 'default',
        fontSize: '2xs',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        mb: '0.5',
        fontWeight: 'medium',
    },
    variants: {
        status: {
            SCHEDULED: {bg: 'primary.surface', color: 'primary.text'},
            CONFIRMED: {bg: 'success.surface', color: 'success'},
            COMPLETED: {bg: 'bg.surface', color: 'text.secondary'},
            CANCELLED: {bg: 'danger.surface', color: 'danger', opacity: '0.6'},
            NO_SHOW: {bg: 'warning.surface', color: 'warning'},
            ARRIVED: {bg: 'primary.surface', color: 'primary.text'},
            IN_PROGRESS: {bg: 'info.surface', color: 'info'},
        },
    },
});

export const sheetStatusBadge = cva({
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '1.5',
        px: '2',
        py: '0.5',
        rounded: 'full',
        fontSize: 'xs',
        fontWeight: 'medium',
    },
    variants: {
        status: {
            SCHEDULED: {bg: 'primary.surface', color: 'primary.text'},
            CONFIRMED: {bg: 'success.surface', color: 'success'},
            COMPLETED: {bg: 'bg.surface', color: 'text.secondary'},
            CANCELLED: {bg: 'danger.surface', color: 'danger'},
            NO_SHOW: {bg: 'warning.surface', color: 'warning'},
            ARRIVED: {bg: 'primary.surface', color: 'primary.text'},
            IN_PROGRESS: {bg: 'info.surface', color: 'info'},
        },
    },
});

// ── Classes individuais (elementos folha) ──────────────────────────────────────

export const page = css({display: 'flex', flexDirection: 'column', h: 'full'});

export const header = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    px: '6',
    py: '4',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    flexShrink: '0',
});
export const headerLeft = css({display: 'flex', alignItems: 'center', gap: '3'});
export const headerRight = css({display: 'flex', alignItems: 'center', gap: '2'});
export const pageTitle = css({fontSize: '2xl', lineHeight: '[1.2]', fontWeight: 'medium', color: 'text.primary'});
export const headerCalIcon = css({w: '5', h: '5', color: 'text.secondary'});

export const periodBar = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    px: '6',
    py: '3',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    flexShrink: '0',
    gap: '4',
    flexWrap: 'wrap',
});
export const periodLeft = css({display: 'flex', alignItems: 'center', gap: '2'});
export const periodLabel = css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'text.primary',
    fontVariantNumeric: 'tabular-nums',
    fontFamily: 'mono',
});
export const arrowsGroup = css({display: 'flex', alignItems: 'center'});
export const arrowBtn = css({
    p: '1.5',
    rounded: 'button',
    color: 'text.secondary',
    transitionProperty: 'color, background-color',
    _hover: {color: 'text.primary', bg: 'bg.surface'},
});

export const statusFilterRow = css({display: 'flex', alignItems: 'center', gap: '1.5', flexWrap: 'wrap'});

export const mainLayout = css({display: 'flex', flex: '1', overflow: 'hidden'});
export const sidebar = css({
    w: '[220px]',
    flexShrink: '0',
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: 'border',
    overflowY: 'auto',
    p: '3',
    display: {base: 'none', lg: 'block'},
});
export const calBody = css({flex: '1', overflow: 'auto'});

export const segmented = css({
    display: 'flex',
    alignItems: 'center',
    rounded: 'button',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.surface',
    p: '0.5',
    gap: '0.5',
});

// Mini calendar
export const miniRoot = css({userSelect: 'none'});
export const miniHead = css({display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '2'});
export const miniMonthLabel = css({fontSize: 'xs', fontWeight: 'medium', color: 'text.primary'});
export const miniArrows = css({display: 'flex', alignItems: 'center', gap: '0.5'});
export const miniArrowBtn = css({
    p: '0.5',
    rounded: 'default',
    color: 'text.secondary',
    transitionProperty: 'color, background-color',
    _hover: {color: 'text.primary', bg: 'bg.surface'},
});
export const miniDowRow = css({display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', mb: '1'});
export const miniDowCell = css({textAlign: 'center', fontSize: '[10px]', color: 'text.tertiary', py: '0.5'});
export const miniGrid = css({display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))'});
export const miniCellNum = css({
    fontSize: '2xs',
    lineHeight: '5',
    w: '5',
    h: '5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: 'full',
});
export const miniTodayNum = css({
    fontSize: '2xs',
    lineHeight: '5',
    w: '5',
    h: '5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: 'full',
    bg: 'primary',
    color: 'white',
    fontWeight: 'medium',
});
export const miniDot = css({w: '1', h: '1', rounded: 'full', bg: 'primary', mt: '[1px]'});
export const miniTodayBtn = css({
    mt: '2',
    w: 'full',
    fontSize: '[10px]',
    color: 'text.secondary',
    textAlign: 'center',
    py: '1',
    rounded: 'default',
    transitionProperty: 'color',
    _hover: {color: 'text.primary'},
});

// Week/Day grid
export const weekHeaderMin = css({minWidth: '[560px]'});
export const gridWeekHead = css({
    display: 'flex',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    position: 'sticky',
    top: '0',
    zIndex: '10',
    bg: 'bg.page',
});
export const gridTimeColHead = css({w: '14', flexShrink: '0'});
export const gridBody = css({display: 'flex'});
export const gridTimeCol = css({w: '14', flexShrink: '0'});
export const gridTimeRow = css({
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    pr: '2',
});
export const gridTimeLabel = css({
    fontSize: '[10px]',
    color: 'text.tertiary',
    fontVariantNumeric: 'tabular-nums',
    fontFamily: 'mono',
    mt: '-[6px]',
});
export const gridSlot = css({
    position: 'absolute',
    insetInline: '0',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border/40',
    cursor: 'pointer',
    transitionProperty: 'background-color',
    _hover: {bg: 'bg.surface'},
});
export const gridNowLine = css({
    position: 'absolute',
    left: '0',
    right: '0',
    zIndex: '10',
    borderTopWidth: '2px',
    borderTopStyle: 'solid',
    borderTopColor: 'primary',
    pointerEvents: 'none',
});
export const gridNowDot = css({
    position: 'absolute',
    left: '-[5px]',
    top: '-[5px]',
    w: '[10px]',
    h: '[10px]',
    rounded: 'full',
    bg: 'primary',
});
export const gridEmptyDay = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2',
    color: 'text.tertiary',
    pointerEvents: 'none',
});
export const gridEmptyDayTitle = css({fontSize: 'sm', fontWeight: 'medium', color: 'text.secondary'});
export const gridEmptyDaySub = css({fontSize: 'xs', color: 'text.tertiary', textAlign: 'center', maxWidth: '[200px]'});
export const dayOfWeekText = css({fontSize: '[10px]', textTransform: 'uppercase'});

// Day column
export const dayColHead = css({
    px: '6',
    py: '3',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    position: 'sticky',
    top: '0',
    bg: 'bg.page',
    zIndex: '10',
});
export const dayHeadBaseline = css({display: 'flex', alignItems: 'baseline', gap: '2'});
export const dayDateNum = css({
    fontSize: '3xl',
    fontWeight: 'medium',
    fontVariantNumeric: 'tabular-nums',
    fontFamily: 'mono',
    color: 'text.primary',
});
export const dayHeaderMin = css({minWidth: '[280px]'});
export const dayHeaderText = css({fontSize: 'sm', color: 'text.secondary'});
export const apptCountText = css({fontSize: 'xs', color: 'primary'});
export const dayBodyCol = css({
    flex: '1',
    position: 'relative',
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderLeftColor: 'border',
});
export const nowTimeLabel = css({
    position: 'absolute',
    left: '3',
    top: '-[8px]',
    fontSize: '[10px]',
    fontFamily: 'mono',
    fontVariantNumeric: 'tabular-nums',
    color: 'primary',
});

// Appointment block
export const apptContent = css({pl: '2', pr: '1', py: '0.5', overflow: 'hidden'});
export const apptTime = css({
    fontSize: '[10px]',
    fontFamily: 'mono',
    fontVariantNumeric: 'tabular-nums',
    color: 'text.secondary',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});
export const apptName = css({
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'text.primary',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: '4',
});
export const apptType = css({
    fontSize: '[10px]',
    color: 'text.tertiary',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});
export const apptTimeMono = css({fontFamily: 'mono', fontVariantNumeric: 'tabular-nums', mr: '1'});

// Month grid
export const monthGridHead = css({
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    bg: 'bg.page',
    position: 'sticky',
    top: '0',
    zIndex: '10',
});
export const monthGridHeadCell = css({
    textAlign: 'center',
    py: '2',
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'text.secondary',
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderLeftColor: 'border',
    _first: {borderLeftWidth: '0'},
});
export const monthGridGrid = css({display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))'});
export const monthGridCellHead = css({display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '1'});
export const monthGridMoreBtn = css({
    fontSize: '[10px]',
    color: 'text.secondary',
    cursor: 'pointer',
    _hover: {color: 'text.primary'},
});

// Dialog forms
export const formBody = css({display: 'grid', gap: '4', py: '2'});
export const formRow = css({display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '3'});
export const formField = css({display: 'flex', flexDirection: 'column', gap: '1.5'});
export const formFooter = css({display: 'flex', justifyContent: 'flex-end', gap: '2', pt: '2'});
export const optionalLabel = css({color: 'text.tertiary', fontWeight: 'normal', fontSize: 'xs'});
export const sheetInfoRow = css({display: 'flex', flexDirection: 'column', gap: '1'});
export const cancelBtn = css({gap: '1.5', color: 'danger', borderColor: 'danger/30', _hover: {bg: 'danger/5'}});

// Patient search
export const patSearchPill = css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    p: '2',
    rounded: 'card-sm',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.surface',
});
export const patAvatarSm = css({
    w: '6',
    h: '6',
    rounded: 'full',
    bg: 'primary/10',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2xs',
    fontWeight: 'medium',
    color: 'primary',
    flexShrink: '0',
});
export const patAvatarLg = css({
    w: '10',
    h: '10',
    rounded: 'full',
    bg: 'primary/10',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'primary',
    flexShrink: '0',
});
export const patSearchName = css({
    fontSize: 'sm',
    color: 'text.primary',
    flex: '1',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});
export const patSearchDrop = css({
    position: 'absolute',
    top: 'full',
    left: '0',
    right: '0',
    zIndex: '50',
    mt: '1',
    rounded: 'card',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    boxShadow: 'lg',
    overflow: 'hidden',
    maxHeight: '48',
    overflowY: 'auto',
});
export const patSearchRow = css({
    w: 'full',
    textAlign: 'left',
    px: '3',
    py: '2',
    fontSize: 'sm',
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    transitionProperty: 'background-color',
    _hover: {bg: 'bg.surface'},
});
export const patProfileLink = css({
    display: 'flex',
    alignItems: 'center',
    gap: '1',
    fontSize: 'xs',
    color: 'primary',
    _hover: {textDecoration: 'underline'},
    flexShrink: '0',
});
export const patSearchWrap = css({position: 'relative'});
export const patClearBtn = css({color: 'text.tertiary', _hover: {color: 'text.primary'}});

// Sheet
export const sheetEyebrow = css({
    fontSize: 'xs',
    color: 'text.tertiary',
    fontWeight: 'medium',
    textTransform: 'uppercase',
    letterSpacing: 'wide',
});
export const sheetPatientCard = css({
    display: 'flex',
    alignItems: 'center',
    gap: '3',
    p: '3',
    rounded: 'card',
    bg: 'bg.surface',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
});
export const sheetPatientName = css({fontSize: 'sm', fontWeight: 'medium', color: 'text.primary'});
export const sheetPatientMeta = css({fontSize: 'xs', color: 'text.secondary'});
export const sheetPatientBody = css({flex: '1', minW: '0'});
export const sheetSection = css({
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'border',
    pt: '4',
    mt: '4',
});
export const sheetSectionTitle = css({
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'text.tertiary',
    textTransform: 'uppercase',
    letterSpacing: 'wide',
    mb: '3',
});
export const sheetKvGrid = css({display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '3'});
export const sheetKv = css({display: 'flex', flexDirection: 'column', gap: '0.5'});
export const sheetKvKey = css({fontSize: 'xs', color: 'text.tertiary'});
export const sheetKvVal = css({
    fontSize: 'sm',
    color: 'text.primary',
    fontFamily: 'mono',
    fontVariantNumeric: 'tabular-nums',
});
export const sheetKvText = css({fontSize: 'sm', color: 'text.primary'});
export const sheetNotes = css({fontSize: 'sm', color: 'text.secondary', lineHeight: 'relaxed'});
export const sheetNotesEmpty = css({fontSize: 'sm', color: 'text.tertiary', fontStyle: 'italic'});
export const sheetActions = css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    pt: '4',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'border',
    mt: '4',
});

// Misc / sizes
export const emptyDayCalIcon = css({w: '7', h: '7', color: 'text.tertiary'});
export const cancelDialogText = css({fontSize: 'sm', color: 'text.secondary'});
export const detailSheetPanel = css({w: '[400px]', overflowY: 'auto'});
export const editDialogWidth = css({maxWidth: '[480px]'});
export const newApptDialogWidth = css({maxWidth: '[520px]'});
export const cancelDialogWidth = css({maxWidth: '[400px]'});

// ── Inline Tailwind migrations ────────────────────────────────────────────────

export const icon3 = css({w: '3', h: '3'});
export const icon35 = css({w: '3.5', h: '3.5'});
export const icon4 = css({w: '4', h: '4'});
export const srOnly = css({srOnly: true});
export const mt6 = css({mt: '6'});
export const mt2 = css({mt: '2'});
export const relative = css({position: 'relative'});
export const gap1_5 = css({gap: '1.5'});
export const truncate = css({overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'});
export const highlightRing = css({boxShadow: 'focus'});
export const miniCellTextWhite = css({color: 'white'});
export const miniCellTextPrimary = css({color: 'text.primary'});
export const miniCellTextTertiary = css({color: 'text.tertiary'});
export const sheetDotBase = css({w: '1.5', h: '1.5', rounded: 'full', flexShrink: '0'});

