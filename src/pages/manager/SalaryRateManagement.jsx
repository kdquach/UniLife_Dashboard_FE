import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Space,
  message,
  Modal,
  Form,
  InputNumber,
  Input,
  Select,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Divider,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DollarOutlined,
  UserOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getSalaryRatesByCanteen,
  setSalaryRate,
} from "@/services/salaryRate.service";
import { getAllUsers } from "@/services/user.service";
import ResponsiveDataTable from "@/components/ResponsiveDataTable";

const { Title, Text } = Typography;
const { Option } = Select;

const SalaryRateManagement = () => {
  const { user } = useAuthStore();
  const [salaryRates, setSalaryRates] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (user?.canteenId) {
      fetchData();
    }
  }, [user?.canteenId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Lấy salary rates và danh sách staff song song
      const [ratesRes, usersRes] = await Promise.all([
        getSalaryRatesByCanteen(user.canteenId),
        getAllUsers({ canteenId: user.canteenId, role: "staff" }),
      ]);

      setSalaryRates(ratesRes.data?.salaryRates || []);
      setStaffList(usersRes.data?.users || []);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      message.error("Không thể tải danh sách cấu hình lương");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRate(null);
    form.resetFields();
    // Set giá trị mặc định
    form.setFieldsValue({
      hourlyRate: 50000,
      attendanceBonus100: 500000,
      attendanceBonus95: 300000,
      attendanceBonus90: 100000,
      overtimeMultiplier: 1.5,
      lateDeduction: 50000,
      earlyLeaveDeduction: 30000,
      absentDeduction: 200000,
      maxLateAllowed: 3,
    });
    setOpenModal(true);
  };

  const handleEdit = (record) => {
    setEditingRate(record);
    form.setFieldsValue({
      userId: record.userId._id,
      hourlyRate: record.hourlyRate,
      attendanceBonus100: record.attendanceBonus100,
      attendanceBonus95: record.attendanceBonus95,
      attendanceBonus90: record.attendanceBonus90,
      overtimeMultiplier: record.overtimeMultiplier,
      lateDeduction: record.lateDeduction,
      earlyLeaveDeduction: record.earlyLeaveDeduction,
      absentDeduction: record.absentDeduction,
      maxLateAllowed: record.maxLateAllowed,
      note: record.note,
    });
    setOpenModal(true);
  };

  const handleSubmit = async (values) => {
    try {
      await setSalaryRate({
        ...values,
        // Nếu đang edit, lấy userId từ editingRate vì field không được render
        userId: editingRate ? editingRate.userId._id : values.userId,
        canteenId: user.canteenId,
      });
      message.success(
        editingRate ? "Đã cập nhật cấu hình lương" : "Đã thêm cấu hình lương",
      );
      setOpenModal(false);
      fetchData();
    } catch (error) {
      message.error(
        error.response?.data?.message || "Lỗi khi lưu cấu hình lương",
      );
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  // Lọc staff chưa có salary rate
  const availableStaff = staffList.filter(
    (staff) => !salaryRates.some((rate) => rate.userId._id === staff._id),
  );

  const columns = [
    {
      title: "Nhân viên",
      dataIndex: ["userId", "fullName"],
      key: "staffName",
      fixed: "left",
      width: 50,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {record.userId?.email}
          </Text>
        </div>
      ),
    },
    {
      title: "Lương giờ",
      dataIndex: "hourlyRate",
      key: "hourlyRate",
      align: "right",
      width: 50,
      render: (value) => (
        <Tag color="blue" icon={<DollarOutlined />} style={{ fontSize: 13 }}>
          {formatCurrency(value)}
        </Tag>
      ),
    },
    {
      title: "Thưởng chuyên cần",
      key: "attendanceBonus",
      width: 50,
      render: (_, record) => (
        <Space direction="vertical" orientation="vertical" size={2}>
          <Text style={{ fontSize: 13 }}>
            100%: <strong>{formatCurrency(record.attendanceBonus100)}</strong>
          </Text>
          <Text style={{ fontSize: 13 }}>
            ≥95%: <strong>{formatCurrency(record.attendanceBonus95)}</strong>
          </Text>
          <Text style={{ fontSize: 13 }}>
            ≥90%: <strong>{formatCurrency(record.attendanceBonus90)}</strong>
          </Text>
        </Space>
      ),
    },
    {
      title: "Hệ số OT",
      dataIndex: "overtimeMultiplier",
      key: "overtimeMultiplier",
      align: "center",
      width: 50,
      render: (value) => <Tag color="green">x{value}</Tag>,
    },
    {
      title: "Phạt",
      key: "deductions",
      width: 50,
      render: (_, record) => (
        <Space direction="vertical" orientation="vertical" size={2}>
          <Text style={{ fontSize: 13, color: "#ff4d4f" }}>
            Đi muộn: {formatCurrency(record.lateDeduction)}
          </Text>
          <Text style={{ fontSize: 13, color: "#ff4d4f" }}>
            Về sớm: {formatCurrency(record.earlyLeaveDeduction)}
          </Text>
          <Text style={{ fontSize: 13, color: "#ff4d4f" }}>
            Nghỉ KP: {formatCurrency(record.absentDeduction)}
          </Text>
        </Space>
      ),
    },
    {
      title: "Cho phép muộn",
      dataIndex: "maxLateAllowed",
      key: "maxLateAllowed",
      align: "center",
      width: 30,
      render: (value) => <Tag>{value} lần</Tag>,
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right",
      width: 20,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          Sửa
        </Button>
      ),
    },
  ];

  // Tính thống kê
  const stats = {
    total: salaryRates.length,
    avgHourlyRate:
      salaryRates.reduce((sum, r) => sum + r.hourlyRate, 0) /
        salaryRates.length || 0,
    maxHourlyRate: Math.max(...salaryRates.map((r) => r.hourlyRate), 0),
    minHourlyRate:
      salaryRates.length > 0
        ? Math.min(...salaryRates.map((r) => r.hourlyRate))
        : 0,
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Cấu hình lương & thưởng phạt
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          size="large"
          disabled={availableStaff.length === 0}
        >
          Thêm cấu hình
        </Button>
      </div>

      {/* Thống kê */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng nhân viên đã cấu hình"
              value={stats.total}
              prefix={<UserOutlined />}
              suffix="người"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Lương giờ TB"
              value={stats.avgHourlyRate}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(value)}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Lương giờ cao nhất"
              value={stats.maxHourlyRate}
              styles={{ value: { color: "#52c41a" } }}
              formatter={(value) => formatCurrency(value)}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Lương giờ thấp nhất"
              value={stats.minHourlyRate}
              styles={{ value: { color: "#faad14" } }}
              formatter={(value) => formatCurrency(value)}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card>
        <ResponsiveDataTable
          columns={columns}
          dataSource={salaryRates}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1400 }}
          mobileFields={[
            "staffName",
            "hourlyRate",
            "overtimeMultiplier",
            "action",
          ]}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} cấu hình`,
          }}
        />
      </Card>

      {/* Modal Form */}
      <Modal
        title={
          editingRate
            ? `Cấu hình lương - ${editingRate.userId?.fullName}`
            : "Thêm cấu hình lương mới"
        }
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onOk={() => form.submit()}
        width={800}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editingRate && (
            <Form.Item
              name="userId"
              label="Chọn nhân viên"
              rules={[{ required: true, message: "Vui lòng chọn nhân viên" }]}
            >
              <Select
                placeholder="Chọn nhân viên"
                showSearch
                optionFilterProp="children"
              >
                {availableStaff.map((staff) => (
                  <Option key={staff._id} value={staff._id}>
                    {staff.fullName} - {staff.email}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Divider orientation="left">Lương cơ bản</Divider>

          <Form.Item
            name="hourlyRate"
            label={
              <span>
                Mức lương theo giờ{" "}
                <Tooltip title="Lương cơ bản tính theo số giờ làm việc">
                  <InfoCircleOutlined />
                </Tooltip>
              </span>
            }
            rules={[{ required: true, message: "Vui lòng nhập lương giờ" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              step={1000}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              addonAfter="VNĐ"
            />
          </Form.Item>

          <Divider orientation="left">Thưởng chuyên cần</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="attendanceBonus100"
                label="Thưởng 100% ca"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={10000}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  addonAfter="VNĐ"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="attendanceBonus95"
                label="Thưởng ≥95% ca"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={10000}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  addonAfter="VNĐ"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="attendanceBonus90"
                label="Thưởng ≥90% ca"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={10000}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  addonAfter="VNĐ"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="overtimeMultiplier"
            label={
              <span>
                Hệ số thưởng overtime{" "}
                <Tooltip title="Ví dụ: 1.5 = 150% lương giờ cho giờ OT">
                  <InfoCircleOutlined />
                </Tooltip>
              </span>
            }
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: "100%" }} min={1} max={5} step={0.1} />
          </Form.Item>

          <Divider orientation="left">Khấu trừ</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="lateDeduction"
                label="Phạt đi muộn (mỗi lần)"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={10000}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  addonAfter="VNĐ"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="earlyLeaveDeduction"
                label="Phạt về sớm (mỗi lần)"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={10000}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  addonAfter="VNĐ"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="absentDeduction"
                label="Phạt nghỉ KP (mỗi ca)"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={10000}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  addonAfter="VNĐ"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="maxLateAllowed"
            label={
              <span>
                Số lần đi muộn tối đa cho phép{" "}
                <Tooltip title="Vượt quá số này sẽ không được thưởng chuyên cần">
                  <InfoCircleOutlined />
                </Tooltip>
              </span>
            }
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} max={10} />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú về cấu hình này..." />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default SalaryRateManagement;
