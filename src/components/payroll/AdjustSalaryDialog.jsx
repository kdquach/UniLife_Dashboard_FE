import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Input,
  Select,
  Alert,
  Spin,
  Descriptions,
  Divider,
  Space,
  Typography,
  Tag,
} from "antd";
import {
  EditOutlined,
  DollarOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { getSalaryRateByUser } from "@/services/salaryRate.service";

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const AdjustSalaryDialog = ({ open, onClose, onSave, salaryData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingSalaryRate, setLoadingSalaryRate] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState("bonus");
  const [salaryRate, setSalaryRate] = useState(null);

  // Lấy thông tin SalaryRate khi mở dialog
  useEffect(() => {
    const fetchSalaryRate = async () => {
      if (open && salaryData?.userId?._id) {
        try {
          setLoadingSalaryRate(true);
          const response = await getSalaryRateByUser(salaryData.userId._id);
          setSalaryRate(response.data.salaryRate);
        } catch (error) {
          console.error("Không thể tải thông tin mức lương:", error);
          setSalaryRate(null);
        } finally {
          setLoadingSalaryRate(false);
        }
      }
    };

    fetchSalaryRate();
  }, [open, salaryData]);

  useEffect(() => {
    if (open && salaryData) {
      form.setFieldsValue({
        adjustmentType: "bonus",
        amount: 0,
        reason: "",
      });
      setAdjustmentType("bonus");
    }
  }, [open, salaryData, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Tính toán lương mới
      const totalSalary =
        values.adjustmentType === "bonus"
          ? salaryData.baseSalary + values.amount
          : salaryData.baseSalary - values.amount;

      await onSave({
        salaryId: salaryData._id,
        bonus: values.adjustmentType === "bonus" ? values.amount : 0,
        deduction: values.adjustmentType === "deduction" ? values.amount : 0,
        reason: values.reason,
        totalSalary,
      });

      form.resetFields();
      setLoading(false);
      onClose();
    } catch (error) {
      setLoading(false);
      console.error("Lỗi khi điều chỉnh lương:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value || 0);
  };

  const calculateFinalAmount = () => {
    const amount = form.getFieldValue("amount") || 0;
    const type = form.getFieldValue("adjustmentType");

    if (!salaryData) return 0;

    return type === "bonus"
      ? salaryData.baseSalary + amount
      : salaryData.baseSalary - amount;
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <EditOutlined style={{ color: "#1890ff" }} />
          <span>Điều chỉnh lương nhân viên</span>
        </div>
      }
      open={open}
      onOk={handleSave}
      onCancel={handleCancel}
      okText="Lưu thay đổi"
      cancelText="Hủy"
      width={700}
      confirmLoading={loading}
    >
      {salaryData && (
        <>
          {/* Thông tin nhân viên và lương cơ bản */}
          <Alert
            message={
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                  <Text strong>Nhân viên:</Text> {salaryData.userId?.fullName}
                  <Text type="secondary"> ({salaryData.userId?.email})</Text>
                </div>
                <div>
                  <Text strong>Số giờ làm việc:</Text>{" "}
                  <Tag color="blue">{salaryData.totalHours} giờ</Tag>
                </div>
                <div>
                  <Text strong>Lương cơ bản:</Text>{" "}
                  <Text style={{ fontSize: 16, color: "#1890ff" }}>
                    {formatCurrency(salaryData.baseSalary)}
                  </Text>
                </div>
                <div>
                  <Text strong>Thưởng hiện tại:</Text>{" "}
                  <Text style={{ color: "#52c41a" }}>
                    +{formatCurrency(salaryData.bonus || 0)}
                  </Text>
                  {" | "}
                  <Text strong>Khấu trừ hiện tại:</Text>{" "}
                  <Text style={{ color: "#ff4d4f" }}>
                    -{formatCurrency(salaryData.deduction || 0)}
                  </Text>
                </div>
              </Space>
            }
            type="info"
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 16 }}
          />

          {/* Thông tin SalaryRate config */}
          <Spin spinning={loadingSalaryRate}>
            {salaryRate && (
              <>
                <Divider orientation="left" plain>
                  <Space>
                    <DollarOutlined />
                    Cấu hình lương cá nhân
                  </Space>
                </Divider>
                <Descriptions
                  bordered
                  size="small"
                  column={2}
                  style={{ marginBottom: 24 }}
                >
                  <Descriptions.Item label="Lương giờ">
                    <Text strong style={{ color: "#1890ff" }}>
                      {formatCurrency(salaryRate.hourlyRate)}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Hiệu lực từ">
                    {new Date(salaryRate.effectiveFrom).toLocaleDateString(
                      "vi-VN",
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thưởng chuyên cần 100%">
                    {formatCurrency(salaryRate.attendanceBonus100 || 0)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thưởng chuyên cần 95%">
                    {formatCurrency(salaryRate.attendanceBonus95 || 0)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thưởng chuyên cần 90%">
                    {formatCurrency(salaryRate.attendanceBonus90 || 0)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Hệ số làm thêm">
                    x{salaryRate.overtimeMultiplier || 1.5}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phạt đi muộn">
                    {formatCurrency(salaryRate.lateDeduction || 0)}/lần
                  </Descriptions.Item>
                  <Descriptions.Item label="Phạt về sớm">
                    {formatCurrency(salaryRate.earlyLeaveDeduction || 0)}/lần
                  </Descriptions.Item>
                  <Descriptions.Item label="Phạt vắng">
                    {formatCurrency(salaryRate.absentDeduction || 0)}/lần
                  </Descriptions.Item>
                  <Descriptions.Item label="Số lần muộn tối đa">
                    <Tag color="warning">
                      {salaryRate.maxLateAllowed || 0} lần
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </Spin>

          <Divider orientation="left" plain>
            Điều chỉnh bổ sung
          </Divider>

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              adjustmentType: "bonus",
              amount: 0,
              reason: "",
            }}
          >
            <Form.Item
              name="adjustmentType"
              label="Loại điều chỉnh"
              rules={[{ required: true, message: "Vui lòng chọn loại" }]}
            >
              <Select
                onChange={(value) => setAdjustmentType(value)}
                placeholder="Chọn loại điều chỉnh"
              >
                <Option value="bonus">Thưởng thêm</Option>
                <Option value="deduction">Khấu trừ</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="amount"
              label="Số tiền"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập số tiền",
                },
                {
                  type: "number",
                  min: 0,
                  message: "Số tiền phải lớn hơn 0",
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder="Nhập số tiền điều chỉnh"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                addonAfter="VNĐ"
                onChange={() => form.validateFields(["amount"])}
              />
            </Form.Item>

            <Form.Item
              name="reason"
              label="Lý do điều chỉnh"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập lý do",
                },
                {
                  min: 10,
                  message: "Lý do phải có ít nhất 10 ký tự",
                },
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Nhập lý do điều chỉnh lương (vd: Thưởng hiệu suất, Vi phạm quy định...)"
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Alert
              message={
                <div style={{ fontSize: 14 }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Tổng lương sau điều chỉnh:</strong>
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: adjustmentType === "bonus" ? "#52c41a" : "#ff4d4f",
                    }}
                  >
                    {formatCurrency(calculateFinalAmount())}
                  </div>
                </div>
              }
              type={adjustmentType === "bonus" ? "success" : "warning"}
              showIcon
            />
          </Form>
        </>
      )}
    </Modal>
  );
};

export default AdjustSalaryDialog;
