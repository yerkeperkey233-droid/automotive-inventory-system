import React, { useState } from 'react';
import { useForm } from '@mantine/form';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Container,
  Grid,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { ROUTES } from '@/app/router/route-paths';
import { ErrorState } from '@components/ui/ErrorState';
import { LoadingState } from '@components/ui/LoadingState';
import { formatCurrency, formatNumber } from '@shared/utils/formatting';
import { useProduct } from '@/features/products/products.hooks';
import { useSalesOrderItems } from '@/features/sales-orders/salesOrders.hooks';
import { getErrorMessage } from '@shared/utils/errors';
import type { StockEntry } from '../stock.types';
import {
  useCreateStockAllocation,
  useCreateStockEntry,
  useDeleteStockEntry,
  useStockAllocations,
  useStocks,
} from '../stocks.hooks';
import { StockAllocationsByProductCard } from '../components/list/StockAllocationsByProductCard';
import { StockEntriesByProductCard } from '../components/list/StockEntriesByProductCard';

const StockMetric: React.FC<{ label: string; value: string; valueColor?: string }> = ({
  label,
  value,
  valueColor,
}) => (
  <Stack gap={4} align="center">
    <Text size="sm" c="dimmed" fw={500}>
      {label}
    </Text>
    <Text fw={700} size="lg" ta="center" c={valueColor}>
      {value}
    </Text>
  </Stack>
);

const StockDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = id ? parseInt(id, 10) : null;
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    entry: StockEntry | null;
  }>({
    isOpen: false,
    entry: null,
  });
  const [stockEntryModalOpen, setStockEntryModalOpen] = useState(false);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [allocationEntryId, setAllocationEntryId] = useState<string | null>(null);
  const [allocationType, setAllocationType] = useState<'sale' | 'expired' | 'other'>('other');
  const [allocationQuantity, setAllocationQuantity] = useState<number | string>(0);
  const [allocationNotes, setAllocationNotes] = useState('');
  const [salesOrderItemId, setSalesOrderItemId] = useState<string | null>(null);
  const [allocationError, setAllocationError] = useState<string | null>(null);

  const productQuery = useProduct(productId);
  const stockEntriesQuery = useStocks({
    product: productId || undefined,
    ordering: '-received_at',
  });
  const stockAllocationsQuery = useStockAllocations({
    product: productId || undefined,
  });
  const deleteMutation = useDeleteStockEntry();
  const createStockEntryMutation = useCreateStockEntry();
  const createAllocationMutation = useCreateStockAllocation();
  const salesOrderItemsQuery = useSalesOrderItems({
    product: productId || undefined,
    status: 'draft,confirmed',
  });
  const stockEntryForm = useForm({
    initialValues: {
      quantity_received: 0,
      received_at: new Date().toISOString().split('T')[0],
      expiration_date: '',
    },
    validate: {
      quantity_received: (value: number) =>
        value <= 0 ? '数量必须大于 0' : null,
      received_at: (value: string) =>
        value.length === 0 ? '请选择入库日期' : null,
    },
  });

  const handleDeleteConfirm = async () => {
    if (!deleteModal.entry) return;

    try {
      await deleteMutation.mutateAsync(deleteModal.entry.id);
      setDeleteModal({ isOpen: false, entry: null });
    } catch (error) {
      console.error('删除入库记录失败', error);
    }
  };

  const resetAllocationModal = () => {
    setAllocationModalOpen(false);
    setAllocationEntryId(null);
    setAllocationType('other');
    setAllocationQuantity(0);
    setAllocationNotes('');
    setSalesOrderItemId(null);
    setAllocationError(null);
  };

  const resetStockEntryModal = () => {
    setStockEntryModalOpen(false);
    stockEntryForm.reset();
    stockEntryForm.setFieldValue('received_at', new Date().toISOString().split('T')[0]);
  };

  if (productQuery.isLoading || stockEntriesQuery.isLoading || stockAllocationsQuery.isLoading) {
    return <LoadingState message="正在加载库存详情…" />;
  }

  if (productQuery.isError || stockEntriesQuery.isError || stockAllocationsQuery.isError || !productQuery.data) {
    return (
      <ErrorState
        message="加载库存详情失败"
        onRetry={() => {
          productQuery.refetch();
          stockEntriesQuery.refetch();
          stockAllocationsQuery.refetch();
        }}
      />
    );
  }

  const product = productQuery.data;
  const entries = stockEntriesQuery.data?.results || [];
  const allocations = stockAllocationsQuery.data?.results || [];
  const quantityDecimals = product.base_unit === 'unit' ? 0 : 2;
  const availableEntries = entries.filter((entry) => Number(entry.quantity_available) > 0);
  const selectedEntry = availableEntries.find((entry) => String(entry.id) === allocationEntryId);
  const salesOrderItems = salesOrderItemsQuery.data?.results || [];
  const salesAllocationOptions = salesOrderItems
    .map((item) => {
      const allocatedTotal = (item.allocations || [])
        .filter((allocation) => allocation.type === 'sale')
        .reduce((sum, allocation) => sum + Number(allocation.quantity_allocated), 0);
      const remainingQuantity = Number(item.quantity) - allocatedTotal;

      return {
        value: String(item.id),
        label: `${item.sales_order_code || `订单 #${item.sales_order}`} · ${item.product_name || product.name} · 剩余数量 ${formatNumber(remainingQuantity, quantityDecimals)}`,
        remainingQuantity,
      };
    })
    .filter((item) => item.remainingQuantity > 0.0001);

  const handleCreateAllocation = async () => {
    if (!allocationEntryId) {
      setAllocationError('请选择入库记录。');
      return;
    }

    const numericQuantity =
      typeof allocationQuantity === 'number' ? allocationQuantity : Number(allocationQuantity);
    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      setAllocationError('数量必须大于 0。');
      return;
    }

    if (!selectedEntry) {
      setAllocationError('请选择有效的入库记录。');
      return;
    }

    if (numericQuantity - Number(selectedEntry.quantity_available) > 0.0001) {
      setAllocationError(
        `数量不能超过所选入库记录的可用数量 ${formatNumber(selectedEntry.quantity_available, quantityDecimals)}。`
      );
      return;
    }

    const payload = {
      stock_entry: selectedEntry.id,
      quantity_allocated: numericQuantity,
      type: allocationType,
      notes: allocationNotes.trim() || null,
      sales_order_item:
        allocationType === 'sale' && salesOrderItemId ? Number(salesOrderItemId) : null,
    };

    if (allocationType === 'sale') {
      if (!salesOrderItemId) {
        setAllocationError('销售出库分配必须关联销售订单明细。');
        return;
      }

      const selectedSalesOption = salesAllocationOptions.find((item) => item.value === salesOrderItemId);
      if (!selectedSalesOption) {
        setAllocationError('请选择有效的销售订单明细。');
        return;
      }

      if (numericQuantity - selectedSalesOption.remainingQuantity > 0.0001) {
        setAllocationError(
          `数量不能超过所选销售订单明细的剩余数量 ${formatNumber(selectedSalesOption.remainingQuantity, quantityDecimals)}。`
        );
        return;
      }
    }

    try {
      await createAllocationMutation.mutateAsync(payload);
      resetAllocationModal();
    } catch (error) {
      setAllocationError(getErrorMessage(error));
    }
  };

  const handleCreateStockEntry = async (values: typeof stockEntryForm.values) => {
    if (!productId) {
      return;
    }

    try {
      await createStockEntryMutation.mutateAsync({
        product: productId,
        quantity_received: values.quantity_received,
        source_type: 'manual',
        received_at: values.received_at,
        expiration_date: values.expiration_date || undefined,
      });
      resetStockEntryModal();
    } catch (error) {
      console.error('创建入库记录失败', error);
    }
  };

  return (
    <Container fluid px="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap={0}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>库存详情</h1>
            <Text size="sm" c="dimmed">
              {product.name} ({product.sku})
            </Text>
          </Stack>
          <Group>
            <Button
              onClick={() => setAllocationModalOpen(true)}
              disabled={availableEntries.length === 0}
            >
              新增库存分配
            </Button>
            <Button variant="light" color="teal" onClick={() => setStockEntryModalOpen(true)}>
              新增入库记录
            </Button>
            <Button variant="light" color="blue" onClick={() => navigate(ROUTES.stocks)}>
              返回
            </Button>
          </Group>
        </Group>

        <Paper p="lg" radius="md" withBorder>
          <Stack gap="lg">
            <Group justify="space-between">
              <Stack gap={0}>
                <Text fw={700} size="lg">
                  商品库存汇总
                </Text>
                {/* <Text size="sm" c="dimmed">
                  该商品的当前库存情况
                </Text> */}
              </Stack>
            </Group>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <StockMetric
                  label="库存数量"
                  value={formatNumber(product.available_quantity, quantityDecimals)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <StockMetric
                  label="库存金额"
                  value={formatCurrency(product.total_inventory_value)}
                  valueColor="blue.7"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <StockMetric
                  label="库存分配"
                  value={String(allocations.length)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <StockMetric label="入库记录" value={String(entries.length)} />
              </Grid.Col>
            </Grid>
          </Stack>
        </Paper>

        <StockEntriesByProductCard
          entries={entries}
          onEdit={(entry: StockEntry) => navigate(ROUTES.stockEntryEdit(entry.id))}
          onDelete={(entry: StockEntry) => setDeleteModal({ isOpen: true, entry })}
        />

        <StockAllocationsByProductCard
          allocations={allocations}
          entries={entries}
          quantityDecimals={quantityDecimals}
        />

        <Modal
          opened={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, entry: null })}
          title="删除入库记录"
          centered
        >
          <Stack>
            <Text>
              确定删除该入库记录吗？此操作无法撤销。
            </Text>
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => setDeleteModal({ isOpen: false, entry: null })}
              >
                取消
              </Button>
              <Button
                color="red"
                loading={deleteMutation.isPending}
                onClick={handleDeleteConfirm}
              >
                删除
              </Button>
            </Group>
          </Stack>
        </Modal>

        <Modal
          opened={stockEntryModalOpen}
          onClose={resetStockEntryModal}
          title="新增入库记录"
          centered
        >
          <form onSubmit={stockEntryForm.onSubmit(handleCreateStockEntry)}>
            <Stack gap="md">
              {createStockEntryMutation.error ? (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                  {getErrorMessage(createStockEntryMutation.error)}
                </Alert>
              ) : null}

              <Stack gap={4}>
                <Text size="sm" fw={500}>
                  商品
                </Text>
                <Text size="sm" c="dimmed">
                  {product.name} ({product.sku})
                </Text>
              </Stack>

              <NumberInput
                label="入库数量"
                min={1}
                decimalScale={quantityDecimals}
                step={quantityDecimals === 0 ? 1 : 0.01}
                {...stockEntryForm.getInputProps('quantity_received')}
                disabled={createStockEntryMutation.isPending}
                required
              />

              <TextInput
                label="入库日期"
                type="date"
                {...stockEntryForm.getInputProps('received_at')}
                disabled={createStockEntryMutation.isPending}
                required
              />

              <TextInput
                label="有效期截止日期（选填）"
                type="date"
                {...stockEntryForm.getInputProps('expiration_date')}
                disabled={createStockEntryMutation.isPending}
              />

              <Group justify="flex-end">
                <Button
                  variant="light"
                  onClick={resetStockEntryModal}
                  disabled={createStockEntryMutation.isPending}
                >
                  取消
                </Button>
                <Button type="submit" loading={createStockEntryMutation.isPending}>
                  创建入库记录
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        <Modal
          opened={allocationModalOpen}
          onClose={resetAllocationModal}
          title="新增库存分配"
          centered
        >
          <Stack gap="md">
            {allocationError ? (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                {allocationError}
              </Alert>
            ) : null}

            {availableEntries.length === 0 ? (
              <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light">
                请先新增库存，再创建分配。
              </Alert>
            ) : (
              <>
                <Select
                  label="入库记录"
                  placeholder="请选择入库记录"
                  data={availableEntries.map((entry) => ({
                    value: String(entry.id),
                    label: `${entry.stock_identifier} · 可用数量 ${formatNumber(entry.quantity_available, quantityDecimals)}`,
                  }))}
                  value={allocationEntryId}
                  onChange={(value) => setAllocationEntryId(value)}
                  disabled={createAllocationMutation.isPending}
                  searchable
                  required
                />

                <Select
                  label="类型"
                  data={[
                    { value: 'sale', label: '销售出库' },
                    { value: 'expired', label: '过期损耗' },
                    { value: 'other', label: '其他' },
                  ]}
                  value={allocationType}
                  onChange={(value) => {
                    if (!value) return;
                    setAllocationType(value as 'sale' | 'expired' | 'other');
                    if (value !== 'sale') {
                      setSalesOrderItemId(null);
                    }
                  }}
                  disabled={createAllocationMutation.isPending}
                  required
                />

                {allocationType === 'sale' ? (
                  <Select
                    label="销售订单明细"
                    placeholder="请选择销售订单明细"
                    data={salesAllocationOptions}
                    value={salesOrderItemId}
                    onChange={(value) => setSalesOrderItemId(value)}
                    disabled={createAllocationMutation.isPending || salesOrderItemsQuery.isLoading}
                    searchable
                    required
                  />
                ) : null}

                <NumberInput
                  label="数量"
                  value={allocationQuantity}
                  onChange={setAllocationQuantity}
                  min={0}
                  max={selectedEntry ? Number(selectedEntry.quantity_available) : undefined}
                  decimalScale={quantityDecimals}
                  step={quantityDecimals === 0 ? 1 : 0.01}
                  disabled={createAllocationMutation.isPending}
                  required
                />

                <Textarea
                  label="备注"
                  value={allocationNotes}
                  onChange={(event) => setAllocationNotes(event.currentTarget.value)}
                  minRows={3}
                  autosize
                  disabled={createAllocationMutation.isPending}
                />

                <Group justify="flex-end">
                  <Button
                    variant="light"
                    onClick={resetAllocationModal}
                    disabled={createAllocationMutation.isPending}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleCreateAllocation}
                    loading={createAllocationMutation.isPending}
                  >
                    创建分配
                  </Button>
                </Group>
              </>
            )}
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
};

export default StockDetailsPage;
