import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  message,
  Row,
  Space,
  Typography,
  Upload,
} from "antd";
import { useProfile } from "@/hooks/useProfile";
import { changePassword } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import GIcon from "@/components/GIcon";

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { profile, loading, error, fetchMe, updateMe, uploadAvatar } =
    useProfile();
  const { updateUser } = useAuthStore();

  const [messageApi, contextHolder] = message.useMessage();
  const [editing, setEditing] = useState(false);
  const [infoForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    fetchMe().catch(() => {});
  }, [fetchMe]);

  useEffect(() => {
    if (!profile) return;
    infoForm.setFieldsValue({
      fullName: profile.fullName || "",
      phone: profile.phone || "",
      email: profile.email || "",
    });
  }, [profile, infoForm]);

  const completion = useMemo(() => {
    const items = [
      { label: "Thiết lập tài khoản", weight: 20, done: true },
      { label: "Ảnh đại diện", weight: 20, done: !!profile?.avatar },
      {
        label: "Thông tin cá nhân",
        weight: 60,
        done: !!profile?.fullName && !!profile?.phone,
      },
    ];

    return {
      items,
      percent: items.reduce((sum, i) => sum + (i.done ? i.weight : 0), 0),
    };
  }, [profile]);

  const handleAvatarChange = async ({ file }) => {
    const rawFile = file?.originFileObj || file;
    if (!rawFile) return;

    if (!rawFile.type?.startsWith("image/")) {
      messageApi.error("Vui lòng chọn một file hình ảnh");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (rawFile.size > maxSize) {
      messageApi.error("Kích thước file không được vượt quá 5MB");
      return;
    }

    try {
      const updatedUser = await uploadAvatar(rawFile);
      if (updatedUser) updateUser(updatedUser);
      messageApi.success("Cập nhật ảnh đại diện thành công");
    } catch (err) {
      messageApi.error(
        err?.response?.data?.message || err?.message || "Cập nhật thất bại"
      );
    }
  };

  const savePersonalInfo = async () => {
    try {
      const values = await infoForm.validateFields(["fullName", "phone"]);
      const updatedUser = await updateMe(values);
      if (updatedUser) updateUser(updatedUser);
      messageApi.success("Đã lưu thông tin cá nhân");
      setEditing(false);
    } catch (err) {
      if (err?.errorFields) return;
      messageApi.error("Cập nhật thất bại");
    }
  };

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      const { currentPassword, newPassword, confirmPassword } = values;

      if (newPassword !== confirmPassword) {
        messageApi.error("Mật khẩu mới và xác nhận không khớp");
        return;
      }

      if (currentPassword === newPassword) {
        messageApi.error("Mật khẩu mới phải khác mật khẩu hiện tại");
        return;
      }

      await changePassword({ currentPassword, newPassword, confirmPassword });
      messageApi.success("Đổi mật khẩu thành công");
      passwordForm.resetFields();
    } catch (err) {
      if (err?.errorFields) return;
      messageApi.error(
        err?.response?.data?.message || err?.message || "Đổi mật khẩu thất bại"
      );
    }
  };

  if (error && !profile) {
    return (
      <Card>
        {contextHolder}
        <Title level={4} style={{ marginBottom: 8 }}>
          Không tải được hồ sơ
        </Title>
        <Text type="secondary">{error}</Text>
        <div style={{ marginTop: 16 }}>
          <Button type="primary" onClick={fetchMe}>
            Thử lại
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {contextHolder}
      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          Hồ sơ cá nhân
        </Title>
        <Text type="secondary">Quản lý thông tin hồ sơ của bạn</Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title="Ảnh đại diện"
            extra={
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={() => false}
                onChange={handleAvatarChange}
              >
                <Button icon={<GIcon name="upload" />}>Tải ảnh lên</Button>
              </Upload>
            }
            loading={loading}
          >
            <Space size="large">
              <Avatar size={80} src={profile?.avatar} icon={<GIcon name="person" />} />
              <div>
                <Text strong>Ảnh đại diện</Text>
                <div>
                  <Text type="secondary">Khuyến nghị tối thiểu 800×800. Hỗ trợ JPG/PNG</Text>
                </div>
              </div>
            </Space>
          </Card>

          <Card
            title="Thông tin cá nhân"
            style={{ marginTop: 24 }}
            extra={
              <Button type="text" onClick={() => setEditing((v) => !v)}>
                <GIcon name="edit" style={{ marginRight: 8 }} />
                {editing ? "Đóng" : "Chỉnh sửa"}
              </Button>
            }
            loading={loading}
          >
            <Form layout="vertical" form={infoForm} disabled={!editing}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Họ và tên"
                    name="fullName"
                    rules={[
                      { required: true, message: "Vui lòng nhập họ và tên" },
                      { min: 2, message: "Họ và tên phải có ít nhất 2 ký tự" },
                      { max: 100, message: "Họ và tên không được vượt quá 100 ký tự" },
                    ]}
                  >
                    <Input placeholder="Nhập họ và tên" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Số điện thoại"
                    name="phone"
                    rules={[
                      { required: true, message: "Vui lòng nhập số điện thoại" },
                      {
                        pattern: /^0[0-9]{9,10}$/,
                        message: "Số điện thoại không hợp lệ (10-11 chữ số, bắt đầu từ 0)",
                      },
                    ]}
                  >
                    <Input placeholder="Nhập số điện thoại" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Email" name="email">
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>
            </Form>

            {editing && (
              <Space>
                <Button type="primary" onClick={savePersonalInfo} loading={loading}>
                  Lưu
                </Button>
                <Button
                  onClick={() => {
                    infoForm.setFieldsValue({
                      fullName: profile?.fullName || "",
                      phone: profile?.phone || "",
                    });
                    setEditing(false);
                  }}
                >
                  Hủy
                </Button>
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Tiến độ hoàn thiện" loading={loading}>
            <div style={{ display: "grid", gap: 16, padding: 8 }}>
              <div style={{ display: "grid", gap: 8, textAlign: "center" }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: "var(--primary)" }}>
                  {completion.percent}%
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>Hoàn thành hồ sơ</Text>
              </div>
              <div style={{ borderTop: "1px solid rgba(0, 0, 0, 0.06)", paddingTop: 12 }}>
                {completion.items.map((item, idx) => (
                  <div key={item.label} style={{ display: "grid", gap: 4, marginBottom: idx < completion.items.length - 1 ? 12 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</Text>
                      <GIcon name={item.done ? "check_circle" : "radio_button_unchecked"} style={{ color: item.done ? "var(--primary)" : "rgba(0, 0, 0, 0.25)" }} />
                    </div>
                    <div style={{ height: 4, backgroundColor: "rgba(0, 0, 0, 0.06)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: item.done ? "100%" : "0%", backgroundColor: "var(--primary)", transition: "width 0.3s" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Đổi mật khẩu" style={{ marginTop: 24 }}>
            <Form layout="vertical" form={passwordForm}>
              <Form.Item
                label="Mật khẩu hiện tại"
                name="currentPassword"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại" }]}
              >
                <Input.Password placeholder="Nhập mật khẩu hiện tại" />
              </Form.Item>
              <Form.Item
                label="Mật khẩu mới"
                name="newPassword"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu mới" },
                  { min: 6, message: "Mật khẩu mới phải có ít nhất 6 ký tự" },
                ]}
              >
                <Input.Password placeholder="Nhập mật khẩu mới" />
              </Form.Item>
              <Form.Item
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                rules={[{ required: true, message: "Vui lòng xác nhận mật khẩu" }]}
              >
                <Input.Password placeholder="Nhập lại mật khẩu mới" />
              </Form.Item>
            </Form>

            <Divider style={{ margin: "12px 0" }} />
            <Button type="primary" onClick={handleChangePassword} loading={loading}>
              Đổi mật khẩu
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
