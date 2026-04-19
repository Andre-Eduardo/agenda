import { Group, TextInput } from '@mantine/core';
import type { ReactNode } from 'react';

interface ListToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
}

export function ListToolbar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  actions,
}: ListToolbarProps) {
  return (
    <Group justify="space-between" align="center" mb="md" wrap="wrap">
      <Group gap="sm" style={{ flex: 1, minWidth: 280 }} wrap="nowrap">
        {onSearchChange && (
          <TextInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            leftSection={
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                search
              </span>
            }
            style={{ flex: 1, maxWidth: 420 }}
          />
        )}
        {filters}
      </Group>
      {actions && <Group gap="sm">{actions}</Group>}
    </Group>
  );
}
