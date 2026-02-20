import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Dropdown,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import GIcon from '@/components/GIcon';
import { useAuthStore } from '@/store/useAuthStore';
import {
  deleteProduct,
  getAllProducts,
  getProductById,
} from '@/services/product.service';
import { getActiveProductCategories } from '@/services/productCategory.service';
import { getAllCanteens } from '@/services/canteen.service';
import { STATUS_COLORS } from '@/config/constants';

const { Title, Text } = Typography;

const STATUS_OPTIONS = [
  { value: 'available', label: 'Có sẵn' },
  { value: 'unavailable', label: 'Tạm ngưng' },
  { value: 'out_of_stock', label: 'Hết hàng' },
  { value: 'hidden', label: 'Ẩn' },
];

const DEFAULT_PAGE_SIZE = 10;

export default function ProductPage() {
  const navigate = useNavigate();
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
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const role = user?.role || 'admin';
  const canDelete = role === 'admin';
  const staffCanteenId = user?.canteenId || user?.canteen?._id || null;

  // Lấy danh sách danh mục và căng tin
  const fetchLookups = async () => {
    try {
      const canteenFallback = staffCanteenId
        ? [{ _id: staffCanteenId, name: user?.canteen?.name || 'Căng tin' }]
        : [];

      const [categoryRes, canteenRes] = await Promise.all([
        getActiveProductCategories(),
        role === 'admin'
          ? getAllCanteens({ status: 'active' })
          : Promise.resolve({ data: { canteens: canteenFallback } }),
      ]);
      setCategories(categoryRes?.data?.categories || []);
      setCanteens(canteenRes?.data?.canteens || []);
    } catch (error) {
      messageApi.error(
        error?.response?.data?.message || 'Không tải được dữ liệu danh mục'
      );
    }
  };

  // Lấy danh sách sản phẩm
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

  // Xem chi tiết sản phẩm
  const handleViewDetail = async (record) => {
    try {
      const response = await getProductById(record._id);
      setSelected(response?.data?.product || null);
      setDetailOpen(true);
    } catch (error) {
      messageApi.error('Không thể tải chi tiết món');
    }
  };

  // Xóa sản phẩm
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
                  onClick: () => navigate(`/staff/product/${record._id}/edit`),
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
              <Text type="secondary">Xem, tạo, cập nhật sản phẩm</Text>
            </div>
            <Button
              type="primary"
              onClick={() => navigate('/staff/product/create')}
            >
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

      {/* Chi tiết sản phẩm */}
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
    </div>
  );
}
