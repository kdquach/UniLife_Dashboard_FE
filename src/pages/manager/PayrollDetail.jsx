import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Descriptions,
  Table,
  Button,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  Typography,
  Popconfirm,
  message,
  Spin,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
  PayCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import {
  getPayrollDetail,
  approvePayroll,
  confirmPayment,
  deletePayroll,
} from "@/services/payroll.service";
import { updateSalary } from "@/services/salary.service";
import AdjustSalaryDialog from "@/components/payroll/AdjustSalaryDialog";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const PayrollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openAdjustDialog, setOpenAdjustDialog] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);

  useEffect(() => {
    fetchPayrollDetail();
  }, [id]);

  const fetchPayrollDetail = async () => {
    setLoading(true);
    try {
      const response = await getPayrollDetail(id);
      setPayroll(response.data.payroll);
    } catch (error) {
      console.error("Lỗi khi tải chi tiết payroll:", error);
      message.error("Không thể tải chi tiết bảng lương");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await approvePayroll(id);
      message.success("Đã duyệt kỳ lương");
      fetchPayrollDetail();
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi khi duyệt");
    }
  };

  const handlePay = async () => {
    try {
      await confirmPayment(id);
      message.success("Đã xác nhận thanh toán");
      fetchPayrollDetail();
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi khi xác nhận");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePayroll(id);
      message.success("Đã xóa kỳ lương");
      navigate("/manager/payroll");
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi khi xóa");
    }
  };

  const handleAdjustSalary = (salaryRecord) => {
    setSelectedSalary(salaryRecord);
    setOpenAdjustDialog(true);
  };

  const handleSaveAdjustment = async (data) => {
    try {
      await updateSalary(data.salaryId, {
        bonus: data.bonus,
        deduction: data.deduction,
        adjustmentReason: data.reason,
      });
      message.success("Đã cập nhật lương");
      fetchPayrollDetail();
    } catch (error) {
      message.error(error.response?.data?.message || "Lỗi khi cập nhật lương");
      throw error;
    }
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

  const columns = [
    {
      title: "Nhân viên",
      dataIndex: ["userId", "fullName"],
      key: "staffName",
      fixed: "left",
      width: 200,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.userId?.email}
          </Text>
        </div>
      ),
    },
    {
      title: "Số giờ",
      dataIndex: "totalHours",
      key: "totalHours",
      align: "right",
      width: 100,
      render: (value) => (
        <Tag icon={<ClockCircleOutlined />}>{value?.toFixed(1)} giờ</Tag>
      ),
    },
    {
      title: "Lương cơ bản",
      dataIndex: "baseSalary",
      key: "baseSalary",
      align: "right",
      width: 150,
      render: (value) => formatCurrency(value),
    },
    {
      title: "Thưởng",
      dataIndex: "bonus",
      key: "bonus",
      align: "right",
      width: 120,
      render: (value) => (
        <Text style={{ color: "#52c41a" }}>
          {value > 0 ? `+${formatCurrency(value)}` : "-"}
        </Text>
      ),
    },
    {
      title: "Khấu trừ",
      dataIndex: "deduction",
      key: "deduction",
      align: "right",
      width: 120,
      render: (value) => (
        <Text style={{ color: "#ff4d4f" }}>
          {value > 0 ? `-${formatCurrency(value)}` : "-"}
        </Text>
      ),
    },
    {
      title: "Tổng lương",
      dataIndex: "totalSalary",
      key: "totalSalary",
      align: "right",
      width: 150,
      render: (value) => (
        <Text strong style={{ color: "#1890ff", fontSize: 14 }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "adjustmentReason",
      key: "adjustmentReason",
      width: 200,
      render: (text) => text || <Text type="secondary">-</Text>,
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Space>
          {(payroll?.status === "draft" ||
            payroll?.status === "calculated") && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleAdjustSalary(record)}
            >
              Điều chỉnh
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!payroll) {
    return <Alert message="Không tìm thấy bảng lương" type="error" showIcon />;
  }

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/manager/payroll")}
          >
            Quay lại
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            Chi tiết bảng lương - {dayjs(payroll.periodStart).format("MM/YYYY")}
          </Title>
          {getStatusTag(payroll.status)}
        </Space>

        <Space>
          {payroll.status === "calculated" && (
            <Popconfirm
              title="Xác nhận duyệt kỳ lương này?"
              description="Sau khi duyệt, bạn sẽ không thể chỉnh sửa."
              onConfirm={handleApprove}
              okText="Duyệt"
              cancelText="Hủy"
            >
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                style={{ background: "#52c41a" }}
                size="large"
              >
                Duyệt kỳ lương
              </Button>
            </Popconfirm>
          )}

          {payroll.status === "approved" && (
            <Popconfirm
              title="Xác nhận đã thanh toán?"
              onConfirm={handlePay}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button type="primary" icon={<PayCircleOutlined />} size="large">
                Xác nhận thanh toán
              </Button>
            </Popconfirm>
          )}

          {(payroll.status === "draft" || payroll.status === "calculated") && (
            <Popconfirm
              title="Bạn có chắc muốn xóa kỳ lương này?"
              onConfirm={handleDelete}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button danger icon={<DeleteOutlined />} size="large">
                Xóa
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      {/* Thông tin tổng quan */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Số nhân viên"
              value={payroll.totalStaff}
              prefix={<TeamOutlined />}
              suffix="người"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng giờ làm"
              value={payroll.totalHours?.toFixed(1)}
              prefix={<ClockCircleOutlined />}
              suffix="giờ"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng lương"
              value={payroll.totalAmount}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Kỳ lương"
              value={`${dayjs(payroll.periodStart).format("DD/MM")} - ${dayjs(payroll.periodEnd).format("DD/MM/YYYY")}`}
              prefix={<CalendarOutlined />}
              valueStyle={{ fontSize: 16 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Thông tin chi tiết */}
      <Card title="Thông tin kỳ lương" style={{ marginBottom: 24 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Canteen">
            {payroll.canteenId?.name || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {getStatusTag(payroll.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {dayjs(payroll.createdAt).format("DD/MM/YYYY HH:mm")}
          </Descriptions.Item>
          <Descriptions.Item label="Người tạo">
            {payroll.createdBy?.fullName || "-"}
          </Descriptions.Item>
          {payroll.approvedBy && (
            <>
              <Descriptions.Item label="Người duyệt">
                {payroll.approvedBy?.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày duyệt">
                {dayjs(payroll.approvedAt).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
            </>
          )}
          {payroll.paidBy && (
            <>
              <Descriptions.Item label="Người xác nhận thanh toán">
                {payroll.paidBy?.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày thanh toán">
                {dayjs(payroll.paidAt).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
            </>
          )}
        </Descriptions>
      </Card>

      {/* Alert chỉnh sửa */}
      {(payroll.status === "draft" || payroll.status === "calculated") && (
        <Alert
          message="Bạn có thể điều chỉnh lương của từng nhân viên trước khi duyệt"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Bảng chi tiết lương nhân viên */}
      <Card title="Chi tiết lương nhân viên">
        <Table
          columns={columns}
          dataSource={payroll.salaries}
          rowKey="_id"
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} nhân viên`,
          }}
          summary={(pageData) => {
            let totalHours = 0;
            let totalBase = 0;
            let totalBonus = 0;
            let totalDeduction = 0;
            let totalFinal = 0;

            pageData.forEach(
              ({
                totalHours: h,
                baseSalary,
                bonus,
                deduction,
                totalSalary,
              }) => {
                totalHours += h || 0;
                totalBase += baseSalary || 0;
                totalBonus += bonus || 0;
                totalDeduction += deduction || 0;
                totalFinal += totalSalary || 0;
              },
            );

            return (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: "#fafafa" }}>
                  <Table.Summary.Cell index={0}>
                    <Text strong>Tổng cộng</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Tag icon={<ClockCircleOutlined />}>
                      {totalHours.toFixed(1)} giờ
                    </Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <Text strong>{formatCurrency(totalBase)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <Text strong style={{ color: "#52c41a" }}>
                      +{formatCurrency(totalBonus)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <Text strong style={{ color: "#ff4d4f" }}>
                      -{formatCurrency(totalDeduction)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <Text strong style={{ color: "#1890ff", fontSize: 16 }}>
                      {formatCurrency(totalFinal)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} />
                  <Table.Summary.Cell index={7} />
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>

      {/* Adjust Dialog */}
      <AdjustSalaryDialog
        open={openAdjustDialog}
        onClose={() => setOpenAdjustDialog(false)}
        onSave={handleSaveAdjustment}
        salaryData={selectedSalary}
      />
    </div>
  );
};

export default PayrollDetail;
