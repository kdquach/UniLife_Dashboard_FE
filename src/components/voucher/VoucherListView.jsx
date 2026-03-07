import React from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Card,
  Tooltip,
  Popconfirm,
  Badge,
  Progress,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CloudUploadOutlined,
  CopyOutlined,
  InboxOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import VoucherStateBadge from "./VoucherStateBadge";

export default function VoucherListView({
  loading,
  items,
  pagination,
  searchText,
  filterState,
  filterScope,
  filterDiscountType,
  onSearchChange,
  onFilterStateChange,
  onFilterScopeChange,
  onFilterDiscountTypeChange,
  onSortChange,
  onSearch,
  onPaginationChange,
  onAdd,
  onView,
  onEdit,
  onDelete,
  onStateChange,
  onClone,
  managerRole,
}) {
  const formatDiscount = (type, value, cap) => {
    if (type === "Percentage") {
      return `Giảm ${value}%${cap ? ` (tối đa ${cap.toLocaleString("vi-VN")}đ)` : ""}`;
    }
    return `Giảm ${value?.toLocaleString("vi-VN")}đ`;
  };

  const handleTableChange = (pag, _filters, sorter) => {
    if (sorter && sorter.field && onSortChange) {
      const sortStr =
        sorter.order === "descend" ? `-${sorter.field}` : sorter.field;
      onSortChange(sorter.order ? sortStr : "-createdAt");
    }
    onPaginationChange(pag.current, pag.pageSize);
  };

  const columns = [
    {
      title: "Mã Voucher",
      dataIndex: "code",
      key: "code",
      sorter: true,
      width: 160,
      render: (text) => (
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: 13,
            color: "#fa541c",
            letterSpacing: "0.5px",
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Tên / Chương trình",
      dataIndex: "name",
      key: "name",
      width: 240,
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, color: "#1a1a2e", marginBottom: 2 }}>
            {text}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#8c8c8c",
              background: "#fff7e6",
              padding: "2px 8px",
              borderRadius: 4,
              display: "inline-block",
            }}
          >
            {formatDiscount(
              record.discountType,
              record.discountValue,
              record.maxDiscountCap,
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Phạm vi",
      dataIndex: "scope",
      key: "scope",
      width: 110,
      render: (scope, record) => (
        <div>
          <Badge
            status={scope === "Global" ? "success" : "processing"}
            text={
              <span style={{ fontWeight: 500, fontSize: 13 }}>
                {scope === "Global" ? "Global" : "Branch"}
              </span>
            }
          />
          {scope === "Branch" && record.canteen_ids?.length > 0 && (
            <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 2 }}>
              {record.canteen_ids.map((c) => c.name).join(", ")}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Hiệu lực",
      key: "startDatetime",
      dataIndex: "startDatetime",
      sorter: true,
      width: 170,
      render: (_, record) => (
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          <div>
            <span style={{ color: "#52c41a" }}>▸</span>{" "}
            {dayjs(record.startDatetime).format("DD/MM/YY HH:mm")}
          </div>
          <div>
            <span style={{ color: "#ff4d4f" }}>▪</span>{" "}
            {dayjs(record.endDatetime).format("DD/MM/YY HH:mm")}
          </div>
        </div>
      ),
    },
    {
      title: "Sử dụng",
      key: "usedCount",
      dataIndex: "usedCount",
      sorter: true,
      width: 120,
      render: (_, record) => {
        const limitStr = record.totalLimit === null ? "∞" : record.totalLimit;
        const pct = record.totalLimit
          ? Math.round((record.usedCount / record.totalLimit) * 100)
          : 0;

        return (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
              {record.usedCount} / {limitStr}
            </div>
            {record.totalLimit && (
              <Progress
                percent={pct}
                size="small"
                showInfo={false}
                strokeColor={
                  pct >= 100 ? "#f5222d" : pct > 80 ? "#faad14" : "#fa541c"
                }
                style={{ width: 80 }}
              />
            )}
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "state",
      dataIndex: "state",
      width: 150,
      render: (state) => <VoucherStateBadge state={state} />,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 200,
      fixed: "right",
      render: (_, record) => {
        const s = record.state;
        return (
          <Space size={4}>
            {/* View */}
            <Tooltip title="Xem chi tiết">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onView(record)}
                style={{ color: "#fa541c" }}
              />
            </Tooltip>

            {/* Edit */}
            {["Draft", "Upcoming", "Active", "Inactive"].includes(s) && (
              <Tooltip
                title={
                  s === "Active" || s === "Inactive"
                    ? "Sửa giới hạn"
                    : "Chỉnh sửa"
                }
              >
                <Button
                  type="text"
                  size="small"
                  style={{ color: "#1890ff" }}
                  icon={<EditOutlined />}
                  onClick={() => onEdit(record)}
                />
              </Tooltip>
            )}

            {/* Clone */}
            <Tooltip title="Nhân bản">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => onClone(record)}
                style={{ color: "#13c2c2" }}
              />
            </Tooltip>

            {/* Publish */}
            {s === "Draft" && (
              <Tooltip title="Xuất bản">
                <Button
                  type="text"
                  size="small"
                  style={{ color: "#52c41a" }}
                  icon={<CloudUploadOutlined />}
                  onClick={() => onStateChange("publish", record)}
                />
              </Tooltip>
            )}

            {/* Deactivate */}
            {s === "Active" && (
              <Tooltip title="Tạm ngưng">
                <Button
                  type="text"
                  size="small"
                  style={{ color: "#faad14" }}
                  icon={<PauseCircleOutlined />}
                  onClick={() => onStateChange("deactivate", record)}
                />
              </Tooltip>
            )}

            {/* Reactivate */}
            {s === "Inactive" && (
              <Tooltip title="Kích hoạt lại">
                <Popconfirm
                  title="Kích hoạt lại voucher này?"
                  onConfirm={() => onStateChange("reactivate", record)}
                  okText="Đồng ý"
                  cancelText="Hủy"
                >
                  <Button
                    type="text"
                    size="small"
                    style={{ color: "#52c41a" }}
                    icon={<PlayCircleOutlined />}
                  />
                </Popconfirm>
              </Tooltip>
            )}

            {/* Archive */}
            {["Expired", "OutOfQuota"].includes(s) && (
              <Tooltip title="Lưu trữ">
                <Popconfirm
                  title="Lưu trữ voucher này?"
                  onConfirm={() => onStateChange("archive", record)}
                  okText="Lưu trữ"
                  cancelText="Hủy"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<InboxOutlined />}
                    style={{ color: "#8c8c8c" }}
                  />
                </Popconfirm>
              </Tooltip>
            )}

            {/* Delete */}
            {s === "Draft" && (
              <Tooltip title="Xóa">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(record)}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Card
      title={
        <span style={{ fontSize: 18, fontWeight: 700 }}>
          📋 Danh sách Voucher & Khuyến mãi
        </span>
      }
      bordered={false}
      style={{
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
      styles={{
        body: { padding: "16px 24px" },
        header: {
          borderBottom: "2px solid #f0f0f0",
          padding: "16px 24px",
        },
      }}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={onSearch}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAdd}
            style={{
              borderRadius: 8,
              background: "linear-gradient(135deg, #fa541c 0%, #ff7a45 100%)",
              border: "none",
              fontWeight: 600,
            }}
          >
            Tạo Voucher Mới
          </Button>
        </Space>
      }
    >
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          padding: "12px 16px",
          background: "#fff9f0",
          borderRadius: 10,
          border: "1px solid #ffe7cc",
        }}
      >
        <Input
          placeholder="Tìm mã hoặc tên voucher..."
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          onPressEnter={onSearch}
          style={{ width: 240, borderRadius: 8 }}
          allowClear
        />
        <Select
          value={filterState}
          onChange={onFilterStateChange}
          style={{ width: 155 }}
          options={[
            { value: "all", label: "Tất cả trạng thái" },
            { value: "Draft", label: "Bản nháp" },
            { value: "Upcoming", label: "Sắp diễn ra" },
            { value: "Active", label: "Đang hoạt động" },
            { value: "Inactive", label: "Tạm ngưng" },
            { value: "Expired", label: "Hết hạn" },
            { value: "OutOfQuota", label: "Hết lượt" },
            { value: "Archived", label: "Đã lưu trữ" },
          ]}
        />
        {!managerRole && (
          <Select
            value={filterScope}
            onChange={onFilterScopeChange}
            style={{ width: 145 }}
            options={[
              { value: "all", label: "Mọi phạm vi" },
              { value: "Global", label: "Toàn hệ thống" },
              { value: "Branch", label: "Theo Canteen" },
            ]}
          />
        )}
        <Select
          value={filterDiscountType}
          onChange={onFilterDiscountTypeChange}
          style={{ width: 145 }}
          options={[
            { value: "all", label: "Loại giảm giá" },
            { value: "Percentage", label: "Phần trăm (%)" },
            { value: "Fixed Amount", label: "Tiền mặt (VNĐ)" },
          ]}
        />
        <Button
          type="primary"
          ghost
          onClick={onSearch}
          style={{ borderRadius: 8 }}
        >
          Tìm kiếm
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={items}
        rowKey="_id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} voucher`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1300 }}
        size="middle"
      />
    </Card>
  );
}
