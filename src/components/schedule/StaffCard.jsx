import { Tooltip } from "antd";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export default function StaffCard({
  cardId,
  staff,
  draggable,
  dragData,
  showAvatar = true,
  hideAccent = false,
  removable = false,
  onRemove,
  onClick,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: cardId,
    disabled: !draggable,
    data: dragData,
  });

  const style = {
    transform: isDragging 
      ? `${CSS.Translate.toString(transform)} scale(1.08)` 
      : CSS.Translate.toString(transform),
    opacity: isDragging ? 0.95 : 1,
    boxShadow: isDragging ? "0 10px 24px rgba(15, 23, 42, 0.16)" : "0 1px 2px rgba(15, 23, 42, 0.06)",
    backgroundColor: isDragging ? "var(--primary-soft)" : "#ffffff",
    zIndex: isDragging ? 1000 : 10,
  };

  const initials = String(staff?.name || "S")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join("");

  const normalizedStatus = String(staff?.status || "").toLowerCase();
  const showStatusBadge = Boolean(normalizedStatus);
  const statusAccentMap = {
    scheduled: "#64748b",
    checked_in: "#16a34a",
    checked_out: "#2563eb",
    absent: "#ef4444",
    draft: "#fb923c",
    assigned: "#94a3b8",
  };
  const statusLabelMap = {
    assigned: "đã phân công",
    scheduled: "xếp lịch",
    draft: "nháp",
    checked_in: "đã vào ca",
    checked_out: "đã kết thúc",
    absent: "vắng mặt",
  };
  const statusLabel = statusLabelMap[normalizedStatus] || normalizedStatus;
  const accentColor = statusAccentMap[normalizedStatus] || staff.shiftColor || "var(--primary)";

  return (
    <Tooltip title={staff.name}>
      <div
        ref={setNodeRef}
        className={`staff-card ${draggable ? "is-draggable" : ""}`}
        style={style}
        onClick={onClick}
        role="button"
        tabIndex={0}
        {...(draggable ? attributes : {})}
        {...(draggable ? listeners : {})}
      >
        {!hideAccent && (
          <span
            style={{ backgroundColor: accentColor }}
            className="staff-card-accent"
          />
        )}
        {showAvatar && <span className="staff-card-avatar">{initials || "S"}</span>}
        <div className="staff-card-content">
          <div className="staff-card-top">
            <span className="staff-card-name">{staff.name}</span>

            {removable && (
              <button
                type="button"
                className="staff-card-remove"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove?.();
                }}
              >
                ×
              </button>
            )}
          </div>

          <div className="staff-card-bottom">
            {showStatusBadge && (
              <span className={`staff-status-badge status-${normalizedStatus}`}>
                {statusLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </Tooltip>
  );
}
