import { useState, useEffect, useMemo } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Upload,
  Checkbox,
  Button,
  Space,
  Typography,
  Tabs,
  Table,
  Modal,
  Spin,
} from 'antd';
import GIcon from '@/components/GIcon';
import { getAllIngredients } from '@/services/ingredient.service';
import { useAuthStore } from '@/store/useAuthStore';

const { TextArea } = Input;
const { Text } = Typography;

export default function ProductForm({
  form,
  categories,
  canteens,
  imageList,
  onImageChange,
}) {
  // Danh sách công thức (nguyên liệu)
  const { user } = useAuthStore();
  const [recipes, setRecipes] = useState([]);
  const [recipeForm] = Form.useForm();
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // Theo dõi canteenId từ form để hiển thị tên
  const canteenId = Form.useWatch('canteenId', form);
  const canteenName = useMemo(() => {
    console.log('ProductForm - canteenId:', canteenId);
    if (!canteenId || !canteens || canteens.length === 0)
      return 'Chưa xác định';
    const canteen = canteens.find((c) => c._id === canteenId);
    console.log('ProductForm - canteenName:', canteen?.name);
    return canteen?.name || 'Chưa xác định';
  }, [canteenId, canteens]);

  // Theo dõi stockQuantity để tự động cập nhật status
  const stockQuantity = Form.useWatch('stockQuantity', form);

  // Tự động chuyển status khi stockQuantity thay đổi
  useEffect(() => {
    // Chỉ áp dụng khi không có recipe
    if (recipes.length > 0) return;

    const currentStatus = form.getFieldValue('status');

    if (stockQuantity === 0) {
      // Tự động chuyển sang hết hàng khi stockQuantity = 0
      if (currentStatus !== 'out_of_stock') {
        form.setFieldValue('status', 'out_of_stock');
        console.log(
          'ProductForm - Auto set status to out_of_stock because stockQuantity = 0'
        );
      }
    } else if (stockQuantity > 0 && currentStatus === 'out_of_stock') {
      // Tự động chuyển sang available khi stockQuantity > 0 và đang ở trạng thái hết hàng
      form.setFieldValue('status', 'available');
      console.log(
        'ProductForm - Auto set status to available because stockQuantity > 0'
      );
    }
  }, [stockQuantity, recipes.length, form]);

  // Đồng bộ recipes từ form value
  useEffect(() => {
    const formRecipe = form.getFieldValue('recipe') || [];
    setRecipes(formRecipe);
  }, [form]);

  // Fetch danh sách nguyên liệu
  useEffect(() => {
    const fetchIngredients = async () => {
      setLoadingIngredients(true);
      try {
        const response = await getAllIngredients({ limit: 1000 });
        setIngredients(response?.data || []);
      } catch (error) {
        console.error('Không thể tải danh sách nguyên liệu:', error);
      } finally {
        setLoadingIngredients(false);
      }
    };
    fetchIngredients();
  }, []);

  // Debug: Log canteens prop
  useEffect(() => {
    console.log('ProductForm - canteens:', canteens);
  }, [canteens]);

  // Xử lý thêm/sửa nguyên liệu
  const handleSaveRecipe = async () => {
    try {
      const values = await recipeForm.validateFields();
      if (editingRecipe) {
        // Sửa nguyên liệu
        const updatedRecipes = recipes.map((r) =>
          r.id === editingRecipe.id ? { ...r, ...values } : r
        );
        setRecipes(updatedRecipes);
        form.setFieldValue('recipe', updatedRecipes);
        // Tự động set stockQuantity = 0 khi có recipe
        form.setFieldValue('stockQuantity', 0);
      } else {
        // Thêm nguyên liệu mới
        const newRecipe = {
          id: Date.now(),
          ...values,
        };
        const updatedRecipes = [...recipes, newRecipe];
        setRecipes(updatedRecipes);
        form.setFieldValue('recipe', updatedRecipes);
        // Tự động set stockQuantity = 0 khi có recipe
        form.setFieldValue('stockQuantity', 0);
      }
      recipeForm.resetFields();
      setEditingRecipe(null);
      setRecipeModalOpen(false);
    } catch (error) {
      console.error('Lỗi validate:', error);
    }
  };

  // Xử lý xóa nguyên liệu
  const handleDeleteRecipe = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa nguyên liệu này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: () => {
        const updatedRecipes = recipes.filter((r) => r.id !== id);
        setRecipes(updatedRecipes);
        form.setFieldValue('recipe', updatedRecipes);

        // Nếu không còn recipe, có thể nhập stockQuantity
        if (updatedRecipes.length === 0) {
          form.setFieldValue('stockQuantity', undefined);
        }
      },
    });
  };

  // Xử lý sửa nguyên liệu
  const handleEditRecipe = (record) => {
    setEditingRecipe(record);
    recipeForm.setFieldsValue({
      ingredientId: record.ingredientId,
      ingredientName: record.ingredientName,
      quantity: record.quantity,
      unit: record.unit,
    });
    setRecipeModalOpen(true);
  };

  // Xử lý mở modal thêm nguyên liệu
  const handleAddRecipe = () => {
    setEditingRecipe(null);
    recipeForm.resetFields();
    setRecipeModalOpen(true);
  };

  // Cột bảng công thức
  const recipeColumns = [
    {
      title: 'Tên nguyên liệu',
      dataIndex: 'ingredientName',
      key: 'ingredientName',
      flex: 1,
      render: (ingredientName, record) => {
        // Tìm tên từ ingredients list nếu có
        const ingredient = ingredients.find(
          (ing) => ing._id === record.ingredientId
        );
        return ingredient?.name || ingredientName || '-';
      },
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (qty) => qty.toFixed(2),
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="text"
            style={{ color: 'var(--text-muted)' }}
            icon={<GIcon name="edit" />}
            onClick={() => handleEditRecipe(record)}
          />
          <Button
            size="small"
            type="text"
            danger
            icon={<GIcon name="delete_outline" />}
            onClick={() => handleDeleteRecipe(record.id)}
          />
        </Space>
      ),
    },
  ];

  // Tab items - chỉ chứa stock và recipe
  const tabItems = [
    {
      key: 'stock',
      label: 'Kho hàng',
      children: (
        <div style={{ padding: '16px 0' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            <Form.Item
              name="stockQuantity"
              label="Số lượng tồn kho"
              rules={[
                {
                  validator: () => {
                    if (recipes.length > 0) {
                      // Nếu có recipe, không yêu cầu stockQuantity
                      return Promise.resolve();
                    }
                    // Nếu không có recipe, bắt buộc nhập
                    const value = form.getFieldValue('stockQuantity');
                    if (value === null || value === undefined || value < 0) {
                      return Promise.reject(
                        new Error('Vui lòng nhập số lượng tồn kho (>= 0)')
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              tooltip={
                recipes.length === 0
                  ? "Khi số lượng = 0, trạng thái sẽ tự động chuyển sang 'Hết hàng'"
                  : ''
              }
            >
              <InputNumber
                placeholder="Nhập số lượng tồn kho"
                min={0}
                style={{ width: '100%' }}
                disabled={recipes.length > 0}
              />
            </Form.Item>

            <Form.Item
              name="lowStockThreshold"
              label="Ngưỡng cảnh báo tồn kho thấp"
              rules={[
                {
                  type: 'number',
                  min: 0,
                  message: 'Ngưỡng cảnh báo phải >= 0',
                },
              ]}
              tooltip="Hệ thống sẽ cảnh báo khi số lượng tồn kho thấp hơn ngưỡng này"
            >
              <InputNumber
                placeholder="Nhập ngưỡng cảnh báo (mặc định: 10)"
                min={0}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>

          {recipes.length > 0 ? (
            <div
              style={{ color: '#1890ff', marginTop: '8px', fontSize: '12px' }}
            >
              <GIcon name="info" /> Số lượng được quản lý thông qua nguyên liệu
              công thức
            </div>
          ) : (
            stockQuantity === 0 && (
              <div
                style={{ color: '#ff4d4f', marginTop: '8px', fontSize: '12px' }}
              >
                <GIcon name="warning" /> Sản phẩm đang hết hàng (số lượng = 0),
                trạng thái sẽ tự động là "Hết hàng"
              </div>
            )
          )}
        </div>
      ),
    },
    {
      key: 'recipe',
      label: 'Công thức',
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Button
            type="primary"
            icon={<GIcon name="add" />}
            onClick={handleAddRecipe}
          >
            Thêm nguyên liệu
          </Button>
          <Form.Item name="recipe" hidden>
            <Input />
          </Form.Item>
          <Table
            columns={recipeColumns}
            dataSource={recipes}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: 'Không có nguyên liệu nào' }}
            size="small"
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: 'available',
          isPopular: false,
          isNew: true,
          recipe: [],
          lowStockThreshold: 10,
          canteenId: user?.canteenId || null, // ✅ Thêm canteenId vào initialValues
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Căng tin */}
          <div style={{ paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
            <h4 style={{ marginTop: 0 }}>Căng tin</h4>

            {/* Hidden field để lưu ID căng tin */}
            <Form.Item
              name="canteenId"
              rules={[{ required: true, message: 'Vui lòng chọn căng tin' }]}
              hidden
            >
              <Input />
            </Form.Item>

            {/* Hiển thị tên căng tin dưới dạng text */}
            <Form.Item label="Căng tin" style={{ marginBottom: 8 }}>
              <Input
                disabled
                value={canteenName}
                style={{
                  cursor: 'not-allowed',
                  backgroundColor: '#f5f5f5',
                  color: 'rgba(0, 0, 0, 0.85)',
                  fontWeight: '500',
                }}
                prefix={<GIcon name="store" style={{ color: '#8c8c8c' }} />}
              />
            </Form.Item>

            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              <GIcon name="info" style={{ marginRight: 4 }} />
              {user?.role === 'staff' || user?.role === 'manager'
                ? 'Bạn chỉ có thể tạo sản phẩm cho căng tin của bạn'
                : 'Căng tin được gán tự động theo tài khoản của bạn'}
            </Text>
          </div>

          {/* Thông tin sản phẩm */}
          <div style={{ paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
            <h4 style={{ marginTop: 0 }}>Thông tin sản phẩm</h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: 16,
              }}
            >
              <Form.Item
                name="name"
                label="Tên sản phẩm"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên sản phẩm' },
                  { min: 3, message: 'Tên sản phẩm phải có ít nhất 3 ký tự' },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="Nhập tên sản phẩm" />
              </Form.Item>

              <Form.Item
                name="categoryId"
                label="Danh mục"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                style={{ marginBottom: 0 }}
              >
                <Select
                  placeholder="Chọn danh mục"
                  options={
                    categories && categories.length > 0
                      ? categories.map((cat) => ({
                          label: cat.name,
                          value: cat._id,
                        }))
                      : []
                  }
                  loading={!categories || categories.length === 0}
                />
              </Form.Item>
            </div>
          </div>

          {/* Giá cả */}
          <div style={{ paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
            <h4 style={{ marginTop: 0 }}>Giá cả</h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
              }}
            >
              <div>
                <Form.Item
                  name="price"
                  label="Giá bán"
                  rules={[
                    { required: true, message: 'Vui lòng nhập giá bán' },
                    { type: 'number', min: 0, message: 'Giá phải lớn hơn 0' },
                  ]}
                  style={{ marginBottom: 8 }}
                >
                  <InputNumber
                    placeholder="Nhập giá bán cho khách hàng"
                    min={0}
                    style={{ width: '100%' }}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    }
                    parser={(value) => value.replace(/,/g, '')}
                  />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <GIcon name="info" style={{ marginRight: 4 }} />
                  Giá bán cho khách hàng
                </Text>
              </div>

              <div>
                <Form.Item
                  name="originalPrice"
                  label="Giá gốc"
                  style={{ marginBottom: 8 }}
                  rules={[
                    {
                      validator: (_, value) => {
                        const priceValue = form.getFieldValue('price');
                        // Nếu không có giá gốc, skip validation
                        if (!value || value === 0) {
                          return Promise.resolve();
                        }
                        // Nếu có giá gốc, phải >= giá bán
                        if (priceValue && value < priceValue) {
                          return Promise.reject(
                            new Error('Giá gốc phải >= giá bán')
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <InputNumber
                    placeholder="Nhập giá gốc (tùy chọn)"
                    min={0}
                    style={{ width: '100%' }}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    }
                    parser={(value) => value.replace(/,/g, '')}
                  />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <GIcon name="info" style={{ marginRight: 4 }} />
                  Dùng tính chiết khấu (≥ giá bán)
                </Text>
              </div>
            </div>
          </div>

          {/* Thông tin bổ sung */}
          <div style={{ paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
            <h4 style={{ marginTop: 0 }}>Thông tin bổ sung</h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
              }}
            >
              <div>
                <Form.Item name="calories" label="Calo" style={{ flex: 1 }}>
                  <InputNumber
                    placeholder="Nhập calo"
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </div>

              <div>
                <Form.Item
                  name="preparationTime"
                  label="Thời gian chuẩn bị (phút)"
                  style={{ flex: 1 }}
                >
                  <InputNumber
                    placeholder="Nhập thời gian"
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </div>
            </div>
          </div>

          {/* Mô tả chi tiết */}
          <div style={{ paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
            <h4 style={{ marginTop: 0 }}>Mô tả chi tiết</h4>
            <Form.Item name="description" style={{ marginBottom: 0 }}>
              <TextArea
                placeholder="Nhập mô tả sản phẩm"
                rows={4}
                showCount
                maxLength={1000}
              />
            </Form.Item>
          </div>

          {/* Cài đặt */}
          <div style={{ paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
            <h4 style={{ marginTop: 0 }}>Cài đặt</h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
              }}
            >
              <Form.Item
                name="status"
                label="Trạng thái"
                style={{ marginBottom: 0 }}
                tooltip={
                  stockQuantity === 0 && recipes.length === 0
                    ? "Trạng thái 'Hết hàng' được tự động áp dụng khi số lượng = 0"
                    : ''
                }
              >
                <Select
                  options={[
                    {
                      label: 'Có sẵn',
                      value: 'available',
                      disabled: stockQuantity === 0 && recipes.length === 0,
                    },
                    {
                      label: 'Không có sẵn',
                      value: 'unavailable',
                      disabled: stockQuantity === 0 && recipes.length === 0,
                    },
                    {
                      label: 'Hết hàng',
                      value: 'out_of_stock',
                      disabled: stockQuantity > 0 && recipes.length === 0,
                    },
                    {
                      label: 'Ẩn',
                      value: 'hidden',
                      disabled: stockQuantity === 0 && recipes.length === 0,
                    },
                  ]}
                />
              </Form.Item>

              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                <Form.Item
                  name="isPopular"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>Phổ biến</Checkbox>
                </Form.Item>
                <Form.Item
                  name="isNew"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>Mới</Checkbox>
                </Form.Item>
              </div>
            </div>
          </div>

          {/* Ảnh sản phẩm */}
          <div style={{ paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
            <h4 style={{ marginTop: 0 }}>Ảnh sản phẩm</h4>
            <Form.Item label="" style={{ marginBottom: 12 }}>
              <Upload
                listType="picture-card"
                fileList={imageList}
                onChange={onImageChange}
                beforeUpload={() => false}
                maxCount={6}
                accept="image/*"
                onRemove={() => {
                  // Cho phép xóa ảnh
                  return true;
                }}
              >
                {imageList.length < 6 && (
                  <Button type="text" icon={<GIcon name="add_a_photo" />}>
                    Tải lên ảnh
                  </Button>
                )}
              </Upload>
            </Form.Item>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <GIcon name="info" style={{ marginRight: 4 }} />
              Ảnh đầu tiên sẽ là ảnh chính. Tối đa 6 ảnh.
            </Text>
          </div>
        </Space>

        {/* Tabs cho kho hàng và công thức */}
        <Tabs items={tabItems} />
      </Form>

      {/* Modal thêm/sửa nguyên liệu */}
      <Modal
        open={recipeModalOpen}
        title={editingRecipe ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'}
        okText={editingRecipe ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
        onOk={handleSaveRecipe}
        onCancel={() => {
          recipeForm.resetFields();
          setEditingRecipe(null);
          setRecipeModalOpen(false);
        }}
      >
        <Spin spinning={loadingIngredients}>
          <Form form={recipeForm} layout="vertical">
            <Form.Item
              name="ingredientId"
              label="Chọn nguyên liệu"
              rules={[{ required: true, message: 'Vui lòng chọn nguyên liệu' }]}
            >
              <Select
                placeholder="Chọn nguyên liệu từ danh sách"
                options={
                  ingredients && ingredients.length > 0
                    ? ingredients.map((ing) => ({
                        label: ing.name,
                        value: ing._id,
                      }))
                    : []
                }
                onChange={(value) => {
                  // Tự động fill ingredientName khi chọn
                  const selectedIngredient = ingredients.find(
                    (ing) => ing._id === value
                  );
                  if (selectedIngredient) {
                    recipeForm.setFieldValue(
                      'ingredientName',
                      selectedIngredient.name
                    );
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="ingredientName"
              label="Tên nguyên liệu (tùy chọn)"
              rules={[]}
            >
              <Input placeholder="Tên nguyên liệu (tự động điền)" disabled />
            </Form.Item>

            <Form.Item
              name="quantity"
              label="Số lượng"
              rules={[
                { required: true, message: 'Vui lòng nhập số lượng' },
                {
                  type: 'number',
                  min: 0,
                  message: 'Số lượng phải lớn hơn 0',
                },
              ]}
            >
              <InputNumber
                placeholder="Nhập số lượng"
                min={0}
                step={0.01}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="unit"
              label="Đơn vị"
              rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
            >
              <Select
                placeholder="Chọn đơn vị"
                options={[
                  { label: 'Cái', value: 'cai' },
                  { label: 'Kg', value: 'kg' },
                  { label: 'Gram', value: 'gram' },
                  { label: 'Lít', value: 'lit' },
                  { label: 'Ml', value: 'ml' },
                  { label: 'Thìa', value: 'thia' },
                  { label: 'Tách', value: 'tach' },
                ]}
              />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
