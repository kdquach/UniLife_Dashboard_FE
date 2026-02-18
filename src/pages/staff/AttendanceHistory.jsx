import { useCallback, useEffect, useState } from "react";
import {
  message as antdMessage,
  Table,
  Select,
  Spin,
  DatePicker,
  Modal,
  Button,
} from "antd";
import dayjs from "dayjs";
import GIcon from "@/components/GIcon";
import { getHistory, getAttendanceDetail } from "@/services/attendance.service";
import { useAuthStore } from "@/store/useAuthStore";
import "@/styles/attendance.css";

const STATUS_MAP = {
  on_time: {
    label: "Đúng giờ",
    css: "on_time",
    icon: "check_circle",
    color: "#16a34a",
  },
  late: { label: "Trễ", css: "late", icon: "schedule", color: "#d97706" },
  critical_late: {
    label: "Trễ nghiêm trọng",
    css: "critical_late",
    icon: "error",
    color: "#dc2626",
  },
  early_leave: {
    label: "Về sớm",
    css: "early_leave",
    icon: "logout",
    color: "#ea580c",
  },
  overtime: {
    label: "Overtime",
    css: "overtime",
    icon: "more_time",
    color: "#7c3aed",
  },
  missing_checkout: {
    label: "Thiếu check-out",
    css: "missing_checkout",
    icon: "help",
    color: "#6b7280",
  },
};

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "on_time", label: "Đúng giờ" },
  { value: "late", label: "Trễ" },
  { value: "critical_late", label: "Trễ nghiêm trọng" },
  { value: "early_leave", label: "Về sớm" },
  { value: "overtime", label: "Overtime" },
  { value: "missing_checkout", label: "Thiếu check-out" },
];

function StatusBadge({ status, size }) {
  const info = STATUS_MAP[status];
  if (!info) return null;
  const cls = size === "large" ? "att-badge att-badge--lg" : "att-badge";
  return <span className={`${cls} att-badge--${info.css}`}>{info.label}</span>;
}

function formatTimeVN(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateVN(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatDateFull(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function StatCard({ icon, label, value, colorClass }) {
  return (
    <div className="att-stat-card">
      <div className={`att-stat-icon att-stat-icon--${colorClass}`}>
        <GIcon name={icon} />
      </div>
      <div>
        <div className="att-stat-value">{value}</div>
        <div className="att-stat-label">{label}</div>
      </div>
    </div>
  );
}

/* =====================================================================
   DETAIL MODAL — Premium Modal Design
   ===================================================================== */
function DetailModal({ detail, loading, open, onClose }) {
  const statusInfo = detail ? STATUS_MAP[detail.status] || {} : {};

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      destroyOnHidden
      className="att-detail-modal"
      title={null}
      closable={false}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: "#9ca3af", fontSize: 13 }}>
            Đang tải chi tiết...
          </div>
        </div>
      ) : detail ? (
        <div className="att-dm">
          {/* Close button */}
          <button className="att-dm-close" onClick={onClose}>
            <GIcon name="close" />
          </button>

          {/* === Hero Section === */}
          <div className="att-dm-hero">
            <div
              className="att-dm-hero__icon"
              style={{ background: statusInfo.color || "#6b7280" }}
            >
              <GIcon name={statusInfo.icon || "info"} />
            </div>
            <div className="att-dm-hero__content">
              <StatusBadge status={detail.status} size="large" />
              <div className="att-dm-hero__date">
                {formatDateFull(detail.date)}
              </div>
              <div className="att-dm-hero__shift">
                {detail.shift?.name} • {detail.shift?.start_time} -{" "}
                {detail.shift?.end_time}
              </div>
              {(detail.assigned_by ||
                detail.shift?.created_by ||
                detail.shift?.assigned_by) && (
                <div className="att-dm-hero__scheduler">
                  <GIcon name="person" />
                  Người xếp lịch:{" "}
                  {detail.assigned_by?.fullName ||
                    detail.assigned_by?.name ||
                    detail.assigned_by?.email ||
                    detail.shift?.created_by?.fullName ||
                    detail.shift?.created_by?.name ||
                    detail.shift?.created_by?.email ||
                    detail.shift?.created_by ||
                    detail.shift?.assigned_by?.fullName ||
                    detail.shift?.assigned_by?.name ||
                    detail.shift?.assigned_by?.email ||
                    detail.shift?.assigned_by}
                </div>
              )}
              {detail.canteen?.name && (
                <div className="att-dm-hero__canteen">
                  <GIcon name="storefront" /> {detail.canteen.name}
                </div>
              )}
            </div>
          </div>

          {/* === Key Metrics === */}
          <div className="att-dm-metrics">
            <div className="att-dm-metric">
              <div className="att-dm-metric__value">
                {detail.formatted_work_time ||
                  `${detail.actual_work_minutes || 0}p`}
              </div>
              <div className="att-dm-metric__label">Giờ làm</div>
            </div>
            <div className="att-dm-metric__divider" />
            <div className="att-dm-metric">
              <div
                className="att-dm-metric__value"
                style={{
                  color: detail.late_minutes > 0 ? "#d97706" : "#16a34a",
                }}
              >
                {detail.late_minutes || 0}p
              </div>
              <div className="att-dm-metric__label">Trễ</div>
            </div>
            <div className="att-dm-metric__divider" />
            <div className="att-dm-metric">
              <div
                className="att-dm-metric__value"
                style={{
                  color: detail.overtime_minutes > 0 ? "#7c3aed" : "#9ca3af",
                }}
              >
                {detail.overtime_minutes || 0}p
              </div>
              <div className="att-dm-metric__label">Overtime</div>
            </div>
          </div>

          {/* === Timeline === */}
          <div className="att-dm-timeline">
            <div className="att-dm-tl-item">
              <div className="att-dm-tl-dot att-dm-tl-dot--in" />
              <div className="att-dm-tl-content">
                <div className="att-dm-tl-row">
                  <span className="att-dm-tl-label">Check-in</span>
                  <span className="att-dm-tl-time">
                    {formatTimeVN(detail.check_in_time)}
                  </span>
                </div>
                {(detail.check_in_ip || detail.check_in_device) && (
                  <div className="att-dm-tl-meta">
                    {detail.check_in_ip && (
                      <span>
                        <GIcon name="lan" /> {detail.check_in_ip}
                      </span>
                    )}
                    {detail.check_in_device && (
                      <span title={detail.check_in_device}>
                        <GIcon name="devices" />{" "}
                        {detail.check_in_device.length > 35
                          ? detail.check_in_device.substring(0, 35) + "…"
                          : detail.check_in_device}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="att-dm-tl-connector" />

            <div className="att-dm-tl-item">
              <div
                className={`att-dm-tl-dot ${detail.check_out_time ? "att-dm-tl-dot--out" : "att-dm-tl-dot--pending"}`}
              />
              <div className="att-dm-tl-content">
                <div className="att-dm-tl-row">
                  <span className="att-dm-tl-label">Check-out</span>
                  <span className="att-dm-tl-time">
                    {detail.check_out_time
                      ? formatTimeVN(detail.check_out_time)
                      : "Chưa check-out"}
                  </span>
                </div>
                {detail.check_out_time &&
                  (detail.check_out_ip || detail.check_out_device) && (
                    <div className="att-dm-tl-meta">
                      {detail.check_out_ip && (
                        <span>
                          <GIcon name="lan" /> {detail.check_out_ip}
                        </span>
                      )}
                      {detail.check_out_device && (
                        <span title={detail.check_out_device}>
                          <GIcon name="devices" />{" "}
                          {detail.check_out_device.length > 35
                            ? detail.check_out_device.substring(0, 35) + "…"
                            : detail.check_out_device}
                        </span>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* === Info Cards === */}
          <div className="att-dm-cards">
            {detail.overtime_minutes > 0 && (
              <div className="att-dm-info att-dm-info--purple">
                <div className="att-dm-info__icon">
                  <GIcon name="more_time" />
                </div>
                <div className="att-dm-info__body">
                  <div className="att-dm-info__title">
                    Overtime: {detail.overtime_minutes} phút
                  </div>
                  <div className="att-dm-info__sub">
                    {detail.overtime_approved ? (
                      <span style={{ color: "#16a34a" }}>✓ Đã duyệt</span>
                    ) : (
                      <span style={{ color: "#d97706" }}>⏳ Chờ duyệt</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {detail.early_leave_reason && (
              <div className="att-dm-info att-dm-info--orange">
                <div className="att-dm-info__icon">
                  <GIcon name="logout" />
                </div>
                <div className="att-dm-info__body">
                  <div className="att-dm-info__title">Lý do về sớm</div>
                  <div className="att-dm-info__sub">
                    {detail.early_leave_reason}
                  </div>
                </div>
              </div>
            )}

            {detail.needs_review && (
              <div className="att-dm-info att-dm-info--amber">
                <div className="att-dm-info__icon">
                  <GIcon name="rate_review" />
                </div>
                <div className="att-dm-info__body">
                  <div className="att-dm-info__title">Cần xem xét</div>
                  <div className="att-dm-info__sub">
                    Bản ghi này cần được quản lý xem xét
                  </div>
                </div>
              </div>
            )}

            {detail.reviewed_by && (
              <div className="att-dm-info att-dm-info--green">
                <div className="att-dm-info__icon">
                  <GIcon name="verified" />
                </div>
                <div className="att-dm-info__body">
                  <div className="att-dm-info__title">
                    Đã xem xét bởi {detail.reviewed_by}
                  </div>
                  {detail.reviewed_at && (
                    <div className="att-dm-info__sub">
                      {formatDateFull(detail.reviewed_at)}{" "}
                      {formatTimeVN(detail.reviewed_at)}
                    </div>
                  )}
                  {detail.manager_note && (
                    <div
                      className="att-dm-info__sub"
                      style={{ marginTop: 4, fontStyle: "italic" }}
                    >
                      &ldquo;{detail.manager_note}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

/* =====================================================================
   MAIN PAGE
   ===================================================================== */
export default function AttendanceHistory() {
  const { isAuthenticated } = useAuthStore();
  const [month, setMonth] = useState(dayjs());
  const [statusFilter, setStatusFilter] = useState("");
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_records: 0,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchHistory = useCallback(
    async (params = {}) => {
      setLoading(true);
      try {
        const query = {
          month: params.month || month.format("YYYY-MM"),
          page: params.page || page,
          limit: 20,
        };
        if (params.status !== undefined ? params.status : statusFilter) {
          query.status =
            params.status !== undefined ? params.status : statusFilter;
        }
        const res = await getHistory(query);
        setRecords(res?.data?.records || []);
        setSummary(res?.data?.summary || null);
        setPagination(
          res?.data?.pagination || {
            current_page: 1,
            total_pages: 1,
            total_records: 0,
            limit: 20,
          },
        );
      } catch (err) {
        if (err?.response?.status === 401) {
          window.location.href = "/login";
          return;
        }
        antdMessage.error(
          err?.response?.data?.message || "Không thể tải lịch sử chấm công",
        );
        setRecords([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    },
    [month, page, statusFilter],
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchHistory();
  }, [fetchHistory, isAuthenticated]);

  const handleMonthPick = (val) => {
    if (!val) return;
    setMonth(val);
    setPage(1);
    fetchHistory({ month: val.format("YYYY-MM"), page: 1 });
  };

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setPage(1);
    fetchHistory({ status: val, page: 1 });
  };

  const handlePageChange = (p) => {
    setPage(p);
    fetchHistory({ page: p });
  };

  const openDetail = async (record) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await getAttendanceDetail(record.id);
      setDetailData(res?.data || null);
    } catch (err) {
      antdMessage.error(
        err?.response?.data?.message || "Không thể tải chi tiết",
      );
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      width: 80,
      render: (v) => formatDateVN(v),
    },
    {
      title: "Ca",
      dataIndex: "shift",
      key: "shift",
      width: 130,
      render: (shift) => (
        <div>
          <div style={{ fontWeight: 500 }}>{shift?.name || "—"}</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            {shift?.start_time} - {shift?.end_time}
          </div>
        </div>
      ),
    },
    {
      title: "Check-in",
      dataIndex: "check_in_time",
      key: "check_in",
      width: 80,
      render: (v) => formatTimeVN(v),
    },
    {
      title: "Check-out",
      dataIndex: "check_out_time",
      key: "check_out",
      width: 80,
      render: (v) => formatTimeVN(v),
    },
    {
      title: "Giờ làm",
      dataIndex: "formatted_work_time",
      key: "work_time",
      width: 80,
      render: (v, r) => v || `${r.actual_work_minutes || 0}m`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <StatusBadge status={status} />
          {record.late_minutes > 0 && (
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              {record.late_minutes}p
            </span>
          )}
        </div>
      ),
    },
    {
      title: "",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<GIcon name="visibility" />}
          onClick={(e) => {
            e.stopPropagation();
            openDetail(record);
          }}
          className="att-view-btn"
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="att-page">
      <div className="att-page-header">
        <div className="att-page-title">Lịch sử chấm công</div>
      </div>

      {/* Filters bar: DatePicker + Status */}
      <div className="att-filters">
        <DatePicker
          picker="month"
          value={month}
          onChange={handleMonthPick}
          format="MM/YYYY"
          allowClear={false}
          style={{ width: 160 }}
          placeholder="Chọn tháng"
        />
        <Select
          value={statusFilter}
          onChange={handleStatusChange}
          options={STATUS_OPTIONS}
          style={{ width: 200 }}
          placeholder="Trạng thái"
        />
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="att-stats-grid">
          <StatCard
            icon="calendar_month"
            label="Tổng ca"
            value={summary.total_shifts || 0}
            colorClass="blue"
          />
          <StatCard
            icon="check_circle"
            label="Đúng giờ"
            value={summary.on_time || 0}
            colorClass="green"
          />
          <StatCard
            icon="schedule"
            label="Trễ"
            value={summary.late || 0}
            colorClass="amber"
          />
          <StatCard
            icon="timer"
            label="Tổng giờ"
            value={`${summary.total_hours || 0}h`}
            colorClass="purple"
          />
        </div>
      )}

      {/* Desktop table */}
      <div className="att-history-table">
        <Table
          columns={columns}
          dataSource={records}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.current_page,
            total: pagination.total_records,
            pageSize: pagination.limit,
            showSizeChanger: false,
            onChange: handlePageChange,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`,
          }}
          locale={{
            emptyText: (
              <div className="att-empty" style={{ padding: 40 }}>
                <div className="att-empty__icon">
                  <GIcon name="search_off" />
                </div>
                <div className="att-empty__text">
                  {statusFilter
                    ? "Không tìm thấy bản ghi phù hợp. Thử thay đổi bộ lọc."
                    : "Chưa có dữ liệu chấm công trong khoảng thời gian này"}
                </div>
              </div>
            ),
          }}
        />
      </div>

      {/* Mobile card list */}
      <div className="att-mobile-list">
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
          </div>
        ) : records.length === 0 ? (
          <div className="att-empty">
            <div className="att-empty__icon">
              <GIcon name="search_off" />
            </div>
            <div className="att-empty__text">
              {statusFilter
                ? "Không tìm thấy bản ghi phù hợp. Thử thay đổi bộ lọc."
                : "Chưa có dữ liệu chấm công trong khoảng thời gian này"}
            </div>
          </div>
        ) : (
          records.map((record) => (
            <div
              key={record.id}
              className="att-mobile-card"
              onClick={() => openDetail(record)}
            >
              <div className="att-mobile-card__header">
                <div>
                  <div className="att-mobile-card__title">
                    {formatDateFull(record.date)} - {record.shift?.name}
                  </div>
                  <div className="att-mobile-card__date">
                    {record.shift?.start_time} - {record.shift?.end_time}
                  </div>
                </div>
                <StatusBadge status={record.status} />
              </div>
              <div className="att-mobile-card__body">
                <span>
                  In: {formatTimeVN(record.check_in_time)} &nbsp; Out:{" "}
                  {formatTimeVN(record.check_out_time)}
                </span>
              </div>
              <div className="att-mobile-card__footer">
                <span className="att-mobile-card__work-time">
                  Tổng:{" "}
                  {record.formatted_work_time ||
                    `${record.actual_work_minutes || 0}m`}
                </span>
                <button
                  className="att-mobile-view-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetail(record);
                  }}
                >
                  <GIcon name="visibility" /> Xem chi tiết
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail modal */}
      <DetailModal
        detail={detailData}
        loading={detailLoading}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailData(null);
        }}
      />
    </div>
  );
}
