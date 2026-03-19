import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import GIcon from "@/components/GIcon";
import {
  assignPermissionToRole,
  assignRoleToUser,
  createPermission,
  deletePermission,
  getRolesByUser,
  getAllPermissions,
  getAllRoles,
  getPermissionDetail,
  getPermissionsByRole,
  removeRoleFromUser,
  removePermissionFromRole,
  updatePermission,
} from "@/services/permission.service";
import { getAllUsers } from "@/services/user.service";

const { Title, Text } = Typography;

export default function PermissionManagementPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(undefined);
  const [originRolePermissionIds, setOriginRolePermissionIds] = useState([]);
  const [draftRolePermissionIds, setDraftRolePermissionIds] = useState([]);

  const [selectedUserId, setSelectedUserId] = useState(undefined);
  const [originUserRoleIds, setOriginUserRoleIds] = useState([]);
  const [draftUserRoleIds, setDraftUserRoleIds] = useState([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedPermissionDetail, setSelectedPermissionDetail] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [form] = Form.useForm();

  const fetchInitData = useCallback(async () => {
    setLoading(true);
    try {
      const [permissionResponse, roleResponse, userResponse] = await Promise.all([
        getAllPermissions(),
        getAllRoles(),
        getAllUsers({ page: 1, limit: 100, sort: "fullName" }),
      ]);

      const permissionList = permissionResponse?.data?.permissions || [];
      const roleList = roleResponse?.data?.roles || [];
      const userList = userResponse?.data || [];

      setPermissions(permissionList);
      setRoles(roleList);
      setUsers(userList);

      if (roleList.length > 0 && !selectedRoleId) {
        setSelectedRoleId(roleList[0]._id);
      }

      if (userList.length > 0 && !selectedUserId) {
        setSelectedUserId(userList[0]._id);
      }
    } catch (error) {
      messageApi.error(
        error?.response?.data?.message || "Không thể tải dữ liệu phân quyền",
      );
    } finally {
      setLoading(false);
    }
  }, [messageApi, selectedRoleId, selectedUserId]);

  const fetchRolePermissions = useCallback(
    async (roleId) => {
      if (!roleId) {
        setOriginRolePermissionIds([]);
        setDraftRolePermissionIds([]);
        return;
      }

      try {
        const response = await getPermissionsByRole(roleId);
        const permissionIds = (response?.data?.permissions || []).map(
          (permission) => permission._id,
        );
        setOriginRolePermissionIds(permissionIds);
        setDraftRolePermissionIds(permissionIds);
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message ||
          "Không thể tải danh sách quyền theo vai trò",
        );
      }
    },
    [messageApi],
  );

  useEffect(() => {
    fetchInitData();
  }, [fetchInitData]);

  useEffect(() => {
    fetchRolePermissions(selectedRoleId);
  }, [selectedRoleId, fetchRolePermissions]);

  const fetchUserRoles = useCallback(
    async (userId) => {
      if (!userId) {
        setOriginUserRoleIds([]);
        setDraftUserRoleIds([]);
        return;
      }

      try {
        const response = await getRolesByUser(userId);
        const roleIds = (response?.data?.roles || []).map((role) => role._id);
        setOriginUserRoleIds(roleIds);

        // Enforce UI as single-role selection
        if (roleIds.length === 1) {
          setDraftUserRoleIds(roleIds);
        } else {
          setDraftUserRoleIds([]);
          if (roleIds.length > 1) {
            messageApi.warning(
              "Người dùng đang có nhiều vai trò. Vui lòng chọn 1 vai trò để lưu.",
            );
          }
        }
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message ||
          "Không thể tải danh sách vai trò theo người dùng",
        );
      }
    },
    [messageApi],
  );

  useEffect(() => {
    fetchUserRoles(selectedUserId);
  }, [selectedUserId, fetchUserRoles]);

  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        label: role.roleName,
        value: role._id,
      })),
    [roles],
  );

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        label: `${user.fullName || "(No name)"} - ${user.email || ""}`.trim(),
        value: user._id,
      })),
    [users],
  );

  const handleOpenCreate = () => {
    setFormMode("create");
    setSelectedPermission(null);
    form.resetFields();
    setFormOpen(true);
  };

  const handleOpenEdit = useCallback(
    (permission) => {
      setFormMode("edit");
      setSelectedPermission(permission);
      form.setFieldsValue({
        code: permission.code,
        description: permission.description,
      });
      setFormOpen(true);
    },
    [form],
  );

  const handleSubmitForm = async () => {
    try {
      const values = await form.validateFields();

      if (formMode === "create") {
        await createPermission(values);
        messageApi.success("Tạo quyền thành công");
      } else if (selectedPermission?._id) {
        await updatePermission(selectedPermission._id, values);
        messageApi.success("Cập nhật quyền thành công");
      }

      setFormOpen(false);
      form.resetFields();
      await fetchInitData();
      await fetchRolePermissions(selectedRoleId);
    } catch (error) {
      if (error?.errorFields) {
        messageApi.error("Vui lòng kiểm tra lại thông tin");
      } else {
        messageApi.error(error?.response?.data?.message || "Không thể lưu quyền");
      }
    }
  };

  const handleViewDetail = useCallback(
    async (permission) => {
      setDetailLoading(true);
      setDetailOpen(true);
      try {
        const response = await getPermissionDetail(permission._id);
        setSelectedPermissionDetail(response?.data?.permission || null);
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message || "Không thể tải chi tiết quyền",
        );
        setDetailOpen(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [messageApi],
  );

  const handleDeletePermission = useCallback(
    (permission) => {
      Modal.confirm({
        title: "Xác nhận xóa quyền",
        content: `Bạn có chắc chắn muốn xóa quyền "${permission.code}" không?`,
        okText: "Xóa",
        cancelText: "Hủy",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await deletePermission(permission._id);
            messageApi.success("Xóa quyền thành công");
            await fetchInitData();
            await fetchRolePermissions(selectedRoleId);
          } catch (error) {
            messageApi.error(
              error?.response?.data?.message || "Không thể xóa quyền",
            );
          }
        },
      });
    },
    [messageApi, fetchInitData, fetchRolePermissions, selectedRoleId],
  );

  const togglePermissionForRole = (permissionId, checked) => {
    setDraftRolePermissionIds((prev) => {
      const currentSet = new Set(prev);
      if (checked) {
        currentSet.add(permissionId);
      } else {
        currentSet.delete(permissionId);
      }
      return Array.from(currentSet);
    });
  };

  const setSingleRoleForUser = (roleId) => {
    setDraftUserRoleIds(roleId ? [roleId] : []);
  };

  const hasRolePermissionChanges = useMemo(() => {
    const originSet = new Set(originRolePermissionIds);
    const draftSet = new Set(draftRolePermissionIds);

    if (originSet.size !== draftSet.size) {
      return true;
    }

    return Array.from(draftSet).some((id) => !originSet.has(id));
  }, [originRolePermissionIds, draftRolePermissionIds]);

  const hasUserRoleChanges = useMemo(() => {
    const originSet = new Set(originUserRoleIds);
    const draftSet = new Set(draftUserRoleIds);

    if (originSet.size !== draftSet.size) {
      return true;
    }

    return Array.from(draftSet).some((id) => !originSet.has(id));
  }, [originUserRoleIds, draftUserRoleIds]);

  const handleSaveRolePermissions = async () => {
    if (!selectedRoleId) {
      messageApi.warning("Vui lòng chọn vai trò");
      return;
    }

    const originSet = new Set(originRolePermissionIds);
    const draftSet = new Set(draftRolePermissionIds);

    const toAssign = Array.from(draftSet).filter((id) => !originSet.has(id));
    const toRemove = Array.from(originSet).filter((id) => !draftSet.has(id));

    if (toAssign.length === 0 && toRemove.length === 0) {
      messageApi.info("Không có thay đổi để lưu");
      return;
    }

    try {
      setLoading(true);
      for (const permissionId of toAssign) {
        // Gán từng quyền (tái sử dụng API hiện có)
        await assignPermissionToRole(selectedRoleId, permissionId);
      }
      for (const permissionId of toRemove) {
        // Bỏ từng quyền (tái sử dụng API hiện có)
        await removePermissionFromRole(selectedRoleId, permissionId);
      }

      messageApi.success("Cập nhật phân quyền cho vai trò thành công");
      await fetchRolePermissions(selectedRoleId);
      await fetchInitData();
    } catch (error) {
      messageApi.error(
        error?.response?.data?.message || "Không thể cập nhật phân quyền",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUserRoles = async () => {
    if (!selectedUserId) {
      messageApi.warning("Vui lòng chọn người dùng");
      return;
    }

    if (!draftUserRoleIds || draftUserRoleIds.length === 0) {
      messageApi.warning("Vui lòng chọn 1 vai trò để lưu");
      return;
    }

    const originSet = new Set(originUserRoleIds);
    const draftSet = new Set(draftUserRoleIds);

    const toAssign = Array.from(draftSet).filter((id) => !originSet.has(id));
    const toRemove = Array.from(originSet).filter((id) => !draftSet.has(id));

    if (toAssign.length === 0 && toRemove.length === 0) {
      messageApi.info("Không có thay đổi để lưu");
      return;
    }

    try {
      setLoading(true);
      for (const roleId of toAssign) {
        await assignRoleToUser(selectedUserId, roleId);
      }
      for (const roleId of toRemove) {
        await removeRoleFromUser(selectedUserId, roleId);
      }

      messageApi.success("Cập nhật vai trò cho người dùng thành công");
      await fetchUserRoles(selectedUserId);
    } catch (error) {
      messageApi.error(
        error?.response?.data?.message || "Không thể cập nhật vai trò",
      );
    } finally {
      setLoading(false);
    }
  };

  const permissionColumns = useMemo(
    () => [
      {
        title: "Mã quyền",
        dataIndex: "code",
        key: "code",
        render: (value) => <Tag color="blue">{value}</Tag>,
        sorter: (a, b) => a.code.localeCompare(b.code),
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        key: "description",
        render: (value) => value || "Không có",
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 170,
        render: (value) => dayjs(value).format("DD/MM/YYYY HH:mm"),
      },
      {
        title: "Hành động",
        key: "actions",
        width: 160,
        render: (_, record) => (
          <Space>
            <Button
              size="small"
              icon={<GIcon name="visibility" />}
              onClick={() => handleViewDetail(record)}
            >
              Chi tiết
            </Button>
            <Button
              size="small"
              icon={<GIcon name="edit" />}
              onClick={() => handleOpenEdit(record)}
            >
              Sửa
            </Button>
            <Button
              danger
              size="small"
              icon={<GIcon name="delete" />}
              onClick={() => handleDeletePermission(record)}
            >
              Xóa
            </Button>
          </Space>
        ),
      },
    ],
    [handleOpenEdit, handleViewDetail, handleDeletePermission],
  );

  const roleAssignColumns = useMemo(
    () => [
      {
        title: "Mã quyền",
        dataIndex: "code",
        key: "code",
        render: (value) => <Tag color="geekblue">{value}</Tag>,
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        key: "description",
        render: (value) => value || "Không có",
      },
      {
        title: "Gán cho vai trò",
        key: "assigned",
        width: 160,
        align: "center",
        render: (_, record) => (
          <Switch
            checked={draftRolePermissionIds.includes(record._id)}
            onChange={(checked) => togglePermissionForRole(record._id, checked)}
          />
        ),
      },
    ],
    [draftRolePermissionIds],
  );

  const userRoleColumns = useMemo(
    () => [
      {
        title: "Vai trò",
        dataIndex: "roleName",
        key: "roleName",
        render: (value) => <Tag color="purple">{value}</Tag>,
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        key: "description",
        render: (value) => value || "Không có",
      },
      {
        title: "Gán cho người dùng",
        key: "assigned",
        width: 180,
        align: "center",
        render: (_, record) => (
          <Radio
            checked={draftUserRoleIds[0] === record._id}
            onChange={() => setSingleRoleForUser(record._id)}
          />
        ),
      },
    ],
    [draftUserRoleIds],
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
              Permission Management
            </Title>
            <Button
              type="primary"
              icon={<GIcon name="add" />}
              onClick={handleOpenCreate}
            >
              Tạo quyền mới
            </Button>
          </Space>
        </Card>

        <Card title="Danh sách quyền trong hệ thống">
          <Table
            rowKey="_id"
            loading={loading}
            dataSource={permissions}
            columns={permissionColumns}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>

        <Card
          title="Gán/Bỏ quyền theo vai trò"
          extra={
            <Button
              type="primary"
              icon={<GIcon name="save" />}
              disabled={!selectedRoleId || !hasRolePermissionChanges}
              onClick={handleSaveRolePermissions}
            >
              Lưu phân quyền
            </Button>
          }
        >
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <Text strong>Vai trò</Text>
              <Select
                style={{ width: "100%", marginTop: 8 }}
                placeholder="Chọn vai trò"
                value={selectedRoleId}
                options={roleOptions}
                onChange={setSelectedRoleId}
              />
            </div>

            <Table
              rowKey="_id"
              loading={loading}
              dataSource={permissions}
              columns={roleAssignColumns}
              pagination={{ pageSize: 8, showSizeChanger: true }}
            />
          </Space>
        </Card>

        <Card
          title="Gán/Bỏ vai trò cho người dùng"
          extra={
            <Button
              type="primary"
              icon={<GIcon name="save" />}
              disabled={
                !selectedUserId ||
                draftUserRoleIds.length === 0 ||
                !hasUserRoleChanges
              }
              onClick={handleSaveUserRoles}
            >
              Lưu vai trò
            </Button>
          }
        >
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <Text strong>Người dùng</Text>
              <Select
                style={{ width: "100%", marginTop: 8 }}
                placeholder="Chọn người dùng"
                value={selectedUserId}
                options={userOptions}
                onChange={setSelectedUserId}
                showSearch
                optionFilterProp="label"
              />
            </div>

            <Table
              rowKey="_id"
              loading={loading}
              dataSource={roles}
              columns={userRoleColumns}
              pagination={{ pageSize: 8, showSizeChanger: true }}
            />
          </Space>
        </Card>
      </Space>

      <Modal
        open={detailOpen}
        title="Chi tiết quyền"
        onCancel={() => {
          setDetailOpen(false);
          setSelectedPermissionDetail(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailOpen(false);
              setSelectedPermissionDetail(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={640}
      >
        {detailLoading ? (
          <Text>Đang tải...</Text>
        ) : selectedPermissionDetail ? (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <Text strong>Code:</Text>
              <div>
                <Tag color="blue">{selectedPermissionDetail.code}</Tag>
              </div>
            </div>

            <div>
              <Text strong>Mô tả:</Text>
              <div>{selectedPermissionDetail.description || "Không có"}</div>
            </div>

            <div>
              <Text strong>Số vai trò đang dùng:</Text>
              <div>{selectedPermissionDetail.roleCount || 0}</div>
            </div>

            <div>
              <Text strong>Danh sách vai trò:</Text>
              <div style={{ marginTop: 8 }}>
                {(selectedPermissionDetail.roles || []).length === 0 ? (
                  <Text type="secondary">Chưa có vai trò nào được gán quyền này</Text>
                ) : (
                  <Space wrap>
                    {selectedPermissionDetail.roles.map((role) => (
                      <Tag key={role._id} color="purple">
                        {role.roleName}
                      </Tag>
                    ))}
                  </Space>
                )}
              </div>
            </div>
          </Space>
        ) : (
          <Text type="secondary">Không có dữ liệu chi tiết</Text>
        )}
      </Modal>

      <Modal
        open={formOpen}
        title={formMode === "create" ? "Tạo quyền mới" : "Cập nhật quyền"}
        onCancel={() => {
          setFormOpen(false);
          form.resetFields();
        }}
        onOk={handleSubmitForm}
        okText={formMode === "create" ? "Tạo" : "Cập nhật"}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Code"
            name="code"
            rules={[
              { required: true, message: "Vui lòng nhập code quyền" },
              {
                pattern: /^[A-Z0-9_]+$/,
                message: "Code chỉ gồm chữ hoa, số và dấu _",
              },
            ]}
          >
            <Input placeholder="Ví dụ: INVENTORY_MANAGE" />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea
              rows={4}
              placeholder="Mô tả ý nghĩa và phạm vi sử dụng của quyền"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
