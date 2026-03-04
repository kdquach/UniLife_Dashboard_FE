import { useMemo } from 'react';
import {
  Button,
  Card,
  Dropdown,
  Input,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import GIcon from '@/components/GIcon';

const { Title } = Typography;
const { Search } = Input;

// Component hiển thị danh sách nguyên liệu
export default function IngredientListView({
  loading,
  items,
  pagination,
  searchText,
  onSearchChange,
  onSearch,
  onPaginationChange,
  onAdd,
  onEdit,
  onDelete,
  onUpdateStock,
}) {
  // Cấu hình cột bảng
  const columns = useMemo(
    () => [
      {
        title: 'Tên nguyên liệu',
        dataIndex: 'name',
        key: 'name',
        width: 200,
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (name) => <strong>{name}</strong>,
      },
      {
        title: 'Danh mục',
        dataIndex: ['categoryId', 'name'],
        key: 'categoryId',
        width: 150,
      },
      {
        title: 'Tồn kho',
        dataIndex: 'stock',
        key: 'stock',
        width: 120,
        align: 'right',
        render: (stock, record) => {
          const isLow = stock <= record.lowStockThreshold;
          return (
            <Tag color={isLow ? 'red' : 'green'}>
              {stock} {record.unit}
            </Tag>
          );
        },
        sorter: (a, b) => a.stock - b.stock,
      },
      {
        title: 'Đơn vị',
        dataIndex: 'unit',
        key: 'unit',
        width: 80,
        align: 'center',
      },
      {
        title: 'Ngưỡng cảnh báo',
        dataIndex: 'lowStockThreshold',
        key: 'lowStockThreshold',
        width: 150,
        align: 'right',
        render: (threshold, record) => `${threshold} ${record.unit}`,
      },
      {
        title: 'Trạng thái',
        dataIndex: 'isActive',
        key: 'isActive',
        width: 120,
        align: 'center',
        render: (isActive) => (
          <Tag color={isActive ? 'success' : 'default'}>
            {isActive ? 'Hoạt động' : 'Tạm ngưng'}
          </Tag>
        ),
        filters: [
          { text: 'Hoạt động', value: true },
          { text: 'Tạm ngưng', value: false },
        ],
        onFilter: (value, record) => record.isActive === value,
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
        width: 120,
        align: 'center',
        fixed: 'right',
        render: (_, record) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'updateStock',
                  label: 'Cập nhật tồn kho',
                  icon: <GIcon name="inventory" />,
                  onClick: () => onUpdateStock(record),
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
                  icon: <GIcon name="delete" />,
                  danger: true,
                  onClick: () => onDelete(record),
                },
              ],
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<GIcon name="more_vert" />} />
          </Dropdown>
        ),
      },
    ],
    [onEdit, onDelete, onUpdateStock]
  );

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <GIcon name="inventory_2" size={24} />
          <Title level={4} style={{ margin: 0 }}>
            Quản lý nguyên liệu
          </Title>
        </div>
      }
      extra={
        <Space>
          <Search
            placeholder="Tìm kiếm nguyên liệu..."
            allowClear
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            onSearch={onSearch}
            style={{ width: 300 }}
            enterButton
          />
          <Button type="primary" icon={<GIcon name="add" />} onClick={onAdd}>
            Thêm nguyên liệu
          </Button>
        </Space>
      }
    >
      <Table
        loading={loading}
        columns={columns}
        dataSource={items}
        rowKey="_id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} nguyên liệu`,
          onChange: onPaginationChange,
        }}
        scroll={{ x: 1200 }}
      />
    </Card>
  );
}
