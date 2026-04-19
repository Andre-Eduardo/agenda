import type { CSSProperties } from 'react';

export const backgroundContainerStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: -1,
  width: '100%',
  height: '100%',
};

export const backgroundImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

export const backgroundOverlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundColor: 'rgba(69, 95, 136, 0.1)', // primary with 10% opacity
  backdropFilter: 'brightness(0.95)',
};

export const mainWrapperStyle: CSSProperties = {
  flexGrow: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--mantine-spacing-xl) 1rem',
};

export const loginCardStyle: CSSProperties = {
  width: '100%',
  maxWidth: '400px',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: 'var(--mantine-radius-xl)',
  padding: 'var(--mantine-spacing-xl)',
  boxShadow: 'var(--mantine-shadow-xl)',
  border: '1px solid rgba(255, 255, 255, 0.4)',
};

export const logoWrapperStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: 'var(--mantine-spacing-xl)',
};

export const iconContainerStyle: CSSProperties = {
  color: 'var(--mantine-color-brand-5)',
  marginBottom: 'var(--mantine-spacing-md)',
  padding: 'var(--mantine-spacing-sm)',
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  borderRadius: '50%',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const headerTextStyle: CSSProperties = {
  textAlign: 'center',
  marginBottom: 'var(--mantine-spacing-xl)',
};

export const formWrapperStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--mantine-spacing-md)',
};

export const inputLabelStyle: CSSProperties = {
  fontSize: 'var(--mantine-font-size-xs)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--mantine-color-brand-4)',
  marginLeft: 'var(--mantine-spacing-xs)',
  marginBottom: '4px',
};

export const inputFieldStyle: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.6)',
  borderBottom: '2px solid rgba(148, 163, 184, 0.2)', // outline variant approx
  borderRadius: 'var(--mantine-radius-md) var(--mantine-radius-md) 0 0',
};

export const primaryButtonStyle: CSSProperties = {
  background: 'linear-gradient(to right, var(--mantine-color-brand-5), var(--mantine-color-brand-6))',
  color: 'white',
  fontWeight: 700,
  height: '48px',
  marginTop: 'var(--mantine-spacing-md)',
};

export const googleButtonStyle: CSSProperties = {
  backgroundColor: 'white',
  color: '#374151',
  fontWeight: 600,
  border: '1px solid #e5e7eb',
  height: '44px',
};

export const footerTextStyle: CSSProperties = {
  marginTop: 'var(--mantine-spacing-xl)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  color: 'rgba(69, 95, 136, 0.6)',
};

export const footerContainerStyle: CSSProperties = {
  padding: 'var(--mantine-spacing-xl) 0',
  marginTop: 'auto',
  textAlign: 'center',
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: 'var(--mantine-font-size-xs)',
};
