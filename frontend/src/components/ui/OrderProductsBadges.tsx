import React from 'react';
import { Badge, Group, HoverCard, Stack, Text } from '@mantine/core';

interface OrderProductsBadgeItem {
  id: number;
  label: string;
  quantity: number;
}

interface OrderProductsBadgesProps {
  items: OrderProductsBadgeItem[];
  badgeColor: string;
}

export const OrderProductsBadges: React.FC<OrderProductsBadgesProps> = ({
  items,
  badgeColor,
}) => {
  if (!items.length) {
    return <>暂无</>;
  }

  const visibleItems = items.slice(0, 2);
  const hiddenItems = items.slice(2);

  return (
    <Group gap={6} justify="center" wrap="wrap">
      {visibleItems.map((item) => (
        <Badge key={item.id} variant="light" color={badgeColor}>
          {item.label}
        </Badge>
      ))}
      {hiddenItems.length > 0 ? (
        <HoverCard width={280} position="bottom" withArrow shadow="md" openDelay={100} closeDelay={100}>
          <HoverCard.Target>
            <Badge variant="outline" color="gray" style={{ cursor: 'pointer' }}>
              +{hiddenItems.length} 项更多商品
            </Badge>
          </HoverCard.Target>
          <HoverCard.Dropdown>
            <Stack gap={8}>
              {items.map((item) => (
                <Group key={item.id} justify="space-between" gap="sm" wrap="nowrap">
                  <Text size="sm">{item.label}</Text>
                  <Text size="xs" c="dimmed">
                    ×{item.quantity}
                  </Text>
                </Group>
              ))}
            </Stack>
          </HoverCard.Dropdown>
        </HoverCard>
      ) : null}
    </Group>
  );
};
