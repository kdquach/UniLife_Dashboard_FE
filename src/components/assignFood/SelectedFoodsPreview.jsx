import { Table, Button, Space, Popconfirm, Tag, Tooltip, Empty } from 'antd';
import GIcon from '@/components/GIcon';

export default function SelectedFoodsPreview({ foods, onRemoveFood }) {
  if (!foods || foods.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Chưa chọn thực phẩm nào"
      />
    );
  }

  const columns = [
    {
      title: 'Thứ tự',
      dataIndex: 'sequence',
      key: 'sequence',
      width: 80,
      align: 'center',
      render: (seq) => (
        <Tag color="blue" style={{ minWidth: '32px', textAlign: 'center' }}>
          {seq + 1}
        </Tag>
      ),
    },
    {
      title: 'Tên thực phẩm',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name) => <span style={{ fontWeight: '500' }}>{name}</span>,
    },
    {
      title: 'Danh mục',
      dataIndex: ['categoryId', 'name'],
      key: 'categoryId',
      width: 120,
      render: (cat) => <Tag color="cyan">{cat || 'N/A'}</Tag>,
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      align: 'right',
      render: (price) => (
        <span style={{ fontWeight: 'bold', color: '#ff4d4f' }}>
          {price?.toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xóa khỏi danh sách">
            <Popconfirm
              title="Xóa thực phẩm"
              description="Bạn chắc chắn muốn xóa thực phẩm này khỏi danh sách?"
              onConfirm={() => onRemoveFood(record._id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                danger
                icon={<GIcon name="delete_outline" />}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={foods}
      columns={columns}
      rowKey="_id"
      pagination={false}
      size="small"
      scroll={{ x: 800 }}
      style={{ marginTop: '16px' }}
    />
  );
}
