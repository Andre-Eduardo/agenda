import {useState} from 'react';
import {Outlet, Link, useRouterState, useNavigate, createFileRoute, redirect} from '@tanstack/react-router';
import {
    Calendar,
    ClipboardList,
    FileText,
    Home,
    LogOut,
    Menu,
    Moon,
    Settings,
    Stethoscope,
    Sun,
    Users,
    type LucideIcon,
} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {Avatar, AvatarFallback} from '@/components/ui/componentes/avatar';
import {Button} from '@/components/ui/componentes/button';
import {Sheet, SheetContent, SheetTitle, SheetTrigger} from '@/components/ui/componentes/sheet';
import {useCan, type Permission} from '@/hooks/useCan';
import {useAppStore} from '@/store/appStore';
import * as styles from './styles';
import {icon, navLink, srOnly} from './styles';

interface NavItem {
    icon: LucideIcon;
    labelKey: string;
    path: string;
    permission?: Permission;
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
            {icon: Calendar, labelKey: 'nav.appointments', path: '/appointments'},
            {icon: Users, labelKey: 'nav.patients', path: '/patients'},
            {icon: Stethoscope, labelKey: 'nav.professionals', path: '/professionals'},
        ],
    },
    {
        labelKey: 'nav.system',
        items: [
            {icon: ClipboardList, labelKey: 'nav.forms', path: '/form-templates'},
            {icon: FileText, labelKey: 'nav.chat', path: '/chat'},
            {icon: Settings, labelKey: 'nav.settings', path: '/settings'},
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
    onClick?: () => void;
}

function NavLink({item, currentPath, onClick}: NavLinkProps) {
    const {t} = useTranslation();
    const allowed = useCan(item.permission ? {has: item.permission} : undefined);
    const isActive = item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path);
    const Icon = item.icon;

    if (!allowed) return null;

    return (
        <Link to={item.path} onClick={onClick} className={navLink({active: isActive})}>
            <Icon aria-hidden className={icon} />
            {t(item.labelKey)}
        </Link>
    );
}

interface NavSectionProps {
    group: NavGroup;
    currentPath: string;
    onNavigate?: () => void;
}

function NavSection({group, currentPath, onNavigate}: NavSectionProps) {
    const {t} = useTranslation();

    return (
        <div className={styles.navSection}>
            <p className={styles.navSectionLabel}>{t(group.labelKey)}</p>
            {group.items.map((item) => (
                <NavLink key={item.path} item={item} currentPath={currentPath} onClick={onNavigate} />
            ))}
        </div>
    );
}

function SidebarContent({onNavigate}: {onNavigate?: () => void}) {
    const {t} = useTranslation();
    const routerState = useRouterState();
    const currentPath = routerState.location.pathname;
    const navigate = useNavigate();
    const setAuth = useAppStore((s) => s.setAuth);
    const colorMode = useAppStore((s) => s.colorMode);
    const setColorMode = useAppStore((s) => s.setColorMode);

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
                    <span className={styles.logoTagline}>Gestão Clínica</span>
                </div>
            </div>

            <nav className={styles.nav}>
                {NAV_GROUPS.map((group) => (
                    <NavSection key={group.labelKey} group={group} currentPath={currentPath} onNavigate={onNavigate} />
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
                                <SidebarContent onNavigate={() => setMobileOpen(false)} />
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

                <main className={styles.main}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
