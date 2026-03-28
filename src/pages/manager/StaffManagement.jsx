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
  Tag,
} from "antd";
import GIcon from "@/components/GIcon";
import ResponsiveDataTable from "@/components/ResponsiveDataTable";
import {
  DEFAULT_PAGE_SIZE,
  STAFF_GENDER_OPTIONS,
  STATUS_LABELS,
  USER_ROLES,
} from "@/config/constants";
import { useStaffManagement } from "@/hooks/useStaffManagement";

const STAFF_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: STATUS_LABELS.active },
  { value: "inactive", label: STATUS_LABELS.inactive },
  { value: "pending", label: STATUS_LABELS.pending },
  { value: "banned", label: STATUS_LABELS.banned || "Bị khóa" },
];

const STAFF_STATUS_UPDATE_OPTIONS = [
  { value: "active", label: STATUS_LABELS.active },
  { value: "inactive", label: STATUS_LABELS.inactive },
];

export default function StaffManagementPage() {
  const [searchText, setSearchText] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);

  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();

  const {
    contextHolder,
    loading,
    items,
    pagination,
    filters,
    setFilters,
    fetchList,
    fetchDetail,
    createStaff,
    updateStaff,
  } = useStaffManagement();

  const currentPage = pagination.current;
  const currentPageSize = pagination.pageSize || DEFAULT_PAGE_SIZE;

  useEffect(() => {
    fetchList(1, DEFAULT_PAGE_SIZE);
  }, [fetchList]);

  const handleApplyFilters = useCallback(() => {
    const nextFilters = {
      ...filters,
      search: searchText,
    };
    setFilters(nextFilters);
    fetchList(1, pagination.pageSize || DEFAULT_PAGE_SIZE, nextFilters);
  }, [filters, searchText, setFilters, fetchList, pagination.pageSize]);

  const handleResetFilters = useCallback(() => {
    const nextFilters = {
      search: "",
      status: "all",
      gender: "all",
    };

    setSearchText("");
    setFilters(nextFilters);
    fetchList(1, pagination.pageSize || DEFAULT_PAGE_SIZE, nextFilters);
  }, [setFilters, fetchList, pagination.pageSize]);

  const handleOpenDetail = useCallback(
    async (record) => {
      const detail = await fetchDetail(record._id);
      if (!detail) return;

      setSelectedStaff(detail);
      setOpenDetailModal(true);
    },
    [fetchDetail],
  );

  const handleOpenUpdate = useCallback(
    async (record) => {
      const detail = await fetchDetail(record._id);
      if (!detail) return;

      setSelectedStaff(detail);
      updateForm.setFieldsValue({
        fullName: detail.fullName,
        phone: detail.phone,
        gender: detail.gender,
        status: detail.status,
      });
      setOpenUpdateModal(true);
    },
    [fetchDetail, updateForm],
  );

  const handleSubmitCreate = useCallback(async () => {
    try {
      const values = await createForm.validateFields();
      const created = await createStaff(values);
      if (!created) return;

      createForm.resetFields();
      setOpenCreateModal(false);
      fetchList(currentPage, currentPageSize);
    } catch {
      // Không xử lý thêm vì Ant Form đã hiển thị lỗi validate
    }
  }, [createForm, createStaff, fetchList, currentPage, currentPageSize]);

  const handleSubmitUpdate = useCallback(async () => {
    if (!selectedStaff?._id) return;

    try {
      const values = await updateForm.validateFields();
      const updated = await updateStaff(selectedStaff._id, values);
      if (!updated) return;

      setOpenUpdateModal(false);
      setSelectedStaff(updated);
      fetchList(currentPage, currentPageSize);
    } catch {
      // Không xử lý thêm vì Ant Form đã hiển thị lỗi validate
    }
  }, [selectedStaff, updateForm, updateStaff, fetchList, currentPage, currentPageSize]);

  const columns = useMemo(
    () => [
      {
        title: "Họ tên",
        dataIndex: "fullName",
        key: "fullName",
        ellipsis: true,
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        ellipsis: true,
      },
      {
        title: "Số điện thoại",
        dataIndex: "phone",
        key: "phone",
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (value) => {
          const color = value === "active" ? "green" : "default";
          return <Tag color={color}>{STATUS_LABELS[value] || value}</Tag>;
        },
      },
      {
        title: "Thao tác",
        key: "action",
        align: "center",
        render: (_, record) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: "view",
                  label: "Chi tiết",
                  icon: <GIcon name="visibility" />,
                  onClick: () => handleOpenDetail(record),
                },
                {
                  key: "edit",
                  label: "Cập nhật",
                  icon: <GIcon name="edit" />,
                  onClick: () => handleOpenUpdate(record),
                },
              ],
            }}
            trigger={["click"]}
          >
            <Button
              type="text"
              style={{ color: "var(--text-muted)" }}
              icon={<GIcon name="more_vert" />}
            />
          </Dropdown>
        ),
      },
    ],
    [handleOpenDetail, handleOpenUpdate],
  );

  return (
    <>
      {contextHolder}

      <Card
        title="Quản lý nhân viên"
        extra={(
          <Button type="primary" onClick={() => setOpenCreateModal(true)}>
            Thêm nhân viên
          </Button>
        )}
      >
        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
          <div className="dashboard-filter-bar">
            <div className="dashboard-filter-item dashboard-filter-item--grow">
              <Input
                value={searchText}
                placeholder="Tìm theo tên, email, số điện thoại"
                onChange={(event) => setSearchText(event.target.value)}
                onPressEnter={handleApplyFilters}
                allowClear
              />
            </div>
            <div className="dashboard-filter-item">
              <Select
                value={filters.status}
                style={{ width: "100%" }}
                options={STAFF_STATUS_FILTER_OPTIONS}
                onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              />
            </div>
            <div className="dashboard-filter-item">
              <Select
                value={filters.gender}
                style={{ width: "100%" }}
                options={[{ value: "all", label: "Tất cả giới tính" }, ...STAFF_GENDER_OPTIONS]}
                onChange={(value) => setFilters((prev) => ({ ...prev, gender: value }))}
              />
            </div>
            <div className="dashboard-filter-actions">
              <Button style={{ width: "100%" }} onClick={handleApplyFilters}>
                Lọc
              </Button>
            </div>
          </div>

          <Row>
            <Col>
              <Button type="link" onClick={handleResetFilters} style={{ paddingInline: 0 }}>
                Đặt lại bộ lọc
              </Button>
            </Col>
          </Row>

          <ResponsiveDataTable
            rowKey="_id"
            loading={loading}
            columns={columns}
            dataSource={items}
            mobileFields={["fullName", "status", "phone", "action"]}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              onChange: (page, pageSize) => {
                fetchList(page, pageSize || DEFAULT_PAGE_SIZE);
              },
            }}
          />
        </Space>
      </Card>

      <Modal
        title="Chi tiết nhân viên"
        open={openDetailModal}
        onCancel={() => {
          setOpenDetailModal(false);
        }}
        footer={null}
        destroyOnClose
      >
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label="Họ tên">{selectedStaff?.fullName || "—"}</Descriptions.Item>
          <Descriptions.Item label="Email">{selectedStaff?.email || "—"}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{selectedStaff?.phone || "—"}</Descriptions.Item>
          <Descriptions.Item label="Giới tính">
            {STAFF_GENDER_OPTIONS.find((item) => item.value === selectedStaff?.gender)?.label || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Vai trò">{USER_ROLES[selectedStaff?.role] || "—"}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">{STATUS_LABELS[selectedStaff?.status] || "—"}</Descriptions.Item>
          <Descriptions.Item label="Xác thực email">{selectedStaff?.emailVerified ? "Đã xác thực" : "Chưa xác thực"}</Descriptions.Item>
          <Descriptions.Item label="Bắt buộc đổi mật khẩu">{selectedStaff?.forceChangePassword ? "Có" : "Không"}</Descriptions.Item>
          <Descriptions.Item label="Canteen">{selectedStaff?.canteenId?.name || "—"}</Descriptions.Item>
          <Descriptions.Item label="Campus">{selectedStaff?.campusId?.name || "—"}</Descriptions.Item>
        </Descriptions>
      </Modal>

      <Modal
        title="Thêm nhân viên"
        open={openCreateModal}
        onCancel={() => {
          setOpenCreateModal(false);
          createForm.resetFields();
        }}
        onOk={handleSubmitCreate}
        okText="Tạo tài khoản"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="fullName"
            label="Họ tên"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input placeholder="Nhập họ tên" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại" },
              { pattern: /^[0-9]{10,11}$/, message: "Số điện thoại không hợp lệ" },
            ]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            name="gender"
            label="Giới tính"
            rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
          >
            <Select options={STAFF_GENDER_OPTIONS} placeholder="Chọn giới tính" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Cập nhật nhân viên"
        open={openUpdateModal}
        onCancel={() => {
          setOpenUpdateModal(false);
        }}
        onOk={handleSubmitUpdate}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={updateForm} layout="vertical">
          <Form.Item
            name="fullName"
            label="Họ tên"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input placeholder="Nhập họ tên" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại" },
              { pattern: /^[0-9]{10,11}$/, message: "Số điện thoại không hợp lệ" },
            ]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            name="gender"
            label="Giới tính"
            rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
          >
            <Select options={STAFF_GENDER_OPTIONS} placeholder="Chọn giới tính" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select options={STAFF_STATUS_UPDATE_OPTIONS} placeholder="Chọn trạng thái" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
