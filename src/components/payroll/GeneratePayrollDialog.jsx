import { useState } from "react";
import {
  Modal,
  Form,
  DatePicker,
  Alert,
  Spin,
  Typography,
  Space,
  Divider,
  Tag,
} from "antd";
import {
  CalendarOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const GeneratePayrollDialog = ({ open, onClose, onGenerate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const selectedPeriod = Form.useWatch("period", form);

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

  const getDefaultPeriod = () => {
    const now = dayjs();
    return [now.startOf("month"), now.endOf("month")];
  };

  const disabledDate = (current) => {
    return current && current > dayjs().endOf("day");
  };

  const renderPeriodPreview = () => {
    if (!selectedPeriod || selectedPeriod.length !== 2) return null;

    const [start, end] = selectedPeriod;
    if (!start || !end) return null;

    return (
      <div className="payroll-generate-period-preview">
        <Text type="secondary">Kỳ lương đã chọn:</Text>
        <Tag color="blue">
          {start.format("DD/MM/YYYY")} - {end.format("DD/MM/YYYY")}
        </Tag>
      </div>
    );
  };

  return (
    <Modal
      title={
        <div className="payroll-generate-modal-title">
          <CalendarOutlined className="payroll-generate-modal-title-icon" />
          <div>
            <Title level={5} style={{ margin: 0 }}>
              Tạo bảng lương mới
            </Title>
            <Text type="secondary">
              Thiết lập kỳ lương và tính toán tự động
            </Text>
          </div>
        </div>
      }
      open={open}
      onOk={handleGenerate}
      onCancel={handleCancel}
      okText="Tạo bảng lương"
      cancelText="Hủy"
      width={560}
      confirmLoading={loading}
      className="payroll-generate-modal"
    >
      <Spin spinning={loading}>
        <div className="payroll-generate-guide">
          <div className="payroll-generate-guide-header">
            <InfoCircleOutlined />
            <Text strong>Quy trình tạo bảng lương tự động</Text>
          </div>

          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            <div className="payroll-generate-guide-item">
              <CheckCircleOutlined />
              <span>Thu thập tất cả ca đã check-out trong kỳ lương</span>
            </div>
            <div className="payroll-generate-guide-item">
              <CheckCircleOutlined />
              <span>
                Tính lương theo mức <strong>lương giờ cá nhân</strong> của từng
                nhân viên
              </span>
            </div>
            <div className="payroll-generate-guide-item">
              <CheckCircleOutlined />
              <span>
                Tự động tính <strong>thưởng</strong> và{" "}
                <strong>khấu trừ</strong>
                theo cấu hình hiện hành
              </span>
            </div>
            <div className="payroll-generate-guide-item">
              <CheckCircleOutlined />
              <span>
                Cho phép điều chỉnh chi tiết từng nhân viên trước khi duyệt
              </span>
            </div>
          </Space>
        </div>

        <Divider style={{ margin: "18px 0" }} />

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
                Chọn đầy đủ ngày bắt đầu và ngày kết thúc của kỳ lương
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

          {renderPeriodPreview()}

          <Alert
            message={
              <div>
                <Text strong>Lưu ý quan trọng</Text>
                <ul className="payroll-generate-note-list">
                  <li>
                    Mức lương được ưu tiên theo
                    <Text strong style={{ color: "#1890ff" }}>
                      {" "}
                      cài đặt lương cá nhân
                    </Text>{" "}
                    trong mục "Quản lý mức lương"
                  </li>
                  <li>
                    Thưởng/phạt tự động được tính theo cấu hình riêng của từng
                    nhân viên
                  </li>
                  <li>
                    Mỗi kỳ chỉ nên tồn tại một bảng lương để tránh trùng dữ liệu
                  </li>
                  <li>
                    Bảng lương có thể chỉnh sửa trước khi duyệt và khóa dữ liệu
                  </li>
                </ul>
              </div>
            }
            type="warning"
            showIcon
            icon={<InfoCircleOutlined />}
          />
        </Form>
      </Spin>
    </Modal>
  );
};

export default GeneratePayrollDialog;
