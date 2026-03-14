import { useMemo } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Input,
  List,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import GIcon from '@/components/GIcon';

const { Search } = Input;
const { Title, Text } = Typography;

const PRODUCT_STATUS_CONFIG = {
  available: { color: 'success', label: 'Đang bán' },
  unavailable: { color: 'warning', label: 'Tạm ngưng' },
  out_of_stock: { color: 'error', label: 'Hết hàng' },
  hidden: { color: 'default', label: 'Đang ẩn' },
};

// Component hiển thị danh sách công thức của một sản phẩm
export default function RecipeListView({
  loading,
  products,
  ingredients,
  recipeItems,
  selectedProduct,
  selectedProductId,
  productSearchText,
  onProductSearchTextChange,
  onSearchProducts,
  onSelectProduct,
  onViewRecipeDetail,
  onRefresh,
  onAdd,
  onEdit,
  onDelete,
}) {
  const ingredientMapById = useMemo(() => {
    const source = Array.isArray(ingredients) ? ingredients : [];

    return source.reduce((acc, item) => {
      if (item?._id) {
        acc[String(item._id)] = item;
      }

      return acc;
    }, {});
  }, [ingredients]);

  const productOptions = useMemo(
    () =>
      (products || []).map((item) => ({
        label: item.name,
        value: item._id,
      })),
    [products]
  );

  const selectedStatusConfig =
    PRODUCT_STATUS_CONFIG[selectedProduct?.status] ||
    PRODUCT_STATUS_CONFIG.available;

  const columns = useMemo(
    () => [
      {
        title: 'Nguyên liệu',
        dataIndex: 'ingredientName',
        key: 'ingredientName',
        render: (value) => <strong>{value}</strong>,
      },
      {
        title: 'Số lượng',
        dataIndex: 'quantity',
        key: 'quantity',
        align: 'right',
        width: 120,
        render: (value) => Number(value || 0).toLocaleString('vi-VN'),
      },
      {
        title: 'Đơn vị',
        dataIndex: 'unit',
        key: 'unit',
        align: 'center',
        width: 120,
      },
      {
        title: 'Tồn kho hiện tại',
        key: 'stock',
        align: 'center',
        width: 150,
        render: (_, record) => {
          const ingredientInfo =
            ingredientMapById[String(record.ingredientId)] || null;

          if (!ingredientInfo) {
            return <Tag>Không có dữ liệu</Tag>;
          }

          const isLowStock =
            Number(ingredientInfo.stock || 0) <=
            Number(ingredientInfo.lowStockThreshold || 0);

          return (
            <Tag color={isLowStock ? 'error' : 'success'}>
              {Number(ingredientInfo.stock || 0).toLocaleString('vi-VN')}{' '}
              {ingredientInfo.unit}
            </Tag>
          );
        },
      },
      {
        title: 'Trạng thái',
        key: 'status',
        width: 150,
        align: 'center',
        render: () => <Tag color="processing">Đang áp dụng</Tag>,
      },
      {
        title: 'Hành động',
        key: 'actions',
        width: 150,
        align: 'center',
        render: (_, record) => (
          <Space>
            <Button
              type="text"
              icon={<GIcon name="edit" />}
              onClick={() => onEdit(record)}
            />
            <Button
              type="text"
              danger
              icon={<GIcon name="delete" />}
              onClick={() => onDelete(record)}
            />
          </Space>
        ),
      },
    ],
    [ingredientMapById, onDelete, onEdit]
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Space align="center" size={12}>
            <Avatar
              shape="square"
              size={52}
              style={{
                background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)',
              }}
              icon={<GIcon name="menu_book" />}
            />
            <div>
              <Title level={3} style={{ margin: 0 }}>
                Quản lý công thức món ăn
              </Title>
              <Text type="secondary">
                Chọn món cần cấu hình, sau đó thêm hoặc điều chỉnh định lượng
                nguyên liệu theo đúng công thức bán hàng.
              </Text>
            </div>
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} xl={8}>
          <Card title="Chọn sản phẩm" style={{ height: '100%' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Search
                placeholder="Tìm món theo tên..."
                allowClear
                value={productSearchText}
                onChange={(e) => onProductSearchTextChange(e.target.value)}
                onSearch={onSearchProducts}
                enterButton
              />

              <Select
                showSearch
                placeholder="Chọn nhanh sản phẩm"
                value={selectedProductId || undefined}
                onChange={onSelectProduct}
                options={productOptions}
                style={{ width: '100%' }}
                optionFilterProp="label"
              />

              <Divider style={{ margin: 0 }} />

              <div
                style={{ maxHeight: 480, overflow: 'auto', paddingRight: 4 }}
              >
                <List
                  dataSource={products}
                  locale={{
                    emptyText: (
                      <Empty description="Không có sản phẩm phù hợp" />
                    ),
                  }}
                  renderItem={(item) => {
                    const isSelected = item._id === selectedProductId;
                    const statusConfig =
                      PRODUCT_STATUS_CONFIG[item.status] ||
                      PRODUCT_STATUS_CONFIG.available;

                    return (
                      <List.Item
                        onClick={() => onSelectProduct(item._id)}
                        style={{
                          cursor: 'pointer',
                          padding: 14,
                          marginBottom: 10,
                          borderRadius: 12,
                          border: isSelected
                            ? '1px solid #1677ff'
                            : '1px solid #f0f0f0',
                          background: isSelected ? '#f0f7ff' : '#fff',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Space
                          direction="vertical"
                          size={8}
                          style={{ width: '100%' }}
                        >
                          <Space
                            style={{
                              width: '100%',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                            }}
                          >
                            <Text strong>{item.name}</Text>
                            <Tag color={statusConfig.color}>
                              {statusConfig.label}
                            </Tag>
                          </Space>

                          <Space size={[8, 8]} wrap>
                            {item.categoryId?.name ? (
                              <Tag>{item.categoryId.name}</Tag>
                            ) : null}
                            <Tag color="blue">
                              {Number(item.price || 0).toLocaleString('vi-VN')}{' '}
                              đ
                            </Tag>
                            {Array.isArray(item.recipe) ? (
                              item.recipe.length > 0 ? (
                                <Tag color="green">
                                  {item.recipe.length} nguyên liệu
                                </Tag>
                              ) : (
                                <Tag color="warning">Chưa có công thức</Tag>
                              )
                            ) : (
                              <Tag>Chưa có dữ liệu công thức</Tag>
                            )}
                          </Space>
                        </Space>
                      </List.Item>
                    );
                  }}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={16}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Card>
                  <Statistic
                    title="Món đang cấu hình"
                    value={selectedProduct ? selectedProduct.name : 'Chưa chọn'}
                    valueStyle={{
                      fontSize: selectedProduct ? 20 : 16,
                    }}
                  />
                  {selectedProduct ? (
                    <Space size={[8, 8]} wrap style={{ marginTop: 12 }}>
                      <Tag color={selectedStatusConfig.color}>
                        {selectedStatusConfig.label}
                      </Tag>
                      {selectedProduct.categoryId?.name ? (
                        <Tag>{selectedProduct.categoryId.name}</Tag>
                      ) : null}
                    </Space>
                  ) : null}
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="Số nguyên liệu"
                    value={recipeItems.length}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="Trạng thái"
                    value={selectedProductId ? 'Sẵn sàng' : 'Chờ chọn món'}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Card>
              </Col>
            </Row>

            <Card
              title="Danh sách nguyên liệu trong công thức"
              extra={
                <Space>
                  <Button
                    icon={<GIcon name="visibility" />}
                    onClick={onViewRecipeDetail}
                    disabled={!selectedProductId}
                  >
                    Xem chi tiết công thức
                  </Button>
                  <Button
                    icon={<GIcon name="refresh" />}
                    onClick={onRefresh}
                    disabled={!selectedProductId}
                  >
                    Tải lại
                  </Button>
                  <Button
                    type="primary"
                    icon={<GIcon name="add" />}
                    onClick={onAdd}
                    disabled={!selectedProductId}
                  >
                    Thêm nguyên liệu
                  </Button>
                </Space>
              }
            >
              {selectedProduct ? (
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary">
                    Định lượng dưới đây được dùng để tính tiêu hao nguyên liệu
                    mỗi khi bán món <Text strong>{selectedProduct.name}</Text>.
                  </Text>
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary">
                    Chọn một sản phẩm ở cột bên trái để bắt đầu cấu hình công
                    thức.
                  </Text>
                </div>
              )}

              <Table
                loading={loading}
                columns={columns}
                dataSource={recipeItems}
                rowKey={(record) => String(record.ingredientId)}
                locale={{
                  emptyText: selectedProductId ? (
                    <Empty description="Sản phẩm này chưa có công thức" />
                  ) : (
                    <Empty description="Chưa chọn sản phẩm" />
                  ),
                }}
                pagination={false}
                scroll={{ x: 720 }}
              />
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
