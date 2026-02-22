import { useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Statistic,
  Empty,
  Button,
  Space,
  Tooltip,
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import GIcon from '@/components/GIcon';
import { useInventoryManagement } from '@/hooks/useInventoryManagement';

export default function InventoryDashboard() {
  const {
    contextHolder,
    loadingOutOfStock,
    loadingLowStock,
    outOfStockItems,
    outOfStockPagination,
    lowStockItems,
    lowStockPagination,
    fetchOutOfStockProducts,
    fetchLowStockProducts,
  } = useInventoryManagement();

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    fetchOutOfStockProducts();
    fetchLowStockProducts();
  }, [fetchOutOfStockProducts, fetchLowStockProducts]);

  // Định nghĩa cột cho bảng hết hàng
  const outOfStockColumns = [
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      flex: 1,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'Danh mục',
      dataIndex: ['categoryId', 'name'],
      key: 'categoryId',
      width: 150,
      render: (text) => text || 'N/A',
    },
    {
      title: 'Căng tin',
      dataIndex: ['canteenId', 'name'],
      key: 'canteenId',
      width: 150,
      render: (text) => text || 'N/A',
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price) => (price ? `${price.toLocaleString('vi-VN')}đ` : '0đ'),
      align: 'right',
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 100,
      render: (stock) => (
        <Tag color="red" icon={<GIcon name="error" />}>
          {stock}
        </Tag>
      ),
      align: 'center',
    },
    {
      title: 'Ngưỡng cảnh báo',
      dataIndex: 'lowStockThreshold',
      key: 'lowStockThreshold',
      width: 120,
      align: 'center',
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      fixed: 'right',
      align: 'center',
      render: () => (
        <Tooltip title="Cập nhật sản phẩm">
          <Button
            type="primary"
            danger
            size="small"
            icon={<GIcon name="edit" />}
          />
        </Tooltip>
      ),
    },
  ];

  // Định nghĩa cột cho bảng sắp hết hàng
  const lowStockColumns = [
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      flex: 1,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'Danh mục',
      dataIndex: ['categoryId', 'name'],
      key: 'categoryId',
      width: 150,
      render: (text) => text || 'N/A',
    },
    {
      title: 'Căng tin',
      dataIndex: ['canteenId', 'name'],
      key: 'canteenId',
      width: 150,
      render: (text) => text || 'N/A',
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price) => (price ? `${price.toLocaleString('vi-VN')}đ` : '0đ'),
      align: 'right',
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 100,
      render: (stock) => (
        <Tag color="orange" icon={<GIcon name="warning" />}>
          {stock}
        </Tag>
      ),
      align: 'center',
    },
    {
      title: 'Ngưỡng cảnh báo',
      dataIndex: 'lowStockThreshold',
      key: 'lowStockThreshold',
      width: 120,
      align: 'center',
    },
    {
      title: 'Tỷ lệ tồn kho %',
      key: 'stockPercentage',
      width: 120,
      align: 'center',
      render: (text, record) => {
        const percentage = record.lowStockThreshold
          ? ((record.stockQuantity / record.lowStockThreshold) * 100).toFixed(0)
          : 0;
        return (
          <span className={percentage < 50 ? 'text-red-500 font-bold' : ''}>
            {percentage}%
          </span>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      fixed: 'right',
      align: 'center',
      render: () => (
        <Tooltip title="Cập nhật sản phẩm">
          <Button type="primary" size="small" icon={<GIcon name="edit" />} />
        </Tooltip>
      ),
    },
  ];

  // Tính toán thống kê
  const stats = useMemo(
    () => ({
      totalOutOfStock: outOfStockPagination.total,
      totalLowStock: lowStockPagination.total,
      criticalItems: lowStockItems.filter(
        (item) => item.stockQuantity / (item.lowStockThreshold || 1) <= 0.25
      ).length,
    }),
    [outOfStockPagination.total, lowStockPagination.total, lowStockItems]
  );

  return (
    <div className="p-6">
      {contextHolder}

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">
          <GIcon name="inventory_2" style={{ marginRight: '8px' }} />
          Bảng Điều Khiển Tồn Kho
        </h1>
        <p className="text-gray-600">
          Theo dõi và quản lý sản phẩm hết hàng và sắp hết hàng
        </p>
      </div>

      {/* Thống kê tóm tắt */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Sản phẩm hết hàng"
              value={stats.totalOutOfStock}
              prefix={<GIcon name="error_outline" />}
              valueStyle={{
                color: '#ff4d4f',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Sản phẩm sắp hết hàng"
              value={stats.totalLowStock}
              prefix={<GIcon name="warning_amber" />}
              valueStyle={{
                color: '#faad14',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Mục nguy hiểm (≤25%)"
              value={stats.criticalItems}
              prefix={<GIcon name="priority_high" />}
              valueStyle={{
                color: '#ff7a45',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Bảng hết hàng */}
      <Card title="Sản phẩm Hết Hàng" className="mb-6">
        {outOfStockItems.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_DEFAULT}
            description="Không có sản phẩm hết hàng"
          />
        ) : (
          <Table
            columns={outOfStockColumns}
            dataSource={outOfStockItems.map((item, index) => ({
              ...item,
              key: item._id || index,
            }))}
            loading={loadingOutOfStock}
            pagination={{
              current: outOfStockPagination.current,
              pageSize: outOfStockPagination.pageSize,
              total: outOfStockPagination.total,
              onChange: (page, pageSize) =>
                fetchOutOfStockProducts(page, pageSize),
            }}
            scroll={{ x: 1000 }}
            size="middle"
          />
        )}
      </Card>

      {/* Bảng sắp hết hàng */}
      <Card title="Sản phẩm Sắp Hết Hàng">
        {lowStockItems.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_DEFAULT}
            description="Không có sản phẩm sắp hết hàng"
          />
        ) : (
          <Table
            columns={lowStockColumns}
            dataSource={lowStockItems.map((item, index) => ({
              ...item,
              key: item._id || index,
            }))}
            loading={loadingLowStock}
            pagination={{
              current: lowStockPagination.current,
              pageSize: lowStockPagination.pageSize,
              total: lowStockPagination.total,
              onChange: (page, pageSize) =>
                fetchLowStockProducts(page, pageSize),
            }}
            scroll={{ x: 1000 }}
            size="middle"
          />
        )}
      </Card>
    </div>
  );
}
