import { useEffect, useMemo, useState } from "react";
import {
  FilterOutlined,
  PlusOutlined,
  PoweroffOutlined,
  RedoOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useAuthStore } from "@/store/useAuthStore";
import { getAllCanteens } from "@/services/canteen.service";
import { useSystemNotificationManagement } from "@/hooks/useSystemNotificationManagement";

export default function NotificationPage() {
  const { Text, Paragraph } = Typography;
  const { user } = useAuthStore();
  const [filterForm] = Form.useForm();
  const [form] = Form.useForm();

  const role = String(user?.role || "").toLowerCase();
  const canManageSystemNotifications = role === "manager" || role === "admin";

  const {
    contextHolder,
    loading,
    saving,
    items,
    pagination,
    detail,
    selectedId,
    filters,
    setSelectedId,
    setFilters,
    fetchList,
    fetchDetail,
    createItem,
    updateItem,
    quickToggleStatus,
  } = useSystemNotificationManagement(user);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [canteenOptions, setCanteenOptions] = useState([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const availableTargetRoles = useMemo(() => {
    if (role === "manager") {
      return ["staff"];
    }

    if (role === "admin") {
      return ["manager", "customer"];
    }

    return [];
  }, [role]);

  const ROLE_META = useMemo(
    () => ({
      all: { label: "Tất cả vai trò", color: "default" },
      manager: { label: "Quản lý", color: "blue" },
      staff: { label: "Nhân viên", color: "cyan" },
      customer: { label: "Khách hàng", color: "gold" },
      admin: { label: "Quản trị viên", color: "purple" },
    }),
    [],
  );

  const TARGET_ROLE_OPTIONS = useMemo(
    () => availableTargetRoles.map((targetRole) => ({
      value: targetRole,
      label: ROLE_META[targetRole]?.label || targetRole,
    })),
    [ROLE_META, availableTargetRoles],
  );

  const FILTER_TARGET_ROLE_OPTIONS = useMemo(
    () => [
      { value: "all", label: ROLE_META.all.label },
      ...TARGET_ROLE_OPTIONS,
    ],
    [ROLE_META.all.label, TARGET_ROLE_OPTIONS],
  );

  const SCOPE_OPTIONS = useMemo(
    () => [
      { value: "all", label: "Tất cả phạm vi" },
      { value: "global", label: "Toàn hệ thống" },
      { value: "canteen", label: "Theo căn tin" },
    ],
    [],
  );

  const STATUS_OPTIONS = useMemo(
    () => [
      { value: "all", label: "Tất cả trạng thái" },
      { value: "activeOnly", label: "Đang bật" },
      { value: "inactiveOnly", label: "Đã tắt" },
    ],
    [],
  );

  const selectedRecord = useMemo(
    () => items.find((item) => String(item.id) === String(selectedId)) || detail,
    [detail, items, selectedId],
  );

  const canUpdateSelected = useMemo(() => {
    if (!selectedRecord) return false;
    if (role === "admin") return true;
    if (role !== "manager") return false;
    const selectedCanteenId = selectedRecord?.canteenId?._id || selectedRecord?.canteenId;
    const myCanteenId = user?.canteenId?._id || user?.canteenId;
    return Boolean(selectedCanteenId && myCanteenId && String(selectedCanteenId) === String(myCanteenId));
  }, [role, selectedRecord, user?.canteenId]);

  const canUpdateRecord = (record) => {
    if (!record) return false;
    if (role === "admin") return true;
    if (role !== "manager") return false;

    const recordCanteenId = record?.canteenId?._id || record?.canteenId;
    const myCanteenId = user?.canteenId?._id || user?.canteenId;
    return Boolean(recordCanteenId && myCanteenId && String(recordCanteenId) === String(myCanteenId));
  };

  const loadCanteenOptions = async () => {
    if (role !== "admin") return;

    try {
      const response = await getAllCanteens({ page: 1, limit: 500, sort: "name" });
      const rows = response?.data?.canteens || response?.data || [];
      const safeRows = Array.isArray(rows) ? rows : [];

      setCanteenOptions(
        safeRows.map((item) => ({
          label: `${item?.name || "Can tin"}${item?.location ? ` - ${item.location}` : ""}`,
          value: item?._id,
        })),
      );
    } catch {
      setCanteenOptions([]);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      targetRole: TARGET_ROLE_OPTIONS[0]?.value,
      isActive: true,
      scope: role === "admin" ? "global" : "canteen",
      canteenId: role === "admin" ? undefined : (user?.canteenId?._id || user?.canteenId),
    });
    setIsModalOpen(true);
  };

  const openEditModal = async () => {
    if (!selectedRecord || !canUpdateSelected) return;
    const targetId = selectedRecord.id || selectedRecord._id;
    const full = await fetchDetail(targetId);
    if (!full) return;

    setEditingId(targetId);
    form.setFieldsValue({
      isActive: Boolean(full.isActive),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  const handleFilter = async () => {
    const values = await filterForm.validateFields();
    const nextFilters = {
      search: values.search || "",
      targetRole: values.targetRole || "all",
      scope: values.scope || "all",
      status: values.status || "all",
    };

    setFilters(nextFilters);
    await fetchList(1, pagination.pageSize, nextFilters);
  };

  const handleResetFilter = async () => {
    const nextFilters = {
      search: "",
      targetRole: "all",
      scope: "all",
      status: "all",
    };
    filterForm.setFieldsValue(nextFilters);
    setFilters(nextFilters);
    await fetchList(1, pagination.pageSize, nextFilters);
  };

  const handleSave = async () => {
    if (editingId) {
      const values = await form.validateFields(["isActive"]);
      const ok = await updateItem(editingId, {
        isActive: values.isActive,
      });

      if (!ok) return;

      closeModal();
      await fetchList(pagination.current, pagination.pageSize, filters);
      return;
    }

    const values = await form.validateFields();

    const ok = editingId
      ? await updateItem(editingId, values)
      : await createItem(values);

    if (!ok) return;

    closeModal();
    await fetchList(pagination.current, pagination.pageSize, filters);
  };

  const handleSelectRow = async (record) => {
    const targetId = record.id || record._id;
    if (!targetId) return;

    setSelectedId(targetId);
    await fetchDetail(targetId);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
  };

  const handleQuickToggle = async (event, record) => {
    event?.stopPropagation?.();
    if (!canUpdateRecord(record)) return;

    await quickToggleStatus(record.id || record._id, record.isActive);
  };

  useEffect(() => {
    if (!canManageSystemNotifications) return;

    const initFilters = {
      search: "",
      targetRole: "all",
      scope: "all",
      status: "all",
    };

    filterForm.setFieldsValue(initFilters);
    setFilters(initFilters);
    fetchList(1, pagination.pageSize, initFilters);
    loadCanteenOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageSystemNotifications]);

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "Phạm vi",
      dataIndex: "canteenName",
      key: "canteenName",
      width: 180,
      render: (value, record) => (
        <Tag color={record?.canteenId ? "blue" : "geekblue"}>{value || "Toàn hệ thống"}</Tag>
      ),
    },
    {
      title: "Vai trò nhận",
      dataIndex: "targetRole",
      key: "targetRole",
      width: 140,
      render: (value) => {
        const roleKey = String(value || "all").toLowerCase();
        const roleMeta = ROLE_META[roleKey] || ROLE_META.all;
        return <Tag color={roleMeta.color}>{roleMeta.label}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 140,
      render: (value) => (
        <Tag color={value ? "green" : "default"}>{value ? "Đang bật" : "Đã tắt"}</Tag>
      ),
    },
    {
      title: "Tạo bởi",
      dataIndex: "createdByName",
      key: "createdByName",
      width: 180,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 220,
      fixed: "right",
      render: (_, record) => {
        const canUpdate = canUpdateRecord(record);
        const nextActionLabel = record?.isActive ? "Tắt hiển thị" : "Bật hiển thị";

        return (
          <Space size={4}>
            <Button
              size="small"
              type={record?.isActive ? "default" : "primary"}
              disabled={!canUpdate || saving}
              onClick={(event) => handleQuickToggle(event, record)}
              icon={<PoweroffOutlined />}
            >
              {nextActionLabel}
            </Button>
          </Space>
        );
      },
    },
  ];

  if (!canManageSystemNotifications) {
    return (
      <Card bordered={false}>
        <Alert
          type="warning"
          showIcon
          message="Bạn không có quyền truy cập màn hình này"
          description="Màn hình thông báo hệ thống chỉ dành cho quản lý và quản trị viên."
        />
      </Card>
    );
  }

  return (
    <div style={{ background: "#f9fafb", minHeight: "100%", padding: 16, borderRadius: 16 }}>
      {contextHolder}
      <Space direction="vertical" size={14} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
            Quản lí thông báo hệ thống
          </div>
          <Button type="primary" onClick={openCreateModal} icon={<PlusOutlined />}>
            Tạo thông báo hệ thống
          </Button>
        </div>

        <Card bordered={false} style={{ borderRadius: 14 }}>
          <Form form={filterForm} layout="vertical">
            <Row gutter={12}>
              <Col xs={24} md={8} lg={7}>
                <Form.Item name="search" label="Tìm kiếm">
                  <Input
                    allowClear
                    placeholder="Nhập tiêu đề hoặc nội dung"
                    onPressEnter={handleFilter}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={8} lg={4}>
                <Form.Item name="targetRole" label="Vai trò nhận" initialValue="all">
                  <Select options={FILTER_TARGET_ROLE_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={12} md={8} lg={4}>
                <Form.Item name="scope" label="Phạm vi" initialValue="all">
                  <Select
                    options={role === "admin" ? SCOPE_OPTIONS : SCOPE_OPTIONS.filter((it) => it.value !== "global")}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={8} lg={6}>
                <Form.Item name="status" label="Trạng thái hiển thị" initialValue="all">
                  <Select options={STATUS_OPTIONS} />
                </Form.Item>
              </Col>
            </Row>
            <Space>
              <Button type="primary" onClick={handleFilter} icon={<FilterOutlined />}>Lọc thông báo</Button>
              <Button onClick={handleResetFilter} icon={<RedoOutlined />}>Đặt lại bộ lọc</Button>
            </Space>
          </Form>
        </Card>

        <Row gutter={14}>
          <Col xs={24}>
            <Card bordered={false} style={{ borderRadius: 14 }} title="Danh sách thông báo hệ thống">
              <Table
                rowKey={(record) => record.id}
                loading={loading}
                columns={columns}
                dataSource={items}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  showSizeChanger: true,
                }}
                onRow={(record) => ({
                  onClick: () => handleSelectRow(record),
                  style: {
                    cursor: "pointer",
                    background:
                      String(record.id) === String(selectedId)
                        ? "rgba(59,130,246,0.08)"
                        : "transparent",
                  },
                })}
                onChange={(nextPagination) => {
                  fetchList(
                    nextPagination.current,
                    nextPagination.pageSize,
                    filters,
                  );
                }}
                scroll={{ x: 1280 }}
              />
            </Card>
          </Col>
        </Row>
      </Space>

      <Modal
        open={isDetailModalOpen}
        onCancel={closeDetailModal}
        footer={null}
        width={760}
        title="Chi tiết thông báo"
      >
        {selectedRecord ? (
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
              <Text strong style={{ fontSize: 16 }}>{selectedRecord.title}</Text>
              <Button
                size="small"
                disabled={!canUpdateSelected}
                onClick={openEditModal}
              >
                Chỉnh sửa
              </Button>
            </div>

            <Space size={8} wrap>
              <Tag color={selectedRecord?.canteenId ? "blue" : "geekblue"}>
                {selectedRecord?.canteenName || "Toàn hệ thống"}
              </Tag>
              <Tag color={(ROLE_META[String(selectedRecord?.targetRole || "all").toLowerCase()] || ROLE_META.all).color}>
                {(ROLE_META[String(selectedRecord?.targetRole || "all").toLowerCase()] || ROLE_META.all).label}
              </Tag>
              <Tag color={selectedRecord?.isActive ? "green" : "default"}>
                {selectedRecord?.isActive ? "Đang bật" : "Đã tắt"}
              </Tag>
            </Space>

            <Text type="secondary">
              Tạo lúc: {selectedRecord?.createdAt ? dayjs(selectedRecord.createdAt).format("DD/MM/YYYY HH:mm") : "-"}
            </Text>
            <Text type="secondary">Tạo bởi: {selectedRecord?.createdByName || "Hệ thống"}</Text>
            <Paragraph style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
              {selectedRecord?.content || "-"}
            </Paragraph>
          </Space>
        ) : (
          <Space direction="vertical" size={8}>
            <Tag icon={<UserOutlined />} color="default">Chưa có thông báo được chọn</Tag>
            <Text type="secondary">Chọn thông báo trong danh sách để xem chi tiết</Text>
          </Space>
        )}
      </Modal>

      <Modal
        open={isModalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        confirmLoading={saving}
        okText={editingId ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
        width={760}
        title={editingId ? "Cập nhật thông báo hệ thống" : "Tạo thông báo hệ thống"}
      >
        <Form form={form} layout="vertical">
          {editingId ? (
            <Form.Item
              label="Trạng thái hiển thị"
              name="isActive"
              valuePropName="checked"
            >
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>
          ) : (
            <>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input maxLength={200} />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          >
            <Input.TextArea rows={4} maxLength={2000} />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Form.Item
                name="targetRole"
                label="Vai trò nhận"
                rules={[{ required: true, message: "Vui lòng chọn vai trò nhận" }]}
              >
                <Select options={TARGET_ROLE_OPTIONS} />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="scope"
                label="Phạm vi gửi"
                rules={[{ required: true, message: "Vui lòng chọn phạm vi" }]}
              >
                <Select
                  disabled={role !== "admin"}
                  options={
                    role === "admin"
                      ? [
                        { value: "global", label: "Toàn hệ thống" },
                        { value: "canteen", label: "Theo căn tin" },
                      ]
                      : [{ value: "canteen", label: "Theo căn tin của quản lý" }]
                  }
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Trạng thái hiển thị"
                name="isActive"
                valuePropName="checked"
              >
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.scope !== curr.scope}>
            {({ getFieldValue }) =>
              role === "admin" && getFieldValue("scope") === "canteen" ? (
                <Form.Item
                  name="canteenId"
                  label="Căn tin"
                  rules={[{ required: true, message: "Vui lòng chọn căn tin" }]}
                >
                  <Select
                    options={canteenOptions}
                    showSearch
                    optionFilterProp="label"
                    placeholder="Chọn căn tin"
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
