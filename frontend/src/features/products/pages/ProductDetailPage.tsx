import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  Button,
  Container,
  Grid,
  Group,
  Modal,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { ROUTES } from '@/app/router/route-paths';
import { ErrorState } from '@components/ui/ErrorState';
import { LoadingState } from '@components/ui/LoadingState';
import { ProductInventoryCard } from '../components/detail/ProductInventoryCard';
import { ProductInfoCard } from '../components/detail/ProductInfoCard';
import { ProductHeader } from '../components/shared/ProductHeader';
import { useDeleteProduct, useProduct } from '../products.hooks';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = id ? parseInt(id, 10) : null;
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const query = useProduct(productId);
  const deleteMutation = useDeleteProduct();

  const handleDelete = async () => {
    if (productId) {
      try {
        await deleteMutation.mutateAsync(productId);
        navigate(ROUTES.products);
      } catch (error) {
        console.error('删除失败：', error);
      }
    }
  };

  if (query.isLoading) {
    return <LoadingState message="正在加载商品…" />;
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        message="加载商品失败"
        onRetry={() => query.refetch()}
      />
    );
  }

  const product = query.data;

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <ProductHeader
          title={product.name}
          subtitle={`商品编码：${product.sku}`}
          actions={
            <Group>
              <Tooltip label="编辑商品">
                <ActionIcon
                  size="lg"
                  variant="light"
                  color="blue"
                  onClick={() => navigate(ROUTES.productEdit(product.id))}
                >
                  <IconPencil size={20} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="删除商品">
                <ActionIcon
                  size="lg"
                  variant="light"
                  color="red"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <IconTrash size={20} />
                </ActionIcon>
              </Tooltip>
              <Button variant="light" onClick={() => navigate(ROUTES.products)}>
                返回
              </Button>
            </Group>
          }
        />

        <Grid>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <ProductInfoCard product={product} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <ProductInventoryCard product={product} />
          </Grid.Col>
        </Grid>

        <Modal
          opened={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="删除商品"
          centered
        >
          <Stack>
            <Text>
              确定删除该商品吗？此操作无法撤销。
            </Text>
            <Group justify="flex-end">
              <Button variant="light" onClick={() => setShowDeleteModal(false)}>
                取消
              </Button>
              <Button
                color="red"
                loading={deleteMutation.isPending}
                onClick={handleDelete}
              >
                删除
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
};

export default ProductDetailPage;
