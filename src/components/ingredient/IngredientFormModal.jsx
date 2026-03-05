import { Modal, Form, Input, InputNumber, Select, Switch, message } from 'antd';
import { useEffect } from 'react';

const { TextArea } = Input;

// Danh sách đơn vị hợp lệ (phải khớp với BE)
const VALID_UNITS = ['kg', 'g', 'lit', 'lít', 'ml', 'cái', 'gói', 'hộp', 'lon'];

// Modal form thêm/sửa nguyên liệu
export default function IngredientFormModal({
  open,
  mode, // 'create' | 'edit'
  initialValues,
  categories,
  onSubmit,
  onCancel,
}) {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // Reset form khi mở/đóng modal hoặc thay đổi initialValues
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialValues) {
        form.setFieldsValue({
          ...initialValues,
          categoryId: initialValues.categoryId?._id || initialValues.categoryId,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, mode, initialValues, form]);

  // Xử lý submit form
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
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

  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        onCancel={handleCancel}
        onOk={handleOk}
        title={
          mode === 'create' ? 'Thêm nguyên liệu mới' : 'Chỉnh sửa nguyên liệu'
        }
        okText={mode === 'create' ? 'Tạo mới' : 'Cập nhật'}
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            stock: 0,
            lowStockThreshold: 10,
            isActive: true,
          }}
        >
          <Form.Item
            name="name"
            label="Tên nguyên liệu"
            rules={[
              { required: true, message: 'Vui lòng nhập tên nguyên liệu' },
              { max: 100, message: 'Tên không được quá 100 ký tự' },
            ]}
          >
            <Input placeholder="VD: Thịt bò, Cà chua, Gạo..." />
          </Form.Item>

          <Form.Item
            name="categoryId"
            label="Danh mục"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
          >
            <Select
              placeholder="Chọn danh mục"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={categories.map((cat) => ({
                value: cat._id,
                label: cat.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="unit"
            label="Đơn vị"
            rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
          >
            <Select
              placeholder="Chọn đơn vị"
              options={VALID_UNITS.map((unit) => ({
                value: unit,
                label: unit,
              }))}
            />
          </Form.Item>

          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
          >
            <Form.Item
              name="stock"
              label="Tồn kho"
              rules={[
                { required: true, message: 'Vui lòng nhập số lượng tồn kho' },
              ]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>

            <Form.Item
              name="lowStockThreshold"
              label="Ngưỡng cảnh báo"
              tooltip="Cảnh báo khi tồn kho <= ngưỡng này"
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="10" />
            </Form.Item>
          </div>

          <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm ngưng" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
