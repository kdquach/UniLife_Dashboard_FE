import React, { useState, useEffect, useCallback } from "react";
import { Table, Tag, DatePicker, Select, Button, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getVoucherUsageHistory } from "@/services/voucher.service";

export default function VoucherUsageHistoryTable({ voucherId, canteens = [] }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({});

  const fetchHistory = useCallback(
    async (page = 1, limit = 10, currentFilters = filters) => {
      if (!voucherId) return;
      setLoading(true);
      try {
        const params = {
          page,
          limit,
          sort: "-createdAt",
          ...currentFilters,
        };
        const response = await getVoucherUsageHistory(voucherId, params);
        setData(response?.data || []);
        setPagination({
          current: response?.pagination?.page || 1,
          pageSize: response?.pagination?.limit || 10,
          total: response?.pagination?.total || 0,
        });
      } catch (error) {
        console.error("Failed to load history", error);
      } finally {
        setLoading(false);
      }
    },
    [voucherId, filters],
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleTableChange = (pag) => {
    fetchHistory(pag.current, pag.pageSize);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    if (!value) delete newFilters[key];
    setFilters(newFilters);
    fetchHistory(1, pagination.pageSize, newFilters);
  };

  const columns = [
    {
      title: "Khách hàng",
      key: "user",
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.userId?.fullName || "Khách vãng lai"}
          </div>
          <div style={{ fontSize: 11, color: "#8c8c8c" }}>
            {record.userId?.email}
          </div>
        </div>
      ),
    },
    {
      title: "Canteen",
      dataIndex: ["canteenId", "name"],
      key: "canteen",
      width: 120,
    },
    {
      title: "Mã Đơn",
      dataIndex: ["orderId", "orderNumber"],
      key: "orderNumber",
      width: 110,
      render: (text) => (
        <span style={{ fontFamily: "monospace", fontWeight: 500 }}>
          {text || "--"}
        </span>
      ),
    },
    {
      title: "Tiền gốc",
      dataIndex: "originalAmount",
      key: "originalAmount",
      width: 110,
      render: (amount) => (
        <span style={{ color: "#8c8c8c" }}>
          {(amount || 0).toLocaleString()}đ
        </span>
      ),
    },
    {
      title: "Giảm giá",
      dataIndex: "discountAmount",
      key: "discountAmount",
      width: 110,
      render: (amount) => (
        <span style={{ color: "#52c41a", fontWeight: 600 }}>
          -{(amount || 0).toLocaleString()}đ
        </span>
      ),
    },
    {
      title: "Thanh toán",
      dataIndex: "finalAmount",
      key: "finalAmount",
      width: 110,
      render: (amount) => (
        <span style={{ fontWeight: 700 }}>
          {(amount || 0).toLocaleString()}đ
        </span>
      ),
    },
    {
      title: "Voucher",
      dataIndex: "voucherStatus",
      key: "voucherStatus",
      width: 100,
      render: (status) => (
        <Tag color={status === "Consumed" ? "green" : "orange"}>
          {status === "Consumed" ? "Đã dùng" : "Hoàn lại"}
        </Tag>
      ),
    },
    {
      title: "Đơn hàng",
      dataIndex: "orderStatus",
      key: "orderStatus",
      width: 100,
      render: (status) => {
        const colors = {
          Completed: "green",
          Cancelled: "red",
          Pending: "blue",
          Processing: "gold",
        };
        return <Tag color={colors[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (date) => (
        <span style={{ fontSize: 12 }}>
          {dayjs(date).format("DD/MM/YYYY HH:mm")}
        </span>
      ),
    },
  ];

  return (
    <>
      <div
        style={{
          marginBottom: 16,
          padding: "10px 12px",
          background: "#fafafa",
          borderRadius: 8,
          border: "1px solid #f0f0f0",
        }}
      >
        <Space wrap>
          <DatePicker.RangePicker
            size="small"
            onChange={(dates) => {
              if (dates) {
                handleFilterChange("startDate", dates[0].toISOString());
                handleFilterChange("endDate", dates[1].toISOString());
              } else {
                handleFilterChange("startDate", null);
                handleFilterChange("endDate", null);
              }
            }}
          />
          <Select
            placeholder="TT Voucher"
            allowClear
            size="small"
            style={{ width: 130 }}
            onChange={(v) => handleFilterChange("voucherStatus", v)}
            options={[
              { value: "Consumed", label: "Đã dùng" },
              { value: "Refunded", label: "Hoàn lại" },
            ]}
          />
          <Select
            placeholder="TT Đơn hàng"
            allowClear
            size="small"
            style={{ width: 130 }}
            onChange={(v) => handleFilterChange("orderStatus", v)}
            options={["Pending", "Processing", "Completed", "Cancelled"].map(
              (s) => ({ value: s, label: s }),
            )}
          />
          {canteens.length > 0 && (
            <Select
              placeholder="Canteen"
              allowClear
              size="small"
              style={{ width: 150 }}
              onChange={(v) => handleFilterChange("canteenId", v)}
              options={canteens.map((c) => ({
                label: c.name,
                value: c._id,
              }))}
            />
          )}
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => fetchHistory(1, pagination.pageSize)}
          >
            Tải lại
          </Button>
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="_id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          size: "small",
        }}
        onChange={handleTableChange}
        size="small"
        scroll={{ x: "max-content" }}
      />
    </>
  );
}
