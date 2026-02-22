import { useEffect, useState, useCallback } from 'react';
import { Form } from 'antd';
import { useAuthStore } from '@/store/useAuthStore';
import { getAllProductCategories } from '@/services/productCategory.service';
import { getAllCanteens } from '@/services/canteen.service';
import { useProductManagement } from '@/hooks/useProductManagement';
import ProductListView from '@/components/product/ProductListView';
import ProductDetailModal from '@/components/product/ProductDetailModal';
import ProductFormModal from '@/components/product/ProductFormModal';

// Component chính quản lý sản phẩm
export default function ProductManagementPage() {
  const { user } = useAuthStore();
  const [form] = Form.useForm();

  // State cho modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selected, setSelected] = useState(null);
  const [imageList, setImageList] = useState([]);

  // State cho dữ liệu phụ trợ
  const [categories, setCategories] = useState([]);
  const [canteens, setCanteens] = useState([]);

  // Sử dụng custom hook cho logic CRUD
  const {
    contextHolder,
    loading,
    items,
    pagination,
    searchText,
    filterStatus,
    viewMode,
    setSearchText,
    setFilterStatus,
    setViewMode,
    fetchList,
    fetchDeletedProducts,
    handleViewDetail: viewDetail,
    handleDelete,
    handleRestore,
    handleCreate: createProduct,
    handleUpdate: updateProduct,
  } = useProductManagement();

  // Fetch danh sách categories và canteens khi component mount
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

  // Fetch danh sách sản phẩm khi mount
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Fetch data khi chuyển viewMode
  useEffect(() => {
    if (viewMode === 'active') {
      fetchList();
    } else {
      fetchDeletedProducts();
    }
  }, [viewMode, fetchList, fetchDeletedProducts]);

  // Xử lý xem chi tiết
  const handleView = useCallback(
    async (record) => {
      const data = await viewDetail(record);
      if (data) {
        setSelected(data);
        setDetailOpen(true);
      }
    },
    [viewDetail]
  );

  // Xử lý mở form tạo mới
  const handleAdd = useCallback(() => {
    setFormMode('create');
    form.resetFields();
    if (user?.role === 'staff' && user?.canteenId) {
      form.setFieldValue('canteenId', user.canteenId);
    }
    setImageList([]);
    setFormOpen(true);
  }, [form, user]);

  // Xử lý mở form chỉnh sửa
  const handleEdit = useCallback(
    (record) => {
      setFormMode('edit');
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
        recipe: record.recipe || [],
      });
      setSelected(record);

      // Chuyển đổi URL ảnh hiện có thành format của Upload component
      const existingImages = [];
      if (record.image) {
        existingImages.push({
          uid: '-1',
          name: 'image.png',
          status: 'done',
          url: record.image,
        });
      }
      if (record.images && record.images.length > 0) {
        record.images.forEach((img, index) => {
          existingImages.push({
            uid: `-${index + 2}`,
            name: `image-${index + 1}.png`,
            status: 'done',
            url: img,
          });
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
      const success =
        formMode === 'create'
          ? await createProduct(formData)
          : await updateProduct(selected._id, formData);

      if (success) {
        setFormOpen(false);
        form.resetFields();
        setImageList([]);
      }
    },
    [formMode, selected, createProduct, updateProduct, form]
  );

  // Xử lý đóng form
  const handleFormCancel = useCallback(() => {
    setFormOpen(false);
    form.resetFields();
    setImageList([]);
  }, [form]);

  return (
    <>
      {contextHolder}

      <ProductListView
        loading={loading}
        items={items}
        pagination={pagination}
        searchText={searchText}
        filterStatus={filterStatus}
        viewMode={viewMode}
        onSearchChange={setSearchText}
        onFilterChange={setFilterStatus}
        onViewModeChange={setViewMode}
        onSearch={() =>
          viewMode === 'active' ? fetchList() : fetchDeletedProducts()
        }
        onPaginationChange={
          viewMode === 'active' ? fetchList : fetchDeletedProducts
        }
        onAdd={handleAdd}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRestore={handleRestore}
      />

      <ProductDetailModal
        open={detailOpen}
        product={selected}
        onClose={() => setDetailOpen(false)}
        onEdit={handleEdit}
      />

      <ProductFormModal
        open={formOpen}
        mode={formMode}
        form={form}
        categories={categories}
        canteens={canteens}
        imageList={imageList}
        onImageChange={({ fileList }) => setImageList(fileList)}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />
    </>
  );
}
