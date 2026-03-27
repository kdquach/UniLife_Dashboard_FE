import { Button, Card, Select, Space, Tag } from "antd";
import dayjs from "dayjs";
import { useShiftRequestsManagement } from "@/hooks/useShiftRequestsManagement";
import ResponsiveDataTable from "@/components/ResponsiveDataTable";

export default function ShiftRequestsManagementPage() {
  const {
    requests,
    statusFilter,
    setStatusFilter,
    loading,
    handleReview,
  } = useShiftRequestsManagement();

  return (
    <Card title="Quản lý yêu cầu đổi ca">
      <div className="dashboard-filter-bar" style={{ marginBottom: 16 }}>
        <div className="dashboard-filter-item">
          <Select
            value={statusFilter}
            style={{ width: "100%" }}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "Tất cả" },
              { value: "pending", label: "Đang chờ" },
              { value: "approved", label: "Đã duyệt" },
              { value: "rejected", label: "Đã từ chối" },
            ]}
          />
        </div>
      </div>

      <ResponsiveDataTable
        rowKey="_id"
        loading={loading}
        dataSource={requests}
        mobileFields={[
          "staff",
          "status",
          "currentShift",
          "action",
        ]}
        columns={[
          {
            title: "Nhân viên",
            key: "staff",
            render: (_, row) => row.staffId?.fullName || "—",
          },
          {
            title: "Ca hiện tại",
            key: "currentShift",
            render: (_, row) => {
              const oldShift = row.staffShiftId?.shiftId;
              if (!oldShift) return "—";
              return `${oldShift.name} (${oldShift.startTime} - ${oldShift.endTime})`;
            },
          },
          {
            title: "Nội dung yêu cầu",
            key: "requestType",
            render: () => "Yêu cầu bỏ ca",
          },
          {
            title: "Lý do",
            dataIndex: "reason",
            key: "reason",
          },
          {
            title: "Trạng thái",
            key: "status",
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
            key: "createdAt",
            render: (_, row) => dayjs(row.createdAt).format("DD/MM/YYYY HH:mm"),
          },
          {
            title: "Thời gian xử lý",
            key: "reviewedAt",
            render: (_, row) => (row.reviewedAt ? dayjs(row.reviewedAt).format("DD/MM/YYYY HH:mm") : "—"),
          },
          {
            title: "Thao tác",
            key: "action",
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
