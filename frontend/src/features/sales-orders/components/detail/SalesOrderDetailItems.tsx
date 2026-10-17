import React from 'react';
import { Anchor, Paper, Stack, Table, Text } from '@mantine/core';
import { Link as RouterLink } from 'react-router-dom';
import { ROUTES } from '@/app/router/route-paths';
import { formatCurrency } from '@shared/utils/formatting';
import type { SalesOrderItem } from '../../salesOrder.types';

interface SalesOrderDetailItemsProps {
  items: SalesOrderItem[];
  orderStatus: 'draft' | 'confirmed' | 'cancelled';
}

export const SalesOrderDetailItems: React.FC<SalesOrderDetailItemsProps> = ({
  items,
  orderStatus,
}) => {
  const totalRevenue = items.reduce((sum, item) => sum + Number(item.total_revenue), 0);
  const shouldLinkToStock = orderStatus === 'confirmed';

  return (
    <Stack gap="lg" style={{ width: '100%' }}>
      <Text fw={600} size="lg">
        订单明细
      </Text>
      <Paper p="lg" radius="md" withBorder style={{ width: '100%', overflowX: 'auto' }}>
        {items.length === 0 ? (
          <Text c="dimmed">该订单暂无明细</Text>
        ) : (
          <Table striped style={{ width: '100%', minWidth: 600 }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: '32%', textAlign: 'left' }}>商品</Table.Th>
                <Table.Th style={{ width: '16%', textAlign: 'center' }}>数量</Table.Th>
                <Table.Th style={{ width: '16%', textAlign: 'center' }}>销售单价</Table.Th>
                <Table.Th style={{ width: '18%', textAlign: 'right' }}>小计</Table.Th>
                {shouldLinkToStock ? (
                  <Table.Th style={{ width: '18%', textAlign: 'center' }}>查看库存</Table.Th>
                ) : null}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td style={{ textAlign: 'left' }}>{item.product_name || `商品 #${item.product}`}</Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>{item.quantity}</Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>{formatCurrency(item.unit_price)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(item.total_revenue)}</Table.Td>
                  {shouldLinkToStock ? (
                    <Table.Td style={{ textAlign: 'center' }}>
                      <Anchor
                        component={RouterLink}
                        to={ROUTES.stockDetail(item.product)}
                        onClick={(event) => event.stopPropagation()}
                      >
                        查看库存
                      </Anchor>
                    </Table.Td>
                  ) : null}
                </Table.Tr>
              ))}
            </Table.Tbody>
            <Table.Tfoot>
              <Table.Tr>
                <Table.Td colSpan={shouldLinkToStock ? 4 : 3} style={{ textAlign: 'right', fontWeight: 600 }}>
                  合计：
                </Table.Td>
                <Table.Td style={{ textAlign: 'right', fontWeight: 700, fontSize: 16 }}>
                  {formatCurrency(totalRevenue)}
                </Table.Td>
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        )}
      </Paper>
    </Stack>
  );
};
