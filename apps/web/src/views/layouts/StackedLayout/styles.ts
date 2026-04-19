import type { CSSProperties } from 'react';

export const rootStyle: CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: 'var(--mantine-color-brand-0)',
};

export const sidebarStyle: CSSProperties = {
  width: '260px',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--mantine-color-brand-8)',
  position: 'fixed',
  top: 0,
  left: 0,
  height: '100vh',
  zIndex: 100,
  overflowY: 'auto',
};

export const sidebarBrandStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '20px 20px',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
};

export const brandIconStyle: CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  backgroundColor: 'var(--mantine-color-brand-5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: 'white',
};

export const sidebarNavStyle: CSSProperties = {
  flex: 1,
  padding: '16px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

export const navSectionLabelStyle: CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.35)',
  padding: '12px 8px 6px',
};

export const navItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '9px 12px',
  borderRadius: '8px',
  cursor: 'pointer',
  color: 'rgba(255,255,255,0.65)',
  fontSize: '14px',
  fontWeight: 500,
  textDecoration: 'none',
  transition: 'background 0.15s, color 0.15s',
};

export const navItemActiveStyle: CSSProperties = {
  ...navItemStyle,
  backgroundColor: 'rgba(69,95,136,0.6)',
  color: 'white',
};

export const navItemIconStyle: CSSProperties = {
  fontSize: '20px',
  lineHeight: 1,
  flexShrink: 0,
};

export const sidebarFooterStyle: CSSProperties = {
  padding: '16px',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

export const userAvatarStyle: CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  backgroundColor: 'var(--mantine-color-brand-5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '14px',
  fontWeight: 700,
  flexShrink: 0,
};

export const mainStyle: CSSProperties = {
  flex: 1,
  marginLeft: '260px',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
};

export const topbarStyle: CSSProperties = {
  height: '64px',
  backgroundColor: 'white',
  borderBottom: '1px solid var(--mantine-color-brand-1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 28px',
  position: 'sticky',
  top: 0,
  zIndex: 50,
};

export const contentStyle: CSSProperties = {
  flex: 1,
  padding: '28px',
};

export const notifBtnStyle: CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  border: '1px solid var(--mantine-color-brand-1)',
  backgroundColor: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: 'var(--mantine-color-brand-4)',
  position: 'relative',
};

export const notifDotStyle: CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: '#ef4444',
  border: '2px solid white',
};
