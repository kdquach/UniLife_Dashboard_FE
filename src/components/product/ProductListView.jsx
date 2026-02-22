import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Dropdown,
  Input,
  Modal,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import GIcon from '@/components/GIcon';

const { Title, Text } = Typography;

// Cấu hình trạng thái sản phẩm
const STATUS_CONFIG = {
  available: { color: 'success', label: 'Có sẵn' },
  unavailable: { color: 'warning', label: 'Không có sẵn' },
  out_of_stock: { color: 'error', label: 'Hết hàng' },
  hidden: { color: 'default', label: 'Ẩn' },
};

// Component hiển thị danh sách sản phẩm với bộ lọc
export default function ProductListView({
  loading,
  items,
  pagination,
  searchText,
  filterStatus,
  viewMode,
  onSearchChange,
  onFilterChange,
  onViewModeChange,
  onSearch,
  onPaginationChange,
  onAdd,
  onView,
  onEdit,
  onDelete,
  onRestore,
}) {
  // State cho modal hướng dẫn
  const [guideOpen, setGuideOpen] = useState(false);

  // Cấu hình cột bảng
  const columns = useMemo(
    () => [
      {
        title: 'Ảnh',
        dataIndex: 'image',
        key: 'image',
        width: 80,
        render: (image) => (
          <img
            src={image || 'https://via.placeholder.com/80'}
            alt="product"
            style={{
              width: 50,
              height: 50,
              objectFit: 'cover',
              borderRadius: 4,
            }}
          />
        ),
      },
      {
        title: 'Tên sản phẩm',
        dataIndex: 'name',
        key: 'name',
        width: 200,
        sorter: (a, b) => a.name.localeCompare(b.name),
      },
      {
        title: 'Danh mục',
        dataIndex: ['categoryId', 'name'],
        key: 'categoryId',
        width: 130,
      },
      {
        title: 'Giá',
        dataIndex: 'price',
        key: 'price',
        width: 100,
        align: 'right',
        render: (price) => `${price?.toLocaleString('vi-VN')} đ`,
        sorter: (a, b) => a.price - b.price,
      },
      {
        title: 'Số lượng',
        dataIndex: 'stockQuantity',
        key: 'stockQuantity',
        width: 100,
        align: 'center',
        render: (qty) => <Tag color={qty > 0 ? 'green' : 'red'}>{qty}</Tag>,
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        align: 'center',
        render: (status) => {
          const config = STATUS_CONFIG[status] || STATUS_CONFIG.available;
          return <Tag color={config.color}>{config.label}</Tag>;
        },
        filters: [
          { text: 'Có sẵn', value: 'available' },
          { text: 'Không có sẵn', value: 'unavailable' },
          { text: 'Hết hàng', value: 'out_of_stock' },
          { text: 'Ẩn', value: 'hidden' },
        ],
        onFilter: (value, record) => record.status === value,
      },
      {
        title: 'Ngày tạo',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 160,
        render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
        sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      },
      {
        title: 'Hành động',
        key: 'actions',
        width: 100,
        align: 'center',
        render: (_, record) => (
          <Dropdown
            menu={{
              items:
                viewMode === 'active'
                  ? [
                      {
                        key: 'view',
                        label: 'Xem chi tiết',
                        icon: <GIcon name="visibility" />,
                        onClick: () => onView(record),
                      },
                      {
                        key: 'edit',
                        label: 'Chỉnh sửa',
                        icon: <GIcon name="edit" />,
                        onClick: () => onEdit(record),
                      },
                      {
                        type: 'divider',
                      },
                      {
                        key: 'delete',
                        label: 'Xóa',
                        icon: <GIcon name="delete_outline" />,
                        danger: true,
                        onClick: () => onDelete(record),
                      },
                    ]
                  : [
                      {
                        key: 'view',
                        label: 'Xem chi tiết',
                        icon: <GIcon name="visibility" />,
                        onClick: () => onView(record),
                      },
                      {
                        key: 'restore',
                        label: 'Khôi phục',
                        icon: <GIcon name="restore" />,
                        onClick: () => onRestore(record),
                      },
                    ],
            }}
            trigger={['click']}
          >
            <Button
              type="text"
              style={{ color: 'var(--text-muted)' }}
              icon={<GIcon name="more_vert" />}
            />
          </Dropdown>
        ),
      },
    ],
    [viewMode, onView, onEdit, onDelete, onRestore]
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header */}
      <Card>
        <Space
          style={{
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            Quản lý sản phẩm
          </Title>
          <Button type="primary" icon={<GIcon name="add" />} onClick={onAdd}>
            Thêm sản phẩm
          </Button>
        </Space>
      </Card>

      {/* Bộ lọc */}
      <Card>
        <Space size="large" style={{ width: '100%', flexWrap: 'wrap' }}>
          <Segmented
            value={viewMode}
            onChange={onViewModeChange}
            style={{
              background: viewMode === 'active' ? '#e6f7ff' : '#fff1f0',
              border:
                viewMode === 'active'
                  ? '1px solid #91d5ff'
                  : '1px solid #ffccc7',
              padding: '2px',
            }}
            options={[
              {
                label: 'Đang hoạt động',
                value: 'active',
                icon: <GIcon name="visibility" />,
              },
              {
                label: 'Đã xóa',
                value: 'deleted',
                icon: <GIcon name="delete_outline" />,
              },
            ]}
          />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            prefix={<GIcon name="search" />}
            style={{ width: 250 }}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            onPressEnter={onSearch}
            allowClear
          />
          {viewMode === 'active' && (
            <Segmented
              value={filterStatus}
              onChange={onFilterChange}
              options={[
                { label: 'Tất cả', value: 'all' },
                { label: 'Có sẵn', value: 'available' },
                { label: 'Không có sẵn', value: 'unavailable' },
                { label: 'Hết hàng', value: 'out_of_stock' },
                { label: 'Ẩn', value: 'hidden' },
              ]}
            />
          )}
          <Button
            type="primary"
            ghost
            icon={<GIcon name="search" />}
            onClick={onSearch}
          >
            Tìm kiếm
          </Button>
          <Button
            icon={<GIcon name="help_outline" />}
            onClick={() => setGuideOpen(true)}
            title="Xem hướng dẫn filter"
          ></Button>
        </Space>
      </Card>

      {/* Bảng dữ liệu */}
      <Card>
        <Table
          loading={loading}
          dataSource={items}
          columns={columns}
          rowKey="_id"
          scroll={{ x: true }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} sản phẩm`,
            onChange: onPaginationChange,
          }}
        />
      </Card>

      {/* Modal hướng dẫn filter */}
      <Modal
        open={guideOpen}
        onCancel={() => setGuideOpen(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setGuideOpen(false)}
          >
            Đã hiểu
          </Button>,
        ]}
        title={
          <Space>
            <GIcon name="help_outline" />
            <span>Hướng dẫn bộ lọc trạng thái</span>
          </Space>
        }
        width={700}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Title level={5} style={{ marginTop: 0 }}>
              Ý nghĩa các trạng thái:
            </Title>
          </div>

          <div style={{ paddingLeft: 16 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Tất cả */}
              <div>
                <Space align="start">
                  <Tag color="blue" style={{ marginTop: 4 }}>
                    Tất cả
                  </Tag>
                  <div>
                    <Text strong>Hiển thị tất cả sản phẩm</Text>
                    <div style={{ color: '#666', marginTop: 4 }}>
                      • Xem toàn bộ danh sách không phân biệt trạng thái
                      <br />• Dùng để quản lý tổng thể sản phẩm
                    </div>
                  </div>
                </Space>
              </div>

              {/* Có sẵn */}
              <div>
                <Space align="start">
                  <Tag color="success" style={{ marginTop: 4 }}>
                    Có sẵn
                  </Tag>
                  <div>
                    <Text strong>Sản phẩm đang bán</Text>
                    <div style={{ color: '#666', marginTop: 4 }}>
                      • Khách hàng có thể đặt mua sản phẩm này
                      <br />• Hiển thị trên app khách hàng
                      <br />• Có đủ nguyên liệu/hàng trong kho
                    </div>
                  </div>
                </Space>
              </div>

              {/* Không có sẵn */}
              <div>
                <Space align="start">
                  <Tag color="warning" style={{ marginTop: 4 }}>
                    Không có sẵn
                  </Tag>
                  <div>
                    <Text strong>Tạm thời không bán</Text>
                    <div style={{ color: '#666', marginTop: 4 }}>
                      • Sản phẩm tạm ngừng kinh doanh
                      <br />• Không hiển thị cho khách hàng
                      <br />• Ví dụ: Món theo mùa, tạm ngừng bán
                    </div>
                  </div>
                </Space>
              </div>

              {/* Hết hàng */}
              <div>
                <Space align="start">
                  <Tag color="error" style={{ marginTop: 4 }}>
                    Hết hàng
                  </Tag>
                  <div>
                    <Text strong>Hết hàng trong kho</Text>
                    <div style={{ color: '#666', marginTop: 4 }}>
                      • Số lượng trong kho = 0
                      <br />• Cần nhập thêm hàng hoặc nguyên liệu
                      <br />• Khách hàng không thể đặt mua
                    </div>
                  </div>
                </Space>
              </div>

              {/* Ẩn */}
              <div>
                <Space align="start">
                  <Tag color="default" style={{ marginTop: 4 }}>
                    Ẩn
                  </Tag>
                  <div>
                    <Text strong>Ẩn khỏi khách hàng</Text>
                    <div style={{ color: '#666', marginTop: 4 }}>
                      • Sản phẩm đang test, chưa muốn bán
                      <br />• Món mới đang chuẩn bị
                      <br />• Chỉ Staff/Admin thấy trong dashboard
                    </div>
                  </div>
                </Space>
              </div>
            </Space>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: '#f0f7ff',
              borderRadius: 8,
            }}
          >
            <Space>
              <GIcon name="info" style={{ color: '#1890ff' }} />
              <Text style={{ color: '#1890ff' }}>
                <strong>Lưu ý:</strong> Trạng thái "Ẩn" khác với "Xóa sản phẩm".
                Sản phẩm ẩn vẫn có thể chỉnh sửa và chuyển về trạng thái khác.
              </Text>
            </Space>
          </div>
        </Space>
      </Modal>
    </Space>
  );
}
