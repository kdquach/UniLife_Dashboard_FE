import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Form,
  Tabs,
  message,
  Tooltip,
  Button,
} from 'antd';
import GIcon from '@/components/GIcon';
import { useInventoryManagement } from '@/hooks/useInventoryManagement';
import { useProductManagement } from '@/hooks/useProductManagement';
import { useIngredientManagement } from '@/hooks/useIngredientManagement';
import { getAllProductCategories } from '@/services/productCategory.service';
import { getAllCanteens } from '@/services/canteen.service';
import {
  getLowStockIngredients,
  updateIngredientStock,
} from '@/services/ingredient.service';
import ProductFormModal from '@/components/product/ProductFormModal';
import IngredientFormModal from '@/components/ingredient/IngredientFormModal';
import StockUpdateModal from '@/components/ingredient/StockUpdateModal';
import ProductInventoryTab from '@/components/inventory/ProductInventoryTab';
import IngredientInventoryTab from '@/components/inventory/IngredientInventoryTab';
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

  // Import useIngredientManagement hook
  const {
    categories: ingredientCategories,
    handleFormSubmit: handleIngredientSubmit,
  } = useIngredientManagement();

  // State cho modal chỉnh sửa sản phẩm
  const [form] = Form.useForm();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [imageList, setImageList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [canteens, setCanteens] = useState([]);

  // State cho modal nguyên liệu
  const [ingredientForm] = Form.useForm();
  const [ingredientFormOpen, setIngredientFormOpen] = useState(false);
  const [ingredientStockModalOpen, setIngredientStockModalOpen] =
    useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [lowStockIngredients, setLowStockIngredients] = useState([]);
  const [ingredientPagination, setIngredientPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [ingredientLoading, setIngredientLoading] = useState(false);
  const [messageApi] = message.useMessage();

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

  // Fetch danh sách nguyên liệu sắp hết
  useEffect(() => {
    const fetchLowStockIngredients = async (page = 1, pageSize = 10) => {
      setIngredientLoading(true);
      try {
        const response = await getLowStockIngredients({
          page,
          limit: pageSize,
        });
        setLowStockIngredients(response?.data || []);
        if (response?.pagination) {
          setIngredientPagination({
            current: response.pagination.page || page,
            pageSize: response.pagination.limit || pageSize,
            total: response.pagination.total || 0,
          });
        }
      } catch (error) {
        messageApi.error('Không thể tải danh sách nguyên liệu sắp hết');
        console.error('Lỗi khi tải nguyên liệu:', error);
      } finally {
        setIngredientLoading(false);
      }
    };
    fetchLowStockIngredients();
  }, [messageApi]);

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

  // Xử lý cancel form sản phẩm
  const handleFormCancel = useCallback(() => {
    setFormOpen(false);
    form.resetFields();
    setImageList([]);
  }, [form]);

  // Xử lý mở modal chỉnh sửa nguyên liệu
  const handleEditIngredient = useCallback((ingredient) => {
    setSelectedIngredient(ingredient);
    setIngredientFormOpen(true);
  }, []);

  // Xử lý mở modal cập nhật tồn kho nguyên liệu
  const handleUpdateIngredientStock = useCallback((ingredient) => {
    setSelectedIngredient(ingredient);
    setIngredientStockModalOpen(true);
  }, []);

  // Xử lý cancel modal form nguyên liệu
  const handleCloseIngredientFormModal = useCallback(() => {
    setIngredientFormOpen(false);
    ingredientForm.resetFields();
    setSelectedIngredient(null);
  }, [ingredientForm]);

  // Xử lý cancel modal cập nhật tồn kho
  const handleCloseIngredientStockModal = useCallback(() => {
    setIngredientStockModalOpen(false);
    setSelectedIngredient(null);
  }, []);

  // Xử lý submit form chỉnh sửa nguyên liệu
  const handleSubmitIngredientForm = useCallback(
    async (values) => {
      const success = await handleIngredientSubmit(values);
      if (success) {
        handleCloseIngredientFormModal();
        // Refresh lại danh sách nguyên liệu sắp hết
        const response = await getLowStockIngredients({
          page: ingredientPagination.current,
          limit: ingredientPagination.pageSize,
        });
        setLowStockIngredients(response?.data || []);
      }
    },
    [
      handleIngredientSubmit,
      handleCloseIngredientFormModal,
      ingredientPagination,
    ]
  );

  // Xử lý submit cập nhật tồn kho nguyên liệu
  const handleSubmitIngredientStock = useCallback(
    async ({ ingredientId, quantity, operation }) => {
      try {
        await updateIngredientStock(ingredientId, { quantity, operation });
        messageApi.success('Cập nhật tồn kho nguyên liệu thành công');
        handleCloseIngredientStockModal();
        // Refresh lại danh sách
        const response = await getLowStockIngredients({
          page: ingredientPagination.current,
          limit: ingredientPagination.pageSize,
        });
        setLowStockIngredients(response?.data || []);
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message || 'Lỗi cập nhật tồn kho'
        );
      }
    },
    [messageApi, handleCloseIngredientStockModal, ingredientPagination]
  );

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

  // Định nghĩa cột cho bảng nguyên liệu sắp hết
  const lowStockIngredientColumns = [
    {
      title: 'Tên nguyên liệu',
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
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (stock, record) => {
        const isLow = stock <= record.lowStockThreshold;
        return (
          <Tag
            color={isLow ? 'red' : 'orange'}
            icon={<GIcon name={isLow ? 'error' : 'warning'} />}
            style={{ fontWeight: '600', fontSize: '13px' }}
          >
            {stock} {record.unit}
          </Tag>
        );
      },
      align: 'center',
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      align: 'center',
      render: (unit) => (
        <Tag color="default" style={{ margin: 0 }}>
          {unit}
        </Tag>
      ),
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
      width: 150,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <Tooltip title="Cập nhật tồn kho">
            <Button
              type="primary"
              size="small"
              icon={<GIcon name="add_circle" />}
              onClick={() => handleUpdateIngredientStock(record)}
              className="inventory-action-btn"
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              size="small"
              icon={<GIcon name="edit" />}
              onClick={() => handleEditIngredient(record)}
              className="inventory-action-btn"
            />
          </Tooltip>
        </div>
      ),
    },
  ];
  const getRowClassName = (record) => {
    const percentage = record.lowStockThreshold
      ? ((record.stockQuantity / record.lowStockThreshold) * 100).toFixed(0)
      : 0;
    return percentage <= 25 ? 'critical-item' : '';
  };

  // Tính toán thống kê sản phẩm và nguyên liệu
  const stats = useMemo(
    () => ({
      // Sản phẩm
      totalOutOfStock: outOfStockPagination.total,
      totalLowStock: lowStockPagination.total,
      criticalItems: lowStockItems.filter(
        (item) => item.stockQuantity / (item.lowStockThreshold || 1) <= 0.25
      ).length,
      // Nguyên liệu
      totalLowStockIngredients: ingredientPagination.total,
      criticalIngredients: lowStockIngredients.filter(
        (item) => item.stock / (item.lowStockThreshold || 1) <= 0.25
      ).length,
    }),
    [
      outOfStockPagination.total,
      lowStockPagination.total,
      lowStockItems,
      ingredientPagination.total,
      lowStockIngredients,
    ]
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
          Theo dõi và quản lý tồn kho sản phẩm và nguyên liệu trong hệ thống
        </p>
      </div>

      {/* Tabs cho sản phẩm và nguyên liệu */}
      <Tabs
        defaultActiveKey="products"
        type="card"
        style={{
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
        items={[
          {
            key: 'products',
            label: (
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                <GIcon name="shopping_bag" style={{ marginRight: '8px' }} />
                Quản lý Sản Phẩm
              </span>
            ),
            children: (
              <ProductInventoryTab
                stats={stats}
                outOfStockItems={outOfStockItems}
                outOfStockPagination={outOfStockPagination}
                loadingOutOfStock={loadingOutOfStock}
                lowStockItems={lowStockItems}
                lowStockPagination={lowStockPagination}
                loadingLowStock={loadingLowStock}
                fetchOutOfStockProducts={fetchOutOfStockProducts}
                fetchLowStockProducts={fetchLowStockProducts}
                outOfStockColumns={outOfStockColumns}
                lowStockColumns={lowStockColumns}
                getRowClassName={getRowClassName}
              />
            ),
          },
          {
            key: 'ingredients',
            label: (
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                <GIcon name="restaurant" style={{ marginRight: '8px' }} />
                Quản lý Nguyên Liệu
              </span>
            ),
            children: (
              <IngredientInventoryTab
                stats={stats}
                lowStockIngredients={lowStockIngredients}
                ingredientPagination={ingredientPagination}
                ingredientLoading={ingredientLoading}
                lowStockIngredientColumns={lowStockIngredientColumns}
                fetchLowStockIngredients={async (page, pageSize) => {
                  const response = await getLowStockIngredients({
                    page,
                    limit: pageSize,
                  });
                  setLowStockIngredients(response?.data || []);
                  if (response?.pagination) {
                    setIngredientPagination({
                      current: response.pagination.page || page,
                      pageSize: response.pagination.limit || pageSize,
                      total: response.pagination.total || 0,
                    });
                  }
                }}
              />
            ),
          },
        ]}
      />

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

      {/* Modal chỉnh sửa nguyên liệu */}
      <IngredientFormModal
        open={ingredientFormOpen}
        mode="edit"
        initialValues={selectedIngredient}
        categories={ingredientCategories}
        onSubmit={handleSubmitIngredientForm}
        onCancel={handleCloseIngredientFormModal}
      />

      {/* Modal cập nhật tồn kho nguyên liệu */}
      <StockUpdateModal
        open={ingredientStockModalOpen}
        ingredient={selectedIngredient}
        onSubmit={handleSubmitIngredientStock}
        onCancel={handleCloseIngredientStockModal}
      />
    </div>
  );
}
