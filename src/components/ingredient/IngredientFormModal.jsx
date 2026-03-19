import { Modal, Form, Input, InputNumber, Select, Switch, message } from 'antd';
import { useEffect } from 'react';
import {
  VALID_INGREDIENT_UNITS,
  getDefaultStandardConfig,
  normalizeUnit,
} from '@/utils/ingredientCost.util';

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

  const unitValue = Form.useWatch('unit', form);
  const costPriceValue = Form.useWatch('costPrice', form);
  const standardUnitFactorValue = Form.useWatch('standardUnitFactor', form);

  // Reset form khi mở/đóng modal hoặc thay đổi initialValues
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialValues) {
        const normalizedUnit = normalizeUnit(initialValues.unit);
        const defaultStandard = getDefaultStandardConfig(normalizedUnit);

        form.setFieldsValue({
          ...initialValues,
          unit: normalizedUnit,
          standardUnit: normalizeUnit(
            initialValues.standardUnit || defaultStandard.standardUnit
          ),
          standardUnitFactor:
            Number(initialValues.standardUnitFactor) > 0
              ? Number(initialValues.standardUnitFactor)
              : defaultStandard.standardUnitFactor,
          costPrice: Number(initialValues.costPrice || 0),
          costPerStandardUnit: Number(initialValues.costPerStandardUnit || 0),
          categoryId: initialValues.categoryId?._id || initialValues.categoryId,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          costPrice: 0,
          costPerStandardUnit: 0,
        });
      }
    }
  }, [open, mode, initialValues, form]);

  // Tự động cập nhật đơn vị chuẩn/hệ số theo đơn vị chính khi chưa chỉnh tay
  useEffect(() => {
    if (!open || !unitValue) {
      return;
    }

    const defaultConfig = getDefaultStandardConfig(unitValue);
    const isStandardUnitTouched = form.isFieldTouched('standardUnit');
    const isStandardFactorTouched = form.isFieldTouched('standardUnitFactor');

    if (!isStandardUnitTouched) {
      form.setFieldValue('standardUnit', defaultConfig.standardUnit);
    }

    if (!isStandardFactorTouched) {
      form.setFieldValue(
        'standardUnitFactor',
        defaultConfig.standardUnitFactor
      );
    }
  }, [form, open, unitValue]);

  // Tự động tính chi phí/đơn vị chuẩn từ giá vốn và hệ số quy đổi
  useEffect(() => {
    if (!open) {
      return;
    }

    const costPrice = Number(costPriceValue || 0);
    const factor = Number(standardUnitFactorValue || 0);

    if (Number.isFinite(costPrice) && Number.isFinite(factor) && factor > 0) {
      form.setFieldValue('costPerStandardUnit', costPrice / factor);
    }
  }, [costPriceValue, form, open, standardUnitFactorValue]);

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
            costPrice: 0,
            costPerStandardUnit: 0,
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
              options={VALID_INGREDIENT_UNITS.map((unit) => ({
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

          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
          >
            <Form.Item
              name="costPrice"
              label="Giá vốn theo đơn vị nhập"
              tooltip="Ví dụ: 80.000 đ / 1kg"
              rules={[{ required: true, message: 'Vui lòng nhập giá vốn' }]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="0"
                addonAfter="đ"
              />
            </Form.Item>

            <Form.Item
              name="standardUnit"
              label="Đơn vị chuẩn"
              rules={[
                { required: true, message: 'Vui lòng chọn đơn vị chuẩn' },
              ]}
            >
              <Select
                placeholder="Chọn đơn vị chuẩn"
                options={[
                  { value: 'g', label: 'g' },
                  { value: 'ml', label: 'ml' },
                  { value: 'cái', label: 'cái' },
                ]}
              />
            </Form.Item>
          </div>

          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
          >
            <Form.Item
              name="standardUnitFactor"
              label="Hệ số quy đổi"
              tooltip="1 đơn vị nhập = bao nhiêu đơn vị chuẩn"
              extra="Ví dụ: 1kg = 1000g thì nhập 1000; 1 lít = 1000ml thì nhập 1000; 1 cái = 1 cái thì nhập 1"
              rules={[
                {
                  required: true,
                  message: 'Vui lòng nhập hệ số quy đổi',
                },
              ]}
            >
              <InputNumber
                min={0.000001}
                style={{ width: '100%' }}
                placeholder="1"
              />
            </Form.Item>

            <Form.Item
              name="costPerStandardUnit"
              label="Chi phí / đơn vị chuẩn"
              tooltip="Tự tính từ Giá vốn và Hệ số quy đổi"
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="0"
                addonAfter="đ"
                disabled
              />
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
