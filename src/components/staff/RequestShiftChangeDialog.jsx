import { Modal, Form, Input, message } from "antd";
import { useShiftRequestStore } from "@/store/useShiftRequestStore";

export default function RequestShiftChangeDialog({ open, shift, onClose }) {
  const [form] = Form.useForm();
  const { createShiftChangeRequest } = useShiftRequestStore();

  const onOk = async () => {
    const values = await form.validateFields();

    createShiftChangeRequest({
      shiftId: shift?.id,
      reason: values.reason,
    });

    message.success("Đã gửi yêu cầu đổi ca (mock)");
    form.resetFields();
    onClose?.();
  };

  return (
    <Modal
      title="Yêu cầu đổi ca"
      open={open}
      onOk={onOk}
      onCancel={() => {
        form.resetFields();
        onClose?.();
      }}
      okText="Gửi yêu cầu"
      cancelText="Hủy"
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Ca" style={{ marginBottom: 10 }}>
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
            {shift?.title || "—"}
          </div>
        </Form.Item>

        <Form.Item
          name="reason"
          label="Lý do"
          rules={[{ required: true, message: "Vui lòng nhập lý do" }]}
        >
          <Input.TextArea placeholder="Ví dụ: bận việc cá nhân…" autoSize={{ minRows: 4, maxRows: 8 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
