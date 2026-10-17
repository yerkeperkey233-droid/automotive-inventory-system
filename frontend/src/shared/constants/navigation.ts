import {
  type TablerIconsProps,
  IconCurrencyDollar,
  IconDashboard,
  IconPackage,
  IconPackages,
  IconUsers,
  IconShoppingCart,
  IconTrendingUp,
} from '@tabler/icons-react';
import { ROUTES } from '@/app/router/route-paths';
import type { FunctionComponent } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: FunctionComponent<TablerIconsProps>;
  superuserOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: '工作台', href: ROUTES.dashboard, icon: IconDashboard },
  { label: '商品管理', href: ROUTES.products, icon: IconPackage },
  { label: '库存管理', href: ROUTES.stocks, icon: IconPackages },
  {
    label: '采购订单',
    href: ROUTES.purchaseOrders,
    icon: IconShoppingCart,
  },
  { label: '销售订单', href: ROUTES.salesOrders, icon: IconTrendingUp },
  { label: '财务分析', href: ROUTES.financial, icon: IconCurrencyDollar },
  { label: '用户管理', href: ROUTES.managerUsers, icon: IconUsers, superuserOnly: true },
];
