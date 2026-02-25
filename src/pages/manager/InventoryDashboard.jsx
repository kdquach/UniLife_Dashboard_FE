import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Statistic,
  Empty,
  Button,
  Tooltip,
  Form,
} from 'antd';
import GIcon from '@/components/GIcon';
import { useInventoryManagement } from '@/hooks/useInventoryManagement';
import { useProductManagement } from '@/hooks/useProductManagement';
import { getAllProductCategories } from '@/services/productCategory.service';
import { getAllCanteens } from '@/services/canteen.service';
import ProductFormModal from '@/components/product/ProductFormModal';
import '@/styles/InventoryDashboard.css';

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

  // State cho modal chỉnh sửa
  const [form] = Form.useForm();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [imageList, setImageList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [canteens, setCanteens] = useState([]);

  // Hook cho update product
  const { handleUpdate: updateProduct } = useProductManagement();

  // Fetch danh sách categories và canteens
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catResponse, canResponse] = await Promise.all([
          getAllProductCategories({ limit: 1000 }),
          getAllCanteens({ limit: 1000 }),
        ]);
        setCategories(catResponse?.data || []);
        setCanteens(canResponse?.data?.canteens || []);
      } catch (error) {
        console.error('Không thể tải dữ liệu:', error);
      }
    };
    fetchData();
  }, []);

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    fetchOutOfStockProducts();
    fetchLowStockProducts();
  }, [fetchOutOfStockProducts, fetchLowStockProducts]);

  // Xử lý mở form chỉnh sửa
  const handleEdit = useCallback(
    (record) => {
      form.setFieldsValue({
        canteenId: record.canteenId?._id || record.canteenId,
        name: record.name,
        categoryId: record.categoryId?._id || record.categoryId,
        price: record.price,
        originalPrice: record.originalPrice,
        description: record.description,
        status: record.status,
        calories: record.calories,
        preparationTime: record.preparationTime,
        isPopular: record.isPopular,
        isNew: record.isNew,
        stockQuantity: record.stockQuantity,
        lowStockThreshold: record.lowStockThreshold,
        recipe: record.recipe || [],
      });
      setSelected(record);

      // Chuyển đổi URL ảnh hiện có thành format của Upload component
      const existingImages = [];

      // Thêm ảnh chính (nếu có)
      if (record.image) {
        existingImages.push({
          uid: '-1',
          name: 'image.png',
          status: 'done',
          url: record.image,
        });
      }

      // Thêm các ảnh phụ (loại bỏ trùng với ảnh chính)
      if (record.images && record.images.length > 0) {
        record.images.forEach((img, index) => {
          // Chỉ thêm nếu không trùng với ảnh chính
          if (img !== record.image) {
            existingImages.push({
              uid: `-${index + 2}`,
              name: `image-${index + 1}.png`,
              status: 'done',
              url: img,
            });
          }
        });
      }

      setImageList(existingImages);
      setFormOpen(true);
    },
    [form]
  );

  // Xử lý submit form
  const handleFormSubmit = useCallback(
    async (formData) => {
      const success = await updateProduct(selected._id, formData);

      if (success) {
        setFormOpen(false);
        form.resetFields();
        setImageList([]);
        // Refresh lại danh sách
        fetchOutOfStockProducts();
        fetchLowStockProducts();
      }
    },
    [
      selected,
      updateProduct,
      form,
      fetchOutOfStockProducts,
      fetchLowStockProducts,
    ]
  );

  // Xử lý đóng form
  const handleFormCancel = useCallback(() => {
    setFormOpen(false);
    form.resetFields();
    setImageList([]);
  }, [form]);

  // Định nghĩa cột cho bảng hết hàng
  const outOfStockColumns = [
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      flex: 1,
      render: (text) => (
        <span style={{ fontWeight: '500', color: '#262626' }}>{text}</span>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: ['categoryId', 'name'],
      key: 'categoryId',
      width: 150,
      render: (text) => (
        <Tag color="blue" style={{ margin: 0 }}>
          {text || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Căng tin',
      dataIndex: ['canteenId', 'name'],
      key: 'canteenId',
      width: 150,
      render: (text) => (
        <span style={{ color: '#595959' }}>
          <GIcon
            name="store"
            style={{ marginRight: '4px', fontSize: '14px' }}
          />
          {text || 'N/A'}
        </span>
      ),
    },
    {
      title: 'Giá bán',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price) => (
        <span style={{ fontWeight: '600', color: '#52c41a' }}>
          {price ? `${price.toLocaleString('vi-VN')}đ` : '0đ'}
        </span>
      ),
      align: 'right',
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 100,
      render: (stock) => (
        <Tag
          color="red"
          icon={<GIcon name="error" />}
          style={{ fontWeight: '600', fontSize: '13px' }}
        >
          {stock}
        </Tag>
      ),
      align: 'center',
    },
    {
      title: 'Ngưỡng cảnh báo',
      dataIndex: 'lowStockThreshold',
      key: 'lowStockThreshold',
      width: 130,
      render: (threshold) => (
        <Tag
          color="cyan"
          icon={<GIcon name="notifications_active" />}
          style={{
            fontWeight: '600',
            fontSize: '13px',
            padding: '4px 12px',
            borderRadius: '6px',
          }}
        >
          {threshold}
        </Tag>
      ),
      align: 'center',
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Cập nhật tồn kho">
          <Button
            type="primary"
            danger
            size="small"
            icon={<GIcon name="edit" />}
            onClick={() => handleEdit(record)}
            className="inventory-action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
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
      render: (text) => (
        <span style={{ fontWeight: '500', color: '#262626' }}>{text}</span>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: ['categoryId', 'name'],
      key: 'categoryId',
      width: 150,
      render: (text) => (
        <Tag color="blue" style={{ margin: 0 }}>
          {text || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Căng tin',
      dataIndex: ['canteenId', 'name'],
      key: 'canteenId',
      width: 150,
      render: (text) => (
        <span style={{ color: '#595959' }}>
          <GIcon
            name="store"
            style={{ marginRight: '4px', fontSize: '14px' }}
          />
          {text || 'N/A'}
        </span>
      ),
    },
    {
      title: 'Giá bán',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price) => (
        <span style={{ fontWeight: '600', color: '#52c41a' }}>
          {price ? `${price.toLocaleString('vi-VN')}đ` : '0đ'}
        </span>
      ),
      align: 'right',
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 100,
      render: (stock, record) => {
        const percentage = record.lowStockThreshold
          ? ((stock / record.lowStockThreshold) * 100).toFixed(0)
          : 0;
        const isLow = percentage < 25;
        return (
          <Tag
            color={isLow ? 'red' : 'orange'}
            icon={<GIcon name={isLow ? 'error' : 'warning'} />}
            style={{ fontWeight: '600', fontSize: '13px' }}
          >
            {stock}
          </Tag>
        );
      },
      align: 'center',
    },
    {
      title: 'Ngưỡng cảnh báo',
      dataIndex: 'lowStockThreshold',
      key: 'lowStockThreshold',
      width: 130,
      render: (threshold) => (
        <Tag
          color="cyan"
          icon={<GIcon name="notifications_active" />}
          style={{
            fontWeight: '600',
            fontSize: '13px',
            padding: '4px 12px',
            borderRadius: '6px',
          }}
        >
          {threshold}
        </Tag>
      ),
      align: 'center',
    },
    {
      title: 'Tỷ lệ tồn kho',
      key: 'stockPercentage',
      width: 150,
      align: 'center',
      render: (text, record) => {
        const percentage = record.lowStockThreshold
          ? ((record.stockQuantity / record.lowStockThreshold) * 100).toFixed(0)
          : 0;
        const isLow = percentage < 25;
        const isMedium = percentage >= 25 && percentage < 50;

        let color = '#52c41a';
        let bgColor = '#f6ffed';
        let icon = 'check_circle';

        if (isLow) {
          color = '#ff4d4f';
          bgColor = '#fff2f0';
          icon = 'error';
        } else if (isMedium) {
          color = '#faad14';
          bgColor = '#fffbe6';
          icon = 'warning';
        }

        return (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              background: bgColor,
              borderRadius: '4px',
              fontWeight: '600',
              color: color,
            }}
          >
            <GIcon name={icon} style={{ fontSize: '16px' }} />
            <span>{percentage}%</span>
          </div>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Cập nhật tồn kho">
          <Button
            type="primary"
            size="small"
            icon={<GIcon name="edit" />}
            onClick={() => handleEdit(record)}
            className="inventory-action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </Tooltip>
      ),
    },
  ];

  // Helper function để highlight row critical
  const getRowClassName = (record) => {
    const percentage = record.lowStockThreshold
      ? ((record.stockQuantity / record.lowStockThreshold) * 100).toFixed(0)
      : 0;
    return percentage <= 25 ? 'critical-item' : '';
  };

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
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {contextHolder}

      {/* Header Section */}
      <div
        style={{
          marginBottom: '24px',
          background: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}
        >
          <GIcon
            name="inventory_2"
            style={{ fontSize: '32px', color: '#1890ff', marginRight: '12px' }}
          />
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>
            Bảng Điều Khiển Tồn Kho
          </h1>
        </div>
        <p style={{ margin: 0, color: '#8c8c8c', fontSize: '14px' }}>
          Theo dõi và quản lý sản phẩm hết hàng và sắp hết hàng theo thời gian
          thực
        </p>
      </div>

      {/* Thống kê tóm tắt */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            className="inventory-stat-card"
            style={{
              background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)',
              borderLeft: '4px solid #ff4d4f',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Statistic
              title={
                <span
                  style={{
                    fontSize: '14px',
                    color: '#8c8c8c',
                    fontWeight: '500',
                  }}
                >
                  Sản phẩm hết hàng
                </span>
              }
              value={stats.totalOutOfStock}
              prefix={
                <GIcon name="error_outline" style={{ color: '#ff4d4f' }} />
              }
              valueStyle={{
                color: '#ff4d4f',
                fontSize: '32px',
                fontWeight: 'bold',
              }}
              suffix={
                <span style={{ fontSize: '14px', color: '#8c8c8c' }}>món</span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            className="inventory-stat-card"
            style={{
              background: 'linear-gradient(135deg, #fffbf0 0%, #fff 100%)',
              borderLeft: '4px solid #faad14',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Statistic
              title={
                <span
                  style={{
                    fontSize: '14px',
                    color: '#8c8c8c',
                    fontWeight: '500',
                  }}
                >
                  Sản phẩm sắp hết hàng
                </span>
              }
              value={stats.totalLowStock}
              prefix={
                <GIcon name="warning_amber" style={{ color: '#faad14' }} />
              }
              valueStyle={{
                color: '#faad14',
                fontSize: '32px',
                fontWeight: 'bold',
              }}
              suffix={
                <span style={{ fontSize: '14px', color: '#8c8c8c' }}>món</span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            className="inventory-stat-card"
            style={{
              background: 'linear-gradient(135deg, #fff7e6 0%, #fff 100%)',
              borderLeft: '4px solid #ff7a45',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Statistic
              title={
                <span
                  style={{
                    fontSize: '14px',
                    color: '#8c8c8c',
                    fontWeight: '500',
                  }}
                >
                  Mức nguy hiểm (≤25%)
                </span>
              }
              value={stats.criticalItems}
              prefix={
                <GIcon name="priority_high" style={{ color: '#ff7a45' }} />
              }
              valueStyle={{
                color: '#ff7a45',
                fontSize: '32px',
                fontWeight: 'bold',
              }}
              suffix={
                <span style={{ fontSize: '14px', color: '#8c8c8c' }}>món</span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Bảng hết hàng */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GIcon
              name="error"
              style={{ color: '#ff4d4f', fontSize: '20px' }}
            />
            <span style={{ fontSize: '16px', fontWeight: '600' }}>
              Sản phẩm Hết Hàng
            </span>
            <Tag color="red" style={{ marginLeft: '8px' }}>
              {outOfStockPagination.total} món
            </Tag>
          </div>
        }
        style={{
          marginBottom: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
        extra={
          <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
            <GIcon name="sync" style={{ marginRight: '4px' }} />
            Cập nhật tự động
          </span>
        }
      >
        {outOfStockItems.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <p
                  style={{
                    fontSize: '16px',
                    color: '#8c8c8c',
                    marginBottom: '4px',
                  }}
                >
                  <GIcon
                    name="check_circle"
                    style={{ color: '#52c41a', marginRight: '8px' }}
                  />
                  Không có sản phẩm hết hàng
                </p>
                <p style={{ fontSize: '12px', color: '#bfbfbf' }}>
                  Tất cả sản phẩm đều có tồn kho
                </p>
              </div>
            }
            style={{ padding: '40px 0' }}
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
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} sản phẩm`,
            }}
            scroll={{ x: 1000 }}
            size="middle"
            style={{ background: '#fff' }}
          />
        )}
      </Card>

      {/* Bảng sắp hết hàng */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GIcon
              name="warning"
              style={{ color: '#faad14', fontSize: '20px' }}
            />
            <span style={{ fontSize: '16px', fontWeight: '600' }}>
              Sản phẩm Sắp Hết Hàng
            </span>
            <Tag color="orange" style={{ marginLeft: '8px' }}>
              {lowStockPagination.total} món
            </Tag>
          </div>
        }
        style={{
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
        extra={
          <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
            <GIcon name="info" style={{ marginRight: '4px' }} />
            Dưới ngưỡng cảnh báo
          </span>
        }
      >
        {lowStockItems.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <p
                  style={{
                    fontSize: '16px',
                    color: '#8c8c8c',
                    marginBottom: '4px',
                  }}
                >
                  <GIcon
                    name="check_circle"
                    style={{ color: '#52c41a', marginRight: '8px' }}
                  />
                  Không có sản phẩm sắp hết hàng
                </p>
                <p style={{ fontSize: '12px', color: '#bfbfbf' }}>
                  Tồn kho đều ở mức an toàn
                </p>
              </div>
            }
            style={{ padding: '40px 0' }}
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
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} sản phẩm`,
            }}
            scroll={{ x: 1000 }}
            size="middle"
            style={{ background: '#fff' }}
            rowClassName={getRowClassName}
          />
        )}
      </Card>

      {/* Modal chỉnh sửa sản phẩm */}
      <ProductFormModal
        open={formOpen}
        mode="edit"
        form={form}
        categories={categories}
        canteens={canteens}
        imageList={imageList}
        onImageChange={({ fileList }) => setImageList(fileList)}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />
    </div>
  );
}
