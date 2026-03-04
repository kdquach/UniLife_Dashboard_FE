import { useState } from "react";
import {
  Modal,
  Form,
  DatePicker,
  Alert,
  Spin,
  Typography,
  InputNumber,
} from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const GeneratePayrollDialog = ({ open, onClose, onGenerate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const [periodStart, periodEnd] = values.period;

      await onGenerate({
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        hourlyRate: values.hourlyRate || 25000,
      });

      form.resetFields();
      setLoading(false);
      onClose();
    } catch (error) {
      setLoading(false);
      console.error("Lỗi validate hoặc generate:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  // Gợi ý kỳ lương tháng hiện tại
  const getDefaultPeriod = () => {
    const now = dayjs();
    const start = now.startOf("month");
    const end = now.endOf("month");
    return [start, end];
  };

  // Disable các ngày trong tương lai
  const disabledDate = (current) => {
    return current && current > dayjs().endOf("day");
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarOutlined style={{ color: "#1890ff" }} />
          <span>Tạo bảng lương mới</span>
        </div>
      }
      open={open}
      onOk={handleGenerate}
      onCancel={handleCancel}
      okText="Tạo bảng lương"
      cancelText="Hủy"
      width={500}
      confirmLoading={loading}
    >
      <Spin spinning={loading}>
        <Alert
          message="Lưu ý"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>Hệ thống sẽ tính toán tự động dựa trên giờ làm thực tế</li>
              <li>
                Mức lương ưu tiên theo cài đặt cá nhân, nếu không có sẽ dùng mức
                mặc định
              </li>
              <li>Bảng lương có thể chỉnh sửa sau khi tạo</li>
              <li>Chỉ tạo một bảng lương cho mỗi kỳ</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            period: getDefaultPeriod(),
            hourlyRate: 25000,
          }}
        >
          <Form.Item
            name="period"
            label="Kỳ lương"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn kỳ lương",
              },
            ]}
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                Chọn từ ngày đầu đến ngày cuối của tháng muốn tạo lương
              </Text>
            }
          >
            <RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
              disabledDate={disabledDate}
            />
          </Form.Item>

          <Form.Item
            name="hourlyRate"
            label="Mức lương mặc định (VNĐ/giờ)"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập mức lương",
              },
              {
                type: "number",
                min: 1000,
                message: "Mức lương phải >= 1,000 VNĐ",
              },
            ]}
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                Áp dụng cho nhân viên chưa có mức lương cá nhân
              </Text>
            }
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              placeholder="Nhập mức lương theo giờ"
              addonAfter="VNĐ"
            />
          </Form.Item>

          <Alert
            message={
              <div>
                <Text strong>Gợi ý:</Text> Bảng lương thường tính từ ngày 1 đến
                ngày cuối tháng. Mức lương mặc định: 25,000 VNĐ/giờ
              </div>
            }
            type="warning"
            showIcon
          />
        </Form>
      </Spin>
    </Modal>
  );
};

export default GeneratePayrollDialog;
