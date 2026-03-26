import { useEffect, useState, useCallback } from "react";
import {
  Card,
  Form,
  Input,
  TimePicker,
  Button,
  Tag,
  Empty,
  message,
  Tabs,
  Table,
  Select,
  Badge,
} from "antd";
import dayjs from "dayjs";
import GIcon from "@/components/GIcon";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getCanteenById,
  createCanteen,
  getAllCanteens,
  updateCanteen,
  reviewCanteenRegistration,
} from "@/services/canteen.service";
import { getAllCampuses } from "@/services/campus.service";
import { getMyProfile } from "@/services/profile.service";

// Định dạng giờ chung cho TimePicker và dữ liệu gửi lên BE
const timeFormat = "HH:mm";

export default function CanteenManagement() {
  // Lấy thông tin user + hàm cập nhật từ global store (Zustand)
  const { user, updateUser } = useAuthStore();
  const [form] = Form.useForm();

  // loading: spinner chung cho màn hình
  const [loading, setLoading] = useState(false);
  // submitting: trạng thái khi submit form tạo/sửa căng tin
  const [submitting, setSubmitting] = useState(false);
  // Danh sách căng tin của manager hiện tại (thường chỉ có 1)
  const [canteens, setCanteens] = useState([]);
  // Dữ liệu cho admin: các căng tin đang hoạt động
  const [adminActiveCanteens, setAdminActiveCanteens] = useState([]);
  // Dữ liệu cho admin: các căng tin chờ duyệt
  const [adminPendingCanteens, setAdminPendingCanteens] = useState([]);
  // Căng tin đang được chọn (dùng cho tab Lịch)
  const [selectedCanteen, setSelectedCanteen] = useState(null);
  // Danh sách campus để map id -> tên
  const [campuses, setCampuses] = useState([]);
  // Chưa dùng tới, giữ lại phòng khi mở modal tạo mới dạng popup
  const [createModalOpen, setCreateModalOpen] = useState(false);
  // editingId: nếu có thì đang chỉnh sửa căng tin, nếu null là tạo mới
  const [editingId, setEditingId] = useState(null);
  // Bật/tắt chế độ hiển thị form quản lý thông tin căng tin
  const [editMode, setEditMode] = useState(false);

  // Phân quyền hiển thị giao diện
  const isManager = user?.role === "manager";
  const isAdmin = user?.role === "admin";

  // Hàm load danh sách căng tin phụ thuộc vào role
  const loadCanteen = useCallback(async () => {
    if (!isManager && !isAdmin) return;
    setLoading(true);
    try {
      if (isManager) {
        if (!user?.canteenId) {
          setCanteens([]);
          setSelectedCanteen(null);
        } else {
          const res = await getCanteenById(user.canteenId);
          const canteen = res?.data?.canteen || null;
          const list = canteen ? [canteen] : [];
          setCanteens(list);
          setSelectedCanteen(list[0] || null);
        }
      } else if (isAdmin) {
        // Admin xem toàn bộ danh sách theo trạng thái
        const [activeRes, pendingRes] = await Promise.all([
          getAllCanteens({ status: "active" }),
          getAllCanteens({ status: "pending" }),
        ]);

        setAdminActiveCanteens(activeRes?.data?.canteens || []);
        setAdminPendingCanteens(pendingRes?.data?.canteens || []);
      }
    } catch (error) {
      if (isManager) {
        setCanteens([]);
        setSelectedCanteen(null);
      }
      if (isAdmin) {
        setAdminActiveCanteens([]);
        setAdminPendingCanteens([]);
      }
    } finally {
      setLoading(false);
    }
  }, [isManager, isAdmin]);

  // Khi component mount / role đổi thì load lại căng tin
  useEffect(() => {
    loadCanteen();
  }, [loadCanteen]);

  // Load danh sách campus dùng chung cho dropdown + hiển thị tên
  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        const res = await getAllCampuses();
        setCampuses(res?.data?.campuses || []);
      } catch (error) {
        // ignore
      }
    };
    fetchCampuses();
  }, []);

  // Sau khi manager đăng ký căng tin thành công, cập nhật lại profile
  const refreshProfile = useCallback(async () => {
    try {
      const res = await getMyProfile();
      const profile = res?.data;
      if (profile) {
        updateUser(profile);
      }
    } catch (error) {
      // ignore profile refresh error
    }
  }, [updateUser]);

  // Submit form tạo mới / cập nhật thông tin cơ bản của căng tin
  const handleSubmit = useCallback(
    async (values) => {
      if (!isManager) return;
      setSubmitting(true);

      const payload = {
        name: values.name,
        location: values.location,
        campusId: values.campusId,
        openingTime: values.openingTime
          ? values.openingTime.format(timeFormat)
          : undefined,
        closingTime: values.closingTime
          ? values.closingTime.format(timeFormat)
          : undefined,
      };

      try {
        if (editingId) {
          // Update basic info for selected canteen
          const res = await updateCanteen(editingId, payload);
          message.success("Cập nhật thông tin căng tin thành công");
          setEditMode(false);
          const updated = res?.data?.canteen;
          if (updated) {
            setCanteens([updated]);
            setSelectedCanteen(updated);
          } else {
            await loadCanteen();
          }
        } else {
          // Tạo mới căng tin cho tài khoản hiện tại
          const res = await createCanteen(payload);
          message.success("Đăng ký căng tin thành công");
          const created = res?.data?.canteen;
          if (created) {
            setCanteens([created]);
            setSelectedCanteen(created);
            setEditMode(false);
          }

          // Sau khi đăng ký thành công, làm mới profile để cập nhật canteenId, v.v.
          await refreshProfile();
        }
      } catch (error) {
        message.error(
          error?.response?.data?.message ||
            "Không thể lưu thông tin căng tin. Vui lòng thử lại.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [editingId, isManager, refreshProfile, loadCanteen],
  );

  // Nếu không phải manager hoặc admin thì không cho vào màn hình
  if (!isManager && !isAdmin) {
    return (
      <Empty
        description="Chỉ tài khoản Manager (chủ căng tin) mới được quản lý căng tin"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  const campusOptions = campuses.map((c) => ({ label: c.name, value: c._id }));

  // Danh sách trạng thái có thể có của căng tin
  const statusOptions = [
    { label: "Chờ duyệt", value: "pending", color: "grey" },
    { label: "Đang hoạt động", value: "active", color: "green" },
    { label: "Tạm dừng", value: "inactive", color: "volcano" },
    { label: "Bảo trì", value: "maintenance", color: "orange" },
  ];

  // Manager được phép đổi trạng thái canteen của mình
  const handleManagerStatusChange = useCallback(
    async (id, status) => {
      try {
        await updateCanteen(id, { status });
        message.success("Cập nhật trạng thái căng tin thành công");
        await loadCanteen();
      } catch (error) {
        message.error(
          error?.response?.data?.message ||
            "Không thể cập nhật trạng thái. Vui lòng thử lại.",
        );
      }
    },
    [loadCanteen],
  );

  // Cấu hình các cột bảng quản lý căng tin cho Manager
  const managerColumns = [
    {
      title: "Tên căng tin",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Campus",
      dataIndex: ["campusId", "name"],
      key: "campus",
      render: (_, record) => {
        if (record.campusId && typeof record.campusId === "object") {
          return record.campusId.name || "-";
        }
        const found = campuses.find((c) => c._id === record.campusId);
        return found?.name || "-";
      },
    },
    {
      title: "Vị trí",
      dataIndex: "location",
      key: "location",
    },
    {
      title: "Giờ mở cửa",
      key: "time",
      render: (_, record) =>
        `${record.openingTime || ""} - ${record.closingTime || ""}`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        // Nếu đang chờ duyệt: chỉ hiển thị tag, không cho sửa
        if (status === "pending") {
          const opt = statusOptions.find((o) => o.value === "pending");
          return (
            <Tag color={opt?.color || "default"} style={{ margin: 0 }}>
              {opt?.label || "Chờ duyệt"}
            </Tag>
          );
        }

        // Các trạng thái khác: cho phép manager đổi nhưng không thể chọn lại "Chờ duyệt"
        const managerStatusOptions = statusOptions.filter(
          (opt) => opt.value !== "pending",
        );

        return (
          <Select
            value={status}
            options={managerStatusOptions.map((opt) => ({
              ...opt,
              label: (
                <Tag color={opt.color} style={{ margin: 0 }}>
                  {opt.label}
                </Tag>
              ),
            }))}
            size="small"
            style={{ minWidth: 140 }}
            onChange={(value) => handleManagerStatusChange(record._id, value)}
          />
        );
      },
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Button
          size="small"
          icon={<GIcon name="edit" />}
          onClick={() => {
            setSelectedCanteen(record);
            setEditingId(record._id);
            form.setFieldsValue({
              name: record.name,
              location: record.location,
              campusId: record.campusId?._id || record.campusId,
              openingTime: record.openingTime
                ? dayjs(record.openingTime, timeFormat)
                : undefined,
              closingTime: record.closingTime
                ? dayjs(record.closingTime, timeFormat)
                : undefined,
            });
            setEditMode(true);
          }}
        >
          Sửa
        </Button>
      ),
    },
  ];

  // ==================== GIAO DIỆN ADMIN: DUYỆT CANTEEN ====================
  // Admin phê duyệt căng tin từ pending -> active
  const handleAdminApprove = useCallback(
    async (id) => {
      try {
        await reviewCanteenRegistration(id, "approve");
        message.success("Đã duyệt căng tin, chuyển sang trạng thái hoạt động");
        await loadCanteen();
      } catch (error) {
        message.error(
          error?.response?.data?.message ||
            "Không thể duyệt căng tin. Vui lòng thử lại.",
        );
      }
    },
    [loadCanteen],
  );

  // Admin từ chối đăng ký canteen (pending -> inactive)
  const handleAdminReject = useCallback(
    async (id) => {
      try {
        await reviewCanteenRegistration(id, "reject");
        message.success("Đã từ chối đăng ký căng tin");
        await loadCanteen();
      } catch (error) {
        message.error(
          error?.response?.data?.message ||
            "Không thể từ chối đăng ký. Vui lòng thử lại.",
        );
      }
    },
    [loadCanteen],
  );

  // ==================== GIAO DIỆN ADMIN ====================
  if (isAdmin) {
    const adminActiveColumns = [
      {
        title: "Tên căng tin",
        dataIndex: "name",
        key: "name",
      },
      {
        title: "Campus",
        dataIndex: ["campusId", "name"],
        key: "campus",
        render: (_, record) => {
          if (record.campusId && typeof record.campusId === "object") {
            return record.campusId.name || "-";
          }
          const found = campuses.find((c) => c._id === record.campusId);
          return found?.name || "-";
        },
      },
      {
        title: "Vị trí",
        dataIndex: "location",
        key: "location",
      },
      {
        title: "Giờ mở cửa",
        key: "time",
        render: (_, record) =>
          `${record.openingTime || ""} - ${record.closingTime || ""}`,
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          const opt = statusOptions.find((o) => o.value === status);
          return (
            <Tag color={opt?.color || "default"} style={{ margin: 0 }}>
              {opt?.label || status}
            </Tag>
          );
        },
      },
    ];

    const adminPendingColumns = [
      {
        title: "Tên căng tin",
        dataIndex: "name",
        key: "name",
      },
      {
        title: "Campus",
        dataIndex: ["campusId", "name"],
        key: "campus",
        render: (_, record) => {
          if (record.campusId && typeof record.campusId === "object") {
            return record.campusId.name || "-";
          }
          const found = campuses.find((c) => c._id === record.campusId);
          return found?.name || "-";
        },
      },
      {
        title: "Vị trí",
        dataIndex: "location",
        key: "location",
      },
      {
        title: "Giờ mở cửa",
        key: "time",
        render: (_, record) =>
          `${record.openingTime || ""} - ${record.closingTime || ""}`,
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (status) => {
          const opt = statusOptions.find((o) => o.value === status);
          return (
            <Tag color={opt?.color || "default"} style={{ margin: 0 }}>
              {opt?.label || status}
            </Tag>
          );
        },
      },
      {
        title: "Thao tác",
        key: "actions",
        render: (_, record) => (
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              type="primary"
              size="small"
              icon={<GIcon name="check" />}
              onClick={() => handleAdminApprove(record._id)}
            >
              Duyệt hoạt động
            </Button>
            <Button
              danger
              size="small"
              icon={<GIcon name="close" />}
              onClick={() => handleAdminReject(record._id)}
            >
              Từ chối
            </Button>
          </div>
        ),
      },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                marginBottom: 4,
              }}
            >
              Quản lý
            </div>
            <div
              style={{ fontSize: 26, fontWeight: 700, color: "var(--text)" }}
            >
              Canteen
            </div>
          </div>
        </div>

        <Tabs
          defaultActiveKey="active"
          items={[
            {
              key: "active",
              label: "Canteen đang hoạt động",
              children: (
                <Card className="surface-card" loading={loading}>
                  {adminActiveCanteens.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Không có căng tin đang hoạt động"
                    />
                  ) : (
                    <Table
                      rowKey="_id"
                      columns={adminActiveColumns}
                      dataSource={adminActiveCanteens}
                      pagination={false}
                    />
                  )}
                </Card>
              ),
            },
            {
              key: "pending",
              label: (
                <Badge
                  count={adminPendingCanteens.length}
                  overflowCount={99}
                  size="small"
                >
                  <span style={{ paddingRight: 4 }}>Duyệt Canteen</span>
                </Badge>
              ),
              children: (
                <Card className="surface-card" loading={loading}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      Danh sách căng tin chờ duyệt
                    </div>
                  </div>

                  {adminPendingCanteens.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Không có căng tin chờ duyệt"
                    />
                  ) : (
                    <Table
                      rowKey="_id"
                      columns={adminPendingColumns}
                      dataSource={adminPendingCanteens}
                      pagination={false}
                    />
                  )}
                </Card>
              ),
            },
          ]}
        />
      </div>
    );
  }

  // ==================== GIAO DIỆN MANAGER ====================

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              marginBottom: 4,
            }}
          >
            Quản lý
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text)" }}>
            Canteen
          </div>
        </div>
      </div>

      <Tabs
        defaultActiveKey="management"
        items={[
          {
            key: "management",
            label: "Quản lý Canteen",
            children: (
              <>
                <Card className="surface-card" loading={loading}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      Danh sách căng tin của bạn
                    </div>
                    {canteens.length === 0 && (
                      <Button
                        type="primary"
                        icon={<GIcon name="add" />}
                        onClick={() => {
                          setEditingId(null);
                          setEditMode(true);
                          form.resetFields();
                        }}
                      >
                        Đăng ký căng tin
                      </Button>
                    )}
                  </div>
                  {canteens.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Bạn chưa có căng tin nào"
                    />
                  ) : (
                    <Table
                      rowKey="_id"
                      columns={managerColumns}
                      dataSource={canteens}
                      pagination={false}
                      style={{ marginBottom: 16 }}
                    />
                  )}

                  {editMode && (
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSubmit}
                      initialValues={{
                        openingTime: selectedCanteen?.openingTime
                          ? dayjs(selectedCanteen.openingTime, timeFormat)
                          : dayjs("07:00", timeFormat),
                        closingTime: selectedCanteen?.closingTime
                          ? dayjs(selectedCanteen.closingTime, timeFormat)
                          : dayjs("21:00", timeFormat),
                      }}
                    >
                      <Form.Item
                        label="Tên căng tin"
                        name="name"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập tên căng tin",
                          },
                        ]}
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        label="Campus"
                        name="campusId"
                        rules={[
                          { required: true, message: "Vui lòng chọn campus" },
                        ]}
                      >
                        <Select
                          options={campusOptions}
                          placeholder="Chọn campus"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Địa điểm / Mô tả vị trí"
                        name="location"
                        rules={[
                          { required: true, message: "Vui lòng nhập địa điểm" },
                        ]}
                      >
                        <Input.TextArea rows={3} />
                      </Form.Item>

                      <Form.Item label="Thời gian hoạt động">
                        <div style={{ display: "flex", gap: 8 }}>
                          <Form.Item name="openingTime" noStyle>
                            <TimePicker format={timeFormat} />
                          </Form.Item>
                          <span style={{ alignSelf: "center" }}>đến</span>
                          <Form.Item name="closingTime" noStyle>
                            <TimePicker format={timeFormat} />
                          </Form.Item>
                        </div>
                      </Form.Item>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 8,
                        }}
                      >
                        <Button
                          onClick={() => {
                            setEditMode(false);
                            setEditingId(null);
                            form.resetFields();
                          }}
                        >
                          Hủy
                        </Button>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={submitting}
                        >
                          Lưu
                        </Button>
                      </div>
                    </Form>
                  )}
                </Card>
              </>
            ),
          },
          {
            key: "schedule",
            label: "Lịch Canteen",
            // TAB LỊCH CANTEEN: cho phép manager xem lịch 7 ngày tới và đánh dấu ngày nghỉ
            children: (
              <Card className="surface-card" loading={loading}>
                {/* Nếu chưa có căng tin active thì không hiển thị lịch */}
                {canteens.filter((c) => c.status === "active").length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có căng tin đang hoạt động để hiển thị lịch. Vui lòng đợi admin duyệt."
                  />
                ) : (
                  (() => {
                    // Lọc ra các căng tin đang ở trạng thái active
                    const activeCanteens = canteens.filter(
                      (c) => c.status === "active",
                    );

                    // Ưu tiên canteen đang được chọn nếu nó active, nếu không lấy canteen active đầu tiên
                    const fallbackActive = activeCanteens[0];
                    const canteen =
                      (selectedCanteen && selectedCanteen.status === "active"
                        ? selectedCanteen
                        : null) || fallbackActive;

                    // Hàm hỗ trợ parse string giờ "HH:mm" thành đối tượng dayjs của ngày hôm nay
                    const parseTime = (timeStr, base) => {
                      if (!timeStr) return null;
                      const [h, m] = timeStr.split(":").map(Number);
                      return base
                        .hour(h || 0)
                        .minute(m || 0)
                        .second(0);
                    };

                    const now = dayjs();
                    const todayBase = dayjs();
                    const openToday = parseTime(canteen.openingTime, todayBase);
                    const closeToday = parseTime(
                      canteen.closingTime,
                      todayBase,
                    );

                    // Canteen đang mở hay đã đóng tại thời điểm hiện tại (so sánh giờ hiện tại với giờ mở/đóng)
                    const isOpenNow =
                      openToday &&
                      closeToday &&
                      now.isAfter(openToday) &&
                      now.isBefore(closeToday);

                    // Lấy tên campus từ object hoặc từ danh sách campuses
                    const campusName =
                      (canteen.campusId &&
                        typeof canteen.campusId === "object" &&
                        canteen.campusId.name) ||
                      (campuses.find((c) => c._id === canteen.campusId)?.name ??
                        "-");

                    // Tạo mảng 7 ngày (hôm nay + 6 ngày tới)
                    const weekDays = Array.from({ length: 7 }, (_, i) => {
                      const d = dayjs().add(i, "day");
                      return {
                        // key lưu theo format YYYY-MM-DD để đồng bộ với offDates trong DB
                        key: d.format("YYYY-MM-DD"),
                        isToday: i === 0,
                        // Hôm nay hiện chữ "Hôm nay", các ngày sau hiện DD/MM
                        label: i === 0 ? "Hôm nay" : d.format("DD/MM"),
                      };
                    });

                    // Chuỗi hiển thị khung giờ mở cửa hằng ngày
                    const timeRangeLabel = `${canteen.openingTime || "--:--"} - ${
                      canteen.closingTime || "--:--"
                    }`;

                    // offDates: mảng ngày nghỉ đặc biệt (theo format YYYY-MM-DD) lấy từ BE
                    const offDates = Array.isArray(canteen.offDates)
                      ? canteen.offDates
                      : [];

                    // Hàm bật/tắt ngày nghỉ cho một ngày cụ thể
                    const handleToggleOffDay = async (
                      dateKey,
                      isCurrentlyOff,
                    ) => {
                      console.log(
                        "🚀 ~ handleToggleOffDay ~ isCurrentlyOff:",
                        isCurrentlyOff,
                      );
                      console.log(
                        "🚀 ~ handleToggleOffDay ~ dateKey:",
                        dateKey,
                      );
                      try {
                        // Nếu đang là ngày nghỉ -> bỏ khỏi danh sách
                        // Nếu đang là ngày làm -> thêm vào danh sách (dùng Set để tránh trùng)
                        const nextOffDates = isCurrentlyOff
                          ? offDates.filter((d) => d !== dateKey)
                          : [...new Set([...offDates, dateKey])];
                        console.log(
                          "🚀 ~ handleToggleOffDay ~ nextOffDates:",
                          nextOffDates,
                        );

                        const res = await updateCanteen(canteen._id, {
                          offDates: nextOffDates,
                        });

                        const updated = res?.data?.canteen;
                        if (updated) {
                          // Cập nhật lại state local
                          setCanteens([updated]);
                          setSelectedCanteen(updated);
                        } else {
                          // Nếu BE không trả về canteen mới, gọi lại API loadCanteen
                          await loadCanteen();
                        }

                        message.success(
                          isCurrentlyOff
                            ? "Đã bật hoạt động lại cho ngày này"
                            : "Đã đặt ngày nghỉ cho ngày này",
                        );
                      } catch (error) {
                        message.error(
                          error?.response?.data?.message ||
                            "Không thể cập nhật ngày nghỉ. Vui lòng thử lại.",
                        );
                      }
                    };

                    return (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 16,
                        }}
                      >
                        {/* THÔNG TIN LỊCH HÔM NAY */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 16,
                                fontWeight: 600,
                                marginBottom: 4,
                              }}
                            >
                              Lịch hoạt động hôm nay
                            </div>
                            <div
                              style={{
                                color: "var(--text-muted)",
                                fontSize: 13,
                              }}
                            >
                              {canteen.name}
                              {campusName &&
                                campusName !== "-" &&
                                ` • ${campusName}`}
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                            }}
                          >
                            <div style={{ textAlign: "right" }}>
                              <Tag
                                color={isOpenNow ? "green" : "red"}
                                style={{ margin: 0 }}
                              >
                                {/* Hiển thị trạng thái hiện tại theo giờ hệ thống */}
                                {isOpenNow ? "Đang mở" : "Đã đóng"}
                              </Tag>
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--text-muted)",
                              }}
                            >
                              Giờ hoạt động: {timeRangeLabel}
                            </div>
                          </div>
                        </div>

                        {/* LỊCH 7 NGÀY TỚI */}
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              marginBottom: 8,
                            }}
                          >
                            Lịch 7 ngày tới
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            {weekDays.map((d) => {
                              const isOff = offDates.includes(d.key);
                              const isToday = d.isToday;

                              // isCurrentlyOff: ngày này hiện đang là ngày nghỉ hay không
                              const isCurrentlyOff = isOff;

                              // nếu là ngày hiện tại thì ẨN LUÔN nút đặt nghỉ/bật hoạt động.
                              // Vì vậy không cần tính disableToggle theo giờ nữa.

                              return (
                                <div
                                  key={d.key}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    backgroundColor: isOff
                                      ? "#fff1f0" // màu nền cho ngày nghỉ
                                      : isToday
                                        ? "rgba(24, 144, 255, 0.06)" // nhấn mạnh hôm nay
                                        : "var(--surface-subtle, #fafafa)",
                                    border: isOff
                                      ? "1px solid #ffa39e"
                                      : isToday
                                        ? "1px solid rgba(24, 144, 255, 0.35)"
                                        : "1px solid #f0f0f0",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontWeight: isToday ? 600 : 500,
                                      }}
                                    >
                                      {d.label}
                                    </span>
                                    {isToday && (
                                      <Tag color="blue" style={{ margin: 0 }}>
                                        Hôm nay
                                      </Tag>
                                    )}
                                    {isOff && (
                                      <Tag
                                        color="volcano"
                                        style={{ margin: 0 }}
                                      >
                                        Nghỉ
                                      </Tag>
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontVariantNumeric: "tabular-nums",
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      {timeRangeLabel}
                                    </div>
                                    {/* Nếu là hôm nay thì ẩn luôn nút, chỉ cho xem thông tin */}
                                    {!isToday && (
                                      <Button
                                        size="small"
                                        onClick={() =>
                                          handleToggleOffDay(
                                            d.key,
                                            isCurrentlyOff,
                                          )
                                        }
                                      >
                                        {/* Nếu đang nghỉ thì cho phép "Bật hoạt động" ngược lại "Đặt nghỉ" */}
                                        {isOff ? "Bật hoạt động" : "Đặt nghỉ"}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
