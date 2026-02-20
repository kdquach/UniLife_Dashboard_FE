import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Dropdown,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
} from 'antd';
import dayjs from 'dayjs';
import GIcon from '@/components/GIcon';
import { useAuthStore } from '@/store/useAuthStore';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from '@/services/product.service';
import { getActiveProductCategories } from '@/services/productCategory.service';
import { getAllCanteens } from '@/services/canteen.service';
import { getAllIngredients } from '@/services/ingredient.service';
import { addMenuItem, createMenu, getMenus } from '@/services/menu.service';
import { STATUS_COLORS } from '@/config/constants';

const { Title, Text } = Typography;

const STATUS_OPTIONS = [
  { value: 'available', label: 'Có sẵn' },
  { value: 'unavailable', label: 'Tạm ngưng' },
  { value: 'out_of_stock', label: 'Hết hàng' },
  { value: 'hidden', label: 'Ẩn' },
];

const DEFAULT_PAGE_SIZE = 10;

export default function ProductsPage() {
  const { user } = useAuthStore();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [filterForm] = Form.useForm();
  const [form] = Form.useForm();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm] = Form.useForm();
  const [imageFileList, setImageFileList] = useState([]);
  const [imagesFileList, setImagesFileList] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [recipeList, setRecipeList] = useState([]);

  const role = user?.role || 'admin';
  const canDelete = role === 'admin';
  const staffCanteenId = user?.canteenId || user?.canteen?._id || null;

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
        error?.response?.data?.message || 'Không tải được dữ liệu danh mục'
      );
    }
  };

  const fetchList = async (options = {}) => {
    setLoading(true);
    try {
      const filters = filterForm.getFieldsValue();
      const params = {
        page: options.page || page,
        limit: options.pageSize || pageSize,
        search: filters.search || undefined,
        status: filters.status || undefined,
        categoryId: filters.categoryId || undefined,
        canteenId: filters.canteenId || staffCanteenId || undefined,
        isPopular:
          filters.isPopular === undefined ? undefined : filters.isPopular,
        isNew: filters.isNew === undefined ? undefined : filters.isNew,
        sort: filters.sort || undefined,
      };

      const response = await getAllProducts(params);
      const data = response?.data || [];

      setItems(Array.isArray(data) ? data : data?.products || []);
      setPage(response?.pagination?.page || params.page || 1);
      setPageSize(response?.pagination?.limit || params.limit || pageSize);
      setTotal(response?.pagination?.total || 0);

      if (Array.isArray(data) && data.length === 0 && params.page > 1) {
        await fetchList({ page: params.page - 1, pageSize: params.limit });
      }
    } catch (error) {
      messageApi.error(
        error?.response?.data?.message || 'Không tải được danh sách món'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookups();
    fetchList();
  }, []);

  const handleViewDetail = async (record) => {
    try {
      const response = await getProductById(record._id);
      setSelected(response?.data?.product || null);
      setDetailOpen(true);
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      messageApi.error('Không thể tải chi tiết món');
    }
  };

  const handleCreate = () => {
    setFormMode('create');
    form.resetFields();
    setImageFileList([]);
    setImagesFileList([]);
    setRecipeList([]);
    form.setFieldsValue({
      status: 'available',
      isPopular: false,
      isNew: false,
      lowStockThreshold: 10,
      stockQuantity: 0,
      canteenId: staffCanteenId || undefined,
    });
    setFormOpen(true);
  };

  const handleEdit = (record) => {
    setFormMode('edit');
    setImageFileList([]);
    setImagesFileList([]);
    setRecipeList(record.recipe || []);
    form.setFieldsValue({
      name: record.name,
      price: record.price,
      originalPrice: record.originalPrice,
      categoryId: record.categoryId?._id || record.categoryId,
      canteenId: record.canteenId?._id || record.canteenId,
      status: record.status,
      description: record.description,
      isPopular: record.isPopular,
      isNew: record.isNew,
      stockQuantity: record.stockQuantity,
      lowStockThreshold: record.lowStockThreshold,
      calories: record.calories,
      preparationTime: record.preparationTime,
    });
    setSelected(record);
    setFormOpen(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa món "${record.name}"?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteProduct(record._id);
          messageApi.success('Xóa món thành công');
          fetchList();
        } catch (error) {
          messageApi.error(
            error?.response?.data?.message || 'Không thể xóa món'
          );
        }
      },
    });
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        ...values,
        image: imageFileList?.[0],
        images: imagesFileList || [],
        recipe: recipeList,
      };

      if (formMode === 'create') {
        await createProduct(payload);
        messageApi.success('Tạo món thành công');
      } else {
        await updateProduct(selected._id, payload);
        messageApi.success('Cập nhật món thành công');
      }

      setFormOpen(false);
      form.resetFields();
      setSelected(null);
      setImageFileList([]);
      setImagesFileList([]);
      setRecipeList([]);
      fetchList();
    } catch (error) {
      if (error?.errorFields) {
        messageApi.error('Vui lòng kiểm tra lại thông tin');
      } else {
        messageApi.error(error?.response?.data?.message || 'Có lỗi xảy ra');
      }
    }
  };

  // Chức năng thêm nguyên liệu vào recipe
  const handleAddRecipeIngredient = (ingredientId) => {
    const ingredient = ingredients.find((i) => i._id === ingredientId);
    if (!ingredient) return;

    // Kiểm tra nguyên liệu đã tồn tại
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

  // Cập nhật thông tin nguyên liệu trong recipe
  const handleUpdateRecipeIngredient = (index, field, value) => {
    const updatedRecipe = [...recipeList];
    updatedRecipe[index] = {
      ...updatedRecipe[index],
      [field]: value,
    };
    setRecipeList(updatedRecipe);
  };

  const handleAssignMenu = (record) => {
    setSelected(record);
    assignForm.setFieldsValue({
      date: dayjs(),
      canteenId: staffCanteenId || undefined,
    });
    setAssignOpen(true);
  };

  const submitAssignMenu = async () => {
    try {
      const values = await assignForm.validateFields();
      const canteenId = values.canteenId || staffCanteenId;

      if (!canteenId) {
        messageApi.error('Vui lòng chọn căng tin');
        return;
      }

      const dateValue = values.date?.startOf('day').toISOString();
      const menuResponse = await getMenus({
        canteenId,
        date: values.date?.format('YYYY-MM-DD'),
      });
      const menus = menuResponse?.data?.menus || [];
      let menu = menus[0];

      if (!menu) {
        const created = await createMenu({
          canteenId,
          date: dateValue,
          status: 'draft',
        });
        menu = created?.data?.menu;
      }

      await addMenuItem(menu._id, {
        productId: selected._id,
        order: values.order || 0,
      });

      messageApi.success('Đã gán món vào menu');
      setAssignOpen(false);
      assignForm.resetFields();
    } catch (error) {
      messageApi.error(
        error?.response?.data?.message || 'Không thể gán món vào menu'
      );
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'Tên món',
        dataIndex: 'name',
        key: 'name',
        render: (value) => <Text strong>{value}</Text>,
      },
      {
        title: 'Danh mục',
        dataIndex: 'categoryId',
        key: 'categoryId',
        render: (category) => category?.name || '—',
      },
      {
        title: 'Giá',
        dataIndex: 'price',
        key: 'price',
        align: 'right',
        render: (value) =>
          value !== undefined
            ? `${Number(value).toLocaleString('vi-VN')}đ`
            : '—',
      },
      {
        title: 'Tồn kho',
        dataIndex: 'stockQuantity',
        key: 'stockQuantity',
        align: 'center',
        render: (value) => (
          <Badge
            count={value}
            style={{ backgroundColor: '#ff5532' }}
            overflowCount={999}
          />
        ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        render: (status) => (
          <Tag color={STATUS_COLORS[status] || 'default'}>
            {STATUS_OPTIONS.find((item) => item.value === status)?.label ||
              status}
          </Tag>
        ),
      },
      {
        title: 'Cập nhật',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        render: (value) => dayjs(value).format('DD/MM/YYYY HH:mm'),
      },
      {
        title: 'Hành động',
        key: 'actions',
        width: 140,
        fixed: 'right',
        align: 'center',
        render: (_, record) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'view',
                  label: 'Xem chi tiết',
                  icon: <GIcon name="visibility" />,
                  onClick: () => handleViewDetail(record),
                },
                {
                  key: 'edit',
                  label: 'Chỉnh sửa',
                  icon: <GIcon name="edit" />,
                  onClick: () => handleEdit(record),
                },
                {
                  key: 'assign',
                  label: 'Gán vào menu',
                  icon: <GIcon name="playlist_add" />,
                  onClick: () => handleAssignMenu(record),
                },
                canDelete
                  ? {
                      type: 'divider',
                    }
                  : null,
                canDelete
                  ? {
                      key: 'delete',
                      label: 'Xóa',
                      icon: <GIcon name="delete" />,
                      danger: true,
                      onClick: () => handleDelete(record),
                    }
                  : null,
              ].filter(Boolean),
            }}
          >
            <Button type="text" icon={<GIcon name="more_horiz" />} />
          </Dropdown>
        ),
      },
    ],
    [canDelete, categories]
  );

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
                Quản lý món
              </Title>
              <Text type="secondary">
                Xem, tạo, cập nhật và gán món vào menu
              </Text>
            </div>
            <Button type="primary" onClick={handleCreate}>
              Tạo món mới
            </Button>
          </Space>
        </Card>

        <Card>
          <Form
            form={filterForm}
            layout="vertical"
            initialValues={{ status: '', sort: '-createdAt' }}
            onValuesChange={() => fetchList({ page: 1 })}
          >
            <Row gutter={[16, 12]}>
              <Col xs={24} md={8} lg={6}>
                <Form.Item name="search" label="Tìm kiếm">
                  <Input placeholder="Tên món" allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} md={8} lg={6}>
                <Form.Item name="status" label="Trạng thái">
                  <Select
                    placeholder="Tất cả"
                    allowClear
                    options={STATUS_OPTIONS}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8} lg={6}>
                <Form.Item name="categoryId" label="Danh mục">
                  <Select
                    placeholder="Tất cả"
                    allowClear
                    options={categories.map((item) => ({
                      value: item._id,
                      label: item.name,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8} lg={6}>
                <Form.Item name="canteenId" label="Căng tin">
                  <Select
                    placeholder={
                      staffCanteenId ? 'Căng tin hiện tại' : 'Tất cả'
                    }
                    allowClear={role === 'admin'}
                    disabled={role !== 'admin'}
                    options={canteens.map((item) => ({
                      value: item._id,
                      label: item.name,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8} lg={6}>
                <Form.Item name="isPopular" label="Phổ biến">
                  <Select
                    placeholder="Tất cả"
                    allowClear
                    options={[
                      { value: true, label: 'Phổ biến' },
                      { value: false, label: 'Không' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8} lg={6}>
                <Form.Item name="isNew" label="Mới">
                  <Select
                    placeholder="Tất cả"
                    allowClear
                    options={[
                      { value: true, label: 'Mới' },
                      { value: false, label: 'Không' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8} lg={6}>
                <Form.Item name="sort" label="Sắp xếp">
                  <Select
                    options={[
                      { value: '-createdAt', label: 'Mới nhất' },
                      { value: 'createdAt', label: 'Cũ nhất' },
                      { value: 'price', label: 'Giá tăng' },
                      { value: '-price', label: 'Giá giảm' },
                      { value: 'name', label: 'Tên A-Z' },
                      { value: '-name', label: 'Tên Z-A' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8} lg={6}>
                <Form.Item label="Làm mới">
                  <Button
                    onClick={() => {
                      filterForm.resetFields();
                      fetchList({ page: 1 });
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <Card>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={items}
            loading={loading}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (nextPage, nextPageSize) =>
                fetchList({ page: nextPage, pageSize: nextPageSize }),
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </Space>

      <Drawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={520}
        title="Chi tiết món"
      >
        {selected ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Title level={4} style={{ marginBottom: 4 }}>
                {selected.name}
              </Title>
              <Text type="secondary">{selected.description || '—'}</Text>
            </div>
            <Tag color={STATUS_COLORS[selected.status] || 'default'}>
              {STATUS_OPTIONS.find((item) => item.value === selected.status)
                ?.label || selected.status}
            </Tag>
            <div>
              <Text strong>Giá: </Text>
              <Text>
                {Number(selected.price || 0).toLocaleString('vi-VN')}đ
              </Text>
            </div>
            <div>
              <Text strong>Danh mục: </Text>
              <Text>{selected.categoryId?.name || '—'}</Text>
            </div>
            <div>
              <Text strong>Căng tin: </Text>
              <Text>{selected.canteenId?.name || '—'}</Text>
            </div>
            <div>
              <Text strong>Tồn kho: </Text>
              <Text>{selected.stockQuantity}</Text>
            </div>
            <div>
              <Text strong>Ngưỡng tồn thấp: </Text>
              <Text>{selected.lowStockThreshold}</Text>
            </div>
            <div>
              <Text strong>Phổ biến: </Text>
              <Text>{selected.isPopular ? 'Có' : 'Không'}</Text>
            </div>
            <div>
              <Text strong>Mới: </Text>
              <Text>{selected.isNew ? 'Có' : 'Không'}</Text>
            </div>
            <div>
              <Text strong>Calories: </Text>
              <Text>{selected.calories || '—'}</Text>
            </div>
            <div>
              <Text strong>Thời gian chuẩn bị: </Text>
              <Text>{selected.preparationTime || '—'} phút</Text>
            </div>
          </Space>
        ) : (
          <Text type="secondary">Không có dữ liệu</Text>
        )}
      </Drawer>

      <Modal
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        title={formMode === 'create' ? 'Tạo món' : 'Cập nhật món'}
        width={900}
        okText={formMode === 'create' ? 'Tạo' : 'Lưu'}
        onOk={handleFormSubmit}
        cancelText="Hủy"
        destroyOnClose={true}
        forceRender={false}
        scroll={{ y: 600 }}
      >
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
                <Select options={STATUS_OPTIONS} />
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
                      <Form.Item name="stockQuantity" label="Tồn kho hiện tại">
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
        </Form>
      </Modal>

      <Modal
        open={assignOpen}
        onCancel={() => setAssignOpen(false)}
        title="Gán món vào menu"
        okText="Gán"
        cancelText="Hủy"
        onOk={submitAssignMenu}
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="date"
            label="Ngày"
            rules={[{ required: true, message: 'Chọn ngày' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
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
          <Form.Item name="order" label="Thứ tự hiển thị">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
