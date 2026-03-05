import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Descriptions,
  Modal,
  Tag,
  Button,
  Space,
  Input,
  Empty,
  message as antdMessage,
} from "antd";
import dayjs from "dayjs";
import ScheduleHeader from "@/components/schedule/ScheduleHeader";
import ReadonlyScheduleView from "@/components/schedule/ReadonlyScheduleView";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getMyStaffShifts,
} from "@/services/staffShift.service";
import {
  createShiftChangeRequest,
  getMyShiftChangeRequests,
} from "@/services/shiftManagement.service";
import { isUpcomingShift, isShiftOngoing } from "@/utils/staffShiftUtils";
import "@/styles/schedule-shared.css";

function toMinutes(value) {
  const [hours = "0", minutes = "0"] = String(value || "").split(":");
  return Number(hours) * 60 + Number(minutes);
}

const SHIFT_TIME_SLOTS = [
  { id: "slot-morning", key: "morning", label: "Ca sáng", startTime: "06:00", endTime: "12:00" },
  { id: "slot-afternoon", key: "afternoon", label: "Ca chiều", startTime: "12:00", endTime: "18:00" },
];

function resolveSlotKeyByTime(startTime, endTime) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const noon = 12 * 60;

  if (start === 6 * 60 && end === noon) return "morning";
  if (start === noon && end === 18 * 60) return "afternoon";
  if (start >= noon) return "afternoon";
  return "morning";
}

export default function StaffSchedulePage() {
  const { user } = useAuthStore();
  const location = useLocation();
  const currentUserId = user?._id || user?.id || null;

  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf("week"));
  const [shifts, setShifts] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openRequestModal, setOpenRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);

  const weekStart = useMemo(() => currentWeek.startOf("day"), [currentWeek]);
  const weekEnd = useMemo(() => weekStart.add(6, "day"), [weekStart]);
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => weekStart.add(index, "day")),
    [weekStart],
  );

  const loadShifts = useCallback(async () => {
    try {
      const [shiftsData, requestsData] = await Promise.all([
        getMyStaffShifts(),
        getMyShiftChangeRequests({ status: "pending" }),
      ]);

      setShifts(shiftsData);
      setPendingRequests(requestsData || []);
      return shiftsData;
    } catch (error) {
      antdMessage.error(error?.response?.data?.message || "Không tải được lịch làm việc");
      setShifts([]);
      setPendingRequests([]);
      return [];
    }
  }, []);

  useEffect(() => {
    void loadShifts();
  }, [loadShifts]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refreshToken = params.get("refresh");
    if (!refreshToken) return;
    void loadShifts();
  }, [location.search, loadShifts]);

  const loading = shifts === null;

  const filteredWeekShifts = useMemo(() => {
    const start = weekStart.startOf("day");
    const end = weekEnd.endOf("day");

    return (shifts ?? []).filter((item) => {
      if (["draft", "cancelled"].includes(item.status)) return false;
      if (currentUserId && String(item.staffId) !== String(currentUserId)) return false;
      const date = dayjs(item.start);
      return date.isAfter(start.subtract(1, "minute")) && date.isBefore(end.add(1, "minute"));
    });
  }, [shifts, weekStart, weekEnd, currentUserId]);

  const shiftRows = useMemo(() => {
    return SHIFT_TIME_SLOTS.map((slot) => ({
      id: slot.id,
      slotKey: slot.key,
      label: slot.label,
      timeRange: `${slot.startTime} - ${slot.endTime}`,
    }));
  }, []);

  const shiftTimeRangeById = useMemo(() => {
    return shiftRows.reduce((acc, row) => {
      acc[row.slotKey] = row.timeRange;
      return acc;
    }, {});
  }, [shiftRows]);

  const assignments = useMemo(() => {
    const map = {};

    for (const item of filteredWeekShifts) {
      const slotKey = resolveSlotKeyByTime(item.shiftStartTime, item.shiftEndTime);
      const slotId = slotKey === "afternoon" ? "slot-afternoon" : "slot-morning";

      const dateKey = dayjs(item.start).format("YYYY-MM-DD");
      map[dateKey] = map[dateKey] || {};
      map[dateKey][slotId] = map[dateKey][slotId] || [];
      map[dateKey][slotId].push({
        id: item.assignmentId,
        name: slotKey === "afternoon" ? "Ca chiều" : "Ca sáng",
        shiftColor: "var(--primary)",
        assignmentId: item.assignmentId,
        status: item.status === "scheduled" ? "assigned" : item.status,
        badgeId: `readonly:${item.assignmentId}`,
      });
    }

    return map;
  }, [filteredWeekShifts]);

  const statusTag = (shift) => {
    if (!shift) return null;
    if (isShiftOngoing(shift)) return <Tag color="processing">Đang diễn ra</Tag>;
    if (isUpcomingShift(shift)) return <Tag color="warning">Sắp tới</Tag>;
    return <Tag color="default">Đã qua</Tag>;
  };

  const hasPendingRequest = useMemo(() => {
    if (!selectedShift?.assignmentId) return false;
    return pendingRequests.some(
      (req) => String(req.staffShiftId?._id || req.staffShiftId) === String(selectedShift.assignmentId),
    );
  }, [selectedShift?.assignmentId, pendingRequests]);

  const isWeekendRequestWindow = useMemo(() => {
    const day = dayjs().day();
    return day === 0 || day === 6;
  }, []);

  const canRequestChange = Boolean(
    selectedShift &&
      String(selectedShift.staffId) === String(currentUserId) &&
      ["assigned", "scheduled"].includes(selectedShift.status) &&
      dayjs(selectedShift.start).isAfter(dayjs()) &&
      isWeekendRequestWindow &&
      !hasPendingRequest,
  );

  const handleCardClick = (card) => {
    const shift = filteredWeekShifts.find((item) => item.assignmentId === card.assignmentId) || null;
    setSelectedShift(shift);
    setOpenDetails(true);
  };

  const handleRequestChange = async () => {
    if (!selectedShift?.assignmentId) return;
    if (!requestReason.trim()) {
      antdMessage.error("Vui lòng nhập lý do đổi ca");
      return;
    }

    setSubmitting(true);
    try {
      await createShiftChangeRequest({
        staffShiftId: selectedShift.assignmentId,
        reason: requestReason.trim(),
      });
      antdMessage.success("Đã gửi yêu cầu đổi ca");
      setRequestReason("");
      setOpenRequestModal(false);
      await loadShifts();
    } catch (error) {
      antdMessage.error(error?.response?.data?.message || "Không thể gửi yêu cầu đổi ca");
    } finally {
      setSubmitting(false);
    }
  };

  const weekLabel = `${weekStart.format("DD/MM")} - ${weekEnd.format("DD/MM/YYYY")}`;

  return (
    <div className="schedule-page">
      <Space direction="vertical" size={14} style={{ width: "100%" }}>
        <ScheduleHeader
          title="Lịch làm việc của tôi"
          weekLabel={weekLabel}
          onPrevWeek={() => setCurrentWeek((prev) => prev.subtract(7, "day"))}
          onToday={() => setCurrentWeek(dayjs().startOf("week"))}
          onNextWeek={() => setCurrentWeek((prev) => prev.add(7, "day"))}
        />

        <div className="surface-card" aria-busy={loading}>
          {filteredWeekShifts.length === 0 ? (
            <div style={{ minHeight: 280, display: "grid", placeItems: "center" }}>
              <Empty description="Tuần này chưa có lịch làm việc" />
            </div>
          ) : (
            <ReadonlyScheduleView
              weekDates={weekDates}
              shifts={shiftRows}
              assignments={assignments}
              onCardClick={handleCardClick}
            />
          )}
        </div>
      </Space>

      <Modal
        title={
          <Space>
            <span>Chi tiết ca</span>
            {statusTag(selectedShift)}
          </Space>
        }
        open={openDetails}
        onCancel={() => {
          setOpenDetails(false);
        }}
        footer={
          <Space>
            <Button onClick={() => setOpenDetails(false)}>Đóng</Button>

            {(canRequestChange || hasPendingRequest) && (
              <Button
                type="primary"
                disabled={hasPendingRequest || !isWeekendRequestWindow}
                onClick={() => {
                  setRequestReason("");
                  setOpenRequestModal(true);
                }}
              >
                {hasPendingRequest ? "Đã gửi yêu cầu đổi ca" : "Yêu cầu đổi ca"}
              </Button>
            )}
          </Space>
        }
        destroyOnHidden
      >
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Ca">{selectedShift?.title || "—"}</Descriptions.Item>
          <Descriptions.Item label="Ngày">
            {selectedShift ? dayjs(selectedShift.start).format("DD/MM/YYYY") : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Canteen">{selectedShift?.canteenName || "—"}</Descriptions.Item>
          <Descriptions.Item label="Địa điểm">{selectedShift?.location || "—"}</Descriptions.Item>
          <Descriptions.Item label="Giờ ca">
            {selectedShift ? shiftTimeRangeById[resolveSlotKeyByTime(selectedShift.shiftStartTime, selectedShift.shiftEndTime)] || `${selectedShift.shiftStartTime} - ${selectedShift.shiftEndTime}` : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Bắt đầu">
            {selectedShift ? dayjs(selectedShift.start).format("DD/MM/YYYY HH:mm") : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Kết thúc">
            {selectedShift ? dayjs(selectedShift.end).format("DD/MM/YYYY HH:mm") : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">{statusTag(selectedShift) || "—"}</Descriptions.Item>
          <Descriptions.Item label="Công thực tế (giờ)">
            {selectedShift?.actualWorkHours ? selectedShift.actualWorkHours.toFixed(2) : "0.00"}
          </Descriptions.Item>
        </Descriptions>

      </Modal>

      <Modal
        title="Yêu cầu đổi ca"
        open={openRequestModal}
        onCancel={() => {
          setOpenRequestModal(false);
          setRequestReason("");
        }}
        onOk={handleRequestChange}
        okText="Gửi yêu cầu"
        cancelText="Hủy"
        okButtonProps={{ loading: submitting }}
        destroyOnHidden
      >
        {!isWeekendRequestWindow && (
          <div style={{ marginBottom: 10, color: "var(--text-muted)", fontSize: 12 }}>
            Chỉ được gửi yêu cầu đổi ca vào Thứ 7 hoặc Chủ nhật.
          </div>
        )}
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 600 }}>Ca hiện tại</div>
          <div style={{ color: "var(--text-muted)" }}>
            {selectedShift?.title || "—"} ({selectedShift ? shiftTimeRangeById[resolveSlotKeyByTime(selectedShift.shiftStartTime, selectedShift.shiftEndTime)] || `${selectedShift?.shiftStartTime || "--:--"} - ${selectedShift?.shiftEndTime || "--:--"}` : "--:-- - --:--"})
          </div>

          <div style={{ fontWeight: 600 }}>Lý do đổi ca</div>
          <Input.TextArea
            value={requestReason}
            onChange={(event) => setRequestReason(event.target.value)}
            placeholder="Nhập lý do đổi ca"
            rows={4}
          />
        </div>
      </Modal>
    </div>
  );
}