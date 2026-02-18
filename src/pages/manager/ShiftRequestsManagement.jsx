import { useEffect, useState } from "react";
import { Button, Card, Select, Space, Table, Tag, message } from "antd";
import dayjs from "dayjs";
import { useLocation } from "react-router-dom";
import {
  getShiftChangeRequests,
  reviewShiftChangeRequest,
} from "@/services/shiftManagement.service";

export default function ShiftRequestsManagementPage() {
  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(false);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getShiftChangeRequests(
        statusFilter ? { status: statusFilter } : {},
      );
      setRequests(data);
    } catch (error) {
      message.error(error?.response?.data?.message || "Không tải được yêu cầu đổi ca");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refreshToken = params.get("refresh");
    if (!refreshToken) return;
    void loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleReview = async (id, status) => {
    try {
      await reviewShiftChangeRequest(id, status);
      message.success(status === "approved" ? "Đã duyệt yêu cầu" : "Đã từ chối yêu cầu");
      await loadRequests();
    } catch (error) {
      message.error(error?.response?.data?.message || "Không thể xử lý yêu cầu");
    }
  };

  return (
    <Card
      title="Staff Requests Management"
      extra={(
        <Space>
          <Select
            value={statusFilter}
            style={{ width: 160 }}
            onChange={setStatusFilter}
            options={[
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
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
            title: "Staff",
            render: (_, row) => row.staffId?.fullName || "—",
          },
          {
            title: "Old Shift",
            render: (_, row) => {
              const oldShift = row.staffShiftId?.shiftId;
              if (!oldShift) return "—";
              return `${oldShift.name} (${oldShift.startTime} - ${oldShift.endTime})`;
            },
          },
          {
            title: "Requested Shift",
            render: (_, row) => {
              const shift = row.requestedShiftId;
              if (!shift) return "—";
              return `${shift.name} (${shift.startTime} - ${shift.endTime})`;
            },
          },
          {
            title: "Reason",
            dataIndex: "reason",
          },
          {
            title: "Status",
            render: (_, row) => {
              const color =
                row.status === "approved"
                  ? "green"
                  : row.status === "rejected"
                    ? "red"
                    : "gold";
              return <Tag color={color}>{row.status}</Tag>;
            },
          },
          {
            title: "Created At",
            render: (_, row) => dayjs(row.createdAt).format("DD/MM/YYYY HH:mm"),
          },
          {
            title: "Action",
            render: (_, row) => (
              <Space>
                <Button
                  type="primary"
                  size="small"
                  disabled={row.status !== "pending"}
                  onClick={() => handleReview(row._id, "approved")}
                >
                  Approve
                </Button>
                <Button
                  danger
                  size="small"
                  disabled={row.status !== "pending"}
                  onClick={() => handleReview(row._id, "rejected")}
                >
                  Reject
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}
