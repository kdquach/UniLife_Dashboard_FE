import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  message,
  Empty,
} from "antd";
import dayjs from "dayjs";
import GIcon from "@/components/GIcon";
import { useAuthStore } from "@/store/useAuthStore";
import { getAllCanteens } from "@/services/canteen.service";
import {
  createBanner,
  deleteBanner,
  getBannerDetail,
  getBannerList,
  uploadBannerImage,
  updateBanner,
} from "@/services/banner.service";

const BANNER_ACTIVE_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "true", label: "Đang hiển thị" },
  { value: "false", label: "Đang tắt" },
];

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
};

const normalizeBannerPayload = (values) => {
  const payload = {
    title: values.title?.trim(),
    imageUrl: values.imageUrl?.trim(),
    linkUrl: values.linkUrl?.trim() || "",
    order: values.order || 0,
    isActive: Boolean(values.isActive),
    canteenId: values.canteenId || undefined,
    startDate: values.startDate ? values.startDate.toISOString() : undefined,
    endDate: values.endDate ? values.endDate.toISOString() : undefined,
  };

  if (!payload.canteenId) {
    delete payload.canteenId;
  }

  if (!payload.startDate) {
    delete payload.startDate;
  }

  if (!payload.endDate) {
    delete payload.endDate;
  }

  return payload;
};

export default function BannerGovernance() {
  const { user } = useAuthStore();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [banners, setBanners] = useState([]);
  const [canteens, setCanteens] = useState([]);

  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [canteenFilter, setCanteenFilter] = useState("all");

  const [editingBanner, setEditingBanner] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailBanner, setDetailBanner] = useState(null);

  const isAdmin = user?.role === "admin";
  const imageUrl = Form.useWatch("imageUrl", form);

  const canteenOptions = useMemo(
    () => [
      { label: "Toàn hệ thống", value: "all" },
      ...canteens.map((canteen) => ({
        label: canteen.name,
        value: canteen._id,
      })),
    ],
    [canteens],
  );

  const mapBannerToForm = useCallback(
    (banner) => {
      form.setFieldsValue({
        title: banner?.title || "",
        imageUrl: banner?.imageUrl || "",
        linkUrl: banner?.linkUrl || "",
        order: banner?.order || 0,
        isActive: Boolean(banner?.isActive),
        canteenId: banner?.canteenId?._id || banner?.canteenId || undefined,
        startDate: banner?.startDate ? dayjs(banner.startDate) : null,
        endDate: banner?.endDate ? dayjs(banner.endDate) : null,
      });
    },
    [form],
  );

  const loadCanteens = useCallback(async () => {
    try {
      const response = await getAllCanteens({ status: "active" });
      setCanteens(response?.data?.canteens || []);
    } catch {
      setCanteens([]);
    }
  }, []);

  const loadBanners = useCallback(
    async ({ page = 1, limit = 10 } = {}) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit,
        };

        if (searchValue?.trim()) {
          params.search = searchValue.trim();
        }

        if (activeFilter !== "all") {
          params.isActive = activeFilter;
        }

        if (canteenFilter !== "all") {
          params.canteenId = canteenFilter;
        }

        const response = await getBannerList(params);
        const list = response?.data || [];
        const pageData = response?.pagination || {};

        setBanners(list);
        setPagination({
          page: pageData?.page || page,
          limit: pageData?.limit || limit,
          total: pageData?.total || list.length,
        });
      } catch (error) {
        setBanners([]);
        setPagination((prev) => ({ ...prev, total: 0 }));
        message.error(
          error?.response?.data?.message || "Không thể tải danh sách banner",
        );
      } finally {
        setLoading(false);
      }
    },
    [activeFilter, canteenFilter, searchValue],
  );

  useEffect(() => {
    if (!isAdmin) return;
    loadCanteens();
  }, [isAdmin, loadCanteens]);

  useEffect(() => {
    if (!isAdmin) return;
    loadBanners({ page: 1, limit: pagination.limit });
  }, [isAdmin, loadBanners, pagination.limit]);

  const openCreateModal = useCallback(() => {
    setEditingBanner(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      order: 0,
    });
    setModalOpen(true);
  }, [form]);

  const openEditModal = useCallback(
    (banner) => {
      setEditingBanner(banner);
      mapBannerToForm(banner);
      setModalOpen(true);
    },
    [mapBannerToForm],
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingBanner(null);
    form.resetFields();
  }, [form]);

  const openDetail = useCallback(async (bannerId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const response = await getBannerDetail(bannerId);
      setDetailBanner(response?.data?.banner || null);
    } catch (error) {
      setDetailBanner(null);
      message.error(
        error?.response?.data?.message || "Không thể lấy chi tiết banner",
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailBanner(null);
  }, []);

  // Upload ảnh banner lên Cloudinary qua BE
  const handleBannerImageChange = useCallback(
    async ({ file }) => {
      const rawFile = file?.originFileObj || file;
      if (!rawFile) return;

      if (!rawFile.type?.startsWith("image/")) {
        message.error("Vui lòng chọn file hình ảnh");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (rawFile.size > maxSize) {
        message.error("Kích thước file không được vượt quá 5MB");
        return;
      }

      setImageUploading(true);
      try {
        const result = await uploadBannerImage(rawFile);
        const uploadedUrl = result?.data?.url;

        if (!uploadedUrl) {
          throw new Error("Không nhận được URL ảnh từ server");
        }

        form.setFieldValue("imageUrl", uploadedUrl);
        message.success("Upload ảnh banner thành công");
      } catch (error) {
        message.error(
          error?.response?.data?.message ||
            error?.message ||
            "Không thể upload ảnh banner",
        );
      } finally {
        setImageUploading(false);
      }
    },
    [form],
  );

  const onSubmit = useCallback(async () => {
    try {
      if (imageUploading) {
        message.warning("Ảnh banner đang upload, vui lòng chờ hoàn tất");
        return;
      }

      const values = await form.validateFields();

      if (
        values.startDate &&
        values.endDate &&
        values.endDate.isBefore(values.startDate)
      ) {
        message.error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
        return;
      }

      const payload = normalizeBannerPayload(values);

      setSubmitting(true);
      if (editingBanner?._id) {
        await updateBanner(editingBanner._id, payload);
        message.success("Cập nhật banner thành công");
      } else {
        await createBanner(payload);
        message.success("Tạo banner thành công");
      }

      closeModal();
      await loadBanners({ page: 1, limit: pagination.limit });
    } catch (error) {
      if (!error?.errorFields) {
        message.error(error?.response?.data?.message || "Không thể lưu banner");
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    closeModal,
    editingBanner?._id,
    form,
    imageUploading,
    loadBanners,
    pagination.limit,
  ]);

  const onDelete = useCallback(
    async (bannerId) => {
      try {
        await deleteBanner(bannerId);
        message.success("Xóa banner thành công");
        await loadBanners({ page: pagination.page, limit: pagination.limit });
      } catch (error) {
        message.error(error?.response?.data?.message || "Không thể xóa banner");
      }
    },
    [loadBanners, pagination.limit, pagination.page],
  );

  if (!isAdmin) {
    return (
      <Empty
        description="Chỉ admin mới có quyền quản lý banner"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "Căng tin áp dụng",
      key: "canteenId",
      render: (_, record) => record?.canteenId?.name || "Toàn hệ thống",
    },
    {
      title: "Thứ tự",
      dataIndex: "order",
      key: "order",
      width: 90,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 130,
      render: (isActive) => (
        <Tag color={isActive ? "green" : "default"} style={{ margin: 0 }}>
          {isActive ? "Đang hiển thị" : "Đang tắt"}
        </Tag>
      ),
    },
    {
      title: "Thời gian hiệu lực",
      key: "dateRange",
      render: (_, record) => {
        const start = record?.startDate
          ? dayjs(record.startDate).format("DD/MM/YYYY HH:mm")
          : "Không giới hạn";
        const end = record?.endDate
          ? dayjs(record.endDate).format("DD/MM/YYYY HH:mm")
          : "Không giới hạn";
        return (
          <Space direction="vertical" size={0}>
            <Typography.Text type="secondary">Từ: {start}</Typography.Text>
            <Typography.Text type="secondary">Đến: {end}</Typography.Text>
          </Space>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 220,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openDetail(record._id)}>
            Chi tiết
          </Button>
          <Button
            size="small"
            icon={<GIcon name="edit" />}
            onClick={() => openEditModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa banner"
            description="Bạn có chắc chắn muốn xóa banner này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => onDelete(record._id)}
          >
            <Button size="small" danger icon={<GIcon name="delete" />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
          <Space wrap>
            <Input.Search
              placeholder="Tìm theo tiêu đề banner"
              allowClear
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onSearch={() => loadBanners({ page: 1, limit: pagination.limit })}
              style={{ width: 280 }}
            />

            <Select
              style={{ width: 180 }}
              value={activeFilter}
              options={BANNER_ACTIVE_FILTER_OPTIONS}
              onChange={(value) => {
                setActiveFilter(value);
              }}
            />

            <Select
              style={{ width: 240 }}
              value={canteenFilter}
              options={canteenOptions}
              onChange={(value) => {
                setCanteenFilter(value);
              }}
            />

            <Button
              onClick={() => loadBanners({ page: 1, limit: pagination.limit })}
            >
              Lọc
            </Button>
          </Space>

          <Button
            type="primary"
            icon={<GIcon name="add" />}
            onClick={openCreateModal}
          >
            Tạo banner
          </Button>
        </Space>
      </Card>

      <Card
        title={
          <Space>
            <span>Danh sách banner</span>
            <Badge count={pagination.total} showZero color="#1677ff" />
          </Space>
        }
      >
        <Table
          rowKey="_id"
          loading={loading}
          dataSource={banners}
          columns={columns}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              loadBanners({ page, limit: pageSize });
            },
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Drawer
        title={editingBanner ? "Cập nhật banner" : "Tạo banner mới"}
        placement="right"
        open={modalOpen}
        onClose={closeModal}
        width={520}
        extra={
          <Space>
            <Button onClick={closeModal}>Hủy</Button>
            <Button type="primary" loading={submitting} onClick={onSubmit}>
              Lưu
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[
              { required: true, message: "Vui lòng nhập tiêu đề" },
              { max: 200, message: "Tiêu đề tối đa 200 ký tự" },
            ]}
          >
            <Input placeholder="Nhập tiêu đề banner" />
          </Form.Item>

          <Form.Item label="Ảnh banner" required>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={() => false}
                onChange={handleBannerImageChange}
              >
                <Button icon={<GIcon name="upload" />} loading={imageUploading}>
                  Tải ảnh banner
                </Button>
              </Upload>

              <Typography.Text type="secondary">
                Hỗ trợ JPG/PNG/WebP, tối đa 5MB
              </Typography.Text>

              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="banner-preview"
                  style={{
                    width: "100%",
                    maxHeight: 180,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              ) : null}
            </Space>
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="URL ảnh banner"
            rules={[
              { required: true, message: "Vui lòng tải ảnh banner" },
              { type: "url", message: "URL ảnh không hợp lệ" },
            ]}
          >
            <Input
              readOnly
              placeholder="URL ảnh sẽ tự cập nhật sau khi upload"
            />
          </Form.Item>

          <Form.Item
            name="linkUrl"
            label="Liên kết điều hướng"
            rules={[{ type: "url", message: "URL điều hướng không hợp lệ" }]}
          >
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item name="canteenId" label="Căng tin áp dụng">
            <Select
              allowClear
              placeholder="Chọn căng tin (bỏ trống nếu áp dụng toàn hệ thống)"
              options={canteens.map((canteen) => ({
                value: canteen._id,
                label: canteen.name,
              }))}
            />
          </Form.Item>

          <Space style={{ width: "100%" }} size={12} align="start">
            <Form.Item name="order" label="Thứ tự hiển thị" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="isActive"
              label="Kích hoạt"
              valuePropName="checked"
              style={{ flex: 1 }}
            >
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>
          </Space>

          <Space style={{ width: "100%" }} size={12} align="start">
            <Form.Item
              name="startDate"
              label="Ngày bắt đầu"
              style={{ flex: 1 }}
            >
              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item name="endDate" label="Ngày kết thúc" style={{ flex: 1 }}>
              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Space>
        </Form>
      </Drawer>

      <Drawer
        title="Chi tiết banner"
        placement="right"
        width={500}
        open={detailOpen}
        onClose={closeDetail}
        loading={detailLoading}
      >
        {!detailBanner ? (
          <Empty
            description="Không có dữ liệu banner"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <img
              src={detailBanner.imageUrl}
              alt={detailBanner.title}
              style={{
                width: "100%",
                borderRadius: 8,
                objectFit: "cover",
                maxHeight: 220,
              }}
            />

            <div>
              <Typography.Text type="secondary">Tiêu đề</Typography.Text>
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                {detailBanner.title}
              </Typography.Paragraph>
            </div>

            <div>
              <Typography.Text type="secondary">
                Căng tin áp dụng
              </Typography.Text>
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                {detailBanner?.canteenId?.name || "Toàn hệ thống"}
              </Typography.Paragraph>
            </div>

            <div>
              <Typography.Text type="secondary">URL ảnh</Typography.Text>
              <Typography.Paragraph copyable style={{ marginBottom: 0 }}>
                {detailBanner.imageUrl}
              </Typography.Paragraph>
            </div>

            <div>
              <Typography.Text type="secondary">URL điều hướng</Typography.Text>
              <Typography.Paragraph copyable style={{ marginBottom: 0 }}>
                {detailBanner.linkUrl || "Không có"}
              </Typography.Paragraph>
            </div>

            <Space>
              <Tag color={detailBanner.isActive ? "green" : "default"}>
                {detailBanner.isActive ? "Đang hiển thị" : "Đang tắt"}
              </Tag>
              <Tag color="blue">Thứ tự: {detailBanner.order || 0}</Tag>
            </Space>

            <div>
              <Typography.Text type="secondary">
                Thời gian hiệu lực
              </Typography.Text>
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                Từ:{" "}
                {detailBanner.startDate
                  ? dayjs(detailBanner.startDate).format("DD/MM/YYYY HH:mm")
                  : "Không giới hạn"}
              </Typography.Paragraph>
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                Đến:{" "}
                {detailBanner.endDate
                  ? dayjs(detailBanner.endDate).format("DD/MM/YYYY HH:mm")
                  : "Không giới hạn"}
              </Typography.Paragraph>
            </div>
          </Space>
        )}
      </Drawer>
    </Space>
  );
}
