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

export const formatCurrency = (value: number | string | null | undefined): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'USD',
  }).format(toSafeNumber(value));
};

export const formatNumber = (
  value: number | string | null | undefined,
  decimals = 2
): string => {
  return toSafeNumber(value)
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatPercentage = (
  value: number | string | null | undefined,
  decimals = 2
): string => {
  return `${toSafeNumber(value).toFixed(decimals)}%`;
};

export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[^\d.-]/g, ''));
};

export const formatUnit = (unit: string): string =>
  ({ kg: '千克', g: '克', L: '升', mL: '毫升', unit: '件' } as Record<string, string>)[unit] ?? unit;
