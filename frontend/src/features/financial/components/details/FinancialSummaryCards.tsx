import React from 'react';
import { Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import type { FinancialSummary } from '../../financial.types';
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
} from '@shared/utils/formatting';

interface FinancialSummaryCardsProps {
  summary: FinancialSummary;
  isSticky: boolean;
  title: string;
  subtitle?: string;
  isRefreshing?: boolean;
}

const formatMetricValue = (
  value: number | string | null | undefined,
  formatter: (value: number | string | null | undefined) => string,
  fallback = '暂无'
) => {
  if (value === null || value === undefined) {
    return fallback;
  }
  return formatter(value);
};

const toSafeNumber = (value: number | string | null | undefined): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const getBalance = (
  revenue: number | string | null | undefined,
  purchaseCost: number | string | null | undefined
): number => {
  return toSafeNumber(revenue) - toSafeNumber(purchaseCost);
};

const getSignedMetricColor = (value: number): string => {
  return value >= 0 ? 'green.7' : 'red.7';
};

const getSignedMetricBorderColor = (value: number): string => {
  return value >= 0
    ? 'var(--mantine-color-green-2)'
    : 'var(--mantine-color-red-2)';
};

export const FinancialSummaryCards: React.FC<FinancialSummaryCardsProps> = ({
  summary,
  isSticky,
  title,
  subtitle,
  isRefreshing = false,
}) => {
  const balance = getBalance(summary.total_revenue, summary.total_purchase_cost);

  const cards = [
    {
      label: '收入',
      value: formatMetricValue(summary.total_revenue, formatCurrency),
      color: 'teal.7',
      borderColor: 'var(--mantine-color-teal-2)',
    },
    {
      label: '采购成本',
      value: formatMetricValue(summary.total_purchase_cost, formatCurrency),
      color: undefined,
      borderColor: undefined,
    },
    {
      label: '销售成本',
      value: formatMetricValue(summary.total_cogs, formatCurrency),
      color: undefined,
      borderColor: undefined,
    },
    {
      label: '利润',
      value: formatMetricValue(summary.profit, formatCurrency),
      color: toSafeNumber(summary.profit) >= 0 ? 'green.7' : 'red.7',
      borderColor:
        toSafeNumber(summary.profit) >= 0
          ? 'var(--mantine-color-green-2)'
          : 'var(--mantine-color-red-2)',
    },
    {
      label: '利润率',
      value: formatMetricValue(summary.profit_margin, formatPercentage),
      color: toSafeNumber(summary.profit_margin) >= 0 ? 'green.7' : 'red.7',
      borderColor:
        toSafeNumber(summary.profit_margin) >= 0
          ? 'var(--mantine-color-green-2)'
          : 'var(--mantine-color-red-2)',
    },
    {
      label: '采购数量',
      value: formatMetricValue(summary.quantity_purchased, (value) => formatNumber(value, 4)),
      color: undefined,
      borderColor: undefined,
    },
    {
      label: '销售数量',
      value: formatMetricValue(summary.quantity_sold, (value) => formatNumber(value, 4)),
      color: undefined,
      borderColor: undefined,
    },
    {
      label: '余额',
      value: formatCurrency(balance),
      color: getSignedMetricColor(balance),
      borderColor: getSignedMetricBorderColor(balance),
    },
  ];

  return (
    <Paper
      withBorder
      radius="md"
      p="lg"
      style={
        isSticky
          ? {
              position: 'sticky',
              top: 16,
              zIndex: 10,
              backgroundColor: 'var(--mantine-color-body)',
            }
          : undefined
      }
    >
      <Stack gap="lg">
        <Stack gap={2}>
          <Text fw={700} size="lg">
            {title}
          </Text>
          {subtitle ? (
            <Text size="sm" c="dimmed">
              {subtitle}
            </Text>
          ) : null}
          {isRefreshing ? (
            <Text size="xs" c="dimmed">
              正在更新已选项目汇总…
            </Text>
          ) : null}
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          {cards.map((card) => (
            <Paper
              key={card.label}
              withBorder
              radius="md"
              p="md"
              style={card.borderColor ? { borderColor: card.borderColor } : undefined}
            >
              <Stack gap={4}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {card.label}
                </Text>
                <Text fw={700} size="xl" c={card.color}>
                  {card.value}
                </Text>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
};
