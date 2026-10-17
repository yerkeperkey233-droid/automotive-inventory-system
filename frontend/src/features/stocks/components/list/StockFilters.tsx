import React from 'react';
import { Group, TextInput, Select, ActionIcon, Tooltip } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';

interface StockFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: (value: string) => void;
  onSearchClear: () => void;
  ordering: string;
  onOrderingChange: (value: string) => void;
}

export const StockFilters: React.FC<StockFiltersProps> = ({
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
        placeholder="按商品名称、商品编码或入库编号搜索…"
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
          { value: 'name_asc', label: '名称升序' },
          { value: 'name_desc', label: '名称降序' },
          { value: 'quantity_desc', label: '库存从高到低' },
          { value: 'quantity_asc', label: '库存从低到高' },
          { value: 'value_desc', label: '金额从高到低' },
          { value: 'value_asc', label: '金额从低到高' },
        ]}
        value={ordering}
        onChange={(val) => onOrderingChange(val || 'quantity_desc')}
        style={{ width: 240, flexShrink: 0 }}
      />
    </Group>
  );
};
