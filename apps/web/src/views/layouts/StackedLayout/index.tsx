import {useRef, useState, type PointerEvent} from 'react';
import type {ModuleType, OperationalModuleType} from '@agenda-app/client';
import {Outlet, Link, useRouterState, useNavigate, createFileRoute, redirect} from '@tanstack/react-router';
import {
    BarChart3,
    Building2,
    Calendar,
    CalendarDays,
    ChevronRight,
    ClipboardList,
    List,
    Home,
    LifeBuoy,
    LogOut,
    Menu,
    Moon,
    Settings,
    Stethoscope,
    Sun,
    UserCog,
    Users,
    Wallet,
    type LucideIcon,
} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {Avatar, AvatarFallback} from '@/components/ui/componentes/avatar';
import {Button} from '@/components/ui/componentes/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/componentes/dropdown-menu';
import {Sheet, SheetContent, SheetTitle, SheetTrigger} from '@/components/ui/componentes/sheet';
import {useAccount} from '@/hooks/useAccount';
import {useCan, type Permission} from '@/hooks/useCan';
import {useHasModule} from '@/hooks/useHasModule';
import {useHoverDelayDisclosure} from '@/hooks/useHoverDelayDisclosure';
import {useAppStore} from '@/store/appStore';
import * as styles from './styles';
import {cx, icon, navLink, srOnly, submenuItem} from './styles';
import {SupportBanner} from './SupportBanner';

interface NavItem {
    icon: LucideIcon;
    labelKey: string;
    path: string;
    permission?: Permission;
    /** Shown when the member has any of these permissions. */
    anyPermission?: Permission[];
    /** Also requires the current member to be released by the clinic for this AI module. */
    module?: ModuleType;
    /** Clinic-only item (team, reception): hidden when the account does not have the module. */
    clinicModule?: OperationalModuleType;
    /** Label used on a solo account (autônomo), where the screen is about the professional alone. */
    soloLabelKey?: string;
    /** Hidden on a solo account (autônomo), where the entry makes no sense for one professional. */
    clinicOnly?: boolean;
    /** Search params of the destination, also used to tell which submenu entry is active. */
    search?: Record<string, string>;
    /**
     * Entries of a floating submenu. The item itself is then a trigger, not a link: on the desktop
     * sidebar the entries open in a menu beside it; in the mobile sheet they are listed below it.
     */
    children?: NavItem[];
}

interface NavGroup {
    labelKey: string;
    items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        labelKey: 'nav.menu',
        items: [
            {icon: Home, labelKey: 'nav.dashboard', path: '/dashboard'},
            {
                icon: ClipboardList,
                labelKey: 'nav.reception',
                path: '/reception',
                permission: 'appointment:view',
                clinicModule: 'RECEPTION',
            },
            {
                icon: Calendar,
                labelKey: 'nav.agenda',
                path: '/appointments',
                children: [
                    {icon: List, labelKey: 'nav.appointments', path: '/appointments'},
                    {icon: CalendarDays, labelKey: 'nav.calendar', path: '/calendar'},
                ],
            },
            {icon: Users, labelKey: 'nav.patients', path: '/patients'},
            {icon: Stethoscope, labelKey: 'nav.professionals', path: '/professionals', clinicModule: 'TEAM'},
            {icon: UserCog, labelKey: 'nav.team', path: '/team', clinicModule: 'TEAM'},
            {
                icon: BarChart3,
                labelKey: 'nav.reports',
                path: '/reports',
                permission: 'clinic-report:view',
                children: [
                    {
                        icon: BarChart3,
                        labelKey: 'reports.tabs.overview',
                        path: '/reports',
                        search: {report: 'overview'},
                    },
                    {
                        icon: Stethoscope,
                        labelKey: 'reports.tabs.professionals',
                        path: '/reports',
                        search: {report: 'professionals'},
                        clinicOnly: true,
                    },
                    {icon: UserCog, labelKey: 'reports.tabs.absences', path: '/reports', search: {report: 'absences'}},
                    {
                        icon: Calendar,
                        labelKey: 'reports.tabs.occupancy',
                        path: '/reports',
                        search: {report: 'occupancy'},
                    },
                ],
            },
        ],
    },
    {
        labelKey: 'nav.system',
        items: [
            {
                icon: Wallet,
                labelKey: 'nav.financial',
                soloLabelKey: 'nav.myFinancial',
                path: '/financial',
                permission: 'financial-report:view',
            },
            {icon: Settings, labelKey: 'nav.settings', soloLabelKey: 'nav.mySettings', path: '/settings'},
        ],
    },
    {
        labelKey: 'nav.admin',
        items: [
            {
                icon: Building2,
                labelKey: 'nav.clinics',
                path: '/admin/clinics',
                anyPermission: ['clinic-license:manage', 'support-access:enter'],
            },
            {
                icon: LifeBuoy,
                labelKey: 'nav.supportUsers',
                path: '/admin/support-users',
                permission: 'support-user:manage',
            },
        ],
    },
];

export const Route = createFileRoute('/_stackedLayout')({
    beforeLoad: ({context, location}) => {
        if (!context?.auth) {
            throw redirect({
                to: '/auth/login',
                search: {redirect: location.pathname},
            });
        }
    },
    component: StackedLayout,
});

function getInitials(name: string | undefined | null): string {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

interface NavLinkProps {
    item: NavItem;
    currentPath: string;
    currentSearch?: Record<string, unknown>;
    /** Inline: the mobile sheet lists submenu entries below their parent instead of floating them. */
    inline?: boolean;
    onClick?: () => void;
}

function isPathActive(path: string, currentPath: string): boolean {
    return path === '/' ? currentPath === '/' : currentPath === path || currentPath.startsWith(`${path}/`);
}

function isItemActive(item: NavItem, currentPath: string, currentSearch: Record<string, unknown> = {}): boolean {
    if (item.children) return item.children.some((child) => isItemActive(child, currentPath, currentSearch));

    if (!isPathActive(item.path, currentPath)) return false;

    return Object.entries(item.search ?? {}).every(([key, value]) => currentSearch[key] === value);
}

/** Whether the current member may see the entry: permission, AI module, clinic module and account type. */
function useNavItemVisible(item: NavItem): boolean {
    const allowed = useCan(
        item.permission || item.anyPermission ? {has: item.permission, hasAny: item.anyPermission} : undefined
    );
    const hasModule = useHasModule(item.module);
    const account = useAccount();
    const hasClinicModule = item.clinicModule === undefined || account.hasClinicModule(item.clinicModule);

    return allowed && hasModule && hasClinicModule && !(item.clinicOnly && account.isSolo);
}

function useNavLabel(item: NavItem): string {
    const {t} = useTranslation();
    const {isSolo} = useAccount();

    return t(isSolo && item.soloLabelKey ? item.soloLabelKey : item.labelKey);
}

function NavLink({item, currentPath, currentSearch, inline, onClick}: NavLinkProps) {
    const visible = useNavItemVisible(item);
    const label = useNavLabel(item);
    const Icon = item.icon;

    if (!visible) return null;

    if (item.children) {
        return inline ? (
            <InlineNavGroup item={item} currentPath={currentPath} currentSearch={currentSearch} onClick={onClick} />
        ) : (
            <FloatingNavGroup item={item} currentPath={currentPath} currentSearch={currentSearch} />
        );
    }

    return (
        <Link
            to={item.path}
            search={item.search}
            onClick={onClick}
            className={navLink({active: isItemActive(item, currentPath, currentSearch)})}
        >
            <Icon aria-hidden className={icon} />
            {label}
        </Link>
    );
}

/** Mobile sheet: the parent is a heading and its entries are links indented below it. */
function InlineNavGroup({item, currentPath, currentSearch, onClick}: NavLinkProps) {
    const label = useNavLabel(item);
    const Icon = item.icon;

    return (
        <div role="group" aria-label={label} className={styles.inlineGroup}>
            <span className={styles.inlineGroupLabel}>
                <Icon aria-hidden className={icon} />
                {label}
            </span>
            <div className={styles.inlineGroupItems}>
                {item.children?.map((child) => (
                    <NavLink
                        key={`${child.path}-${child.labelKey}`}
                        item={child}
                        currentPath={currentPath}
                        currentSearch={currentSearch}
                        onClick={onClick}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Desktop sidebar: the parent opens a menu floating beside the sidebar, by click, keyboard or
 * hover. Radix DropdownMenu brings focus management, arrow-key navigation and Escape.
 */
function FloatingNavGroup({item, currentPath, currentSearch}: NavLinkProps) {
    const {t} = useTranslation();
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const label = useNavLabel(item);
    const {cancelClose, scheduleClose} = useHoverDelayDisclosure({closeDelay: 200, onClose: () => setOpen(false)});
    const Icon = item.icon;
    const active = isItemActive(item, currentPath, currentSearch);

    const hoverProps = {
        onPointerEnter: (event: PointerEvent) => {
            if (event.pointerType !== 'mouse') return;
            cancelClose();
            setOpen(true);
        },
        onPointerLeave: (event: PointerEvent) => {
            if (event.pointerType !== 'mouse') return;
            scheduleClose();
        },
    };

    // Hovering already opened the menu: a click on the parent must not toggle it closed again.
    const keepHoverOpen = (event: PointerEvent) => {
        if (event.pointerType === 'mouse' && open) event.preventDefault();
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
            <DropdownMenuTrigger
                ref={triggerRef}
                className={cx(navLink({active}), styles.navTrigger)}
                onPointerDown={keepHoverOpen}
                {...hoverProps}
            >
                <Icon aria-hidden className={icon} />
                {label}
                <ChevronRight aria-hidden className={styles.chevron} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                side="right"
                align="start"
                sideOffset={10}
                className={styles.submenu}
                aria-label={t('nav.submenu', {label})}
                onInteractOutside={(event) => {
                    // The parent is outside the floating menu; pressing it must not dismiss the menu.
                    if (event.target instanceof Node && triggerRef.current?.contains(event.target)) {
                        event.preventDefault();
                    }
                }}
                {...hoverProps}
            >
                <DropdownMenuLabel className={styles.submenuLabel}>{label}</DropdownMenuLabel>
                {item.children?.map((child) => (
                    <SubmenuEntry
                        key={`${child.path}-${child.labelKey}`}
                        item={child}
                        active={isItemActive(child, currentPath, currentSearch)}
                        onSelect={() => setOpen(false)}
                    />
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function SubmenuEntry({item, active, onSelect}: {item: NavItem; active: boolean; onSelect: () => void}) {
    const visible = useNavItemVisible(item);
    const label = useNavLabel(item);
    const Icon = item.icon;

    if (!visible) return null;

    return (
        <DropdownMenuItem asChild onSelect={onSelect}>
            <Link
                to={item.path}
                search={item.search}
                aria-current={active ? 'page' : undefined}
                className={submenuItem({active})}
            >
                <Icon aria-hidden className={icon} />
                {label}
            </Link>
        </DropdownMenuItem>
    );
}

interface NavSectionProps {
    group: NavGroup;
    currentPath: string;
    currentSearch: Record<string, unknown>;
    inline: boolean;
    onNavigate?: () => void;
}

function NavSection({group, currentPath, currentSearch, inline, onNavigate}: NavSectionProps) {
    const {t} = useTranslation();

    return (
        <div className={styles.navSection}>
            <p className={styles.navSectionLabel}>{t(group.labelKey)}</p>
            {group.items.map((item) => (
                <NavLink
                    key={item.labelKey}
                    item={item}
                    currentPath={currentPath}
                    currentSearch={currentSearch}
                    inline={inline}
                    onClick={onNavigate}
                />
            ))}
        </div>
    );
}

function SidebarContent({onNavigate, inline = false}: {onNavigate?: () => void; inline?: boolean}) {
    const {t} = useTranslation();
    const routerState = useRouterState();
    const currentPath = routerState.location.pathname;
    const currentSearch = routerState.location.search;
    const navigate = useNavigate();
    const setAuth = useAppStore((s) => s.setAuth);
    const colorMode = useAppStore((s) => s.colorMode);
    const setColorMode = useAppStore((s) => s.setColorMode);
    const {isSolo} = useAccount();

    const handleLogout = () => {
        setAuth(false, null);
        onNavigate?.();
        navigate({to: '/auth/login'}).catch((error: unknown) => {
            // eslint-disable-next-line no-console -- defensive logging; navigate rejection here means the router is in an unrecoverable state
            console.error('Logout navigation failed', error);
        });
    };

    return (
        <div className={styles.sidebarInner}>
            <div className={styles.logoRow}>
                <div className={styles.logoIcon}>
                    <Stethoscope aria-hidden className={icon} />
                </div>
                <div className={styles.logoTextGroup}>
                    <span className={styles.logoName}>Agenda Saúde</span>
                    <span className={styles.logoTagline}>
                        {isSolo ? t('account.tagline.SOLO') : t('account.tagline.CLINIC')}
                    </span>
                </div>
            </div>

            <nav className={styles.nav}>
                {NAV_GROUPS.map((group) => (
                    <NavSection
                        key={group.labelKey}
                        group={group}
                        currentPath={currentPath}
                        currentSearch={currentSearch}
                        inline={inline}
                        onNavigate={onNavigate}
                    />
                ))}
            </nav>

            <div className={styles.sidebarFooter}>
                <Button
                    type="button"
                    variant="ghost"
                    className={styles.sidebarAction}
                    onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}
                >
                    {colorMode === 'dark' ? (
                        <Sun aria-hidden className={icon} />
                    ) : (
                        <Moon aria-hidden className={icon} />
                    )}
                    {colorMode === 'dark' ? t('theme.light') : t('theme.dark')}
                </Button>
                <Button type="button" variant="ghost" className={styles.sidebarAction} onClick={handleLogout}>
                    <LogOut aria-hidden className={icon} />
                    {t('nav.logout')}
                </Button>
            </div>
        </div>
    );
}

export function StackedLayout() {
    const {t} = useTranslation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const userName = 'User';
    const initials = getInitials(userName);

    return (
        <div className={styles.root}>
            <aside className={styles.sidebar}>
                <SidebarContent />
            </aside>

            <div className={styles.content}>
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className={styles.navMenuButton}
                                    aria-label={t('nav.menu')}
                                >
                                    <Menu aria-hidden className={icon} />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className={styles.mobileSheet}>
                                <SheetTitle className={srOnly}>{t('nav.menu')}</SheetTitle>
                                <SidebarContent inline onNavigate={() => setMobileOpen(false)} />
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* TODO: link this to /user-profile once that route is registered */}
                    <div className={styles.userChip}>
                        <Avatar className={styles.avatar}>
                            <AvatarFallback className={styles.avatarFallback}>{initials}</AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                <SupportBanner />

                <main className={styles.main}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
