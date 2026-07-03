import {css, cva} from '@/styled-system/css';

export {cx} from '@/styled-system/css';

// ── Variantes (cva prontos) ────────────────────────────────────────────────────

export const segmentedBtn = cva({
    base: {
        rounded: '[6px]',
        px: '3',
        py: '1.5',
        fontSize: '[13px]',
        fontWeight: 'medium',
        lineHeight: '[1.3]',
        transitionProperty: 'all',
        transitionDuration: 'fast',
        transitionTimingFunction: 'ease-out',
    },
    variants: {
        active: {
            true: {bg: 'bg.card', color: 'text.primary', boxShadow: '0 1px 2px rgba(0,0,0,0.04)'},
            false: {color: 'text.tertiary', _hover: {color: 'text.secondary'}},
        },
    },
    defaultVariants: {active: false},
});

export const statusChip = cva({
    base: {
        display: 'inline-flex',
        cursor: 'pointer',
        userSelect: 'none',
        alignItems: 'center',
        gap: '1.5',
        rounded: 'full',
        borderWidth: '1px',
        borderStyle: 'solid',
        px: '2.5',
        py: '0.5',
        fontSize: 'xs',
        fontWeight: 'medium',
        transitionProperty: 'all',
        transitionDuration: 'fast',
    },
    variants: {
        status: {
            scheduled: {borderColor: 'primary.border', bg: 'primary.surface', color: 'primary.text'},
            confirmed: {borderColor: 'success/30', bg: 'success.surface', color: 'success'},
            done: {borderColor: 'border', bg: 'bg.surface', color: 'text.secondary'},
            cancelled: {borderColor: 'danger/30', bg: 'danger.surface', color: 'danger'},
            noshow: {borderColor: 'warning/30', bg: 'warning.surface', color: 'warning'},
        },
        off: {true: {opacity: '0.4'}, false: {}},
    },
    defaultVariants: {off: false},
});

export const miniCalCell = cva({
    base: {
        position: 'relative',
        display: 'flex',
        cursor: 'pointer',
        flexDirection: 'column',
        alignItems: 'center',
        rounded: '[5px]',
        py: '0.5',
        transitionProperty: 'background-color, color',
        transitionDuration: 'fast',
    },
    variants: {
        state: {
            default: {color: 'text.secondary', _hover: {bg: 'bg.surface'}},
            off: {color: 'text.tertiary/40', _hover: {bg: 'bg.surface'}},
            today: {fontWeight: 'medium', color: 'primary', _hover: {bg: 'bg.surface'}},
            selected: {bg: 'primary', color: 'white'},
            inWeek: {bg: 'primary.surface', color: 'primary.text'},
        },
    },
    defaultVariants: {state: 'default'},
});

export const dayHead = cva({
    base: {
        display: 'flex',
        flex: '1',
        flexDirection: 'column',
        alignItems: 'center',
        borderLeftWidth: '1px',
        borderLeftStyle: 'solid',
        borderLeftColor: 'border/50',
        py: '2',
        textAlign: 'center',
        _first: {borderLeftWidth: '0'},
    },
    variants: {
        today: {true: {bg: 'primary.surface'}, false: {}},
    },
});

export const dayHeadNum = cva({
    base: {
        mt: '0.5',
        display: 'flex',
        w: '7',
        h: '7',
        alignItems: 'center',
        justifyContent: 'center',
        rounded: 'full',
        fontSize: 'sm',
        fontVariantNumeric: 'tabular-nums',
    },
    variants: {
        today: {
            true: {bg: 'primary', fontWeight: 'medium', color: 'white'},
            false: {fontWeight: 'medium', color: 'text.primary'},
        },
    },
});

export const dayCol = cva({
    base: {
        position: 'relative',
        flex: '1',
        borderLeftWidth: '1px',
        borderLeftStyle: 'solid',
        borderLeftColor: 'border/40',
        _first: {borderLeftWidth: '0'},
    },
    variants: {
        today: {true: {bg: 'primary.surface/10'}, false: {}},
    },
});

export const monthCell = cva({
    base: {
        cursor: 'pointer',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'border/50',
        borderRightWidth: '1px',
        borderRightStyle: 'solid',
        borderRightColor: 'border/50',
        p: '1',
        transitionProperty: 'background-color',
        transitionDuration: 'fast',
        _last: {borderRightWidth: '0'},
    },
    variants: {
        off: {
            true: {bg: 'bg.page', opacity: '0.6'},
            false: {bg: 'bg.card', _hover: {bg: 'bg.surface'}},
        },
    },
    defaultVariants: {off: false},
});

export const monthCellNum = cva({
    base: {
        mb: '0.5',
        display: 'flex',
        w: '6',
        h: '6',
        alignItems: 'center',
        justifyContent: 'center',
        rounded: 'full',
        fontSize: 'xs',
        fontWeight: 'medium',
        fontVariantNumeric: 'tabular-nums',
    },
    variants: {
        today: {
            true: {bg: 'primary', color: 'white'},
            false: {color: 'text.secondary'},
        },
    },
    defaultVariants: {today: false},
});

export const apptBlock = cva({
    base: {
        position: 'absolute',
        cursor: 'pointer',
        overflow: 'hidden',
        rounded: '[6px]',
        px: '1.5',
        py: '1',
        textAlign: 'left',
        transitionProperty: 'all',
        transitionDuration: 'fast',
        _hover: {filter: 'brightness(0.95)'},
    },
    variants: {
        status: {
            SCHEDULED: {bg: 'primary.surface'},
            CONFIRMED: {bg: 'success.surface'},
            COMPLETED: {bg: 'bg.surface'},
            CANCELLED: {bg: 'danger.surface'},
            NO_SHOW: {bg: 'warning.surface'},
            ARRIVED: {bg: 'info.surface'},
            IN_PROGRESS: {bg: 'success.surface'},
        },
        highlight: {true: {boxShadow: 'focus'}, false: {}},
    },
    defaultVariants: {highlight: false},
});

export const statusBadge = cva({
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '1.5',
        rounded: 'full',
        px: '2.5',
        py: '0.5',
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
            ARRIVED: {bg: 'info.surface', color: 'info'},
            IN_PROGRESS: {bg: 'success.surface', color: 'success'},
        },
    },
});

export const shNotes = cva({
    base: {fontSize: 'sm'},
    variants: {
        empty: {
            true: {fontStyle: 'italic', color: 'text.tertiary'},
            false: {color: 'text.primary'},
        },
    },
});

export const searchBox = cva({
    base: {
        display: 'flex',
        alignItems: 'center',
        gap: '2',
        rounded: 'input',
        borderWidth: '1px',
        borderStyle: 'solid',
        bg: 'bg.card',
        px: '3',
        py: '[9px]',
        transitionProperty: 'border-color',
        transitionDuration: 'fast',
        _focusWithin: {borderColor: 'primary'},
    },
    variants: {
        error: {
            true: {borderColor: 'warning'},
            false: {borderColor: 'border'},
        },
    },
    defaultVariants: {error: false},
});

// ── Classes folha ───────────────────────────────────────────────────────────────

export const agPage = css({display: 'flex', flexDirection: 'column'});

export const agHeader = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    bg: 'bg.card',
    px: '6',
    py: '4',
});
export const agHeaderTitle = css({fontSize: 'xl', fontWeight: 'medium', color: 'text.primary'});
export const agHeaderRight = css({display: 'flex', alignItems: 'center', gap: '2'});

export const agPeriod = css({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '3',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    bg: 'bg.card',
    px: '6',
    py: '3',
});
export const agPeriodLeft = css({display: 'flex', alignItems: 'center', gap: '2'});
export const agPeriodLabel = css({fontSize: 'sm', fontWeight: 'medium', color: 'text.primary'});
export const agArrowBtn = css({
    display: 'flex',
    w: '7',
    h: '7',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: '[6px]',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    color: 'text.secondary',
    transitionProperty: 'background-color, color',
    transitionDuration: 'fast',
    _hover: {bg: 'bg.surface', color: 'text.primary'},
});
export const arrowBtnRow = css({display: 'flex', alignItems: 'center', gap: '0.5'});
export const statusFiltersRow = css({display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5'});

export const agLayout = css({display: 'flex'});
export const agSide = css({
    w: '56',
    flexShrink: '0',
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: 'border',
    bg: 'bg.card',
});
export const agBody = css({minW: '0', flex: '1', bg: 'bg.page'});

export const segmentedRoot = css({
    display: 'inline-flex',
    rounded: '[8px]',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.surface',
    p: '0.5',
});

export const chipDot = css({w: '1.5', h: '1.5', rounded: 'full'});
export const statusDotScheduled = css({bg: 'primary'});
export const statusDotConfirmed = css({bg: 'success'});
export const statusDotDone = css({bg: 'text.tertiary'});
export const statusDotCancelled = css({bg: 'danger'});
export const statusDotNoshow = css({bg: 'warning'});

// Avatar
export const avatarSm = css({
    display: 'flex',
    w: '8',
    h: '8',
    flexShrink: '0',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: 'full',
    fontSize: 'xs',
    fontWeight: 'medium',
});
export const avatarV0 = css({bg: 'primary.surface', color: 'primary.text'});
export const avatarV1 = css({bg: 'info.surface', color: 'info'});
export const avatarV2 = css({bg: 'success.surface', color: 'success'});
export const avatarV3 = css({bg: 'warning.surface', color: 'warning'});
export const avatarV4 = css({bg: 'danger.surface', color: 'danger'});
export const avatarV5 = css({bg: 'ai.bg', color: 'ai.text'});
export const avatarV6 = css({bg: 'bg.surface', color: 'text.secondary'});

// Mini calendar
export const miniCalRoot = css({p: '3'});
export const miniCalHead = css({mb: '2', display: 'flex', alignItems: 'center', justifyContent: 'space-between'});
export const miniCalMonthLabel = css({fontSize: 'sm', fontWeight: 'medium', color: 'text.primary'});
export const miniCalArrowsRow = css({display: 'flex', alignItems: 'center', gap: '0.5'});
export const miniCalArrowBtn = css({
    display: 'flex',
    w: '6',
    h: '6',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: '[5px]',
    color: 'text.tertiary',
    transitionProperty: 'background-color, color',
    transitionDuration: 'fast',
    _hover: {bg: 'bg.surface', color: 'text.primary'},
});
export const miniCalDowRow = css({
    mb: '1',
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    textAlign: 'center',
});
export const miniCalDowCell = css({py: '0.5', fontSize: '2xs', fontWeight: 'medium', color: 'text.tertiary'});
export const miniCalGrid = css({display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))'});
export const miniCalTodayBtn = css({
    mt: '2',
    display: 'flex',
    w: 'full',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5',
    rounded: '[6px]',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    py: '1.5',
    fontSize: 'xs',
    color: 'text.secondary',
    transitionProperty: 'background-color',
    transitionDuration: 'fast',
    _hover: {bg: 'bg.surface'},
});
export const miniCalNum = css({fontSize: '[12px]', lineHeight: '[20px]', fontVariantNumeric: 'tabular-nums'});
export const miniCalDot = css({position: 'absolute', bottom: '0.5', w: '1', h: '1', rounded: 'full', bg: 'primary'});

// Week/Day grid
export const weekGrid = css({minWidth: '[600px]'});
export const weekHead = css({
    position: 'sticky',
    top: '0',
    zIndex: '10',
    display: 'flex',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    bg: 'bg.card',
});
export const timeColHead = css({w: '14', flexShrink: '0', borderRightWidth: '0'});
export const dayHeadDow = css({
    fontSize: '2xs',
    fontWeight: 'medium',
    textTransform: 'uppercase',
    letterSpacing: '[0.06em]',
    color: 'text.tertiary',
});
export const weekBody = css({display: 'flex'});
export const timeCol = css({w: '14', flexShrink: '0'});
export const timeRow = css({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'border/40',
    pr: '2',
    _first: {borderTopWidth: '0'},
});
export const timeLbl = css({
    mt: '-[6px]',
    fontSize: '[10px]',
    fontVariantNumeric: 'tabular-nums',
    color: 'text.tertiary',
});
export const hourSlot = css({
    position: 'absolute',
    insetInline: '0',
    cursor: 'pointer',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'border/40',
    transitionProperty: 'background-color',
    transitionDuration: 'fast',
    _hover: {bg: 'primary.surface/20'},
});
export const nowLine = css({
    position: 'absolute',
    left: '0',
    right: '0',
    zIndex: '10',
    display: 'flex',
    alignItems: 'center',
});
export const nowDot = css({w: '2.5', h: '2.5', flexShrink: '0', rounded: 'full', bg: 'primary'});
export const nowBar = css({flex: '1', borderTopWidth: '2px', borderTopStyle: 'solid', borderTopColor: 'primary'});
export const nowTime = css({
    ml: '1',
    fontFamily: 'mono',
    fontSize: '[10px]',
    fontVariantNumeric: 'tabular-nums',
    color: 'primary',
});

// Day view specific
export const dayViewHead = css({
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    bg: 'bg.card',
    px: '6',
    py: '4',
});
export const dayViewDow = css({
    fontSize: 'xs',
    fontWeight: 'medium',
    textTransform: 'uppercase',
    letterSpacing: '[0.06em]',
    color: 'text.tertiary',
});
export const dayViewNumRow = css({mt: '0.5', display: 'flex', alignItems: 'baseline', gap: '3'});
export const dayViewNum = css({
    fontSize: '[36px]',
    fontWeight: 'medium',
    lineHeight: '[1.1]',
    fontVariantNumeric: 'tabular-nums',
    color: 'text.primary',
});
export const dayViewMonth = css({fontSize: 'sm', color: 'text.secondary'});
export const dayViewCount = css({
    ml: '1',
    rounded: 'full',
    bg: 'primary.surface',
    px: '2',
    py: '0.5',
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'primary.text',
});
export const dayColSolo = css({position: 'relative', flex: '1'});
export const emptyDay = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2',
    color: 'text.tertiary',
});
export const emptyDayTitle = css({fontSize: 'sm', fontWeight: 'medium', color: 'text.secondary'});
export const emptyDaySub = css({maxWidth: '[200px]', textAlign: 'center', fontSize: 'xs', color: 'text.tertiary'});

// Month view
export const monthWrapper = css({});
export const monthHead = css({
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    bg: 'bg.card',
});
export const monthHeadCell = css({
    py: '2',
    textAlign: 'center',
    fontSize: '2xs',
    fontWeight: 'medium',
    textTransform: 'uppercase',
    letterSpacing: '[0.06em]',
    color: 'text.tertiary',
});
export const monthCells = css({
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    gridAutoRows: 'minmax(90px, 1fr)',
});
export const monthMoreBtn = css({
    rounded: '[4px]',
    px: '1',
    py: '0.5',
    fontSize: '2xs',
    color: 'text.tertiary',
    _hover: {bg: 'bg.surface', color: 'text.secondary'},
});

// Month event status
export const monthEvtBase = css({
    mb: '0.5',
    display: 'flex',
    w: 'full',
    cursor: 'pointer',
    alignItems: 'center',
    gap: '1',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    rounded: '[4px]',
    px: '1',
    py: '0.5',
    fontSize: '2xs',
    fontWeight: 'medium',
    transitionProperty: 'all',
    transitionDuration: 'fast',
});
export const monthEvtScheduled = css({bg: 'primary.surface', color: 'primary.text'});
export const monthEvtConfirmed = css({bg: 'success.surface', color: 'success'});
export const monthEvtDone = css({bg: 'bg.surface', color: 'text.secondary'});
export const monthEvtCancelled = css({bg: 'danger.surface', color: 'danger'});
export const monthEvtNoshow = css({bg: 'warning.surface', color: 'warning'});
export const monthEvtArrived = css({bg: 'info.surface', color: 'info'});
export const monthEvtInProgress = css({bg: 'success.surface', color: 'success'});

// Appointment block
export const apptBar = css({position: 'absolute', bottom: '0', left: '0', top: '0', w: '[3px]'});
export const apptBarScheduled = css({bg: 'primary'});
export const apptBarConfirmed = css({bg: 'success'});
export const apptBarCompleted = css({bg: 'text.tertiary'});
export const apptBarCancelled = css({bg: 'danger'});
export const apptBarNoShow = css({bg: 'warning'});
export const apptBarArrived = css({bg: 'info'});
export const apptBarInProgress = css({bg: 'success'});

export const apptContent = css({ml: '2', minW: '0'});
export const apptTimeBase = css({
    fontFamily: 'mono',
    fontSize: '[10px]',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: '[1.2]',
});
export const apptTimeScheduled = css({color: 'primary'});
export const apptTimeConfirmed = css({color: 'success'});
export const apptTimeCompleted = css({color: 'text.tertiary'});
export const apptTimeCancelled = css({color: 'danger'});
export const apptTimeNoShow = css({color: 'warning'});
export const apptTimeArrived = css({color: 'info'});
export const apptTimeInProgress = css({color: 'success'});
export const apptNameBase = css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '2xs',
    fontWeight: 'medium',
    lineHeight: '[1.3]',
});
export const apptNameScheduled = css({color: 'primary.text'});
export const apptNameConfirmed = css({color: 'success'});
export const apptNameCompleted = css({color: 'text.secondary'});
export const apptNameCancelled = css({color: 'danger'});
export const apptNameNoShow = css({color: 'warning'});
export const apptNameArrived = css({color: 'info'});
export const apptNameInProgress = css({color: 'success'});
export const apptTypeLbl = css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '[10px]',
    color: 'text.tertiary',
});
export const apptTimeLabel = css({flexShrink: '0', fontSize: '[10px]', color: 'text.tertiary'});
export const apptMonoTime = css({fontFamily: 'mono', fontSize: '[10px]', fontVariantNumeric: 'tabular-nums'});

// Day popover
export const popOverlay = css({
    position: 'fixed',
    inset: '0',
    zIndex: '50',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    bg: 'black/30',
});
export const popContent = css({
    w: '72',
    overflow: 'hidden',
    rounded: 'modal',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    boxShadow: 'dropdown',
});
export const popHead = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    px: '4',
    py: '3',
});
export const popDow = css({
    fontSize: 'xs',
    fontWeight: 'medium',
    textTransform: 'uppercase',
    letterSpacing: '[0.06em]',
    color: 'text.tertiary',
});
export const popDate = css({fontSize: 'sm', fontWeight: 'medium', color: 'text.primary'});
export const popList = css({maxHeight: '72', overflowY: 'auto', p: '2'});
export const popRow = css({
    display: 'flex',
    w: 'full',
    alignItems: 'center',
    gap: '2',
    rounded: '[6px]',
    px: '2',
    py: '2',
    textAlign: 'left',
    fontSize: 'xs',
    transitionProperty: 'background-color',
    transitionDuration: 'fast',
    _hover: {bg: 'bg.surface'},
});
export const popTime = css({
    w: '24',
    flexShrink: '0',
    fontFamily: 'mono',
    fontVariantNumeric: 'tabular-nums',
    color: 'text.tertiary',
});
export const popName = css({
    flex: '1',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 'medium',
    color: 'text.primary',
});

// Appointment sheet
export const sheetOverlay = css({position: 'fixed', inset: '0', zIndex: '40', bg: 'black/20'});
export const sheetPanel = css({
    position: 'fixed',
    bottom: '0',
    right: '0',
    top: '0',
    zIndex: '50',
    display: 'flex',
    w: '[400px]',
    flexDirection: 'column',
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderLeftColor: 'border',
    bg: 'bg.card',
    boxShadow: '0 0 30px rgba(0,0,0,0.1)',
});
export const shHead = css({
    display: 'flex',
    flexShrink: '0',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'border',
    px: '5',
    py: '4',
});
export const shTitleBlock = css({display: 'flex', flexDirection: 'column', gap: '0.5'});
export const shEyebrow = css({
    fontSize: 'xs',
    fontWeight: 'medium',
    textTransform: 'uppercase',
    letterSpacing: '[0.06em]',
    color: 'text.tertiary',
});
export const shH = css({fontSize: 'sm', fontWeight: 'medium', color: 'text.primary'});
export const shBody = css({flex: '1', overflowY: 'auto', px: '5', py: '5', '& > * + *': {marginTop: '5'}});
export const shFoot = css({
    display: 'flex',
    flexShrink: '0',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '2',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'border',
    px: '5',
    py: '4',
});

export const shStatusRow = css({display: 'flex', alignItems: 'center', gap: '2'});
export const shPatientCard = css({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '3',
    rounded: 'card-sm',
    bg: 'bg.surface',
    p: '3',
});
export const shPatientInfo = css({minW: '0', flex: '1'});
export const shPatientName = css({fontSize: 'sm', fontWeight: 'medium', color: 'text.primary'});
export const shPatientMeta = css({mt: '0.5', fontSize: 'xs', color: 'text.secondary'});
export const shPatientLink = css({
    display: 'flex',
    flexShrink: '0',
    alignItems: 'center',
    gap: '0.5',
    fontSize: 'xs',
    color: 'primary.text',
    transitionProperty: 'color',
    transitionDuration: 'fast',
    _hover: {textDecoration: 'underline'},
});
export const shSection = css({});
export const shSecHead = css({
    mb: '2',
    fontSize: 'xs',
    fontWeight: 'medium',
    textTransform: 'uppercase',
    letterSpacing: '[0.06em]',
    color: 'text.tertiary',
});
export const shInfoGrid = css({display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '3'});
export const shKV = css({display: 'flex', flexDirection: 'column', gap: '0.5'});
export const shK = css({fontSize: 'xs', color: 'text.tertiary'});
export const shV = css({fontSize: 'sm', color: 'text.primary'});
export const shVMono = css({
    fontFamily: 'mono',
    fontSize: 'sm',
    fontVariantNumeric: 'tabular-nums',
    color: 'text.primary',
});

export const statusDot = css({w: '1.5', h: '1.5', rounded: 'full', bg: 'currentColor'});
export const shCloseBtn = css({
    display: 'flex',
    w: '7',
    h: '7',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: '[6px]',
    color: 'text.tertiary',
    _hover: {bg: 'bg.surface'},
});

// Form fields
export const fieldLabel = css({
    display: 'block',
    mb: '1',
    fontSize: 'xs',
    fontWeight: 'medium',
    color: 'text.secondary',
});
export const fieldHint = css({mt: '0.5', fontSize: '2xs', color: 'text.tertiary'});
export const fieldErr = css({
    mt: '0.5',
    display: 'flex',
    alignItems: 'center',
    gap: '1',
    fontSize: '2xs',
    color: 'warning',
});
export const formGrid = css({display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '3'});
export const inputBase = css({
    w: 'full',
    rounded: 'input',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    px: '3',
    py: '[9px]',
    fontSize: 'sm',
    color: 'text.primary',
    transitionProperty: 'border-color',
    transitionDuration: 'fast',
    _placeholder: {color: 'text.tertiary'},
    _focus: {borderColor: 'primary', outline: 'none'},
});
export const inputErr = css({borderColor: 'warning'});
export const selectBase = css({
    w: 'full',
    rounded: 'input',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    px: '3',
    py: '[9px]',
    fontSize: 'sm',
    color: 'text.primary',
    transitionProperty: 'border-color',
    transitionDuration: 'fast',
    _focus: {borderColor: 'primary', outline: 'none'},
});
export const textareaBase = css({
    w: 'full',
    resize: 'none',
    rounded: 'input',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    px: '3',
    py: '2',
    fontSize: 'sm',
    color: 'text.primary',
    transitionProperty: 'border-color',
    transitionDuration: 'fast',
    _placeholder: {color: 'text.tertiary'},
    _focus: {borderColor: 'primary', outline: 'none'},
});

// Patient search
export const patientPill = css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    rounded: 'input',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.surface',
    p: '2',
});
export const ppInfo = css({minW: '0', flex: '1'});
export const ppName = css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'text.primary',
});
export const ppMeta = css({fontSize: 'xs', color: 'text.tertiary'});
export const ppClear = css({
    display: 'flex',
    w: '6',
    h: '6',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: '[4px]',
    color: 'text.tertiary',
    transitionProperty: 'background-color, color',
    transitionDuration: 'fast',
    _hover: {bg: 'bg.card', color: 'text.primary'},
});
export const searchWrap = css({position: 'relative'});
export const searchInput = css({
    flex: '1',
    bg: 'transparent',
    fontSize: 'sm',
    color: 'text.primary',
    _placeholder: {color: 'text.tertiary'},
    _focus: {outline: 'none'},
});
export const searchIcon = css({w: '3.5', h: '3.5', flexShrink: '0', color: 'text.tertiary'});
export const suggList = css({
    position: 'absolute',
    left: '0',
    right: '0',
    top: '[calc(100%+4px)]',
    zIndex: '20',
    overflow: 'hidden',
    rounded: 'dropdown',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    boxShadow: 'dropdown',
});
export const suggRow = css({
    display: 'flex',
    w: 'full',
    cursor: 'pointer',
    alignItems: 'center',
    gap: '2.5',
    px: '3',
    py: '2.5',
    textAlign: 'left',
    transitionProperty: 'background-color',
    transitionDuration: 'fast',
    _hover: {bg: 'bg.surface'},
});
export const suggName = css({fontSize: 'sm', fontWeight: 'medium', color: 'text.primary'});
export const suggMeta = css({fontSize: 'xs', color: 'text.tertiary'});
export const suggEmpty = css({px: '3', py: '4', textAlign: 'center', fontSize: 'sm', color: 'text.tertiary'});

// Conflict banner
export const conflictBanner = css({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '2.5',
    rounded: 'card-sm',
    bg: 'warning.surface',
    px: '3',
    py: '2.5',
});
export const conflictTitle = css({fontSize: 'xs', fontWeight: 'medium', color: 'warning'});
export const conflictDesc = css({mt: '0.5', fontSize: 'xs', color: 'text.secondary'});
export const conflictIcon = css({mt: '0.5', w: '4', h: '4', flexShrink: '0', color: 'warning'});

// Skeleton
export const skeletonRoot = css({display: 'flex', flexDirection: 'column', gap: '2', p: '6'});
export const skeletonDayCard = css({h: '12', w: 'full', rounded: 'card-sm'});

// Cancel modal
export const modalOverlay = css({
    position: 'fixed',
    inset: '0',
    zIndex: '[60]',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    bg: 'black/40',
});
export const modal = css({
    w: '[420px]',
    rounded: 'modal',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'border',
    bg: 'bg.card',
    p: '6',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
});
export const modalHead = css({mb: '4', display: 'flex', alignItems: 'flex-start', gap: '3'});
export const modalIcon = css({
    display: 'flex',
    w: '10',
    h: '10',
    flexShrink: '0',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: 'full',
    bg: 'warning.surface',
    color: 'warning',
});
export const modalTitle = css({fontSize: 'sm', fontWeight: 'medium', color: 'text.primary'});
export const modalDesc = css({mt: '0.5', fontSize: 'xs', color: 'text.secondary'});
export const modalActions = css({mt: '4', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2'});

// Base classes referenced individually (for cn composition in JSX)
export const segmentedBtnBase = css({});
export const segmentedBtnActive = css({});
export const segmentedBtnInactive = css({});

// ── Inline Tailwind migrations ────────────────────────────────────────────────

export const icon3 = css({w: '3', h: '3'});
export const icon35 = css({w: '3.5', h: '3.5'});
export const icon4 = css({w: '4', h: '4'});
export const icon5 = css({w: '5', h: '5'});
export const icon7 = css({w: '7', h: '7'});
export const flex = css({display: 'flex'});
export const truncate = css({overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'});
export const highlightRing = css({boxShadow: 'focus'});
export const textTertiary = css({color: 'text.tertiary'});
export const textDanger = css({color: 'danger'});

export const statusChipBase = css({});
export const statusChipScheduled = css({});
export const statusChipConfirmed = css({});
export const statusChipDone = css({});
export const statusChipCancelled = css({});
export const statusChipNoshow = css({});
export const statusChipOff = css({});
export const miniCalCellBase = css({});
export const miniCalCellDefault = css({});
export const miniCalCellOff = css({});
export const miniCalCellToday = css({});
export const miniCalCellSelected = css({});
export const miniCalCellInWeek = css({});
export const dayHeadBase = css({});
export const dayHeadToday = css({});
export const dayHeadNumBase = css({});
export const dayHeadNumToday = css({});
export const dayHeadNumDefault = css({});
export const dayColBase = css({});
export const dayColToday = css({});
export const monthCellBase = css({});
export const monthCellOff = css({});
export const monthCellOn = css({});
export const monthCellNumBase = css({});
export const monthCellNumToday = css({});
export const monthCellNumDefault = css({});
export const apptBlockBase = css({});
export const apptBlockScheduled = css({});
export const apptBlockConfirmed = css({});
export const apptBlockCompleted = css({});
export const apptBlockCancelled = css({});
export const apptBlockNoShow = css({});
export const apptBlockArrived = css({});
export const apptBlockInProgress = css({});
export const apptBlockHighlight = css({});
export const statusBadgeBase = css({});
export const shNotesBase = css({});
export const shNotesEmpty = css({});
export const shNotesFull = css({});
export const searchBoxBase = css({});
export const searchBoxDefault = css({});
export const searchBoxError = css({});
