import { useState } from "react";
import { Modal, Form, DatePicker, Alert, Spin, Typography, Space } from "antd";
import {
  CalendarOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
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
          message={
            <Space direction="vertical" style={{ width: "100%" }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>
                <InfoCircleOutlined /> Quy trình tạo bảng lương tự động
              </div>
              <Space direction="vertical">
                <div>
                  <CheckCircleOutlined style={{ color: "#52c41a" }} /> Hệ thống
                  sẽ lấy tất cả ca làm việc đã check-out trong kỳ
                </div>
                <div>
                  <CheckCircleOutlined style={{ color: "#52c41a" }} /> Tính
                  lương theo mức <strong>Lương giờ cá nhân</strong> của từng
                  nhân viên
                </div>
                <div>
                  <CheckCircleOutlined style={{ color: "#52c41a" }} /> Tự động
                  tính <strong>thưởng chuyên cần</strong>,{" "}
                  <strong>thưởng làm thêm</strong>
                </div>
                <div>
                  <CheckCircleOutlined style={{ color: "#52c41a" }} /> Tự động
                  khấu trừ <strong>đi muộn, về sớm, vắng mặt</strong>
                </div>
                <div>
                  <CheckCircleOutlined style={{ color: "#52c41a" }} /> Có thể{" "}
                  <strong>điều chỉnh</strong> lương từng nhân viên sau khi tạo
                </div>
              </Space>
            </Space>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            period: getDefaultPeriod(),
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
                💡 Chọn từ ngày đầu đến ngày cuối của tháng muốn tạo lương
              </Text>
            }
          >
            <RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
              disabledDate={disabledDate}
              size="large"
            />
          </Form.Item>

          <Alert
            message={
              <div>
                <Text strong>📌 Lưu ý quan trọng:</Text>
                <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                  <li>
                    Mức lương được ưu tiên theo{" "}
                    <Text strong style={{ color: "#1890ff" }}>
                      Cài đặt lương cá nhân
                    </Text>{" "}
                    trong mục "Quản lý mức lương"
                  </li>
                  <li>
                    Thưởng/phạt tự động được tính theo cấu hình riêng của từng
                    nhân viên
                  </li>
                  <li>
                    Chỉ tạo <Text type="danger">một bảng lương</Text> cho mỗi kỳ
                  </li>
                  <li>
                    Bảng lương có thể chỉnh sửa trước khi{" "}
                    <Text type="success">duyệt</Text>
                  </li>
                </ul>
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
