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
        const [catResult, canResult] = await Promise.allSettled([
          getAllProductCategories({ limit: 1000 }),
          getAllCanteens({ limit: 1000 }),
        ]);
        // Xử lý từng kết quả độc lập, tránh 1 API lỗi làm hỏng API còn lại
        if (catResult.status === 'fulfilled') {
          setCategories(catResult.value?.data || []);
        } else {
          console.error('Không thể tải danh mục sản phẩm:', catResult.reason);
        }
        if (canResult.status === 'fulfilled') {
          setCanteens(canResult.value?.data?.canteens || []);
        } else {
          console.error('Không thể tải căng tin:', canResult.reason);
        }
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
    // ✅ Set canteenId cho cả staff VÀ manager
    const canteenIdValue =
      (user?.role === 'staff' || user?.role === 'manager') && user?.canteenId
        ? user.canteenId
        : null;
    console.log('ProductManagement - handleAdd - user:', user);
    console.log(
      'ProductManagement - handleAdd - canteenIdValue:',
      canteenIdValue
    );
    form.resetFields();
    // ✅ Set lại canteenId SAU khi reset
    if (canteenIdValue) {
      form.setFieldsValue({ canteenId: canteenIdValue });
      console.log(
        'ProductManagement - handleAdd - Set canteenId to form:',
        canteenIdValue
      );
    }
    setImageList([]);
    setFormOpen(true);
  }, [form, user]);

  // Xử lý mở form chỉnh sửa
  const handleEdit = useCallback(
    async (record) => {
      const detailData = await viewDetail(record);
      const sourceData = detailData || record;
      const normalizedRecipe = (sourceData.recipe || []).map((item, index) => ({
        id: item.id || `${item.ingredientId || 'ingredient'}-${index}`,
        ...item,
      }));

      setFormMode('edit');
      form.setFieldsValue({
        canteenId: sourceData.canteenId?._id || sourceData.canteenId,
        name: sourceData.name,
        categoryId: sourceData.categoryId?._id || sourceData.categoryId,
        price: sourceData.price,
        originalPrice: sourceData.originalPrice,
        description: sourceData.description,
        status: sourceData.status,
        calories: sourceData.calories,
        preparationTime: sourceData.preparationTime,
        isPopular: sourceData.isPopular,
        isNew: sourceData.isNew,
        stockQuantity: sourceData.stockQuantity,
        lowStockThreshold: sourceData.lowStockThreshold,
        recipe: normalizedRecipe,
      });
      setSelected(sourceData);

      // Chuyển đổi URL ảnh hiện có thành format của Upload component
      const existingImages = [];

      console.log(
        'ProductManagement - handleEdit - record.image:',
        sourceData.image
      );
      console.log(
        'ProductManagement - handleEdit - record.images:',
        sourceData.images
      );

      // Thêm ảnh chính (nếu có)
      if (sourceData.image) {
        existingImages.push({
          uid: '-1',
          name: 'image.png',
          status: 'done',
          url: sourceData.image,
        });
      }

      // Thêm các ảnh phụ (loại bỏ trùng với ảnh chính)
      if (sourceData.images && sourceData.images.length > 0) {
        sourceData.images.forEach((img, index) => {
          // Chỉ thêm nếu không trùng với ảnh chính
          if (img !== sourceData.image) {
            existingImages.push({
              uid: `-${index + 2}`,
              name: `image-${index + 1}.png`,
              status: 'done',
              url: img,
            });
          } else {
            console.log(
              'ProductManagement - handleEdit - Skipped duplicate image:',
              img
            );
          }
        });
      }

      console.log(
        'ProductManagement - handleEdit - existingImages:',
        existingImages
      );
      setImageList(existingImages);
      setFormOpen(true);
    },
    [form, viewDetail]
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
