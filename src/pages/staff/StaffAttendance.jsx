import { useCallback, useEffect, useMemo, useState } from "react";
import { message as antdMessage, Modal, Input } from "antd";
import dayjs from "dayjs";
import GIcon from "@/components/GIcon";
import { getMyShifts, checkIn, checkOut } from "@/services/attendance.service";
import { useAuthStore } from "@/store/useAuthStore";
import "@/styles/attendance.css";

const STATUS_MAP = {
  on_time: { label: "Đúng giờ", css: "on_time" },
  late: { label: "Trễ", css: "late" },
  critical_late: { label: "Trễ nghiêm trọng", css: "critical_late" },
  early_leave: { label: "Về sớm", css: "early_leave" },
  overtime: { label: "Overtime", css: "overtime" },
  missing_checkout: { label: "Thiếu check-out", css: "missing_checkout" },
};

function StatusBadge({ status }) {
  const info = STATUS_MAP[status];
  if (!info) return null;
  return (
    <span className={`att-badge att-badge--${info.css}`}>{info.label}</span>
  );
}

function formatTimeVN(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function WorkTimer({ checkInTime }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!checkInTime) return;
    const calc = () =>
      Math.max(
        0,
        Math.floor((Date.now() - new Date(checkInTime).getTime()) / 1000),
      );
    const timer = setInterval(() => setElapsed(calc()), 1000);
    return () => clearInterval(timer);
  }, [checkInTime]);

  return (
    <div>
      <div className="att-timer-label">Đang làm việc</div>
      <div className="att-timer att-timer-active">{formatElapsed(elapsed)}</div>
    </div>
  );
}

function getCardState(shift) {
  if (shift.can_checkin && !shift.attendance) return "ready";
  if (shift.can_checkout && shift.attendance) return "working";
  if (shift.attendance) return "done";
  return "upcoming";
}

function getStatusColor(status) {
  const colorMap = {
    on_time: "#22c55e",
    late: "#f59e0b",
    critical_late: "#ef4444",
    early_leave: "#f97316",
    overtime: "#8b5cf6",
    missing_checkout: "#6b7280",
  };
  return colorMap[status] || "#22c55e";
}

/** Check if "now" is before shift end minus 5 minutes (early leave scenario) */
function isEarlyLeave(shiftEndTime) {
  if (!shiftEndTime) return false;
  const today = dayjs().format("YYYY-MM-DD");
  const endMoment = dayjs(`${today} ${shiftEndTime}`, "YYYY-MM-DD HH:mm");
  return dayjs().isBefore(endMoment.subtract(5, "minute"));
}

export default function StaffAttendance() {
  const { isAuthenticated } = useAuthStore();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [warning, setWarning] = useState(null);

  // Early leave modal
  const [earlyLeaveModal, setEarlyLeaveModal] = useState(false);
  const [earlyLeaveShiftId, setEarlyLeaveShiftId] = useState(null);
  const [earlyLeaveReason, setEarlyLeaveReason] = useState("");

  const todayLabel = useMemo(() => {
    return dayjs().format("dddd, DD/MM/YYYY");
  }, []);

  const fetchShifts = useCallback(async () => {
    try {
      const res = await getMyShifts();
      setShifts(res?.data?.shifts || []);
    } catch (err) {
      if (err?.response?.status === 401) {
        window.location.href = "/login";
        return;
      }
      antdMessage.error(
        err?.response?.data?.message || "Không thể tải ca làm việc",
      );
      setShifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + 60s polling
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchShifts();
    const interval = setInterval(fetchShifts, 60000);
    return () => clearInterval(interval);
  }, [fetchShifts, isAuthenticated]);

  const handleCheckin = async (shiftId) => {
    setActionLoading(shiftId);
    try {
      const res = await checkIn(shiftId);
      antdMessage.success(res?.message || "Check-in thành công!");
      if (res?.warning) {
        setWarning(res.warning);
      }
      await fetchShifts();
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "Check-in thất bại";
      if (status === 409) {
        antdMessage.info("Vui lòng thử lại");
        await fetchShifts();
      } else {
        antdMessage.warning(msg);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckoutClick = (shift) => {
    if (isEarlyLeave(shift.end_time)) {
      setEarlyLeaveShiftId(shift.shift_id);
      setEarlyLeaveReason("");
      setEarlyLeaveModal(true);
    } else {
      doCheckout(shift.shift_id, null);
    }
  };

  const doCheckout = async (shiftId, reason) => {
    setActionLoading(shiftId);
    setEarlyLeaveModal(false);
    try {
      const res = await checkOut(shiftId, reason);
      antdMessage.success(res?.message || "Check-out thành công!");
      await fetchShifts();
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "Check-out thất bại";
      if (status === 409) {
        antdMessage.info("Vui lòng thử lại");
        await fetchShifts();
      } else {
        antdMessage.warning(msg);
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="att-page">
        <div className="att-page-header">
          <div className="att-page-title">Chấm công hôm nay</div>
        </div>
        <div className="att-empty">
          <div className="att-empty__icon">
            <GIcon name="hourglass_empty" />
          </div>
          <div className="att-empty__text">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="att-page">
      <div className="att-page-header">
        <div className="att-page-title">Chấm công hôm nay</div>
        <div className="att-page-date">{todayLabel}</div>
      </div>

      {/* Warning bar */}
      {warning && (
        <div className="att-warning-bar">
          <GIcon name="warning" />
          <span>{warning}</span>
          <button
            onClick={() => setWarning(null)}
            style={{
              marginLeft: "auto",
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#92400e",
            }}
          >
            <GIcon name="close" />
          </button>
        </div>
      )}

      {shifts.length === 0 ? (
        <div className="att-empty">
          <div className="att-empty__icon">
            <GIcon name="event_busy" />
          </div>
          <div className="att-empty__text">
            Bạn không có ca làm việc hôm nay
          </div>
        </div>
      ) : (
        <div className="att-shifts-grid">
          {shifts.map((shift) => {
            const state = getCardState(shift);
            const isLoading = actionLoading === shift.shift_id;

            return (
              <div
                key={shift.shift_id}
                className={`att-card att-card--${state}`}
                style={
                  state === "done"
                    ? {
                        "--att-status-color": getStatusColor(
                          shift.attendance?.status,
                        ),
                      }
                    : undefined
                }
              >
                <div className="att-card__header">
                  <div>
                    <div className="att-card__title">{shift.shift_name}</div>
                    <div className="att-card__time">
                      {shift.start_time} - {shift.end_time}
                    </div>
                    <div className="att-card__canteen">
                      <GIcon name="storefront" />
                      {shift.canteen?.name || "—"}
                    </div>
                  </div>
                  <div>
                    {state === "upcoming" && (
                      <span className="att-badge att-badge--upcoming">
                        Sắp tới
                      </span>
                    )}
                    {state === "working" && (
                      <span className="att-badge att-badge--working">
                        Đang làm
                      </span>
                    )}
                    {state === "done" && shift.attendance && (
                      <StatusBadge status={shift.attendance.status} />
                    )}
                  </div>
                </div>

                <div className="att-card__body">
                  {/* Working timer */}
                  {state === "working" && shift.attendance && (
                    <WorkTimer checkInTime={shift.attendance.check_in_time} />
                  )}

                  {/* Check-in info when working or done */}
                  {shift.attendance?.check_in_time && (
                    <div className="att-card__checkin-info">
                      In: {formatTimeVN(shift.attendance.check_in_time)}
                      {shift.attendance.late_minutes > 0 &&
                        ` (trễ ${shift.attendance.late_minutes}p)`}
                    </div>
                  )}
                  {shift.attendance?.check_out_time && (
                    <div className="att-card__checkin-info">
                      Out: {formatTimeVN(shift.attendance.check_out_time)}
                    </div>
                  )}

                  {/* Total work time (done) */}
                  {state === "done" && shift.attendance && (
                    <div className="att-card__total">
                      Tổng:{" "}
                      {shift.attendance.formatted_working_time ||
                        shift.attendance.formatted_work_time ||
                        `${shift.attendance.actual_work_minutes}m`}
                    </div>
                  )}
                </div>

                <div className="att-card__footer">
                  {state === "upcoming" && (
                    <>
                      <div className="att-card__upcoming-info">
                        Check-in sẽ mở trước ca 15 phút
                      </div>
                      <button className="att-btn-checkin" disabled>
                        Check-in
                      </button>
                    </>
                  )}

                  {state === "ready" && (
                    <button
                      className="att-btn-checkin att-btn-pulse"
                      disabled={isLoading}
                      onClick={() => handleCheckin(shift.shift_id)}
                    >
                      {isLoading && <span className="att-spinner" />}
                      Check-in
                    </button>
                  )}

                  {state === "working" && (
                    <button
                      className="att-btn-checkout"
                      disabled={isLoading}
                      onClick={() => handleCheckoutClick(shift)}
                    >
                      {isLoading && <span className="att-spinner" />}
                      Check-out
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Early leave modal */}
      <Modal
        title="Xác nhận check-out sớm"
        open={earlyLeaveModal}
        onCancel={() => {
          setEarlyLeaveModal(false);
          setEarlyLeaveReason("");
        }}
        onOk={() => doCheckout(earlyLeaveShiftId, earlyLeaveReason)}
        okText="Xác nhận check-out"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        destroyOnHidden
      >
        <div style={{ display: "grid", gap: 10 }}>
          <p style={{ color: "#6b7280" }}>
            Bạn đang ra về trước giờ kết thúc ca. Vui lòng nhập lý do:
          </p>
          <Input.TextArea
            value={earlyLeaveReason}
            onChange={(e) => setEarlyLeaveReason(e.target.value)}
            placeholder="Nhập lý do..."
            rows={3}
            maxLength={500}
            showCount
          />
        </div>
      </Modal>
    </div>
  );
}
