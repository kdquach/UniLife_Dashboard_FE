import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  DatePicker,
  TimePicker,
  Switch,
  Row,
  Col,
  Button,
  Alert,
  Divider,
} from "antd";

const { TextArea } = Input;

export default function VoucherFormModal({
  open,
  mode, // 'create', 'edit'
  voucherState, // if edit, need to know state to disable fields
  form,
  categories,
  products,
  canteens,
  managerRole,
  userCanteenId,
  onSubmit,
  onCancel,
  onGenerateCode,
}) {
  const isEdit = mode === "edit";
  const isReadonlyFull =
    isEdit && ["Expired", "OutOfQuota", "Archived"].includes(voucherState);
  const isPartialEdit = isEdit && ["Active", "Inactive"].includes(voucherState);

  // BR04: Active/Inactive chỉ được sửa 4 trường này
  const canEditBase =
    !isEdit || voucherState === "Draft" || voucherState === "Upcoming";

  useEffect(() => {
    if (open && mode === "create" && managerRole && userCanteenId) {
      form.setFieldsValue({ scope: "Branch", canteen_ids: [userCanteenId] });
    }
  }, [open, mode, managerRole, userCanteenId, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      // Format dates
      const payload = { ...values };
      if (values.dateRange && values.dateRange.length === 2) {
        payload.startDatetime = values.dateRange[0].toISOString();
        payload.endDatetime = values.dateRange[1].toISOString();
        delete payload.dateRange;
      }
      if (values.timeRange && values.timeRange.length === 2) {
        payload.timeRestriction = {
          fromTime: values.timeRange[0].format("HH:mm"),
          toTime: values.timeRange[1].format("HH:mm"),
        };
        delete payload.timeRange;
      } else if (values.timeRange === null || values.timeRange === undefined) {
        payload.timeRestriction = null; // Clear if emptied
      }

      onSubmit(payload);
    });
  };

  const handleGenCode = async () => {
    if (onGenerateCode) {
      const code = await onGenerateCode();
      if (code) {
        form.setFieldValue("code", code);
      }
    }
  };

  return (
    <Modal
      title={isEdit ? `Cập nhật Voucher` : "Tạo mới Voucher"}
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={800}
      okText={isReadonlyFull ? "Đóng" : "Lưu lại"}
      cancelButtonProps={{
        style: { display: isReadonlyFull ? "none" : "inline-block" },
      }}
      okButtonProps={{ disabled: isReadonlyFull }}
      maskClosable={false}
    >
      {isPartialEdit && (
        <Alert
          type="warning"
          showIcon
          message="Voucher đang hoạt động / Tạm ngưng. Bạn chỉ có thể sửa: Hạn mức, Ngày kết thúc, và Mô tả."
          style={{ marginBottom: 16 }}
        />
      )}
      {isReadonlyFull && (
        <Alert
          type="error"
          showIcon
          message="Voucher này đã kết thúc/lưu trữ và không thể chỉnh sửa."
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        disabled={isReadonlyFull}
        initialValues={{
          discountType: "Percentage",
          applyTo: "All items",
          scope: managerRole ? "Branch" : "Global",
          allowStackWithCombo: false,
          minOrderValue: 0,
          minItemQuantity: 0,
          usagePerUser: 1,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="code"
              label="Mã Voucher (Code)"
              rules={[
                { required: true, message: "Vui lòng nhập mã voucher" },
                {
                  pattern: /^[A-Za-z0-9_-]{4,20}$/,
                  message: "4-20 ký tự, chỉ chứa chữ, số, _, -",
                },
              ]}
              normalize={(value) => (value || "").toUpperCase()}
            >
              <Input
                placeholder="VD: SUMMER2024"
                disabled={!canEditBase}
                addonAfter={
                  canEditBase ? (
                    <Button
                      type="link"
                      size="small"
                      onClick={handleGenCode}
                      style={{ padding: 0 }}
                    >
                      Tạo tự động
                    </Button>
                  ) : null
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Tên chương trình"
              rules={[{ required: true }]}
            >
              <Input
                placeholder="VD: Khuyến mãi mùa hè"
                disabled={!canEditBase}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="displayDescription"
          label="Mô tả hiển thị (User có thể thấy)"
        >
          <Input placeholder="Giảm 20% tối đa 50k..." />
        </Form.Item>
        <Form.Item name="internalDescription" label="Ghi chú nội bộ">
          <TextArea rows={2} placeholder="Note cho admin/manager..." />
        </Form.Item>

        <Divider>Loại Giảm Giá</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="discountType"
              label="Loại giảm giá"
              rules={[{ required: true }]}
            >
              <Select disabled={!canEditBase}>
                <Select.Option value="Percentage">
                  Theo phần trăm (%)
                </Select.Option>
                <Select.Option value="Fixed Amount">
                  Số tiền mặt (VNĐ)
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Dynamic dependency on discountType */}
          <Form.Item noStyle dependencies={["discountType"]}>
            {({ getFieldValue }) => {
              const type = getFieldValue("discountType");
              return (
                <>
                  <Col span={8}>
                    <Form.Item
                      name="discountValue"
                      label={
                        type === "Percentage"
                          ? "Phần trăm giảm (%)"
                          : "Số tiền giảm (VNĐ)"
                      }
                      rules={[{ required: true, type: "number", min: 0 }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        disabled={!canEditBase}
                        max={type === "Percentage" ? 100 : undefined}
                        formatter={(value) =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        }
                        parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                      />
                    </Form.Item>
                  </Col>
                  {type === "Percentage" && (
                    <Col span={8}>
                      <Form.Item
                        name="maxDiscountCap"
                        label="Giảm tối đa (VNĐ)"
                        tooltip="Để trống nếu không giới hạn"
                      >
                        <InputNumber
                          style={{ width: "100%" }}
                          disabled={!canEditBase}
                          min={0}
                          formatter={(value) =>
                            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                          parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                        />
                      </Form.Item>
                    </Col>
                  )}
                </>
              );
            }}
          </Form.Item>
        </Row>

        <Divider>Phạm vi & Đối tượng</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="scope"
              label="Phạm vi"
              rules={[{ required: true }]}
            >
              <Radio.Group
                disabled={!canEditBase || managerRole}
                buttonStyle="solid"
              >
                <Radio.Button value="Global">Global (Toàn HT)</Radio.Button>
                <Radio.Button value="Branch">
                  Branch (Theo căn tin)
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Form.Item noStyle dependencies={["scope"]}>
            {({ getFieldValue }) => {
              if (getFieldValue("scope") !== "Branch") return null;
              return (
                <Col span={12}>
                  <Form.Item
                    name="canteen_ids"
                    label="Chọn căn tin"
                    rules={[
                      { required: true, message: "Cần chọn ít nhất 1 canteen" },
                    ]}
                  >
                    <Select
                      mode="multiple"
                      disabled={!canEditBase || managerRole} // Manager không đc đổi, mặc định lấy của mình
                      options={canteens?.map((c) => ({
                        label: c.name,
                        value: c._id,
                      }))}
                      placeholder="Chọn căn tin áp dụng"
                    />
                  </Form.Item>
                </Col>
              );
            }}
          </Form.Item>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="applyTo"
              label="Áp dụng cho"
              rules={[{ required: true }]}
            >
              <Radio.Group disabled={!canEditBase}>
                <Radio value="All items">Toàn bộ menu</Radio>
                <Radio value="Category">Theo danh mục</Radio>
                <Radio value="Specific items">Sản phẩm cụ thể</Radio>
                <Radio value="Combo only">Chỉ Combo</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Form.Item noStyle dependencies={["applyTo"]}>
            {({ getFieldValue }) => {
              const applyTo = getFieldValue("applyTo");
              if (applyTo === "Category") {
                return (
                  <Col span={24}>
                    <Form.Item
                      name="categoryIds"
                      label="Chọn danh mục"
                      rules={[{ required: true }]}
                    >
                      <Select
                        mode="multiple"
                        disabled={!canEditBase}
                        options={categories}
                      />
                    </Form.Item>
                  </Col>
                );
              }
              if (applyTo === "Specific items") {
                return (
                  <Col span={24}>
                    <Form.Item
                      name="productIds"
                      label="Chọn sản phẩm"
                      rules={[{ required: true }]}
                    >
                      <Select
                        mode="multiple"
                        disabled={!canEditBase}
                        options={products}
                      />
                    </Form.Item>
                  </Col>
                );
              }
              return null;
            }}
          </Form.Item>
        </Row>

        <Divider>Điều kiện & Hạn mức</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="minOrderValue" label="Đơn tối thiểu (VNĐ)">
              <InputNumber
                style={{ width: "100%" }}
                disabled={!canEditBase}
                min={0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="minItemQuantity" label="Số lượng SP tối thiểu">
              <InputNumber
                style={{ width: "100%" }}
                disabled={!canEditBase}
                min={0}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="dateRange"
              label="Thời gian diễn ra"
              rules={[{ required: true }]}
            >
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                showTime
                format="DD/MM/YYYY HH:mm"
                disabled={[!canEditBase, false]} // Được sửa endDatetime khi Active
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="timeRange"
              label="Khung giờ (trong ngày)"
              tooltip="Chỉ áp dụng trong khung giờ này hằng ngày"
            >
              <TimePicker.RangePicker
                format="HH:mm"
                style={{ width: "100%" }}
                disabled={!canEditBase}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="totalLimit"
              label="Tổng số lượt sử dụng"
              tooltip="Để trống = Không giới hạn"
            >
              <InputNumber
                style={{ width: "100%" }}
                min={
                  isPartialEdit
                    ? form.getFieldValue("usedCount") || 0
                    : undefined
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="usagePerUser"
              label="Số lượt / Khách hàng"
              rules={[{ required: true }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                disabled={!canEditBase}
                min={1}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="allowStackWithCombo" valuePropName="checked">
          <Switch disabled={!canEditBase} />{" "}
          <span style={{ marginLeft: 8 }}>Cho phép áp dụng cùng với Combo</span>
        </Form.Item>
      </Form>
    </Modal>
  );
}
