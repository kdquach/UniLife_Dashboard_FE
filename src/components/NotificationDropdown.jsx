import { useMemo, useState } from "react";
import { Dropdown, Empty } from "antd";
import dayjs from "dayjs";
import GIcon from "@/components/GIcon";

function NotificationButton({ badge }) {
  return (
    <button
      type="button"
      aria-label="Notifications"
      className="nd-trigger"
    >
      <GIcon name="notifications" />

      {badge > 0 && (
        <span className="nd-badge">{badge > 99 ? "99+" : badge}</span>
      )}
    </button>
  );
}

function getTypeConfig(type) {
  switch (type) {
    case "promotion":
      return { icon: "local_offer", className: "nd-icon-promotion" };
    case "order":
      return { icon: "receipt_long", className: "nd-icon-order" };
    case "shift":
      return { icon: "event", className: "nd-icon-shift" };
    case "salary":
      return { icon: "payments", className: "nd-icon-salary" };
    case "feedback":
      return { icon: "chat_bubble", className: "nd-icon-feedback" };
    case "system":
    default:
      return { icon: "campaign", className: "nd-icon-system" };
  }
}

function NotificationItem({ item, isExpanded, onClick }) {
  const config = getTypeConfig(item.type);
  const actorText = item.actor || item.title || "Thông báo";
  const actionText = item.content || "";

  return (
    <div className="nd-item-wrap">
      <button
        type="button"
        onClick={onClick}
        className={`nd-item ${item.isRead ? "nd-read" : "nd-unread"}`}
      >
        <div className={`nd-item-icon ${config.className}`}>
          <GIcon name={config.icon} />
        </div>

        <div className="nd-item-body">
          <p className="nd-item-text">
            <span className="nd-item-title">{actorText}</span>
            {actionText ? ` ${actionText}` : ""}
          </p>
          <div className="nd-item-time">{item.time}</div>
        </div>

        {!item.isRead && <span className="nd-dot" />}
      </button>

      {isExpanded && (
        <div className="nd-detail">
          <div>{item.content || "(Không có nội dung)"}</div>
        </div>
      )}
    </div>
  );
}

export default function NotificationDropdown({
  notifications = [],
  badge,
  onItemClick,
  onMarkAllRead,
  onLoadMore,
  hasMore,
  loadingMore,
  onViewAll,
  open,
  onOpenChange,
  expandedId,
  loadingAll,
}) {
  const badgeCount = typeof badge === "number" ? badge : notifications.length;
  const [activeTab, setActiveTab] = useState("all");

  const filteredNotifications = useMemo(() => {
    if (activeTab === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [activeTab, notifications]);

  const groupedNotifications = useMemo(() => {
    const groups = {
      recent: [],
      earlier: [],
    };

    const now = dayjs();
    filteredNotifications.forEach((item) => {
      const createdAt = item.createdAt ? dayjs(item.createdAt) : null;
      const isRecent = createdAt ? now.diff(createdAt, "hour") < 24 : false;
      if (isRecent) groups.recent.push(item);
      else groups.earlier.push(item);
    });

    return groups;
  }, [filteredNotifications]);

  const hasItems = filteredNotifications.length > 0;
  const viewAllLabel = loadingAll ? "Đang tải..." : "Xem tất cả";

  const renderGroup = (label, items) => {
    if (!items.length) return null;

    return (
      <div className="nd-group">
        <span className="nd-group-label">{label}</span>
        <div className="nd-group-list">
          {items.map((item) => (
            <NotificationItem
              key={item.id}
              item={item}
              isExpanded={expandedId === item.id}
              onClick={() => onItemClick?.(item)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      open={open}
      onOpenChange={onOpenChange}
      popupRender={() => (
        <div className="nd-panel">
          <div className="nd-header">
            <p className="nd-header-title">Thông báo</p>
            <button type="button" onClick={onViewAll} className="nd-link-btn">
              {viewAllLabel}
            </button>
          </div>

          <div className="nd-tabs">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`nd-tab ${activeTab === "all" ? "active" : ""}`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`nd-tab ${activeTab === "unread" ? "active" : ""}`}
            >
              Chưa đọc
            </button>

            <button type="button" onClick={onMarkAllRead} className="nd-markall-btn">
              Đánh dấu tất cả đã đọc
            </button>
          </div>

          <div className="nd-body">
            {!hasItems && (
              <div className="nd-empty-wrap">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có thông báo" />
              </div>
            )}

            {renderGroup("Mới", groupedNotifications.recent)}
            {renderGroup("Trước đó", groupedNotifications.earlier)}

            {hasMore && (
              <div className="nd-more-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (!loadingMore) onLoadMore?.();
                  }}
                  className="nd-more-btn"
                >
                  {loadingMore ? "Đang tải..." : "Xem thêm"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    >
      <span className="inline-flex">
        <NotificationButton badge={badgeCount} />
      </span>
    </Dropdown>
  );
}
