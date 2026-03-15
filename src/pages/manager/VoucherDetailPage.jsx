import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Descriptions,
  Divider,
  Typography,
  Row,
  Col,
  Space,
  Button,
  Tabs,
  Timeline,
  Progress,
  Tag,
  Spin,
  message,
} from "antd";
import dayjs from "dayjs";
import {
  ArrowLeftOutlined,
  EditOutlined,
  PieChartOutlined,
  LineChartOutlined,
  GiftOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  FieldTimeOutlined,
  CloudUploadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  InboxOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { getVoucherById } from "@/services/voucher.service";
import { getAllCanteens } from "@/services/canteen.service";
import VoucherStateBadge from "@/components/voucher/VoucherStateBadge";
import VoucherUsageHistoryTable from "@/components/voucher/VoucherUsageHistoryTable";

const { Title, Text } = Typography;

export default function VoucherDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [voucher, setVoucher] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [canteens, setCanteens] = useState([]);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [voucherRes, canteenRes] = await Promise.all([
        getVoucherById(id),
        getAllCanteens({ limit: 50 }),
      ]);
      setVoucher(voucherRes?.data?.voucher || null);
      setStatistics(voucherRes?.data?.statistics || null);
      setCanteens(canteenRes?.data?.canteens || []);
    } catch (error) {
      console.error(error);
      messageApi.error("Không thể tải chi tiết voucher");
    } finally {
      setLoading(false);
    }
  }, [id, messageApi]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Text type="secondary">Không tìm thấy voucher</Text>
        <br />
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          Quay lại
        </Button>
      </div>
    );
  }

  const formatDiscount = () => {
    if (voucher.discountType === "Percentage") {
      return `Giảm ${voucher.discountValue}%${voucher.maxDiscountCap ? ` (Tối đa ${voucher.maxDiscountCap.toLocaleString()}đ)` : ""}`;
    }
    return `Giảm ${voucher.discountValue?.toLocaleString()}đ`;
  };

  const getApplyToLabel = () => {
    switch (voucher.applyTo) {
      case "All items":
        return "Toàn bộ menu";
      case "Category":
        return `Danh mục (${voucher.categoryIds?.length || 0} mục)`;
      case "Specific items":
        return `Sản phẩm cụ thể (${voucher.productIds?.length || 0} SP)`;
      case "Combo only":
        return "Chỉ Combo";
      default:
        return voucher.applyTo;
    }
  };

  const usagePct = voucher.totalLimit
    ? Math.round((voucher.usedCount / voucher.totalLimit) * 100)
    : null;

  const s = voucher.state;
  const canEdit = ["Draft", "Upcoming", "Active", "Inactive"].includes(s);

  // Info Tab Content
  const infoContent = (
    <div>
      {/* Voucher Config */}
      <Descriptions
        title={
          <span>
            <InfoCircleOutlined style={{ marginRight: 8, color: "#fa541c" }} />
            Thiết lập Khuyến mãi
          </span>
        }
        bordered
        column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
        size="small"
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="Loại giảm giá" span={2}>
          <Tag
            color={voucher.discountType === "Percentage" ? "orange" : "green"}
          >
            {voucher.discountType === "Percentage"
              ? "Phần trăm (%)"
              : "Tiền mặt (VNĐ)"}
          </Tag>
          <Text strong style={{ marginLeft: 8 }}>
            {formatDiscount()}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả hiển thị" span={2}>
          {voucher.displayDescription || <Text type="secondary">Chưa có</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="Phạm vi">
          {voucher.scope === "Global" ? (
            <Tag color="green">🌍 Global</Tag>
          ) : (
            <Tag color="blue">🏪 Branch</Tag>
          )}
          {voucher.scope === "Branch" && voucher.canteen_ids?.length > 0 && (
            <div style={{ marginTop: 4, fontSize: 12 }}>
              {voucher.canteen_ids.map((c) => c.name).join(", ")}
            </div>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Áp dụng cho">
          {getApplyToLabel()}
        </Descriptions.Item>
      </Descriptions>

      {/* Conditions */}
      <Descriptions
        title={
          <span>
            <FieldTimeOutlined style={{ marginRight: 8, color: "#fa541c" }} />
            Điều kiện áp dụng
          </span>
        }
        bordered
        column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
        size="small"
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="Thời gian hiệu lực" span={2}>
          <Text strong>
            {dayjs(voucher.startDatetime).format("DD/MM/YYYY HH:mm")}
          </Text>
          <span style={{ margin: "0 8px", color: "#d9d9d9" }}>→</span>
          <Text strong>
            {dayjs(voucher.endDatetime).format("DD/MM/YYYY HH:mm")}
          </Text>
        </Descriptions.Item>
        {voucher.timeRestriction && (
          <Descriptions.Item label="Khung giờ trong ngày" span={2}>
            {voucher.timeRestriction.fromTime} —{" "}
            {voucher.timeRestriction.toTime}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Đơn tối thiểu">
          {(voucher.minOrderValue || 0).toLocaleString()}đ
        </Descriptions.Item>
        <Descriptions.Item label="Tối thiểu SP">
          {voucher.minItemQuantity || 0} sản phẩm
        </Descriptions.Item>
        <Descriptions.Item label="Lượt / Khách hàng">
          {voucher.usagePerUser} lượt
        </Descriptions.Item>
        <Descriptions.Item label="Dùng kèm Combo">
          {voucher.allowStackWithCombo ? (
            <Tag color="green">Có</Tag>
          ) : (
            <Tag color="default">Không</Tag>
          )}
        </Descriptions.Item>
      </Descriptions>

      {/* Audit */}
      <Descriptions
        title={
          <span>
            <HistoryOutlined style={{ marginRight: 8, color: "#fa541c" }} />
            Thông tin hệ thống
          </span>
        }
        bordered
        column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
        size="small"
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="Người tạo">
          {voucher.createdBy?.fullName || "N/A"} (
          {voucher.createdBy?.email || ""})
        </Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">
          {dayjs(voucher.createdAt).format("DD/MM/YYYY HH:mm")}
        </Descriptions.Item>
        <Descriptions.Item label="Người cập nhật">
          {voucher.updatedBy?.fullName || "N/A"} (
          {voucher.updatedBy?.email || ""})
        </Descriptions.Item>
        <Descriptions.Item label="Cập nhật cuối">
          {dayjs(voucher.updatedAt).format("DD/MM/YYYY HH:mm")}
        </Descriptions.Item>
        <Descriptions.Item label="Ghi chú nội bộ" span={2}>
          {voucher.internalDescription || (
            <Text type="secondary">Không có</Text>
          )}
        </Descriptions.Item>
      </Descriptions>

      {/* Change Log */}
      {voucher.changeLog?.length > 0 && (
        <>
          <Divider orientation="left" style={{ fontSize: 14 }}>
            📝 Lịch sử thay đổi
          </Divider>
          <Timeline
            style={{ marginTop: 12 }}
            items={voucher.changeLog.map((log, index) => ({
              key: index,
              color:
                log.field === "state"
                  ? "orange"
                  : log.field === "totalLimit"
                    ? "green"
                    : "gray",
              children: (
                <div>
                  <Text strong>{log.field}</Text>:{" "}
                  <Text delete type="secondary">
                    {String(log.oldValue)}
                  </Text>{" "}
                  →{" "}
                  <Text type="success" strong>
                    {String(log.newValue)}
                  </Text>
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>
                    {dayjs(log.changedAt).format("DD/MM/YYYY HH:mm")}
                    {log.reason && ` — ${log.reason}`}
                  </div>
                </div>
              ),
            }))}
          />
        </>
      )}
    </div>
  );

  // Usage History Tab
  const historyContent = (
    <VoucherUsageHistoryTable voucherId={voucher._id} canteens={canteens} />
  );

  const tabItems = [
    {
      key: "info",
      label: (
        <span>
          <InfoCircleOutlined /> Thông tin chi tiết
        </span>
      ),
      children: infoContent,
    },
    {
      key: "history",
      label: (
        <span>
          <HistoryOutlined /> Lịch sử sử dụng
        </span>
      ),
      children: historyContent,
    },
  ];

  return (
    <>
      {contextHolder}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ marginBottom: 8, color: "#8c8c8c" }}
          >
            Quay lại danh sách
          </Button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Title level={3} style={{ margin: 0 }}>
              {voucher.name}
            </Title>
            <VoucherStateBadge state={voucher.state} />
          </div>
          <Text
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 15,
              color: "#fa541c",
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            Mã: {voucher.code}
          </Text>
        </div>

        <Space wrap>
          {canEdit && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() =>
                navigate(-1, { state: { editVoucherId: voucher._id } })
              }
              style={{
                background: "linear-gradient(135deg, #fa541c 0%, #ff7a45 100%)",
                border: "none",
                borderRadius: 8,
              }}
            >
              Chỉnh sửa
            </Button>
          )}
          {s === "Draft" && (
            <Button icon={<CloudUploadOutlined />} style={{ borderRadius: 8 }}>
              Xuất bản
            </Button>
          )}
          {s === "Active" && (
            <Button icon={<PauseCircleOutlined />} style={{ borderRadius: 8 }}>
              Tạm ngưng
            </Button>
          )}
          {s === "Inactive" && (
            <Button icon={<PlayCircleOutlined />} style={{ borderRadius: 8 }}>
              Kích hoạt lại
            </Button>
          )}
          {["Expired", "OutOfQuota"].includes(s) && (
            <Button icon={<InboxOutlined />} style={{ borderRadius: 8 }}>
              Lưu trữ
            </Button>
          )}
          <Button icon={<CopyOutlined />} style={{ borderRadius: 8 }}>
            Nhân bản
          </Button>
        </Space>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: "linear-gradient(135deg, #fa541c 0%, #ff7a45 100%)",
              borderRadius: 12,
              border: "none",
            }}
            styles={{ body: { padding: "20px 24px" } }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              <PieChartOutlined /> Đã sử dụng
            </div>
            <div style={{ color: "#fff", fontSize: 28, fontWeight: 700 }}>
              {statistics?.usageDisplay ||
                `${voucher.usedCount}/${voucher.totalLimit || "∞"}`}
            </div>
            {usagePct !== null && (
              <Progress
                percent={usagePct}
                size="small"
                showInfo={false}
                strokeColor="#fff"
                trailColor="rgba(255,255,255,0.3)"
                style={{ marginTop: 8 }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: "linear-gradient(135deg, #fa8c16 0%, #ffc069 100%)",
              borderRadius: 12,
              border: "none",
            }}
            styles={{ body: { padding: "20px 24px" } }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              <GiftOutlined /> Tổng tiền giảm
            </div>
            <div style={{ color: "#fff", fontSize: 28, fontWeight: 700 }}>
              {(statistics?.totalDiscountGiven || 0).toLocaleString()} đ
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: "linear-gradient(135deg, #f5222d 0%, #ff7875 100%)",
              borderRadius: 12,
              border: "none",
            }}
            styles={{ body: { padding: "20px 24px" } }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              <LineChartOutlined /> Doanh thu mang lại
            </div>
            <div style={{ color: "#fff", fontSize: 28, fontWeight: 700 }}>
              {(statistics?.totalRevenue || 0).toLocaleString()} đ
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content Card with Tabs */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        styles={{ body: { padding: "16px 24px" } }}
      >
        <Tabs items={tabItems} defaultActiveKey="info" />
      </Card>
    </>
  );
}
