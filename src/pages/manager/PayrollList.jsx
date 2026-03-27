import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Space,
  Tag,
  Alert,
  Select,
  Row,
  Col,
  Typography,
  Popconfirm,
  message,
  Spin,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  PayCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getAllPayrolls,
  generatePayroll,
  approvePayroll,
  confirmPayment,
  deletePayroll,
} from "@/services/payroll.service";
import GeneratePayrollDialog from "@/components/payroll/GeneratePayrollDialog";
import ResponsiveDataTable from "@/components/ResponsiveDataTable";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const PayrollList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    month: "",
    year: "",
  });

  useEffect(() => {
    if (user?.canteenId) {
      fetchPayrolls();
    }
  }, [user?.canteenId, filters]);

  const fetchPayrolls = async () => {
    if (!user?.canteenId) return;

    setLoading(true);
    try {
      const params = {
        canteenId: user.canteenId,
      };
      if (filters.status) params.status = filters.status;
      if (filters.month && filters.year) {
        const periodStart = dayjs()
          .year(filters.year)
          .month(filters.month - 1)
          .date(1)
          .toISOString();
        const periodEnd = dayjs()
          .year(filters.year)
          .month(filters.month - 1)
          .endOf("month")
          .toISOString();
        params.periodStart = periodStart;
        params.periodEnd = periodEnd;
      }

      const response = await getAllPayrolls(params);
      setPayrolls(response.data.payrolls || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách payroll:", error);
      message.error("Không thể tải danh sách bảng lương");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (data) => {
    try {
      await generatePayroll({
        ...data,
        canteenId: user.canteenId,
      });
      message.success("Tạo bảng lương thành công!");
      fetchPayrolls();
      setOpenGenerateDialog(false);
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi khi tạo bảng lương");
      throw error;
    }
  };

  const handleApprove = async (id) => {
    try {
      await approvePayroll(id);
      message.success("Đã duyệt kỳ lương");
      fetchPayrolls();
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi khi duyệt");
    }
  };

  const handlePay = async (id) => {
    try {
      await confirmPayment(id);
      message.success("Đã xác nhận thanh toán");
      fetchPayrolls();
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi khi xác nhận");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePayroll(id);
      message.success("Đã xóa kỳ lương");
      fetchPayrolls();
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi khi xóa");
    }
  };

  const handleResetFilters = () => {
    setFilters({
      status: "",
      month: "",
      year: "",
    });
  };

  const hasCurrentPeriodPayroll = () => {
    const now = dayjs();
    const currentMonth = now.month();
    const currentYear = now.year();

    return payrolls.some((p) => {
      const pStart = dayjs(p.periodStart);
      return pStart.month() === currentMonth && pStart.year() === currentYear;
    });
  };

  const getStatusTag = (status) => {
    const statusMap = {
      draft: { color: "default", text: "Nháp" },
      calculated: { color: "processing", text: "Đã tính" },
      approved: { color: "success", text: "Đã duyệt" },
      paid: { color: "blue", text: "Đã thanh toán" },
      cancelled: { color: "error", text: "Đã hủy" },
    };
    const config = statusMap[status] || statusMap.draft;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const formatDateRange = (start, end) => {
    return `${dayjs(start).format("DD/MM/YYYY")} - ${dayjs(end).format("DD/MM/YYYY")}`;
  };

  const columns = [
    {
      title: "Kỳ lương",
      dataIndex: "periodStart",
      key: "period",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {dayjs(record.periodStart).format("MM/YYYY")}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatDateRange(record.periodStart, record.periodEnd)}
          </Text>
        </div>
      ),
    },
    {
      title: "Số nhân viên",
      dataIndex: "totalStaff",
      key: "totalStaff",
      align: "center",
      render: (value) => <Tag>{value} người</Tag>,
    },
    {
      title: "Tổng giờ",
      dataIndex: "totalHours",
      key: "totalHours",
      align: "right",
      render: (value) => `${value?.toFixed(1) || 0} giờ`,
    },
    {
      title: "Tổng lương",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right",
      render: (value) => (
        <Text strong style={{ color: "#52c41a" }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/manager/payroll/${record._id}`)}
          >
            Xem
          </Button>

          {record.status === "calculated" && (
            <Popconfirm
              title="Xác nhận duyệt kỳ lương này?"
              onConfirm={() => handleApprove(record._id)}
              okText="Duyệt"
              cancelText="Hủy"
            >
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                style={{ background: "#52c41a" }}
              >
                Duyệt
              </Button>
            </Popconfirm>
          )}

          {record.status === "approved" && (
            <Popconfirm
              title="Xác nhận đã thanh toán kỳ lương này?"
              onConfirm={() => handlePay(record._id)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button type="primary" icon={<PayCircleOutlined />}>
                Thanh toán
              </Button>
            </Popconfirm>
          )}

          {(record.status === "draft" || record.status === "calculated") && (
            <Popconfirm
              title="Bạn có chắc muốn xóa kỳ lương này?"
              onConfirm={() => handleDelete(record._id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <Title level={3}>Quản lý bảng lương</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpenGenerateDialog(true)}
          size="large"
        >
          Tạo bảng lương
        </Button>
      </div>

      {/* Alert */}
      {!loading && !hasCurrentPeriodPayroll() && (
        <Alert
          message={`Chưa tạo bảng lương tháng ${dayjs().format("MM/YYYY")}`}
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={() => setOpenGenerateDialog(true)}>
              Tạo ngay
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <div className="dashboard-filter-bar">
          <div className="dashboard-filter-item">
            <Select
              placeholder="Tháng"
              value={filters.month || undefined}
              onChange={(value) => setFilters({ ...filters, month: value })}
              style={{ width: "100%" }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <Option key={m} value={m}>
                  Tháng {m}
                </Option>
              ))}
            </Select>
          </div>

          <div className="dashboard-filter-item">
            <Select
              placeholder="Năm"
              value={filters.year || undefined}
              onChange={(value) => setFilters({ ...filters, year: value })}
              style={{ width: "100%" }}
            >
              {[2024, 2025, 2026].map((y) => (
                <Option key={y} value={y}>
                  {y}
                </Option>
              ))}
            </Select>
          </div>

          <div className="dashboard-filter-item">
            <Select
              placeholder="Trạng thái"
              value={filters.status || undefined}
              onChange={(value) => setFilters({ ...filters, status: value })}
              style={{ width: "100%" }}
              allowClear
            >
              <Option value="draft">Nháp</Option>
              <Option value="calculated">Đã tính</Option>
              <Option value="approved">Đã duyệt</Option>
              <Option value="paid">Đã thanh toán</Option>
            </Select>
          </div>

          <div className="dashboard-filter-actions">
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleResetFilters}
            >
              Làm mới
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : payrolls.length === 0 ? (
          <Empty
            description={
              <div>
                <Text strong>Chưa có bảng lương nào</Text>
                <br />
                <Text type="secondary">
                  Bắt đầu bằng cách tạo bảng lương cho kỳ lương hiện tại
                </Text>
              </div>
            }
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => setOpenGenerateDialog(true)}
            >
              Tạo bảng lương tháng {dayjs().format("MM/YYYY")}
            </Button>
          </Empty>
        ) : (
          <ResponsiveDataTable
            columns={columns}
            dataSource={payrolls}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Tổng ${total} kỳ lương`,
            }}
            mobileFields={[
              "period",
              "status",
              "totalAmount",
              "actions",
            ]}
          />
        )}
      </Card>

      {/* Generate Dialog */}
      <GeneratePayrollDialog
        open={openGenerateDialog}
        onClose={() => setOpenGenerateDialog(false)}
        onGenerate={handleGenerate}
      />
    </div>
  );
};

export default PayrollList;
