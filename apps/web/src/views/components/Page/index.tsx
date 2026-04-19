import { Box, Title, Text, Group } from '@mantine/core';
import type { ReactNode } from 'react';

interface PageProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function Page({ title, subtitle, actions, children }: PageProps) {
  return (
    <Box>
      <Group justify="space-between" align="flex-start" mb="lg">
        <Box>
          <Title order={2} style={{ fontWeight: 700, lineHeight: 1.2 }}>
            {title}
          </Title>
          {subtitle && (
            <Text size="sm" c="brand.4" mt={4}>
              {subtitle}
            </Text>
          )}
        </Box>
        {actions && <Group gap="sm">{actions}</Group>}
      </Group>
      {children}
    </Box>
  );
}
