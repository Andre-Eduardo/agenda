import type { CSSProperties } from 'react';

export const pageHeaderStyle: CSSProperties = {
  marginBottom: '24px',
};

export const greetingStyle: CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: 'var(--mantine-color-brand-8)',
  lineHeight: 1.3,
  marginBottom: '4px',
};

export const dateStyle: CSSProperties = {
  fontSize: '13px',
  color: 'var(--mantine-color-brand-4)',
  fontWeight: 500,
};

export const statsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '16px',
  marginBottom: '24px',
};

export const statCardStyle: CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '20px',
  border: '1px solid var(--mantine-color-brand-1)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  position: 'relative',
  overflow: 'hidden',
};

export const statCardAccentStyle = (color: string): CSSProperties => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '3px',
  backgroundColor: color,
  borderRadius: '12px 12px 0 0',
});

export const statIconContainerStyle = (bg: string): CSSProperties => ({
  width: '42px',
  height: '42px',
  borderRadius: '10px',
  backgroundColor: bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const statValueStyle: CSSProperties = {
  fontSize: '28px',
  fontWeight: 800,
  color: 'var(--mantine-color-brand-8)',
  lineHeight: 1,
};

export const statLabelStyle: CSSProperties = {
  fontSize: '12px',
  color: 'var(--mantine-color-brand-4)',
  fontWeight: 600,
};

export const statTrendStyle = (positive: boolean): CSSProperties => ({
  fontSize: '11px',
  fontWeight: 600,
  color: positive ? '#16a34a' : '#dc2626',
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
});

export const contentGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 360px',
  gap: '20px',
};

export const cardStyle: CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  border: '1px solid var(--mantine-color-brand-1)',
  overflow: 'hidden',
};

export const cardHeaderStyle: CSSProperties = {
  padding: '18px 20px 14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid var(--mantine-color-brand-0)',
};

export const cardTitleStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: 'var(--mantine-color-brand-8)',
};

export const appointmentRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  padding: '12px 20px',
  borderBottom: '1px solid var(--mantine-color-brand-0)',
  cursor: 'pointer',
  transition: 'background 0.1s',
};

export const appointmentAvatarStyle = (color: string): CSSProperties => ({
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  backgroundColor: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '13px',
  fontWeight: 700,
  flexShrink: 0,
});

export const statusBadgeStyle = (status: 'confirmed' | 'pending' | 'cancelled' | 'done'): CSSProperties => {
  const map = {
    confirmed: { bg: '#dcfce7', color: '#16a34a' },
    pending: { bg: '#fef9c3', color: '#ca8a04' },
    cancelled: { bg: '#fee2e2', color: '#dc2626' },
    done: { bg: '#ede9fe', color: '#7c3aed' },
  };
  const { bg, color } = map[status];
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 10px',
    borderRadius: '20px',
    backgroundColor: bg,
    color,
    fontSize: '11px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  };
};

export const timeSlotStyle = (active: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 20px',
  borderBottom: '1px solid var(--mantine-color-brand-0)',
  backgroundColor: active ? 'var(--mantine-color-brand-0)' : 'white',
});

export const timeStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--mantine-color-brand-5)',
  width: '44px',
  flexShrink: 0,
};

export const quickActionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  padding: '14px 12px',
  borderRadius: '10px',
  backgroundColor: 'var(--mantine-color-brand-0)',
  border: '1px solid var(--mantine-color-brand-1)',
  cursor: 'pointer',
  flex: 1,
  transition: 'background 0.15s',
};
