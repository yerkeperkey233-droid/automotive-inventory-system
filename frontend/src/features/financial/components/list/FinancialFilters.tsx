import React from 'react';
import { ActionIcon, Button, Group, TextInput, Tooltip } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconSearch, IconX } from '@tabler/icons-react';

interface FinancialFiltersProps {
  searchPlaceholder: string;
  searchInput: string;
  startDate: Date | null;
  endDate: Date | null;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  onStartDateChange: (value: Date | null) => void;
  onEndDateChange: (value: Date | null) => void;
  onResetPeriod: () => void;
}

export const FinancialFilters: React.FC<FinancialFiltersProps> = ({
  searchPlaceholder,
  searchInput,
  startDate,
  endDate,
  onSearchInputChange,
  onSearchSubmit,
  onSearchClear,
  onStartDateChange,
  onEndDateChange,
  onResetPeriod,
}) => {
  return (
    <Group align="flex-end" style={{ width: '100%' }} wrap="wrap">
      <TextInput
        placeholder={searchPlaceholder}
        leftSection={<IconSearch size={16} />}
        rightSection={
          searchInput ? (
            <Tooltip label="清除搜索">
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={onSearchClear}
                aria-label="清除搜索"
              >
                <IconX size={16} />
              </ActionIcon>
            </Tooltip>
          ) : null
        }
        value={searchInput}
        onChange={(event) => onSearchInputChange(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onSearchSubmit();
            event.currentTarget.blur();
          }
        }}
        style={{ flex: 1, minWidth: 260 }}
      />
      <Button onClick={onSearchSubmit}>
        搜索
      </Button>
      <DateInput
        label="开始日期"
        placeholder="请选择开始日期"
        value={startDate}
        onChange={(value) => onStartDateChange(value ? new Date(value) : null)}
        clearable
        style={{ minWidth: 180 }}
      />
      <DateInput
        label="结束日期"
        placeholder="请选择结束日期"
        value={endDate}
        onChange={(value) => onEndDateChange(value ? new Date(value) : null)}
        clearable
        style={{ minWidth: 180 }}
      />
      <Button variant="light" color="gray" onClick={onResetPeriod}>
        重置日期范围
      </Button>
    </Group>
  );
};
