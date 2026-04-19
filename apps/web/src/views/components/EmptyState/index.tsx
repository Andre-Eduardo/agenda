import { Box, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  icon?: string;
  title?: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = 'inbox', title, message, action }: EmptyStateProps) {
  const { t } = useTranslation();
  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <Box
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: 'var(--mantine-color-brand-0)',
          color: 'var(--mantine-color-brand-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 32 }}>
          {icon}
        </span>
      </Box>
      <Text fw={600} size="md" mb={4}>
        {title ?? t('states.empty')}
      </Text>
      {message && (
        <Text size="sm" c="brand.4" mb={action ? 'md' : 0}>
          {message}
        </Text>
      )}
      {action}
    </Box>
  );
}
