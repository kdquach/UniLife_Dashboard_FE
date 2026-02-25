import { useEffect, useMemo, useState, useCallback } from "react";
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
  getAllIngredientCategories,
  getIngredientCategoryById,
  createIngredientCategory,
  updateIngredientCategory,
  deleteIngredientCategory,
} from "@/services/ingredientCategory.service";

const { Title, Text } = Typography;

export default function IngredientCategoriesPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [form] = Form.useForm();

  // Fetch danh sách ingredient categories
  const fetchList = useCallback(
    async (page = 1, pageSize = 10) => {
      setLoading(true);
      try {
        const response = await getAllIngredientCategories({
          page,
          limit: pageSize,
        });
        setItems(response?.data || []);
        if (response?.pagination) {
          setPagination({
            current: response.pagination.page,
            pageSize: response.pagination.limit,
            total: response.pagination.total,
          });
        }
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message ||
            "Không thể tải danh sách nhóm nguyên liệu",
        );
        console.error("Lỗi khi tải nhóm nguyên liệu:", error);
      } finally {
        setLoading(false);
      }
    },
    [messageApi],
  );

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Xử lý xem chi tiết
  const handleViewDetail = useCallback(
    async (record) => {
      try {
        const response = await getIngredientCategoryById(record._id);
        setSelected(response?.data);
        setDetailOpen(true);
        // eslint-disable-next-line no-unused-vars
      } catch (error) {
        messageApi.error("Không thể tải chi tiết nhóm nguyên liệu");
      }
    },
    [messageApi],
  );

  // Xử lý mở form tạo mới
  const handleCreate = () => {
    setFormMode("create");
    form.resetFields();
    setFormOpen(true);
  };

  // Xử lý mở form chỉnh sửa
  const handleEdit = useCallback(
    (record) => {
      setFormMode("edit");
      form.setFieldsValue({
        name: record.name,
        description: record.description,
        isActive: record.isActive,
      });
      setSelected(record);
      setFormOpen(true);
    },
    [form],
  );

  // Xử lý xóa
  const handleDelete = useCallback(
    (record) => {
      Modal.confirm({
        title: "Xác nhận xóa",
        content: `Bạn có chắc chắn muốn xóa nhóm nguyên liệu "${record.name}"?`,
        okText: "Xóa",
        cancelText: "Hủy",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await deleteIngredientCategory(record._id);
            messageApi.success("Xóa nhóm nguyên liệu thành công");
            fetchList();
          } catch (error) {
            messageApi.error(
              error?.response?.data?.message ||
                "Không thể xóa nhóm nguyên liệu",
            );
          }
        },
      });
    },
    [messageApi, fetchList],
  );

  // Xử lý submit form
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (formMode === "create") {
        await createIngredientCategory(values);
        messageApi.success("Tạo nhóm nguyên liệu thành công");
      } else {
        await updateIngredientCategory(selected._id, values);
        messageApi.success("Cập nhật nhóm nguyên liệu thành công");
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
        title: "Tên nhóm",
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
          <Tag color={isActive ? "success" : "warning"}>
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
                  icon: <GIcon name="visibility" />,
                  onClick: () => handleViewDetail(record),
                },
                {
                  key: "edit",
                  label: "Chỉnh sửa",
                  icon: <GIcon name="edit" />,
                  onClick: () => handleEdit(record),
                },
                {
                  type: "divider",
                },
                {
                  key: "delete",
                  label: "Xóa",
                  icon: <GIcon name="delete" />,
                  danger: true,
                  onClick: () => handleDelete(record),
                },
              ],
            }}
            trigger={["click"]}
          >
            <Button type="text" icon={<GIcon name="more_vert" />} />
          </Dropdown>
        ),
      },
    ],
    [handleViewDetail, handleEdit, handleDelete],
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
              Nhóm nguyên liệu
            </Title>
            <Button
              type="primary"
              icon={<GIcon name="add" />}
              onClick={handleCreate}
            >
              Thêm nhóm nguyên liệu
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
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} nhóm nguyên liệu`,
              onChange: (page, pageSize) => {
                fetchList(page, pageSize);
              },
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
            icon={<GIcon name="edit" />}
            onClick={() => {
              setDetailOpen(false);
              handleEdit(selected);
            }}
          >
            Chỉnh sửa
          </Button>,
        ]}
        title="Chi tiết nhóm nguyên liệu"
        width={600}
      >
        {selected && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <Text strong>Tên nhóm:</Text>
              <div>{selected.name}</div>
            </div>
            <div>
              <Text strong>Mô tả:</Text>
              <div>{selected.description || "Không có"}</div>
            </div>
            <div>
              <Text strong>Trạng thái:</Text>
              <div>
                <Tag color={selected.isActive ? "success" : "warning"}>
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
          formMode === "create"
            ? "Thêm nhóm nguyên liệu mới"
            : "Chỉnh sửa nhóm nguyên liệu"
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
            label="Tên nhóm"
            rules={[
              { required: true, message: "Vui lòng nhập tên nhóm" },
              { min: 2, message: "Tên nhóm phải có ít nhất 2 ký tự" },
            ]}
          >
            <Input placeholder="Nhập tên nhóm nguyên liệu" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea
              placeholder="Nhập mô tả nhóm nguyên liệu"
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
