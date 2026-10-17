import React from 'react';
import { ActionIcon, Group, Select, TextInput, Tooltip } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';

interface SalesOrdersFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: (value: string) => void;
  onSearchClear: () => void;
  ordering: string;
  onOrderingChange: (value: string) => void;
}

export const SalesOrdersFilters: React.FC<SalesOrdersFiltersProps> = ({
  searchInput,
  onSearchInputChange,
  onSearch,
  onSearchClear,
  ordering,
  onOrderingChange,
}) => {
  return (
    <Group align="flex-end" style={{ width: '100%' }} wrap="nowrap">
      <TextInput
        placeholder="按订单编号、客户或商品搜索…"
        leftSection={<IconSearch size={16} />}
        rightSection={
          searchInput ? (
            <Tooltip label="清除搜索">
              <ActionIcon variant="subtle" color="gray" onClick={onSearchClear} aria-label="清除搜索">
                <IconX size={16} />
              </ActionIcon>
            </Tooltip>
          ) : null
        }
        value={searchInput}
        onChange={(event) => onSearchInputChange(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onSearch(searchInput);
            event.currentTarget.blur();
          }
        }}
        style={{ flex: 1 }}
      />
      <Select
        placeholder="排序方式"
        data={[
          { value: '-sold_at', label: '最新优先' },
          { value: 'sold_at', label: '最早优先' },
          { value: '-total_revenue', label: '收入最高优先' },
        ]}
        value={ordering}
        onChange={(value) => onOrderingChange(value || '-sold_at')}
        style={{ width: 240, flexShrink: 0 }}
      />
    </Group>
  );
};
