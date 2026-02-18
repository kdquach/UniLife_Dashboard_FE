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

  const fetchList = async (page = 1, pageSize = 10) => {
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
  };

  useEffect(() => {
    fetchList();
  }, []);

  const columns = useMemo(
    () => [
      {
        title: "Tên nhóm",
        dataIndex: "name",
        key: "name",
        render: (value) => <Text strong>{value}</Text>,
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        key: "description",
        render: (value) => value || "—",
      },
      {
        title: "Cập nhật",
        dataIndex: "updatedAt",
        key: "updatedAt",
        render: (value) => dayjs(value).format("DD/MM/YYYY HH:mm"),
      },
      {
        title: "Trạng thái",
        key: "status",
        render: () => <Tag color="green">Active</Tag>,
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 88,
        fixed: "right",
        align: "center",
        render: (_, record) => {
          const actions = [
            {
              key: "view",
              label: (
                <span style={{ color: "var(--text-muted)" }}>
                  <GIcon name="visibility" style={{ marginRight: 8 }} />
                  Xem
                </span>
              ),
              onClick: async () => {
                try {
                  const response = await getIngredientCategoryById(record._id);
                  setSelected(response?.data);
                  setDetailOpen(true);
                } catch (error) {
                  messageApi.error("Không thể tải chi tiết nhóm nguyên liệu");
                }
              },
            },
            {
              key: "edit",
              label: (
                <span style={{ color: "var(--text-muted)" }}>
                  <GIcon name="edit" style={{ marginRight: 8 }} />
                  Sửa
                </span>
              ),
              onClick: () => {
                setFormMode("edit");
                form.setFieldsValue({
                  name: record.name,
                  description: record.description,
                });
                setSelected(record);
                setFormOpen(true);
              },
            },
            {
              key: "delete",
              label: (
                <span>
                  <GIcon name="delete" style={{ marginRight: 8 }} />
                  Xóa
                </span>
              ),
              danger: true,
              onClick: () => {
                Modal.confirm({
                  title: "Xóa nhóm nguyên liệu?",
                  content: "Thao tác này không thể hoàn tác.",
                  okText: "Xóa",
                  okButtonProps: { danger: true },
                  cancelText: "Hủy",
                  onOk: async () => {
                    try {
                      await deleteIngredientCategory(record._id);
                      messageApi.success("Đã xóa nhóm nguyên liệu");
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
            },
          ];

          if (actions.length > 2) {
            return (
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: actions.map((action) => ({
                    key: action.key,
                    label: action.label,
                    danger: action.danger,
                    onClick: action.onClick,
                  })),
                }}
              >
                <Button
                  type="text"
                  style={{ color: "var(--text-muted)" }}
                  icon={<GIcon name="more_horiz" />}
                />
              </Dropdown>
            );
          }

          return (
            <Space size={4}>
              {actions.map((action) => (
                <Button
                  key={action.key}
                  type="text"
                  danger={action.danger}
                  onClick={action.onClick}
                  style={{
                    color: action.danger ? undefined : "var(--text-muted)",
                  }}
                  icon={
                    <GIcon
                      name={action.key === "view" ? "visibility" : "edit"}
                    />
                  }
                />
              ))}
            </Space>
          );
        },
      },
    ],
    [form, messageApi],
  );

  const openCreateForm = () => {
    setFormMode("create");
    form.resetFields();
    setSelected(null);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (formMode === "create") {
        await createIngredientCategory(values);
        messageApi.success("Đã tạo nhóm nguyên liệu");
      } else if (selected?._id) {
        await updateIngredientCategory(selected._id, values);
        messageApi.success("Đã cập nhật nhóm nguyên liệu");
      }
      setFormOpen(false);
      fetchList();
    } catch (err) {
      if (!err?.errorFields) {
        messageApi.error("Không thể lưu dữ liệu");
      }
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {contextHolder}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Nhóm nguyên liệu
          </Title>
          <Text type="secondary">Quản lý danh sách nhóm nguyên liệu</Text>
        </div>
        <Button
          type="primary"
          icon={<GIcon name="add" />}
          onClick={openCreateForm}
        >
          Tạo mới
        </Button>
      </div>

      <Card>
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={items}
          loading={loading}
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
        <style>{`
          :where(.ant-table) .ant-table-tbody > tr:hover > td {
            background: rgba(15, 35, 46, 0.02);
          }
        `}</style>
      </Card>

      <Modal
        title="Chi tiết nhóm nguyên liệu"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={520}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <Text type="secondary">Tên nhóm</Text>
            <div style={{ fontWeight: 600 }}>{selected?.name || "—"}</div>
          </div>
          <div>
            <Text type="secondary">Mô tả</Text>
            <div>{selected?.description || "—"}</div>
          </div>
          <div>
            <Text type="secondary">Tạo lúc</Text>
            <div>
              {selected?.createdAt
                ? dayjs(selected.createdAt).format("DD/MM/YYYY HH:mm")
                : "—"}
            </div>
          </div>
          <div>
            <Text type="secondary">Cập nhật</Text>
            <div>
              {selected?.updatedAt
                ? dayjs(selected.updatedAt).format("DD/MM/YYYY HH:mm")
                : "—"}
            </div>
          </div>
          <div>
            <Text type="secondary">Trạng thái</Text>
            <div>
              <Tag color="green">Active</Tag>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title={
          formMode === "create"
            ? "Tạo nhóm nguyên liệu"
            : "Cập nhật nhóm nguyên liệu"
        }
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={handleSubmit}
        okText={formMode === "create" ? "Tạo" : "Lưu"}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Tên nhóm"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên nhóm" }]}
            style={{ marginBottom: 16 }}
          >
            <Input placeholder="Ví dụ: Gia vị" />
          </Form.Item>
          <Form.Item
            label="Mô tả"
            name="description"
            style={{ marginBottom: 0 }}
          >
            <Input.TextArea placeholder="Mô tả ngắn" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
