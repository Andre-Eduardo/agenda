import { Outlet, Link, useRouterState } from '@tanstack/react-router';
import { Box, Text, Badge } from '@mantine/core';
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

const navItems = [
  { icon: 'home', label: 'Dashboard', path: '/' },
  { icon: 'calendar_month', label: 'Consultas', path: '/appointments' },
  { icon: 'people', label: 'Pacientes', path: '/patients' },
  { icon: 'medical_services', label: 'Profissionais', path: '/professionals' },
];

const secondaryNavItems = [
  { icon: 'bar_chart', label: 'Relatórios', path: '/reports' },
  { icon: 'settings', label: 'Configurações', path: '/settings' },
];

export function StackedLayout() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <Box style={rootStyle}>
      {/* Sidebar */}
      <Box style={sidebarStyle}>
        {/* Brand */}
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

        {/* Navigation */}
        <Box style={sidebarNavStyle}>
          <Text style={navSectionLabelStyle}>Menu principal</Text>
          {navItems.map((item) => {
            const isActive = item.path === '/'
              ? currentPath === '/'
              : currentPath.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path as '/'}
                style={isActive ? navItemActiveStyle : navItemStyle}
              >
                <span className="material-symbols-outlined" style={navItemIconStyle}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}

          <Text style={{ ...navSectionLabelStyle, marginTop: '8px' }}>Sistema</Text>
          {secondaryNavItems.map((item) => {
            const isActive = currentPath.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path as '/'}
                style={isActive ? navItemActiveStyle : navItemStyle}
              >
                <span className="material-symbols-outlined" style={navItemIconStyle}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </Box>

        {/* User footer */}
        <Box style={sidebarFooterStyle}>
          <Box style={userAvatarStyle}>AD</Box>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text fw={600} size="xs" c="white" truncate>
              Dr. Admin
            </Text>
            <Text size="xs" style={{ color: 'rgba(255,255,255,0.45)' }} truncate>
              Administrador
            </Text>
          </Box>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '18px', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}
          >
            logout
          </span>
        </Box>
      </Box>

      {/* Main content */}
      <Box style={mainStyle}>
        {/* Topbar */}
        <Box style={topbarStyle}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px', color: 'var(--mantine-color-brand-3)' }}
            >
              chevron_right
            </span>
            <Text size="sm" fw={600} c="brand.8">
              {getPageTitle(currentPath)}
            </Text>
          </Box>

          <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Search */}
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--mantine-color-brand-0)',
                border: '1px solid var(--mantine-color-brand-1)',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '18px', color: 'var(--mantine-color-brand-3)' }}
              >
                search
              </span>
              <Text size="xs" c="brand.3">
                Buscar paciente...
              </Text>
            </Box>

            {/* Notifications */}
            <Box style={notifBtnStyle}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                notifications
              </span>
              <Box style={notifDotStyle} />
            </Box>

            {/* Help */}
            <Box style={{ ...notifBtnStyle, color: 'var(--mantine-color-brand-3)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                help_outline
              </span>
            </Box>

            {/* User chip */}
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
                AD
              </Box>
              <Text size="xs" fw={600} c="brand.8">
                Dr. Admin
              </Text>
              <Badge size="xs" color="green" variant="light">
                Online
              </Badge>
            </Box>
          </Box>
        </Box>

        {/* Page content */}
        <Box style={contentStyle}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

function getPageTitle(path: string): string {
  if (path === '/') return 'Dashboard';
  if (path.startsWith('/appointments')) return 'Consultas';
  if (path.startsWith('/patients')) return 'Pacientes';
  if (path.startsWith('/professionals')) return 'Profissionais';
  if (path.startsWith('/reports')) return 'Relatórios';
  if (path.startsWith('/settings')) return 'Configurações';
  return 'Agenda Saúde';
}

export default StackedLayout;
