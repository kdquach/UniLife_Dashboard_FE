import { useState, useEffect } from "react";
import { Modal, Form, InputNumber, Input, Select, Alert, Spin } from "antd";
import { EditOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Option } = Select;

const AdjustSalaryDialog = ({ open, onClose, onSave, salaryData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState("bonus");

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
          <span>Điều chỉnh lương</span>
        </div>
      }
      open={open}
      onOk={handleSave}
      onCancel={handleCancel}
      okText="Lưu thay đổi"
      cancelText="Hủy"
      width={550}
      confirmLoading={loading}
    >
      <Spin spinning={loading}>
        {salaryData && (
          <>
            <Alert
              message={
                <div>
                  <div>
                    <strong>Nhân viên:</strong> {salaryData.userId?.fullName}
                  </div>
                  <div>
                    <strong>Lương cơ bản:</strong>{" "}
                    {formatCurrency(salaryData.baseSalary)}
                  </div>
                  <div>
                    <strong>Số giờ:</strong> {salaryData.totalHours} giờ
                  </div>
                </div>
              }
              type="info"
              style={{ marginBottom: 24 }}
            />

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
                        color:
                          adjustmentType === "bonus" ? "#52c41a" : "#ff4d4f",
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
      </Spin>
    </Modal>
  );
};

export default AdjustSalaryDialog;
