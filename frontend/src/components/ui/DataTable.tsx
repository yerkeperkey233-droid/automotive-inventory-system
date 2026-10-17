import React from 'react';
import {
  Table,
  Group,
  ActionIcon,
  Menu,
  Pagination,
  Stack,
} from '@mantine/core';
import { IconDots } from '@tabler/icons-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

interface Action<T> {
  label: string;
  icon: React.ReactNode;
  onClick: (row: T, index: number) => void;
  color?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: Action<T>[];
  isLoading?: boolean;
  isPaginated?: boolean;
  pageSize?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  rowKey?: keyof T;
  onRowClick?: (row: T, index: number) => void;
  renderRowActions?: (row: T, index: number) => React.ReactNode;
  actionsColumnWidth?: string | number;
  tableMinWidth?: string | number;
}

const actionsCellStyle = {
  textAlign: 'center' as const,
  paddingLeft: '1.25rem',
  paddingRight: '1.25rem',
};

export const DataTable = React.forwardRef<HTMLTableElement, DataTableProps<any>>(
  (
    {
      columns,
      data,
      actions,
      currentPage = 1,
      totalPages = 1,
      onPageChange,
      rowKey = 'id' as any,
      onRowClick,
      isPaginated,
      renderRowActions,
      actionsColumnWidth,
      tableMinWidth,
    },
    ref
  ) => {
    const rows = data.map((row, index) => (
      <Table.Tr
        key={String(row[rowKey])}
        onClick={() => onRowClick?.(row, index)}
        style={onRowClick ? { cursor: 'pointer' } : undefined}
      >
        {columns.map((column) => (
          <Table.Td
            key={String(column.key)}
            style={column.align ? { textAlign: column.align } : undefined}
          >
            {column.render
              ? column.render(row[column.key as keyof typeof row], row, index)
              : String(row[column.key as keyof typeof row] ?? '')}
          </Table.Td>
        ))}
        {(actions && actions.length > 0) || renderRowActions ? (
          <Table.Td
            style={{
              ...actionsCellStyle,
              ...(actionsColumnWidth ? { width: actionsColumnWidth } : undefined),
            }}
          >
            {renderRowActions ? (
              renderRowActions(row, index)
            ) : (
              <Menu position="bottom-end" shadow="md">
                <Menu.Target>
                  <ActionIcon variant="subtle" color="gray">
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {actions?.map((action, idx) => (
                    <Menu.Item
                      key={idx}
                      leftSection={action.icon}
                      c={action.color}
                      onClick={() => action.onClick(row, index)}
                    >
                      {action.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            )}
          </Table.Td>
        ) : null}
      </Table.Tr>
    ));

    return (
      <Stack gap="md">
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <Table
            ref={ref}
            style={{
              width: '100%',
              ...(tableMinWidth ? { minWidth: tableMinWidth } : undefined),
            }}
          >
            <Table.Thead>
              <Table.Tr>
                {columns.map((column) => (
                  <Table.Th
                    key={String(column.key)}
                    style={{
                      ...(column.width ? { width: column.width } : undefined),
                      ...(column.align ? { textAlign: column.align } : undefined),
                    }}
                  >
                    {column.label}
                  </Table.Th>
                ))}
                {((actions && actions.length > 0) || renderRowActions) && (
                  <Table.Th
                    style={{
                      ...actionsCellStyle,
                      ...(actionsColumnWidth ? { width: actionsColumnWidth } : undefined),
                    }}
                  >
                    操作
                  </Table.Th>
                )}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </div>

        {isPaginated && totalPages > 1 && (
          <Group justify="center">
            <Pagination
              value={currentPage}
              onChange={onPageChange}
              total={totalPages}
            />
          </Group>
        )}
      </Stack>
    );
  }
);

DataTable.displayName = 'DataTable';
