import { Modal, message } from 'antd';
import ProductForm from '@/pages/manager/ProductForm';

// Modal chứa form tạo và sửa sản phẩm
export default function ProductFormModal({
  open,
  mode,
  form,
  categories,
  canteens,
  imageList,
  onImageChange,
  onSubmit,
  onCancel,
}) {
  const [messageApi, contextHolder] = message.useMessage();

  // Xử lý submit form
  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // Kiểm tra căng tin
      if (!values.canteenId) {
        messageApi.error('Vui lòng chọn căng tin');
        return;
      }

      // Tạo FormData để upload ảnh
      const formData = new FormData();
      formData.append('canteenId', values.canteenId);
      formData.append('name', values.name);
      formData.append('categoryId', values.categoryId);
      formData.append('price', values.price);

      // Chỉ gửi originalPrice nếu có giá trị > 0
      if (values.originalPrice && values.originalPrice > 0) {
        formData.append('originalPrice', values.originalPrice);
      }

      formData.append('description', values.description || '');
      formData.append('status', values.status);
      formData.append('calories', values.calories || 0);
      formData.append('preparationTime', values.preparationTime || 0);
      formData.append('isPopular', values.isPopular || false);
      formData.append('isNew', values.isNew || false);

      // Đảm bảo consistency: Nếu có recipe → stockQuantity = 0
      if (values.recipe && values.recipe.length > 0) {
        // Gửi từng item recipe thay vì JSON string
        values.recipe.forEach((item, index) => {
          formData.append(`recipe[${index}][ingredientId]`, item.ingredientId);
          formData.append(
            `recipe[${index}][ingredientName]`,
            item.ingredientName
          );
          formData.append(`recipe[${index}][quantity]`, item.quantity);
          formData.append(`recipe[${index}][unit]`, item.unit);
        });
        formData.append('stockQuantity', 0);
      } else {
        // Nếu không có recipe, gửi stockQuantity
        formData.append('stockQuantity', values.stockQuantity || 0);
      }

      // Xử lý ảnh
      const newImageFiles = [];
      const keepImageUrls = [];

      // Thu thập ảnh mới và ảnh cũ cần giữ lại
      imageList.forEach((file) => {
        if (file.originFileObj) {
          // Ảnh mới cần upload
          newImageFiles.push(file.originFileObj);
        } else if (file.url) {
          // Ảnh cũ cần giữ lại
          keepImageUrls.push(file.url);
        }
      });

      if (newImageFiles.length > 0) {
        // Có ảnh mới: upload ảnh mới
        newImageFiles.forEach((img) => {
          formData.append('images', img);
        });
      } else if (mode === 'edit') {
        // Không có ảnh mới: gửi danh sách ảnh cần giữ lại từng URL
        keepImageUrls.forEach((url, index) => {
          formData.append(`keepImageUrls[${index}]`, url);
        });
      }

      await onSubmit(formData);
    } catch (error) {
      if (error.errorFields) {
        messageApi.error('Vui lòng kiểm tra lại thông tin');
      }
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        onCancel={onCancel}
        onOk={handleOk}
        title={mode === 'create' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
        okText={mode === 'create' ? 'Tạo mới' : 'Cập nhật'}
        cancelText="Hủy"
        width={900}
      >
        <ProductForm
          form={form}
          categories={categories}
          canteens={canteens}
          imageList={imageList}
          onImageChange={onImageChange}
        />
      </Modal>
    </>
  );
}
