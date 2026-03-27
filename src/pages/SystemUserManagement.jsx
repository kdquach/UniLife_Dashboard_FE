import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Dropdown,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import GIcon from "@/components/GIcon";
import {
  DEFAULT_PAGE_SIZE,
  STAFF_GENDER_OPTIONS,
  STATUS_LABELS,
  USER_ROLES,
  DATETIME_FORMAT,
} from "@/config/constants";
import { useSystemUserManagement } from "@/hooks/useSystemUserManagement";
import { useAuthStore } from "@/store/useAuthStore";



const { Text } = Typography;
const { TextArea } = Input;

/* ============================================================
   Constant options
   ============================================================ */
const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Không hoạt động" },
  { value: "pending", label: "Chờ kích hoạt" },
  { value: "banned", label: "Bị khóa" },
];

const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả vai trò" },
  { value: "admin", label: "Quản trị viên" },
  { value: "manager", label: "Quản lý" },
  { value: "staff", label: "Nhân viên" },
];

const STATUS_COLOR_MAP = {
  active: "green",
  inactive: "default",
  pending: "orange",
  banned: "red",
};

const ROLE_COLOR_MAP = {
  admin: "red",
  canteen_owner: "purple",
  manager: "blue",
  staff: "cyan",
};

const ROLE_LABEL_MAP = {
  admin: "Quản trị viên",
  canteen_owner: "Chủ căng tin",
  manager: "Quản lý",
  staff: "Nhân viên",
};

const ROLE_HIERARCHY = ["customer", "staff", "manager", "admin"];

/**
 * Build list of roles that the current user can CREATE.
 * Manager → only staff. Admin → all system roles below admin.
 */
const getCreatableRoles = (currentRole) => {
  if (currentRole === "customer" || currentRole === "staff") return [];
  const myLevel = ROLE_HIERARCHY.indexOf(currentRole);
  return ROLE_HIERARCHY.filter(
    (r, idx) => idx > 0 && idx < myLevel && r !== "customer",
  ).map((r) => ({ value: r, label: ROLE_LABEL_MAP[r] || r }));
};

/**
 * Build list of roles that the current user can ASSIGN TO a target user.
 * Cannot assign role equal or higher than own.
 */

const getAssignableRoles = (currentRole, targetCurrentRole) => {
  const myLevel = ROLE_HIERARCHY.indexOf(currentRole);
  return ROLE_HIERARCHY.filter(
    (r, idx) =>
      idx > 0 && idx < myLevel && r !== targetCurrentRole && r !== "customer",
  ).map((r) => ({ value: r, label: ROLE_LABEL_MAP[r] || r }));
};

/**
 * Build list of roles the target can be DOWNGRADED to.
 * Must be lower than target's current role AND lower than current user's role.
 */
const getDowngradableRoles = (currentRole, targetCurrentRole) => {
  const myLevel = ROLE_HIERARCHY.indexOf(currentRole);
  const targetLevel = ROLE_HIERARCHY.indexOf(targetCurrentRole);
  return ROLE_HIERARCHY.filter(
    (r, idx) =>
      idx > 0 && idx < targetLevel && idx < myLevel && r !== "customer",
  ).map((r) => ({ value: r, label: ROLE_LABEL_MAP[r] || r }));
};

/* ============================================================
   Component
   ============================================================ */
export default function SystemUserManagement() {
  const { user: currentUser } = useAuthStore();
  const currentRole = currentUser?.role;

  const [searchText, setSearchText] = useState("");

  // Modal states
  const [detailModal, setDetailModal] = useState({ open: false, data: null });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModal, setUpdateModal] = useState({ open: false, data: null });
  const [disableModal, setDisableModal] = useState({ open: false, data: null });
  const [reenableModal, setReenableModal] = useState({
    open: false,
    data: null,
  });
  const [assignRoleModal, setAssignRoleModal] = useState({
    open: false,
    data: null,
  });
  const [downgradeRoleModal, setDowngradeRoleModal] = useState({
    open: false,
    data: null,
  });

  // Forms
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [disableForm] = Form.useForm();
  const [reenableForm] = Form.useForm();
  const [assignRoleForm] = Form.useForm();
  const [downgradeRoleForm] = Form.useForm();

  // Canteen & campus options for create form



  const {
    contextHolder,
    loading,
    items,
    pagination,
    filters,
    setFilters,
    fetchList,
    create,
    update,
    disable,
    reenable,
    assignRole,
    downgradeRole,
    reissuePassword,
    deletePending,
  } = useSystemUserManagement();

  const currentPage = pagination?.current;
  const currentSize = pagination?.pageSize;

  /* ----- Bootstrap ----- */
  useEffect(() => {
    fetchList(1, DEFAULT_PAGE_SIZE);
  }, [fetchList]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        /* Removed canteen options loading */

        /* Removed campus options loading */
      } catch (err) {
        console.error("Failed to load options", err);
      }
    };
    loadOptions();
  }, []);

  /* ----- Filter handlers ----- */
  const handleApplyFilters = useCallback(() => {
    const next = { ...filters, search: searchText };
    setFilters(next);
    fetchList(1, currentSize || DEFAULT_PAGE_SIZE, next);
  }, [filters, searchText, setFilters, fetchList, currentSize]);

  const handleResetFilters = useCallback(() => {
    const next = { search: "", status: "all", role: "all" };
    setSearchText("");
    setFilters(next);
    fetchList(1, currentSize || DEFAULT_PAGE_SIZE, next);
  }, [setFilters, fetchList, currentSize]);

  /* ----- Create handler ----- */
  const handleSubmitCreate = useCallback(async () => {
    try {
      const values = await createForm.validateFields();
      const result = await create(values);
      if (!result) return;

      createForm.resetFields();
      setCreateModalOpen(false);
      fetchList(currentPage, currentSize);
    } catch {
      /* validate error */
    }
  }, [createForm, create, fetchList, currentPage, currentSize]);

  /* ----- Update handler ----- */
  const handleSubmitUpdate = useCallback(async () => {
    if (!updateModal.data?._id) return;
    try {
      const values = await updateForm.validateFields();
      const ok = await update(updateModal.data._id, values);
      if (!ok) return;
      setUpdateModal({ open: false, data: null });
      fetchList(currentPage, currentSize);
    } catch {
      /* validate error */
    }
  }, [updateModal, updateForm, update, fetchList, currentPage, currentSize]);

  /* ----- Disable handler ----- */
  const handleSubmitDisable = useCallback(async () => {
    if (!disableModal.data?._id) return;
    try {
      const values = await disableForm.validateFields();
      const ok = await disable(disableModal.data._id, values.reason);
      if (!ok) return;
      disableForm.resetFields();
      setDisableModal({ open: false, data: null });
      fetchList(currentPage, currentSize);
    } catch {
      /* validate error */
    }
  }, [disableModal, disableForm, disable, fetchList, currentPage, currentSize]);

  /* ----- Re-enable handler ----- */
  const handleSubmitReenable = useCallback(async () => {
    if (!reenableModal.data?._id) return;
    try {
      const values = await reenableForm.validateFields();
      const ok = await reenable(reenableModal.data._id, values.reason);
      if (!ok) return;
      reenableForm.resetFields();
      setReenableModal({ open: false, data: null });
      fetchList(currentPage, currentSize);
    } catch {
      /* validate error */
    }
  }, [reenableModal, reenableForm, reenable, fetchList, currentPage, currentSize]);

  /* ----- Assign Role handler ----- */
  const handleSubmitAssignRole = useCallback(async () => {
    if (!assignRoleModal.data?._id) return;
    try {
      const values = await assignRoleForm.validateFields();
      const ok = await assignRole(assignRoleModal.data._id, values.role);
      if (!ok) return;
      assignRoleForm.resetFields();
      setAssignRoleModal({ open: false, data: null });
      fetchList(currentPage, currentSize);
    } catch {
      /* validate error */
    }
  }, [assignRoleModal, assignRoleForm, assignRole, fetchList, currentPage, currentSize]);

  /* ----- Downgrade Role handler ----- */
  const handleSubmitDowngrade = useCallback(async () => {
    if (!downgradeRoleModal.data?._id) return;
    try {
      const values = await downgradeRoleForm.validateFields();
      const ok = await downgradeRole(downgradeRoleModal.data._id, {
        downgradeToRole: values.downgradeToRole,
        reason: values.reason,
      });
      if (!ok) return;
      downgradeRoleForm.resetFields();
      setDowngradeRoleModal({ open: false, data: null });
      fetchList(currentPage, currentSize);
    } catch {
      /* validate error */
    }
  }, [downgradeRoleModal, downgradeRoleForm, downgradeRole, fetchList, currentPage, currentSize]);

  /* ----- Reissue Password handler ----- */
  const handleReissuePassword = useCallback((record) => {
    Modal.confirm({
      title: "Xác nhận cấp lại mật khẩu",
      content: `Bạn có chắc chắn muốn cấp lại mật khẩu cho ${record.fullName} (${record.email})? Mật khẩu mới sẽ tự động được gửi tới email của người dùng. Các thiết bị đăng nhập hiện tại sẽ bị đăng xuất.`,
      okText: "Cấp lại",
      cancelText: "Hủy",
      onOk: async () => {
        const ok = await reissuePassword(record._id);
        if (ok) fetchList(currentPage, currentSize);
      },
    });
  }, [reissuePassword, fetchList, currentPage, currentSize]);

  /* ----- Delete Pending User handler ----- */
  const handleDeletePending = useCallback((record) => {
    Modal.confirm({
      title: "Xác nhận xóa tài khoản",
      content: `Bạn có chắc chắn muốn vĩnh viễn xóa tài khoản ${record.fullName} (${record.email}) không? Hành động này không thể hoàn tác.`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        const ok = await deletePending(record._id);
        if (ok) fetchList(currentPage, currentSize);
      },
    });
  }, [deletePending, fetchList, currentPage, currentSize]);

  /* ----- Helper: can current user act on target? ----- */
  const canActOn = useCallback(
    (record) => {
      if (record._id === currentUser?._id) return false; // cannot self-act
      const myLevel = ROLE_HIERARCHY.indexOf(currentRole);
      const targetLevel = ROLE_HIERARCHY.indexOf(record.role);
      return myLevel > targetLevel;
    },
    [currentRole, currentUser],
  );

  /* ----- Build dropdown actions per record ----- */
  const buildActions = useCallback(
    (record) => {
      const actions = [
        {
          key: "view",
          label: "Chi tiết",
          icon: <GIcon name="visibility" />,
          onClick: () => setDetailModal({ open: true, data: record }),
        },
      ];

      if (canActOn(record)) {
        actions.push({
          key: "edit",
          label: "Cập nhật thông tin",
          icon: <GIcon name="edit" />,
          onClick: () => {
            updateForm.setFieldsValue({
              fullName: record.fullName,
              phone: record.phone,
              gender: record.gender,
            });
            setUpdateModal({ open: true, data: record });
          },
        });

        if (record.status === "active") {
          actions.push({
            key: "disable",
            label: "Vô hiệu hoá",
            icon: <GIcon name="block" />,
            danger: true,
            onClick: () => setDisableModal({ open: true, data: record }),
          });
        }

        if (record.status === "inactive") {
          actions.push({
            key: "reenable",
            label: "Mở khoá",
            icon: <GIcon name="lock_open" />,
            onClick: () => setReenableModal({ open: true, data: record }),
          });
        }

        if (record.status === "active") {
          const assignable = getAssignableRoles(currentRole, record.role);
          if (assignable.length > 0) {
            actions.push({
              key: "assign-role",
              label: "Gán vai trò",
              icon: <GIcon name="shield_person" />,
              onClick: () => {
                assignRoleForm.resetFields();
                setAssignRoleModal({ open: true, data: record });
              },
            });
          }
        }

        if (record.status === "active") {
          const downgradable = getDowngradableRoles(currentRole, record.role);
          if (downgradable.length > 0) {
            actions.push({
              key: "downgrade-role",
              label: "Hạ vai trò",
              icon: <GIcon name="arrow_downward" />,
              danger: true,
              onClick: () => {
                downgradeRoleForm.resetFields();
                setDowngradeRoleModal({ open: true, data: record });
              },
            });
          }
        }

        if (record.status === "pending") {
          actions.push({
            key: "delete-pending",
            label: "Xóa tài khoản",
            icon: <GIcon name="delete" />,
            danger: true,
            onClick: () => handleDeletePending(record),
          });
        }

        // Cấp lại mật khẩu 
        actions.push({
          key: "reissue-password",
          label: "Cấp lại mật khẩu",
          icon: <GIcon name="key" />,
          onClick: () => handleReissuePassword(record),
        });
      }

      return actions;
    },
    [canActOn, currentRole, updateForm, assignRoleForm, downgradeRoleForm, handleDeletePending, handleReissuePassword],
  );

  /* ----- Table columns ----- */
  const columns = useMemo(
    () => [
      {
        title: "Họ tên",
        dataIndex: "fullName",
        key: "fullName",
        ellipsis: true,
        sorter: true,
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        ellipsis: true,
      },
      {
        title: "Vai trò",
        dataIndex: "role",
        key: "role",
        width: 140,
        render: (val) => (
          <Tag color={ROLE_COLOR_MAP[val] || "default"}>
            {ROLE_LABEL_MAP[val] || val}
          </Tag>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (val) => (
          <Tag color={STATUS_COLOR_MAP[val] || "default"}>
            {STATUS_LABELS[val] || val}
          </Tag>
        ),
      },

      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 160,
        sorter: true,
        render: (val) => (val ? dayjs(val).format(DATETIME_FORMAT) : "—"),
      },
      {
        title: "Thao tác",
        key: "action",
        align: "center",
        width: 80,
        render: (_, record) => (
          <Dropdown menu={{ items: buildActions(record) }} trigger={["click"]}>
            <Button
              type="text"
              style={{ color: "var(--text-muted)" }}
              icon={<GIcon name="more_vert" />}
            />
          </Dropdown>
        ),
      },
    ],
    [buildActions],
  );

  /* ----- Table change (pagination + sort) ----- */
  const handleTableChange = useCallback(
    (pag, _tableFilters, sorter) => {
      const nextFilters = { ...filters };
      if (!Array.isArray(sorter) && sorter?.field) {
        nextFilters.sortBy = sorter.field;
        nextFilters.sortOrder = sorter.order === "ascend" ? "asc" : "desc";
      }
      setFilters(nextFilters);
      fetchList(pag.current, pag.pageSize || DEFAULT_PAGE_SIZE, nextFilters);
    },
    [filters, setFilters, fetchList],
  );

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <>
      {contextHolder}

      <Card
        title="Quản lý người dùng hệ thống"
        extra={
          <Button
            type="primary"
            icon={<GIcon name="person_add" />}
            onClick={() => {
              createForm.resetFields();
              setCreateModalOpen(true);
            }}
          >
            Tạo tài khoản
          </Button>
        }
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {/* Filters */}
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <Input
                value={searchText}
                placeholder="Tìm theo email hoặc họ tên"
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleApplyFilters}
                allowClear
              />
            </Col>
            <Col xs={12} md={4}>
              <Select
                value={filters.status}
                style={{ width: "100%" }}
                options={STATUS_FILTER_OPTIONS}
                onChange={(v) => setFilters((p) => ({ ...p, status: v }))}
              />
            </Col>
            <Col xs={12} md={4}>
              <Select
                value={filters.role}
                style={{ width: "100%" }}
                options={ROLE_FILTER_OPTIONS}
                onChange={(v) => setFilters((p) => ({ ...p, role: v }))}
              />
            </Col>
            <Col xs={24} md={4}>
              <Button style={{ width: "100%" }} onClick={handleApplyFilters}>
                Lọc
              </Button>
            </Col>
            <Col xs={24} md={4}>
              <Button
                type="link"
                onClick={handleResetFilters}
                style={{ paddingInline: 0 }}
              >
                Đặt lại bộ lọc
              </Button>
            </Col>
          </Row>

          {/* Table */}
          <Table
            rowKey="_id"
            loading={loading}
            columns={columns}
            dataSource={items}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} người dùng`,
            }}
          />
        </Space>
      </Card>

      {/* ============ DETAIL MODAL ============ */}
      <Modal
        title="Chi tiết người dùng"
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, data: null })}
        footer={null}
        destroyOnClose
        width={560}
      >
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label="Họ tên">
            {detailModal.data?.fullName || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {detailModal.data?.email || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            {detailModal.data?.phone || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Giới tính">
            {STAFF_GENDER_OPTIONS.find(
              (g) => g.value === detailModal.data?.gender,
            )?.label || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            <Tag color={ROLE_COLOR_MAP[detailModal.data?.role] || "default"}>
              {ROLE_LABEL_MAP[detailModal.data?.role] ||
                USER_ROLES[detailModal.data?.role] ||
                "—"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag
              color={STATUS_COLOR_MAP[detailModal.data?.status] || "default"}
            >
              {STATUS_LABELS[detailModal.data?.status] || "—"}
            </Tag>
          </Descriptions.Item>


          <Descriptions.Item label="Ngày tạo">
            {detailModal.data?.createdAt
              ? dayjs(detailModal.data.createdAt).format(DATETIME_FORMAT)
              : "—"}
          </Descriptions.Item>
        </Descriptions>
      </Modal>

      {/* ============ CREATE MODAL ============ */}
      <Modal
        title="Tạo tài khoản hệ thống"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        onOk={handleSubmitCreate}
        okText="Tạo tài khoản"
        cancelText="Hủy"
        destroyOnClose
        width={520}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập email",
                whitespace: true,
              },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="vd: user@unilife.com" />
          </Form.Item>

          <Form.Item
            name="fullName"
            label="Họ tên"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập họ tên",
                whitespace: true,
              },
              { min: 2, message: "Họ tên tối thiểu 2 ký tự" },
            ]}
          >
            <Input placeholder="Nhập họ tên" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
          >
            <Select
              options={getCreatableRoles(currentRole)}
              placeholder="Chọn vai trò"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              {
                pattern: /^[0-9]{10}$/,
                message: "Số điện thoại chỉ bao gồm số, 10 ký tự",
              },
            ]}
          >
            <Input placeholder="Nhập số điện thoại (tuỳ chọn)" />
          </Form.Item>

          <Form.Item name="gender" label="Giới tính">
            <Select
              options={STAFF_GENDER_OPTIONS}
              placeholder="Chọn giới tính (tuỳ chọn)"
              allowClear
            />
          </Form.Item>




        </Form>
      </Modal>

      {/* ============ UPDATE MODAL ============ */}
      <Modal
        title={`Cập nhật – ${updateModal.data?.fullName || ""}`}
        open={updateModal.open}
        onCancel={() => setUpdateModal({ open: false, data: null })}
        onOk={handleSubmitUpdate}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        destroyOnClose
        width={480}
      >
        <Form form={updateForm} layout="vertical">
          <Form.Item
            name="fullName"
            label="Họ tên"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập họ tên",
                whitespace: true,
              },
              { min: 2, message: "Họ tên tối thiểu 2 ký tự" },
            ]}
          >
            <Input placeholder="Nhập họ tên" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              {
                pattern: /^[0-9]{10,11}$/,
                message: "Số điện thoại chỉ bao gồm số, 10-11 ký tự",
              },
            ]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item name="gender" label="Giới tính">
            <Select
              options={STAFF_GENDER_OPTIONS}
              placeholder="Chọn giới tính"
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ============ DISABLE MODAL ============ */}
      <Modal
        title={`Vô hiệu hoá – ${disableModal.data?.fullName || ""}`}
        open={disableModal.open}
        onCancel={() => {
          setDisableModal({ open: false, data: null });
          disableForm.resetFields();
        }}
        onOk={handleSubmitDisable}
        okText="Xác nhận vô hiệu hoá"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
        destroyOnClose
        width={480}
      >
        <p style={{ marginBottom: 16 }}>
          Tài khoản <strong>{disableModal.data?.email}</strong> sẽ bị khoá ngay
          lập tức và tất cả phiên đăng nhập hiện tại sẽ hết hạn.
        </p>
        <Form form={disableForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập lý do",
                whitespace: true,
              },
              { min: 5, message: "Lý do tối thiểu 5 ký tự" },
              { max: 500, message: "Lý do tối đa 500 ký tự" },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Nhập lý do vô hiệu hoá (5-500 ký tự)"
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ============ RE-ENABLE MODAL ============ */}
      <Modal
        title={`Mở khoá – ${reenableModal.data?.fullName || ""}`}
        open={reenableModal.open}
        onCancel={() => {
          setReenableModal({ open: false, data: null });
          reenableForm.resetFields();
        }}
        onOk={handleSubmitReenable}
        okText="Xác nhận mở khoá"
        cancelText="Hủy"
        destroyOnClose
        width={480}
      >
        <p style={{ marginBottom: 16 }}>
          Mở khoá tài khoản <strong>{reenableModal.data?.email}</strong>. Người
          dùng sẽ cần đăng nhập lại.
        </p>
        <Form form={reenableForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do"
            rules={[
              { required: true, message: "Vui lòng nhập lý do" },
              { min: 5, message: "Lý do tối thiểu 5 ký tự" },
              { max: 500, message: "Lý do tối đa 500 ký tự" },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Nhập lý do mở khoá (5-500 ký tự)"
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ============ ASSIGN ROLE MODAL ============ */}
      <Modal
        title={`Gán vai trò – ${assignRoleModal.data?.fullName || ""}`}
        open={assignRoleModal.open}
        onCancel={() => {
          setAssignRoleModal({ open: false, data: null });
          assignRoleForm.resetFields();
        }}
        onOk={handleSubmitAssignRole}
        okText="Xác nhận"
        cancelText="Hủy"
        destroyOnClose
        width={480}
      >
        <p style={{ marginBottom: 8 }}>
          Vai trò hiện tại:{" "}
          <Tag color={ROLE_COLOR_MAP[assignRoleModal.data?.role] || "default"}>
            {ROLE_LABEL_MAP[assignRoleModal.data?.role] ||
              assignRoleModal.data?.role}
          </Tag>
        </p>
        <p style={{ marginBottom: 16, color: "#ff4d4f" }}>
          Lưu ý: Sau khi thay đổi vai trò, tất cả phiên đăng nhập hiện tại của
          người dùng sẽ hết hạn.
        </p>
        <Form form={assignRoleForm} layout="vertical">
          <Form.Item
            name="role"
            label="Vai trò mới"
            rules={[{ required: true, message: "Vui lòng chọn vai trò mới" }]}
          >
            <Select
              options={
                assignRoleModal.data
                  ? getAssignableRoles(currentRole, assignRoleModal.data.role)
                  : []
              }
              placeholder="Chọn vai trò mới"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ============ DOWNGRADE ROLE MODAL ============ */}
      <Modal
        title={`Hạ vai trò – ${downgradeRoleModal.data?.fullName || ""}`}
        open={downgradeRoleModal.open}
        onCancel={() => {
          setDowngradeRoleModal({ open: false, data: null });
          downgradeRoleForm.resetFields();
        }}
        onOk={handleSubmitDowngrade}
        okText="Xác nhận hạ vai trò"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
        destroyOnClose
        width={480}
      >
        <p style={{ marginBottom: 8 }}>
          Vai trò hiện tại:{" "}
          <Tag color={ROLE_COLOR_MAP[downgradeRoleModal.data?.role] || "default"}>
            {ROLE_LABEL_MAP[downgradeRoleModal.data?.role] ||
              downgradeRoleModal.data?.role}
          </Tag>
        </p>
        <p style={{ marginBottom: 16, color: "#ff4d4f" }}>
          Lưu ý: Sau khi hạ vai trò, tất cả phiên đăng nhập hiện tại của
          người dùng sẽ hết hạn.
        </p>
        <Form form={downgradeRoleForm} layout="vertical">
          <Form.Item
            name="downgradeToRole"
            label="Vai trò mới (thấp hơn)"
            rules={[{ required: true, message: "Vui lòng chọn vai trò mới" }]}
          >
            <Select
              options={
                downgradeRoleModal.data
                  ? getDowngradableRoles(currentRole, downgradeRoleModal.data.role)
                  : []
              }
              placeholder="Chọn vai trò"
            />
          </Form.Item>
          <Form.Item
            name="reason"
            label="Lý do"
            rules={[
              { required: true, message: "Vui lòng nhập lý do", whitespace: true },
              { min: 5, message: "Lý do tối thiểu 5 ký tự" },
              { max: 500, message: "Lý do tối đa 500 ký tự" },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Nhập lý do hạ vai trò (5-500 ký tự)"
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
