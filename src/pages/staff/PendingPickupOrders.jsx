import { useCallback, useEffect, useMemo, useState } from "react";
import { message as antdMessage, Modal, Pagination } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { QRCodeSVG } from "qrcode.react";
import GIcon from "@/components/GIcon";
import {
  getOrders,
  getOrderDetail,
  updateOrderStatus,
  completeOrderById,
} from "@/services/order.service";
import { useSocket } from "@/hooks/useSocket";
import "@/styles/canteenOrders.css";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const TABS = [
  {
    key: "pending",
    label: "Chờ xác nhận",
    icon: "pending_actions",
    sort: "-createdAt",
  },
  {
    key: "confirmed",
    label: "Đã xác nhận",
    icon: "check_circle",
    sort: "-createdAt",
  },
  {
    key: "preparing",
    label: "Đang chuẩn bị",
    icon: "restaurant",
    sort: "-createdAt",
  },
  {
    key: "ready",
    label: "Đã chuẩn bị",
    icon: "hourglass_top",
    sort: "preparedAt",
  },
  {
    key: "completed",
    label: "Chờ nhận",
    icon: "qr_code",
    sort: "-completedAt",
  },
  {
    key: "received",
    label: "Đã nhận",
    icon: "task_alt",
    sort: "-receivedAt",
  },
  {
    key: "cancelled",
    label: "Đã hủy",
    icon: "cancel",
    sort: "-cancelledAt",
  },
];

const STATUS_LABEL = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
  ready: "Đã chuẩn bị",
  completed: "Chờ nhận",
  received: "Đã nhận",
  cancelled: "Đã hủy",
};

function formatVND(amount) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

function formatPaymentMethod(method) {
  const map = {
    cash: "Tiền mặt",
    momo: "MoMo",
    vnpay: "VNPay",
    sepay: "SePay",
    balance: "Số dư",
    bank_transfer: "Chuyển khoản",
  };
  return map[method] || method;
}

function timeAgo(date) {
  if (!date) return "";
  return dayjs(date).fromNow();
}

function summarizeItems(items) {
  if (!items?.length) return "—";
  return items.map((i) => `${i.productName} x${i.quantity}`).join(", ");
}

/** Get customer display name — handles fullName, name, or email fallback */
function getCustomerName(user) {
  if (!user) return "Khách hàng";
  return user.fullName || user.name || user.email || "Khách hàng";
}

export default function PendingPickupOrders() {
  const [activeTab, setActiveTab] = useState("pending");
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalResults: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [detailModal, setDetailModal] = useState({
    open: false,
    order: null,
  });

  const currentTab = useMemo(
    () => TABS.find((t) => t.key === activeTab),
    [activeTab],
  );

  // Fetch orders
  const fetchOrders = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          status: activeTab,
          sort: currentTab?.sort || "-createdAt",
          page,
          limit: 20,
        };
        if (search.trim()) params.search = search.trim();
        const res = await getOrders(params);
        setOrders(res?.data || []);
        setPagination(
          res?.pagination || { page: 1, limit: 20, totalResults: 0 },
        );
      } catch (err) {
        if (err?.response?.status === 401) {
          window.location.href = "/login";
          return;
        }
        antdMessage.error(
          err?.response?.data?.message || "Không thể tải danh sách đơn hàng",
        );
        setOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, currentTab?.sort, search],
  );

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  // WebSocket real-time updates
  const handleOrderStatusChanged = useCallback(
    (orderUpdate) => {
      if (!orderUpdate) return;
      const { _id, status, previousStatus } = orderUpdate;

      // If an order just became "ready" and we're on the ready tab, add it
      if (status === "ready" && activeTab === "ready") {
        fetchOrders(pagination.page);
        return;
      }

      // If order left the current tab status, remove it
      if (previousStatus === activeTab && status !== activeTab) {
        setOrders((prev) => prev.filter((o) => o._id !== _id));
        setPagination((prev) => ({
          ...prev,
          totalResults: Math.max(0, prev.totalResults - 1),
        }));
      }

      // If order entered the current tab status, refresh
      if (status === activeTab && previousStatus !== activeTab) {
        fetchOrders(pagination.page);
      }
    },
    [activeTab, fetchOrders, pagination.page],
  );

  const { isConnected } = useSocket(handleOrderStatusChanged);

  const applyUpdatedOrderToState = useCallback(
    (updatedOrder) => {
      if (!updatedOrder?._id) return;

      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)),
      );

      setDetailModal((prev) => {
        if (!prev?.open || !prev?.order?._id) return prev;
        if (prev.order._id !== updatedOrder._id) return prev;
        return { ...prev, order: updatedOrder };
      });
    },
    [setOrders, setDetailModal],
  );

  const handleChangeStatus = useCallback(
    async (order, nextStatus) => {
      if (!order?._id || !nextStatus) return;

      const executeUpdate = async () => {
        // Avoid double submit
        if (statusUpdating) return;
        setStatusUpdating(true);

        try {
          let res;
          if (nextStatus === "completed") {
            // Prefer the dedicated complete endpoint to record scannedBy/scannedAt
            res = await completeOrderById(order._id);
          } else {
            res = await updateOrderStatus(order._id, nextStatus);
          }

          const updatedOrder = res?.data?.order || res?.data || null;
          if (!updatedOrder?._id) {
            antdMessage.success("Cập nhật trạng thái thành công");
          } else {
            applyUpdatedOrderToState(updatedOrder);
            antdMessage.success(
              `Đã chuyển trạng thái sang "${STATUS_LABEL[updatedOrder.status] || updatedOrder.status}"`,
            );

            // If order leaves current tab, refresh list + close modal
            if (updatedOrder.status !== activeTab) {
              setDetailModal({ open: false, order: null, loading: false });
              fetchOrders(pagination.page);
            }
          }
        } catch (err) {
          antdMessage.error(
            err?.response?.data?.message || "Không thể cập nhật trạng thái đơn",
          );
        } finally {
          setStatusUpdating(false);
        }
      };

      if (nextStatus === "cancelled") {
        Modal.confirm({
          title: "Xác nhận hủy đơn hàng",
          content: `Bạn có chắc chắn muốn hủy đơn hàng #${order.orderNumber}?`,
          okText: "Xác nhận hủy",
          okType: "danger",
          cancelText: "Quay lại",
          centered: true,
          onOk: executeUpdate,
        });
      } else {
        await executeUpdate();
      }
    },
    [
      activeTab,
      applyUpdatedOrderToState,
      fetchOrders,
      pagination.page,
      statusUpdating,
    ],
  );

  // Open detail modal
  const openDetail = async (orderId) => {
    // Find base order from list to preserve fields missing in detail API (like userId.fullName)
    const baseOrder = orders.find((o) => o._id === orderId);
    setDetailModal({ open: true, order: baseOrder || null, loading: true });
    try {
      const res = await getOrderDetail(orderId);
      const fetchedOrder = res?.data?.order;

      // Workaround for Backend Bug: Detail API doesn't populate fullName, so we merge it
      if (fetchedOrder && baseOrder) {
        if (!fetchedOrder.userId?.fullName && baseOrder.userId?.fullName) {
          fetchedOrder.userId = {
            ...fetchedOrder.userId,
            fullName: baseOrder.userId.fullName,
          };
        }
      }

      setDetailModal({
        open: true,
        order: fetchedOrder || baseOrder || null,
        loading: false,
      });
    } catch {
      antdMessage.error("Không thể tải chi tiết đơn hàng");
      setDetailModal({ open: false, order: null, loading: false });
    }
  };

  // Search on Enter
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      setSearch(searchValue);
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearch("");
    setSearchValue("");
  };

  return (
    <div className="co-page">
      {/* Header */}
      <div className="co-page-header">
        <div>
          <div className="co-page-title">
            <GIcon name="receipt_long" />
            Đơn chờ nhận hàng
          </div>
          <div className="co-page-subtitle">
            <span
              className={`co-ws-dot ${isConnected ? "co-ws-dot--on" : "co-ws-dot--off"}`}
              title={isConnected ? "Đang kết nối real-time" : "Chưa kết nối"}
            />{" "}
            {isConnected ? "Đang cập nhật real-time" : "Đang kết nối..."}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="co-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`co-tab ${activeTab === tab.key ? "co-tab--active" : ""}`}
            onClick={() => handleTabChange(tab.key)}
          >
            <GIcon name={tab.icon} />
            {tab.label}
            {tab.key === "ready" &&
              pagination.totalResults > 0 &&
              activeTab === "ready" && (
                <span className="co-tab__count">{pagination.totalResults}</span>
              )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="co-toolbar">
        <div className="co-search">
          <span className="co-search__icon">
            <GIcon name="search" />
          </span>
          <input
            className="co-search__input"
            placeholder="Tìm kiếm theo mã đơn..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        <button
          className="co-refresh-btn"
          onClick={() => fetchOrders(pagination.page)}
        >
          <GIcon name="refresh" />
          Làm mới
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="co-empty">
          <div className="co-empty__icon">
            <GIcon name="hourglass_empty" />
          </div>
          <div className="co-empty__text">Đang tải...</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="co-empty">
          <div className="co-empty__icon">
            <GIcon name="inbox" />
          </div>
          <div className="co-empty__text">
            {search
              ? `Không tìm thấy đơn hàng "${search}"`
              : `Không có đơn hàng nào`}
          </div>
          <div className="co-empty__sub">
            {activeTab === "ready" && "Đơn hàng sẵn sàng sẽ xuất hiện ở đây"}
          </div>
        </div>
      ) : (
        <>
          <div className="co-orders-grid">
            {orders.map((order) => (
              <div
                key={order._id}
                className={`co-card co-card--${order.status}`}
                onClick={() => openDetail(order._id)}
              >
                <div className="co-card__header">
                  <span className="co-card__order-num">
                    #{order.orderNumber}
                  </span>
                  <span className={`co-badge co-badge--${order.status}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>

                <div className="co-card__customer">
                  <GIcon name="person" />
                  {getCustomerName(order.userId)}
                </div>

                <div className="co-card__items">
                  {summarizeItems(order.items)}
                </div>

                <div className="co-card__footer">
                  <span className="co-card__amount">
                    {formatVND(order.totalAmount)}
                  </span>
                  <span className="co-card__time">
                    <GIcon name="schedule" />
                    {timeAgo(order.preparedAt || order.createdAt)}
                  </span>
                </div>

                {(order.status === "ready" || order.status === "pending" || order.status === "confirmed") && (
                  <div className="co-card__actions" style={{ justifyContent: "flex-end" }}>
                    {(order.status === "pending" || order.status === "confirmed") && (
                      <button
                        className="co-btn-danger"
                        disabled={statusUpdating}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChangeStatus(order, "cancelled");
                        }}
                      >
                        <GIcon name="cancel" />
                        Hủy đơn
                      </button>
                    )}
                    <button
                      className="co-btn-outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetail(order._id);
                      }}
                    >
                      <GIcon name="visibility" />
                      Chi tiết
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalResults > pagination.limit && (
            <div className="co-pagination">
              <Pagination
                current={pagination.page}
                pageSize={pagination.limit}
                total={pagination.totalResults}
                onChange={(page) => fetchOrders(page)}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal
        open={detailModal.open}
        onCancel={() =>
          setDetailModal({ open: false, order: null, loading: false })
        }
        footer={null}
        closable={false}
        width={520}
        className="co-detail-modal"
        destroyOnHidden
      >
        {detailModal.loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <span
              className="co-spinner co-spinner--dark"
              style={{ width: 28, height: 28 }}
            />
            <div style={{ marginTop: 12, color: "#6b7280" }}>Đang tải...</div>
          </div>
        ) : detailModal.order ? (
          <OrderDetail
            order={detailModal.order}
            onClose={() =>
              setDetailModal({ open: false, order: null, loading: false })
            }
          />
        ) : null}
      </Modal>
    </div>
  );
}

/* ======================================
   Order Detail Component (Modal body)
   ====================================== */
function OrderDetail({ order, onClose }) {
  const heroClass =
    order.status === "completed"
      ? "co-dm-hero--completed"
      : order.status === "received"
        ? "co-dm-hero--received"
        : order.status === "cancelled"
          ? "co-dm-hero--cancelled"
          : "";

  const iconClass =
    order.status === "completed"
      ? "co-dm-hero__icon--completed"
      : order.status === "received"
        ? "co-dm-hero__icon--received"
        : order.status === "cancelled"
          ? "co-dm-hero__icon--cancelled"
          : "co-dm-hero__icon--ready";

  const iconName =
    order.status === "received"
      ? "task_alt"
      : order.status === "completed"
        ? "qr_code"
        : order.status === "cancelled"
          ? "cancel"
          : "pending_actions";

  return (
    <div className="co-dm">
      <button className="co-dm-close" onClick={onClose}>
        <GIcon name="close" />
      </button>

      {/* Hero */}
      <div className={`co-dm-hero ${heroClass}`}>
        <div className={`co-dm-hero__icon ${iconClass}`}>
          <GIcon name={iconName} />
        </div>
        <div className="co-dm-hero__content">
          <div className="co-dm-hero__order-num">#{order.orderNumber}</div>
          <span className={`co-badge co-badge--${order.status}`}>
            {STATUS_LABEL[order.status]}
          </span>
          <div className="co-dm-hero__date">
            {dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="co-dm-section">
        <div className="co-dm-section__title">Thông tin khách hàng</div>
        <div className="co-dm-info-row">
          <span className="co-dm-info-row__label">Họ tên</span>
          <span className="co-dm-info-row__value">
            {getCustomerName(order.userId)}
          </span>
        </div>
        <div className="co-dm-info-row">
          <span className="co-dm-info-row__label">Email</span>
          <span className="co-dm-info-row__value">
            {order.userId?.email || "—"}
          </span>
        </div>
        {order.userId?.phone && (
          <div className="co-dm-info-row">
            <span className="co-dm-info-row__label">SĐT</span>
            <span className="co-dm-info-row__value">{order.userId.phone}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="co-dm-section">
        <div className="co-dm-section__title">Danh sách món</div>
        {order.items?.map((item, i) => (
          <div key={i} className="co-dm-item">
            <div>
              <span className="co-dm-item__name">{item.productName}</span>
              <span className="co-dm-item__qty">x{item.quantity}</span>
            </div>
            <span className="co-dm-item__price">
              {formatVND(item.price * item.quantity)}
            </span>
          </div>
        ))}
        {order.note && (
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginTop: 8,
              fontStyle: "italic",
            }}
          >
            📝 {order.note}
          </div>
        )}
      </div>

      {/* Payment */}
      <div className="co-dm-section">
        <div className="co-dm-section__title">Thanh toán</div>
        <div className="co-dm-info-row">
          <span className="co-dm-info-row__label">Phương thức</span>
          <span className="co-dm-info-row__value">
            {formatPaymentMethod(order.payment?.method)}
          </span>
        </div>
        <div className="co-dm-info-row">
          <span className="co-dm-info-row__label">Trạng thái</span>
          <span className="co-dm-info-row__value">
            {order.payment?.status === "completed"
              ? "✅ Đã thanh toán"
              : order.payment?.status}
          </span>
        </div>
      </div>



      {/* Timestamps */}
      <div className="co-dm-section">
        <div className="co-dm-section__title">Thời gian</div>
        <div className="co-dm-info-row">
          <span className="co-dm-info-row__label">Tạo đơn</span>
          <span className="co-dm-info-row__value">
            {dayjs(order.createdAt).format("HH:mm DD/MM/YYYY")}
          </span>
        </div>
        {order.preparedAt && (
          <div className="co-dm-info-row">
            <span className="co-dm-info-row__label">Chuẩn bị xong</span>
            <span className="co-dm-info-row__value">
              {dayjs(order.preparedAt).format("HH:mm DD/MM/YYYY")}
            </span>
          </div>
        )}
        {order.completedAt && (
          <div className="co-dm-info-row">
            <span className="co-dm-info-row__label">Hoàn thành</span>
            <span className="co-dm-info-row__value">
              {dayjs(order.completedAt).format("HH:mm DD/MM/YYYY")}
            </span>
          </div>
        )}
        {order.receivedAt && (
          <div className="co-dm-info-row">
            <span className="co-dm-info-row__label">Đã nhận lúc</span>
            <span className="co-dm-info-row__value">
              {dayjs(order.receivedAt).format("HH:mm DD/MM/YYYY")}
            </span>
          </div>
        )}
        {order.cancelledAt && (
          <div className="co-dm-info-row">
            <span className="co-dm-info-row__label">Hủy lúc</span>
            <span
              className="co-dm-info-row__value"
              style={{ color: "#dc2626" }}
            >
              {dayjs(order.cancelledAt).format("HH:mm DD/MM/YYYY")}
            </span>
          </div>
        )}
      </div>

      {/* QR Code */}
      {order.pickupQRCode?.code && (
        <div className="co-dm-section">
          <div className="co-dm-section__title">Mã QR nhận hàng</div>
          <div className="co-qr-display">
            <div className="co-qr-display__code">
              <QRCodeSVG
                value={order.pickupQRCode.code}
                size={180}
                level="M"
                includeMargin
                style={{ borderRadius: 8 }}
              />
            </div>
            <div className="co-qr-display__info">
              <div className="co-dm-info-row">
                <span className="co-dm-info-row__label">Hết hạn</span>
                <span className="co-dm-info-row__value">
                  {order.pickupQRCode.expireAt
                    ? dayjs(order.pickupQRCode.expireAt).format(
                      "HH:mm DD/MM/YYYY",
                    )
                    : "—"}
                </span>
              </div>
              {order.pickupQRCode.scannedBy && (
                <div className="co-dm-info-row">
                  <span className="co-dm-info-row__label">Đã quét bởi</span>
                  <span className="co-dm-info-row__value">Staff</span>
                </div>
              )}
              {order.pickupQRCode.scannedAt && (
                <div className="co-dm-info-row">
                  <span className="co-dm-info-row__label">Quét lúc</span>
                  <span className="co-dm-info-row__value">
                    {dayjs(order.pickupQRCode.scannedAt).format(
                      "HH:mm DD/MM/YYYY",
                    )}
                  </span>
                </div>
              )}
              {!order.pickupQRCode.scannedAt && order.status === "ready" && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#16a34a",
                    marginTop: 6,
                    fontWeight: 500,
                  }}
                >
                  ✅ QR đang hoạt động — chờ sinh viên đến nhận
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Total */}
      <div className="co-dm-total">
        <span>Tổng cộng</span>
        <span>{formatVND(order.totalAmount)}</span>
      </div>
    </div>
  );
}
