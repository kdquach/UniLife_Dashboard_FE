import { useEffect, useMemo, useState } from "react";
import { App, Button, Card, Form, Input, Select, Space, Tag } from "antd";
import dayjs from "dayjs";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import {
  createSystemNotification,
  getNotifications,
  markNotificationRead,
  sendNotification,
} from "@/services/notification.service";
import { getShiftStaffList } from "@/services/shiftManagement.service";

export default function NotificationPage() {
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(routeId || location.state?.notificationId || null);
  const [staffOptions, setStaffOptions] = useState([]);

  const role = String(user?.role || "").toLowerCase();
  const canSend = role === "manager" || role === "admin";

  const selectedItem = useMemo(
    () => items.find((item) => String(item.id || item._id) === String(selectedId)) || null,
    [items, selectedId],
  );

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await getNotifications({ page: 1, limit: 30, sort: "-createdAt" });
      setItems(result.items || []);
    } catch (error) {
      message.error(error?.response?.data?.message || "Không tải được thông báo");
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    if (!canSend) return;
    try {
      const data = await getShiftStaffList({ page: 1, limit: 200 });
      setStaffOptions(Array.isArray(data) ? data : []);
    } catch {
      setStaffOptions([]);
    }
  };

  useEffect(() => {
    loadNotifications();
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (routeId) {
      setSelectedId(routeId);
    }
  }, [routeId]);

  const handleSelect = async (notification) => {
    const id = notification.id || notification._id;
    setSelectedId(id);
    navigate(`/notifications/${id}`);

    if (!notification.read) {
      try {
        await markNotificationRead(id);
        setItems((prev) =>
          prev.map((item) =>
            String(item.id || item._id) === String(id) ? { ...item, read: true } : item,
          ),
        );
      } catch {
        // silent
      }
    }
  };

  const handleSend = async (values) => {
    try {
      setSending(true);
      if (values.mode === "all") {
        await createSystemNotification({
          title: values.title,
          content: values.body,
          targetRole: "staff",
          isActive: true,
          activeFrom: new Date().toISOString(),
        });
      } else {
        await sendNotification({
          userId: values.userId,
          title: values.title,
          body: values.body,
          meta: { source: "dashboard" },
        });
      }
      message.success("Gửi thông báo thành công");
      form.resetFields(["title", "body", "userId"]);
      await loadNotifications();
    } catch (error) {
      message.error(error?.response?.data?.message || "Không thể gửi thông báo");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ background: "#f9fafb", minHeight: "100%", padding: 16, borderRadius: 16 }}>
      <Space direction="vertical" size={14} style={{ width: "100%" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Notifications</div>

        {canSend && (
          <Card
            bordered={false}
            style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 2px rgba(15,23,42,0.05)" }}
            title="Send notification"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSend}
              initialValues={{ mode: "single" }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12 }}>
                <Form.Item name="mode" label="Mode" style={{ marginBottom: 12 }}>
                  <Select
                    options={[
                      { value: "single", label: "Single staff" },
                      { value: "all", label: "All staff" },
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  noStyle
                  shouldUpdate={(prev, current) => prev.mode !== current.mode}
                >
                  {({ getFieldValue }) =>
                    getFieldValue("mode") === "single" ? (
                      <Form.Item
                        name="userId"
                        label="Staff"
                        style={{ marginBottom: 12 }}
                        rules={[{ required: true, message: "Vui lòng chọn nhân viên" }]}
                      >
                        <Select
                          showSearch
                          optionFilterProp="label"
                          placeholder="Select staff"
                          options={staffOptions.map((staff) => ({
                            value: staff._id,
                            label: staff.fullName,
                          }))}
                        />
                      </Form.Item>
                    ) : (
                      <Form.Item label="Target" style={{ marginBottom: 12 }}>
                        <Input value="All staff" disabled />
                      </Form.Item>
                    )
                  }
                </Form.Item>
              </div>

              <Form.Item name="title" label="Title" rules={[{ required: true, message: "Nhập tiêu đề" }]}>
                <Input placeholder="Nhập tiêu đề thông báo" />
              </Form.Item>

              <Form.Item name="body" label="Content" rules={[{ required: true, message: "Nhập nội dung" }]}>
                <Input.TextArea rows={3} placeholder="Nhập nội dung thông báo" />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={sending}>
                Send
              </Button>
            </Form>
          </Card>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 14 }}>
          <Card
            bordered={false}
            loading={loading}
            style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 2px rgba(15,23,42,0.05)" }}
            title="Inbox"
            extra={<Tag color="blue">{items.filter((it) => !it.read).length} chưa đọc</Tag>}
          >
            <div style={{ display: "grid", gap: 8, maxHeight: 520, overflowY: "auto" }}>
              {items.map((item) => {
                const id = item.id || item._id;
                const active = String(id) === String(selectedId);

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    style={{
                      textAlign: "left",
                      border: "1px solid rgba(15,23,42,0.06)",
                      background: active ? "#eef2ff" : "#fff",
                      borderRadius: 10,
                      padding: 10,
                      cursor: "pointer",
                      transition: "all 160ms ease",
                    }}
                    onMouseEnter={(event) => {
                      if (!active) event.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(event) => {
                      if (!active) event.currentTarget.style.background = "#fff";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <strong style={{ color: "#111827", fontWeight: item.read ? 600 : 700 }}>{item.title}</strong>
                      {!item.read && <Tag color="blue" style={{ marginInlineEnd: 0 }}>new</Tag>}
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
                      {dayjs(item.createdAt).format("DD/MM/YYYY HH:mm")}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card
            bordered={false}
            style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 2px rgba(15,23,42,0.05)" }}
            title="Detail"
          >
            {selectedItem ? (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{selectedItem.title}</div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>
                  {dayjs(selectedItem.createdAt).format("DD/MM/YYYY HH:mm")}
                </div>
                <div style={{ color: "#1f2937", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {selectedItem.body || selectedItem.content || "—"}
                </div>
              </div>
            ) : (
              <div style={{ color: "#6b7280" }}>Chọn một thông báo để xem chi tiết.</div>
            )}
          </Card>
        </div>
      </Space>
    </div>
  );
}
