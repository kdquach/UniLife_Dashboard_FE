import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  message,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  Switch,
} from "antd";
import dayjs from "dayjs";
import GIcon from "@/components/GIcon";
import {
  getAllProductCategories,
  getProductCategoryById,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from "@/services/productCategory.service";

const { Title, Text } = Typography;

export default function ProductCategoriesPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [form] = Form.useForm();

  // Fetch danh sách product categories
  const fetchList = async () => {
    setLoading(true);
    try {
      const response = await getAllProductCategories();
      setItems(response?.data?.categories || []);
    } catch (error) {
      messageApi.error(
        error?.response?.data?.message ||
          "Không thể tải danh sách danh mục sản phẩm",
      );
      console.error("Lỗi khi tải danh mục sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // Xử lý xem chi tiết
  const handleViewDetail = async (record) => {
    try {
      const response = await getProductCategoryById(record._id);
      setSelected(response?.data?.category);
      setDetailOpen(true);
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      messageApi.error("Không thể tải chi tiết danh mục");
    }
  };

  // Xử lý mở form tạo mới
  const handleCreate = () => {
    setFormMode("create");
    form.resetFields();
    setFormOpen(true);
  };

  // Xử lý mở form chỉnh sửa
  const handleEdit = (record) => {
    setFormMode("edit");
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      isActive: record.isActive,
    });
    setSelected(record);
    setFormOpen(true);
  };

  // Xử lý xóa
  const handleDelete = (record) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa danh mục "${record.name}"?`,
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteProductCategory(record._id);
          messageApi.success("Xóa danh mục thành công");
          fetchList();
        } catch (error) {
          messageApi.error(
            error?.response?.data?.message || "Không thể xóa danh mục",
          );
        }
      },
    });
  };

  // Xử lý submit form
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (formMode === "create") {
        await createProductCategory(values);
        messageApi.success("Tạo danh mục thành công");
      } else {
        await updateProductCategory(selected._id, values);
        messageApi.success("Cập nhật danh mục thành công");
      }

      setFormOpen(false);
      form.resetFields();
      fetchList();
    } catch (error) {
      if (error.errorFields) {
        messageApi.error("Vui lòng kiểm tra lại thông tin");
      } else {
        messageApi.error(error?.response?.data?.message || "Có lỗi xảy ra");
      }
    }
  };

  // Cột bảng
  const columns = useMemo(
    () => [
      {
        title: "Tên danh mục",
        dataIndex: "name",
        key: "name",
        sorter: (a, b) => a.name.localeCompare(b.name),
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
      },
      {
        title: "Trạng thái",
        dataIndex: "isActive",
        key: "isActive",
        width: 120,
        align: "center",
        render: (isActive) => (
          <Tag color={isActive ? "success" : "default"}>
            {isActive ? "Hoạt động" : "Không hoạt động"}
          </Tag>
        ),
        filters: [
          { text: "Hoạt động", value: true },
          { text: "Không hoạt động", value: false },
        ],
        onFilter: (value, record) => record.isActive === value,
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 160,
        render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
        sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      },
      {
        title: "Hành động",
        key: "actions",
        width: 100,
        align: "center",
        render: (_, record) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: "view",
                  label: "Xem chi tiết",
                  icon: <GIcon icon="eye" />,
                  onClick: () => handleViewDetail(record),
                },
                {
                  key: "edit",
                  label: "Chỉnh sửa",
                  icon: <GIcon icon="edit" />,
                  onClick: () => handleEdit(record),
                },
                {
                  type: "divider",
                },
                {
                  key: "delete",
                  label: "Xóa",
                  icon: <GIcon icon="delete" />,
                  danger: true,
                  onClick: () => handleDelete(record),
                },
              ],
            }}
            trigger={["click"]}
          >
            <Button type="text" icon={<GIcon icon="more_vert" />} />
          </Dropdown>
        ),
      },
    ],
    [],
  );

  return (
    <>
      {contextHolder}
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card>
          <Space
            style={{
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Title level={3} style={{ margin: 0 }}>
              Danh mục sản phẩm
            </Title>
            <Button
              type="primary"
              icon={<GIcon icon="add" />}
              onClick={handleCreate}
            >
              Thêm danh mục
            </Button>
          </Space>
        </Card>

        <Card>
          <Table
            loading={loading}
            dataSource={items}
            columns={columns}
            rowKey="_id"
            pagination={{
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} danh mục`,
            }}
          />
        </Card>
      </Space>

      {/* Modal chi tiết */}
      <Modal
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<GIcon icon="edit" />}
            onClick={() => {
              setDetailOpen(false);
              handleEdit(selected);
            }}
          >
            Chỉnh sửa
          </Button>,
        ]}
        title="Chi tiết danh mục sản phẩm"
        width={600}
      >
        {selected && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <Text strong>Tên danh mục:</Text>
              <div>{selected.name}</div>
            </div>
            <div>
              <Text strong>Mô tả:</Text>
              <div>{selected.description || "Không có"}</div>
            </div>
            <div>
              <Text strong>Trạng thái:</Text>
              <div>
                <Tag color={selected.isActive ? "success" : "default"}>
                  {selected.isActive ? "Hoạt động" : "Không hoạt động"}
                </Tag>
              </div>
            </div>
            <div>
              <Text strong>Ngày tạo:</Text>
              <div>{dayjs(selected.createdAt).format("DD/MM/YYYY HH:mm")}</div>
            </div>
            <div>
              <Text strong>Cập nhật lần cuối:</Text>
              <div>{dayjs(selected.updatedAt).format("DD/MM/YYYY HH:mm")}</div>
            </div>
          </Space>
        )}
      </Modal>

      {/* Modal form tạo/sửa */}
      <Modal
        open={formOpen}
        onCancel={() => {
          setFormOpen(false);
          form.resetFields();
        }}
        onOk={handleFormSubmit}
        title={
          formMode === "create" ? "Thêm danh mục mới" : "Chỉnh sửa danh mục"
        }
        okText={formMode === "create" ? "Tạo mới" : "Cập nhật"}
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            isActive: true,
          }}
        >
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[
              { required: true, message: "Vui lòng nhập tên danh mục" },
              { min: 2, message: "Tên danh mục phải có ít nhất 2 ký tự" },
            ]}
          >
            <Input placeholder="Nhập tên danh mục" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea
              placeholder="Nhập mô tả danh mục"
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
            <Switch
              checkedChildren="Hoạt động"
              unCheckedChildren="Không hoạt động"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
