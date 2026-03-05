import {
  Modal,
  Form,
  InputNumber,
  Select,
  Space,
  Typography,
  message,
} from 'antd';
import { useEffect } from 'react';

const { Text } = Typography;

// Modal cập nhật tồn kho
export default function StockUpdateModal({
  open,
  ingredient,
  onSubmit,
  onCancel,
}) {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // Lấy giá trị operation từ form để tính toán
  const operation = Form.useWatch('operation', form) || 'add';

  // Reset form khi mở modal
  useEffect(() => {
    if (open && ingredient) {
      form.setFieldsValue({
        quantity: 0,
        operation: 'add',
      });
    }
  }, [open, ingredient, form]);

  // Tính toán tồn kho mới
  const calculateNewStock = () => {
    const quantity = form.getFieldValue('quantity') || 0;
    const currentStock = ingredient?.stock || 0;

    switch (operation) {
      case 'add':
        return currentStock + quantity;
      case 'subtract':
        return Math.max(0, currentStock - quantity);
      case 'set':
        return quantity;
      default:
        return currentStock;
    }
  };

  // Xử lý submit
  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // Kiểm tra số lượng
      if (values.quantity <= 0 && values.operation !== 'set') {
        messageApi.error('Số lượng phải lớn hơn 0');
        return;
      }

      // Kiểm tra trừ kho vượt quá tồn kho hiện tại
      if (
        values.operation === 'subtract' &&
        values.quantity > ingredient.stock
      ) {
        messageApi.error('Số lượng trừ không được vượt quá tồn kho hiện tại');
        return;
      }

      await onSubmit({
        ingredientId: ingredient._id,
        quantity: values.quantity,
        operation: values.operation,
      });

      form.resetFields();
    } catch (error) {
      if (error.errorFields) {
        messageApi.error('Vui lòng kiểm tra lại thông tin');
      }
    }
  };

  // Xử lý cancel
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const newStock = calculateNewStock();

  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        onCancel={handleCancel}
        onOk={handleOk}
        title="Cập nhật tồn kho"
        okText="Cập nhật"
        cancelText="Hủy"
        width={500}
      >
        {ingredient && (
          <div>
            <Space
              direction="vertical"
              style={{ width: '100%', marginBottom: 16 }}
            >
              <Text strong>Nguyên liệu: {ingredient.name}</Text>
              <Text>
                Tồn kho hiện tại:{' '}
                <Text strong>
                  {ingredient.stock} {ingredient.unit}
                </Text>
              </Text>
            </Space>

            <Form
              form={form}
              layout="vertical"
              initialValues={{
                operation: 'add',
                quantity: 0,
              }}
            >
              <Form.Item
                name="operation"
                label="Thao tác"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: 'add', label: '➕ Nhập thêm' },
                    { value: 'subtract', label: '➖ Xuất kho' },
                    { value: 'set', label: '📝 Đặt lại số lượng' },
                  ]}
                />
              </Form.Item>

              <Form.Item
                name="quantity"
                label={
                  operation === 'set'
                    ? 'Số lượng mới'
                    : 'Số lượng ' + (operation === 'add' ? 'nhập' : 'xuất')
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập số lượng' },
                  {
                    validator: (_, value) => {
                      if (operation === 'set' && value < 0) {
                        return Promise.reject('Số lượng không được âm');
                      }
                      if (operation !== 'set' && value <= 0) {
                        return Promise.reject('Số lượng phải lớn hơn 0');
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Nhập số lượng"
                  addonAfter={ingredient.unit}
                />
              </Form.Item>
            </Form>

            <div
              style={{
                padding: 12,
                background: '#f5f5f5',
                borderRadius: 4,
                marginTop: 16,
              }}
            >
              <Space direction="vertical" size={0}>
                <Text type="secondary">Tồn kho sau cập nhật:</Text>
                <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                  {newStock} {ingredient.unit}
                </Text>
                {newStock <= ingredient.lowStockThreshold && (
                  <Text type="danger" style={{ fontSize: 12 }}>
                    ⚠️ Cảnh báo: tồn kho thấp
                  </Text>
                )}
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
