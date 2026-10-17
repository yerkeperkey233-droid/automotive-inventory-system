import React from 'react';
import { Group, TextInput, Select, ActionIcon, Tooltip } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';

interface PurchaseOrdersFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: (value: string) => void;
  onSearchClear: () => void;
  ordering: string;
  onOrderingChange: (value: string) => void;
}

export const PurchaseOrdersFilters: React.FC<PurchaseOrdersFiltersProps> = ({
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
        placeholder="按订单编号、供应商或商品搜索…"
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
        onChange={(e) => onSearchInputChange(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSearch(searchInput);
            e.currentTarget.blur();
          }
        }}
        style={{ flex: 1 }}
      />
      <Select
        placeholder="排序方式"
        data={[
          { value: '-ordered_at', label: '最新优先' },
          { value: 'ordered_at', label: '最早优先' },
          { value: '-total_cost', label: '成本最高优先' },
        ]}
        value={ordering}
        onChange={(val) => onOrderingChange(val || '-ordered_at')}
        style={{ width: 240, flexShrink: 0 }}
      />
    </Group>
  );
};
