import { useEffect } from 'react';
import {
  Alert,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
} from 'antd';

// Modal thêm/sửa nguyên liệu trong công thức
export default function RecipeIngredientModal({
  open,
  mode,
  initialValues,
  ingredients,
  onSubmit,
  onCancel,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && initialValues) {
      form.setFieldsValue({
        ingredientId: initialValues.ingredientId,
        quantity: Number(initialValues.quantity),
        unit: initialValues.unit,
      });
      return;
    }

    form.resetFields();
  }, [form, initialValues, mode, open]);

  const ingredientOptions = (ingredients || []).map((item) => ({
    label: `${item.name} (${item.unit})`,
    value: item._id,
    unit: item.unit,
  }));

  const hasAvailableIngredients = ingredientOptions.length > 0;

  const handleIngredientChange = (ingredientId) => {
    const selected = ingredientOptions.find(
      (item) => item.value === ingredientId
    );

    if (selected) {
      form.setFieldsValue({ unit: selected.unit });
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
    } catch (error) {
      console.error('Recipe form validation error:', error);
    }
  };

  return (
    <Modal
      title={
        mode === 'create'
          ? 'Thêm nguyên liệu vào công thức'
          : 'Cập nhật nguyên liệu'
      }
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={mode === 'create' ? 'Thêm' : 'Lưu thay đổi'}
      cancelText="Hủy"
      destroyOnHidden
      width={620}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="Nguyên liệu đã được lọc theo căng tin của món đang chọn"
          description={
            mode === 'create'
              ? 'Chỉ những nguyên liệu hợp lệ mới xuất hiện trong danh sách để tránh cấu hình sai công thức.'
              : 'Bạn đang chỉnh sửa định lượng của nguyên liệu đã có trong công thức.'
          }
        />

        <Form form={form} layout="vertical">
          <Form.Item
            label="Nguyên liệu"
            name="ingredientId"
            rules={[{ required: true, message: 'Vui lòng chọn nguyên liệu' }]}
          >
            <Select
              placeholder="Chọn nguyên liệu phù hợp"
              options={ingredientOptions}
              onChange={handleIngredientChange}
              showSearch
              optionFilterProp="label"
              disabled={mode === 'edit' || !hasAvailableIngredients}
              notFoundContent={
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Không có nguyên liệu phù hợp"
                />
              }
            />
          </Form.Item>

          <Form.Item
            label="Số lượng"
            name="quantity"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng' },
              {
                validator: (_, value) => {
                  if (
                    value === undefined ||
                    value === null ||
                    Number(value) <= 0
                  ) {
                    return Promise.reject(new Error('Số lượng phải lớn hơn 0'));
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              min={0.01}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              placeholder="Nhập số lượng"
            />
          </Form.Item>

          <Form.Item
            label="Đơn vị"
            name="unit"
            rules={[{ required: true, message: 'Vui lòng nhập đơn vị' }]}
          >
            <Input placeholder="Ví dụ: g, kg, ml, cái..." />
          </Form.Item>

          {mode === 'create' && !hasAvailableIngredients ? (
            <Alert
              type="warning"
              showIcon
              message="Chưa có nguyên liệu nào khả dụng"
              description="Hãy kiểm tra lại nguyên liệu của căng tin hoặc chọn sản phẩm khác trước khi thêm vào công thức."
            />
          ) : null}
        </Form>
      </Space>
    </Modal>
  );
}
