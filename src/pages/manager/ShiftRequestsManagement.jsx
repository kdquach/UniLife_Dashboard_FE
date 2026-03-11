import { Button, Card, Select, Space, Table, Tag } from "antd";
import dayjs from "dayjs";
import { useShiftRequestsManagement } from "@/hooks/useShiftRequestsManagement";

export default function ShiftRequestsManagementPage() {
  const {
    requests,
    statusFilter,
    setStatusFilter,
    loading,
    handleReview,
  } = useShiftRequestsManagement();

  return (
    <Card
      title="Quản lý yêu cầu đổi ca"
      extra={(
        <Space>
          <Select
            value={statusFilter}
            style={{ width: 160 }}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "Tất cả" },
              { value: "pending", label: "Đang chờ" },
              { value: "approved", label: "Đã duyệt" },
              { value: "rejected", label: "Đã từ chối" },
            ]}
          />
        </Space>
      )}
    >
      <Table
        rowKey="_id"
        loading={loading}
        dataSource={requests}
        columns={[
          {
            title: "Nhân viên",
            render: (_, row) => row.staffId?.fullName || "—",
          },
          {
            title: "Ca hiện tại",
            render: (_, row) => {
              const oldShift = row.staffShiftId?.shiftId;
              if (!oldShift) return "—";
              return `${oldShift.name} (${oldShift.startTime} - ${oldShift.endTime})`;
            },
          },
          {
            title: "Loại yêu cầu",
            render: (_, row) => {
              const typeLabel =
                row.type === "swap"
                  ? "Đổi ca"
                  : row.type === "replace"
                    ? "Nhờ thay ca"
                    : "Bỏ ca";
              return typeLabel;
            },
          },
          {
            title: "Nhân sự mục tiêu",
            render: (_, row) => row.targetStaffId?.fullName || "—",
          },
          {
            title: "Lý do",
            dataIndex: "reason",
          },
          {
            title: "Trạng thái",
            render: (_, row) => {
              const color =
                row.status === "approved"
                  ? "green"
                  : row.status === "rejected"
                    ? "red"
                    : "gold";
              const statusLabel =
                row.status === "approved"
                  ? "Đã duyệt"
                  : row.status === "rejected"
                    ? "Đã từ chối"
                    : "Đang chờ";
              return <Tag color={color}>{statusLabel}</Tag>;
            },
          },
          {
            title: "Thời gian tạo",
            render: (_, row) => dayjs(row.createdAt).format("DD/MM/YYYY HH:mm"),
          },
          {
            title: "Thời gian xử lý",
            render: (_, row) => (row.reviewedAt ? dayjs(row.reviewedAt).format("DD/MM/YYYY HH:mm") : "—"),
          },
          {
            title: "Thao tác",
            render: (_, row) => (
              <Space>
                <Button
                  type="primary"
                  size="small"
                  disabled={row.status !== "pending"}
                  onClick={() => handleReview(row._id, "approved")}
                >
                  Duyệt
                </Button>
                <Button
                  danger
                  size="small"
                  disabled={row.status !== "pending"}
                  onClick={() => handleReview(row._id, "rejected")}
                >
                  Từ chối
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}
