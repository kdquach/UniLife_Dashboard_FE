import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Space,
  Switch,
  Tabs,
  Table,
  Typography,
  Upload,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import GIcon from '@/components/GIcon';
import { useAuthStore } from '@/store/useAuthStore';
import { createProduct } from '@/services/product.service';
import { getActiveProductCategories } from '@/services/productCategory.service';
import { getAllCanteens } from '@/services/canteen.service';
import { getAllIngredients } from '@/services/ingredient.service';

const { Title, Text } = Typography;

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [imageFileList, setImageFileList] = useState([]);
  const [imagesFileList, setImagesFileList] = useState([]);
  const [recipeList, setRecipeList] = useState([]);

  const role = user?.role || 'admin';
  const staffCanteenId = user?.canteenId || user?.canteen?._id || null;

  // Lấy dữ liệu lookup
  const fetchLookups = async () => {
    try {
      const canteenFallback = staffCanteenId
        ? [{ _id: staffCanteenId, name: user?.canteen?.name || 'Căng tin' }]
        : [];

      const [categoryRes, canteenRes, ingredientRes] = await Promise.all([
        getActiveProductCategories(),
        role === 'admin'
          ? getAllCanteens({ status: 'active' })
          : Promise.resolve({ data: { canteens: canteenFallback } }),
        getAllIngredients({ limit: 1000 }),
      ]);
      setCategories(categoryRes?.data?.categories || []);
      setCanteens(canteenRes?.data?.canteens || []);
      setIngredients(ingredientRes?.data?.ingredients || []);
    } catch (error) {
      messageApi.error(
        error?.response?.data?.message || 'Không tải được dữ liệu'
      );
    }
  };

  useEffect(() => {
    fetchLookups();
    // Thiết lập giá trị mặc định
    form.setFieldsValue({
      status: 'available',
      isPopular: false,
      isNew: false,
      lowStockThreshold: 10,
      stockQuantity: 0,
      canteenId: staffCanteenId || undefined,
    });
  }, []);

  // Thêm nguyên liệu vào recipe
  const handleAddRecipeIngredient = (ingredientId) => {
    const ingredient = ingredients.find((i) => i._id === ingredientId);
    if (!ingredient) return;

    if (recipeList.some((r) => r.ingredientId === ingredientId)) {
      messageApi.warning('Nguyên liệu đã tồn tại trong công thức');
      return;
    }

    setRecipeList([
      ...recipeList,
      {
        ingredientId,
        ingredientName: ingredient.name,
        quantity: 1,
        unit: ingredient.unit || '',
      },
    ]);
  };

  // Xóa nguyên liệu khỏi recipe
  const handleRemoveRecipeIngredient = (index) => {
    setRecipeList(recipeList.filter((_, i) => i !== index));
  };

  // Cập nhật nguyên liệu trong recipe
  const handleUpdateRecipeIngredient = (index, field, value) => {
    const updatedRecipe = [...recipeList];
    updatedRecipe[index] = {
      ...updatedRecipe[index],
      [field]: value,
    };
    setRecipeList(updatedRecipe);
  };

  // Submit form
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const payload = {
        ...values,
        image: imageFileList?.[0],
        images: imagesFileList || [],
        recipe: recipeList,
      };

      await createProduct(payload);
      messageApi.success('Tạo món thành công');

      // Quay về trang danh sách
      setTimeout(() => {
        navigate('/staff/product');
      }, 1000);
    } catch (error) {
      if (error?.errorFields) {
        messageApi.error('Vui lòng kiểm tra lại thông tin');
      } else {
        messageApi.error(error?.response?.data?.message || 'Có lỗi xảy ra');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {contextHolder}
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <Card>
          <Space
            align="start"
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <div>
              <Title level={3} style={{ margin: 0 }}>
                Tạo món mới
              </Title>
              <Text type="secondary">Nhập thông tin để tạo món ăn mới</Text>
            </div>
            <Button onClick={() => navigate('/staff/product')}>Quay lại</Button>
          </Space>
        </Card>

        <Card>
          <Form form={form} layout="vertical">
            {/* Phần thông tin cơ bản */}
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="name"
                  label="Tên món"
                  rules={[{ required: true, message: 'Nhập tên món' }]}
                >
                  <Input placeholder="Tên món" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="categoryId"
                  label="Danh mục"
                  rules={[{ required: true, message: 'Chọn danh mục' }]}
                >
                  <Select
                    placeholder="Chọn danh mục"
                    options={categories.map((item) => ({
                      value: item._id,
                      label: item.name,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="canteenId"
                  label="Căng tin"
                  rules={[{ required: true, message: 'Chọn căng tin' }]}
                >
                  <Select
                    placeholder="Chọn căng tin"
                    disabled={role !== 'admin'}
                    options={canteens.map((item) => ({
                      value: item._id,
                      label: item.name,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[{ required: true, message: 'Chọn trạng thái' }]}
                >
                  <Select
                    options={[
                      { value: 'available', label: 'Có sẵn' },
                      { value: 'unavailable', label: 'Tạm ngưng' },
                      { value: 'out_of_stock', label: 'Hết hàng' },
                      { value: 'hidden', label: 'Ẩn' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="price"
                  label="Giá"
                  rules={[{ required: true, message: 'Nhập giá' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    }
                    parser={(value) => value.replace(/\D/g, '')}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="originalPrice" label="Giá gốc">
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    }
                    parser={(value) => value.replace(/\D/g, '')}
                  />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="description" label="Mô tả">
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="isPopular"
                  label="Phổ biến"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="isNew" label="Mới" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Ảnh đại diện">
                  <Upload
                    listType="picture"
                    maxCount={1}
                    beforeUpload={() => false}
                    accept="image/*"
                    fileList={imageFileList}
                    onChange={(info) => setImageFileList(info.fileList)}
                  >
                    <Button icon={<GIcon name="upload" />}>Chọn ảnh</Button>
                  </Upload>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Ảnh khác">
                  <Upload
                    listType="picture"
                    multiple
                    maxCount={5}
                    beforeUpload={() => false}
                    accept="image/*"
                    fileList={imagesFileList}
                    onChange={(info) => setImagesFileList(info.fileList)}
                  >
                    <Button icon={<GIcon name="upload" />}>Chọn ảnh</Button>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>

            {/* Tabs cho Recipe và Stock */}
            <Tabs
              style={{ marginTop: 24 }}
              items={[
                {
                  key: 'recipe',
                  label: 'Công thức chế biến',
                  children: (
                    <Form.Item label="Nguyên liệu">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Select
                          placeholder="Chọn nguyên liệu để thêm"
                          options={ingredients
                            .filter(
                              (ing) =>
                                !recipeList.some(
                                  (r) => r.ingredientId === ing._id
                                )
                            )
                            .map((item) => ({
                              value: item._id,
                              label: item.name,
                            }))}
                          onChange={handleAddRecipeIngredient}
                        />
                        {recipeList.length > 0 && (
                          <Table
                            columns={[
                              {
                                title: 'Nguyên liệu',
                                dataIndex: 'ingredientName',
                                key: 'ingredientName',
                              },
                              {
                                title: 'Số lượng',
                                dataIndex: 'quantity',
                                key: 'quantity',
                                width: 100,
                                render: (value, _, index) => (
                                  <InputNumber
                                    value={value}
                                    min={0}
                                    step={0.1}
                                    onChange={(val) =>
                                      handleUpdateRecipeIngredient(
                                        index,
                                        'quantity',
                                        val
                                      )
                                    }
                                  />
                                ),
                              },
                              {
                                title: 'Đơn vị',
                                dataIndex: 'unit',
                                key: 'unit',
                                width: 100,
                                render: (value, _, index) => (
                                  <Input
                                    value={value}
                                    onChange={(e) =>
                                      handleUpdateRecipeIngredient(
                                        index,
                                        'unit',
                                        e.target.value
                                      )
                                    }
                                    placeholder="kg, lít..."
                                  />
                                ),
                              },
                              {
                                title: 'Hành động',
                                key: 'action',
                                width: 80,
                                render: (_, __, index) => (
                                  <Button
                                    type="text"
                                    danger
                                    onClick={() =>
                                      handleRemoveRecipeIngredient(index)
                                    }
                                    icon={<GIcon name="delete" />}
                                  />
                                ),
                              },
                            ]}
                            dataSource={recipeList}
                            pagination={false}
                            rowKey={(_, index) => index}
                            size="small"
                          />
                        )}
                      </Space>
                    </Form.Item>
                  ),
                },
                {
                  key: 'stock',
                  label: 'Quản lý tồn kho',
                  children: (
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="stockQuantity"
                          label="Tồn kho hiện tại"
                        >
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="lowStockThreshold"
                          label="Ngưỡng tồn thấp"
                        >
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="calories" label="Calories (kcal)">
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="preparationTime"
                          label="Thời gian chuẩn bị (phút)"
                        >
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                      </Col>
                    </Row>
                  ),
                },
              ]}
            />

            {/* Nút submit */}
            <Row gutter={16} style={{ marginTop: 24 }}>
              <Col>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleSubmit}
                  loading={loading}
                >
                  Tạo món
                </Button>
              </Col>
              <Col>
                <Button size="large" onClick={() => navigate('/staff/product')}>
                  Hủy
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>
      </Space>
    </div>
  );
}
