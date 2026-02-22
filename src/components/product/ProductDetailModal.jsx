import {
  Button,
  Collapse,
  Divider,
  Modal,
  Row,
  Col,
  Space,
  Table,
  Tag,
  Typography,
  Empty,
  Rate,
} from 'antd';
import dayjs from 'dayjs';
import GIcon from '@/components/GIcon';

const { Text } = Typography;

// Component hiển thị hàng thông tin
const InfoRow = ({ label, value, icon }) => (
  <Row gutter={[16, 8]} align="middle" style={{ marginBottom: 8 }}>
    <Col span={8}>
      <Text strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <GIcon name={icon} />}
        {label}:
      </Text>
    </Col>
    <Col span={16}>
      <div style={{ wordBreak: 'break-word' }}>
        {value || <span style={{ color: '#999' }}>Chưa cập nhật</span>}
      </div>
    </Col>
  </Row>
);

// Modal hiển thị chi tiết sản phẩm
export default function ProductDetailModal({ open, product, onClose, onEdit }) {
  if (!product) return null;

  // Cấu hình hiển thị trạng thái
  const getStatusTag = (status) => {
    const statusMap = {
      available: { color: 'success', label: 'Có sẵn' },
      unavailable: { color: 'warning', label: 'Không có sẵn' },
      out_of_stock: { color: 'error', label: 'Hết hàng' },
      hidden: { color: 'default', label: 'Ẩn' },
    };
    const config = statusMap[status] || statusMap.available;
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  // Cấu hình các section trong Collapse
  const collapseItems = [
    {
      key: '1',
      label: (
        <Space>
          <GIcon name="shopping_bag" />
          <span>Thông tin cơ bản</span>
        </Space>
      ),
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <InfoRow label="Tên sản phẩm" value={product.name} icon="label" />
          <InfoRow
            label="Căng tin"
            value={product.canteenId?.name || 'N/A'}
            icon="store"
          />
          <InfoRow
            label="Danh mục"
            value={product.categoryId?.name || 'N/A'}
            icon="category"
          />
          <InfoRow label="Slug" value={product.slug || 'N/A'} />
          <InfoRow label="Mô tả" value={product.description || 'Chưa có'} />
          <InfoRow
            label="Trạng thái"
            value={getStatusTag(product.status)}
            icon="check_circle"
          />
        </Space>
      ),
    },
    {
      key: '2',
      label: (
        <Space>
          <GIcon name="attach_money" />
          <span>Giá & Doanh số</span>
        </Space>
      ),
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <InfoRow
            label="Giá hiện tại"
            value={`${product.price?.toLocaleString('vi-VN')} đ`}
            icon="sell"
          />
          {product.originalPrice && (
            <>
              <InfoRow
                label="Giá gốc"
                value={`${product.originalPrice?.toLocaleString('vi-VN')} đ`}
              />
              <InfoRow
                label="Giảm giá"
                value={`${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%`}
              />
            </>
          )}
          <Divider style={{ margin: '8px 0' }} />
          <InfoRow
            label="Tổng đã bán"
            value={`${product.totalSold || 0} đơn`}
            icon="shopping_cart"
          />
          {product.rating?.count > 0 && (
            <InfoRow
              label="Đánh giá"
              value={
                <Space>
                  <Rate
                    disabled
                    value={product.rating?.average || 0}
                    style={{ fontSize: 14 }}
                  />
                  <span style={{ color: '#666', fontSize: 12 }}>
                    ({product.rating?.average?.toFixed(1)}/5 từ{' '}
                    {product.rating?.count} đánh giá)
                  </span>
                </Space>
              }
            />
          )}
        </Space>
      ),
    },
    {
      key: '3',
      label: (
        <Space>
          <GIcon name="warehouse" />
          <span>Kho hàng</span>
        </Space>
      ),
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <InfoRow
            label="Số lượng tồn kho"
            value={
              <Tag color={product.stockQuantity > 0 ? 'green' : 'red'}>
                {product.stockQuantity}
              </Tag>
            }
            icon="inventory_2"
          />
          <InfoRow
            label="Ngưỡng cảnh báo"
            value={`${product.lowStockThreshold}`}
          />
          {product.stockQuantity > 0 &&
            product.stockQuantity <= product.lowStockThreshold && (
              <div
                style={{
                  padding: '8px 12px',
                  background: '#fff7e6',
                  borderRadius: 4,
                  color: '#ad6800',
                }}
              >
                <GIcon name="warning" style={{ marginRight: 6 }} />
                Sắp hết hàng
              </div>
            )}
          {product.stockQuantity === 0 && (
            <div
              style={{
                padding: '8px 12px',
                background: '#fff1f0',
                borderRadius: 4,
                color: '#c5192d',
              }}
            >
              <GIcon name="error" style={{ marginRight: 6 }} />
              Đã hết hàng
            </div>
          )}
        </Space>
      ),
    },
    {
      key: '4',
      label: (
        <Space>
          <GIcon name="restaurant" />
          <span>Công thức nấu ({product.recipe?.length || 0} nguyên liệu)</span>
        </Space>
      ),
      children:
        product.recipe && product.recipe.length > 0 ? (
          <Table
            dataSource={product.recipe}
            columns={[
              {
                title: 'Nguyên liệu',
                dataIndex: 'ingredientName',
                key: 'ingredientName',
                render: (text) => text || 'N/A',
              },
              {
                title: 'Số lượng',
                key: 'quantity',
                render: (_, record) => `${record.quantity} ${record.unit}`,
                align: 'center',
              },
            ]}
            rowKey={(record, index) => record.ingredientId || index}
            pagination={false}
            size="small"
          />
        ) : (
          <Empty description="Không có công thức" />
        ),
    },
    {
      key: '5',
      label: (
        <Space>
          <GIcon name="image" />
          <span>Hình ảnh ({product.images?.length || 0} ảnh)</span>
        </Space>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {product.image && (
            <div>
              <Text strong>Ảnh chính:</Text>
              <img
                src={product.image}
                alt="product-main"
                style={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  marginTop: 8,
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
                onClick={() => window.open(product.image, '_blank')}
              />
            </div>
          )}
          {product.images && product.images.length > 0 && (
            <div>
              <Text strong>Hình ảnh phụ:</Text>
              <Row gutter={[12, 12]} style={{ marginTop: 8 }}>
                {product.images.map((img, index) => (
                  <Col key={index} xs={12} sm={8} md={6}>
                    <img
                      src={img}
                      alt={`product-${index}`}
                      style={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                      onClick={() => window.open(img, '_blank')}
                    />
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Space>
      ),
    },
    {
      key: '6',
      label: (
        <Space>
          <GIcon name="local_fire_department" />
          <span>Dinh dưỡng & Thời gian</span>
        </Space>
      ),
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <InfoRow
            label="Calo"
            value={
              product.calories ? `${product.calories} kcal` : 'Chưa cập nhật'
            }
            icon="local_fire_department"
          />
          <InfoRow
            label="Thời gian chuẩn bị"
            value={
              product.preparationTime
                ? `${product.preparationTime} phút`
                : 'Chưa cập nhật'
            }
            icon="schedule"
          />
        </Space>
      ),
    },
    {
      key: '7',
      label: (
        <Space>
          <GIcon name="flag" />
          <span>Trạng thái đặc biệt</span>
        </Space>
      ),
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Space>
              <Text strong>Phổ biến:</Text>
              <Tag color={product.isPopular ? 'blue' : 'default'}>
                {product.isPopular ? 'Có' : 'Không'}
              </Tag>
            </Space>
          </div>
          <div>
            <Space>
              <Text strong>Sản phẩm mới:</Text>
              <Tag color={product.isNew ? 'green' : 'default'}>
                {product.isNew ? 'Có' : 'Không'}
              </Tag>
            </Space>
          </div>
          <InfoRow label="Thứ tự hiển thị" value={product.displayOrder || 0} />
        </Space>
      ),
    },
    {
      key: '8',
      label: (
        <Space>
          <GIcon name="access_time" />
          <span>Thông tin hệ thống</span>
        </Space>
      ),
      children: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <InfoRow label="ID sản phẩm" value={product._id} />
          <InfoRow
            label="Ngày tạo"
            value={dayjs(product.createdAt).format('DD/MM/YYYY HH:mm')}
          />
          <InfoRow
            label="Cập nhật lần cuối"
            value={dayjs(product.updatedAt).format('DD/MM/YYYY HH:mm')}
          />
          {product.isDeleted && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <div
                style={{
                  padding: '8px 12px',
                  background: '#fff1f0',
                  borderRadius: 4,
                  color: '#c5192d',
                }}
              >
                <GIcon name="delete" style={{ marginRight: 6 }} />
                Xóa lần cuối:{' '}
                {dayjs(product.deletedAt).format('DD/MM/YYYY HH:mm')}
              </div>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
        <Button
          key="edit"
          type="primary"
          icon={<GIcon name="edit" />}
          onClick={() => {
            onClose();
            onEdit(product);
          }}
        >
          Chỉnh sửa
        </Button>,
      ]}
      title={
        <Space>
          <GIcon name="shopping_bag" />
          <span>Chi tiết sản phẩm</span>
        </Space>
      }
      width={900}
      style={{ maxHeight: '90vh' }}
      bodyStyle={{ maxHeight: 'calc(90vh - 160px)', overflowY: 'auto' }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Collapse các section thông tin */}
        <Collapse items={collapseItems} defaultActiveKey={['1', '2', '3']} />
      </Space>
    </Modal>
  );
}
