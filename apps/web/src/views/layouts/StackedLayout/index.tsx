import { Outlet, Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { Box, Text, Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useGetCurrentUser, useSignOut } from '@agenda-app/client';
import { useAppStore } from '../../../store/appStore';
import {
  rootStyle,
  sidebarStyle,
  sidebarBrandStyle,
  brandIconStyle,
  sidebarNavStyle,
  navSectionLabelStyle,
  navItemStyle,
  navItemActiveStyle,
  navItemIconStyle,
  sidebarFooterStyle,
  userAvatarStyle,
  mainStyle,
  topbarStyle,
  contentStyle,
  notifBtnStyle,
  notifDotStyle,
} from './styles';

interface NavItem {
  icon: string;
  labelKey: string;
  path: string;
}

const primaryNav: NavItem[] = [
  { icon: 'home', labelKey: 'nav.dashboard', path: '/' },
  { icon: 'calendar_month', labelKey: 'nav.appointments', path: '/appointments' },
  { icon: 'people', labelKey: 'nav.patients', path: '/patients' },
  { icon: 'medical_services', labelKey: 'nav.professionals', path: '/professionals' },
];

const secondaryNav: NavItem[] = [
  { icon: 'description', labelKey: 'nav.forms', path: '/form-templates' },
];

function NavEntry({ item, currentPath }: { item: NavItem; currentPath: string }) {
  const { t } = useTranslation();
  const isActive = item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path);
  return (
    <Link
      to={item.path}
      style={isActive ? navItemActiveStyle : navItemStyle}
    >
      <span className="material-symbols-outlined" style={navItemIconStyle}>
        {item.icon}
      </span>
      {t(item.labelKey)}
    </Link>
  );
}

function getInitials(name: string | undefined): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function StackedLayout() {
  const { t } = useTranslation();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const navigate = useNavigate();
  const setAuth = useAppStore((s) => s.setAuth);

  const { data: user } = useGetCurrentUser({
    query: { retry: false, staleTime: 60_000 },
  });
  const signOutMutation = useSignOut();

  const initials = getInitials(user?.name);
  const displayName = user?.name ?? user?.username ?? '—';

  const handleLogout = () => {
    signOutMutation.mutate(undefined, {
      onSettled: () => {
        setAuth(false, null);
        navigate({ to: '/auth/login' });
      },
    });
  };

  return (
    <Box style={rootStyle}>
      <Box style={sidebarStyle}>
        <Box style={sidebarBrandStyle}>
          <Box style={brandIconStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              clinical_notes
            </span>
          </Box>
          <Box>
            <Text fw={800} size="sm" c="white" lh={1.2}>
              Agenda Saúde
            </Text>
            <Text size="xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Gestão Clínica
            </Text>
          </Box>
        </Box>

        <Box style={sidebarNavStyle}>
          <Text style={navSectionLabelStyle}>{t('nav.menu')}</Text>
          {primaryNav.map((item) => (
            <NavEntry key={item.path} item={item} currentPath={currentPath} />
          ))}

          <Text style={{ ...navSectionLabelStyle, marginTop: '8px' }}>{t('nav.system')}</Text>
          {secondaryNav.map((item) => (
            <NavEntry key={item.path} item={item} currentPath={currentPath} />
          ))}
        </Box>

        <Box style={sidebarFooterStyle}>
          <Box style={userAvatarStyle}>{initials}</Box>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text fw={600} size="xs" c="white" truncate>
              {displayName}
            </Text>
            <Text size="xs" style={{ color: 'rgba(255,255,255,0.45)' }} truncate>
              {String(user?.email ?? '')}
            </Text>
          </Box>
          <span
            className="material-symbols-outlined"
            onClick={handleLogout}
            title={t('nav.logout')}
            style={{
              fontSize: '18px',
              color: 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
            }}
          >
            logout
          </span>
        </Box>
      </Box>

      <Box style={mainStyle}>
        <Box style={topbarStyle}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px', color: 'var(--mantine-color-brand-3)' }}
            >
              chevron_right
            </span>
            <Text size="sm" fw={600} c="brand.8">
              {getPageTitle(currentPath, t)}
            </Text>
          </Box>

          <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Box style={notifBtnStyle}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                notifications
              </span>
              <Box style={notifDotStyle} />
            </Box>

            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px 4px 4px',
                borderRadius: '20px',
                backgroundColor: 'var(--mantine-color-brand-0)',
                border: '1px solid var(--mantine-color-brand-1)',
                cursor: 'pointer',
              }}
            >
              <Box style={{ ...userAvatarStyle, width: '28px', height: '28px', fontSize: '11px' }}>
                {initials}
              </Box>
              <Text size="xs" fw={600} c="brand.8">
                {displayName}
              </Text>
              <Badge size="xs" color="green" variant="light">
                {t('user.online')}
              </Badge>
            </Box>
          </Box>
        </Box>

        <Box style={contentStyle}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

function getPageTitle(path: string, t: (key: string) => string): string {
  if (path === '/') return t('nav.dashboard');
  if (path.startsWith('/appointments')) return t('nav.appointments');
  if (path.startsWith('/patients')) return t('nav.patients');
  if (path.startsWith('/professionals')) return t('nav.professionals');
  if (path.startsWith('/form-templates')) return t('nav.forms');
  return 'Agenda Saúde';
}
