import { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Descriptions,
  Modal,
  Tag,
  Button,
  Space,
  Input,
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
} from "@/services/shiftManagement.service";
import { isUpcomingShift, isShiftOngoing } from "@/utils/staffShiftUtils";
import "@/styles/schedule-shared.css";

function toMinutes(value) {
  const [hours = "0", minutes = "0"] = String(value || "").split(":");
  return Number(hours) * 60 + Number(minutes);
}

export default function StaffSchedulePage() {
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const currentUserId = user?._id || user?.id || null;

  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf("week"));
  const [shifts, setShifts] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestReason, setRequestReason] = useState("");

  const weekStart = useMemo(() => currentWeek.startOf("day"), [currentWeek]);
  const weekEnd = useMemo(() => weekStart.add(6, "day"), [weekStart]);
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => weekStart.add(index, "day")),
    [weekStart],
  );

  const loadShifts = useCallback(async () => {
    try {
      const data = await getMyStaffShifts();
      setShifts(data);
      return data;
    } catch (error) {
      message.error(error?.response?.data?.message || "Không tải được lịch làm việc");
      setShifts([]);
      return [];
    }
  }, [message]);

  useEffect(() => {
    void loadShifts();
  }, [loadShifts]);

  const loading = shifts === null;

  const filteredWeekShifts = useMemo(() => {
    const start = weekStart.startOf("day");
    const end = weekEnd.endOf("day");

    return (shifts ?? []).filter((item) => {
      if (item.status === "draft") return false;
      const date = dayjs(item.start);
      return date.isAfter(start.subtract(1, "minute")) && date.isBefore(end.add(1, "minute"));
    });
  }, [shifts, weekStart, weekEnd]);

  const shiftRows = useMemo(() => {
    const byShift = new Map();

    for (const item of filteredWeekShifts) {
      if (!item.shiftId || byShift.has(item.shiftId)) continue;
      byShift.set(item.shiftId, {
        id: item.shiftId,
        shiftStartTime: item.shiftStartTime,
        shiftEndTime: item.shiftEndTime,
        label: item.title,
      });
    }

    return [...byShift.values()]
      .sort((left, right) => toMinutes(left.shiftStartTime) - toMinutes(right.shiftStartTime))
      .slice(0, 2)
      .map((row, index) => ({
        id: row.id,
        label: index === 0 ? "Ca sáng" : "Ca chiều",
        timeRange: `${row.shiftStartTime} - ${row.shiftEndTime}`,
      }));
  }, [filteredWeekShifts]);

  const assignments = useMemo(() => {
    const map = {};
    const allowedShiftIds = new Set(shiftRows.map((item) => item.id));

    for (const item of filteredWeekShifts) {
      if (!allowedShiftIds.has(item.shiftId)) continue;

      const dateKey = dayjs(item.start).format("YYYY-MM-DD");
      map[dateKey] = map[dateKey] || {};
      map[dateKey][item.shiftId] = map[dateKey][item.shiftId] || [];
      map[dateKey][item.shiftId].push({
        id: item.assignmentId,
        name: item.title,
        shiftColor: "var(--primary)",
        assignmentId: item.assignmentId,
        badgeId: `readonly:${item.assignmentId}`,
      });
    }

    return map;
  }, [filteredWeekShifts, shiftRows]);

  const statusTag = (shift) => {
    if (!shift) return null;
    if (isShiftOngoing(shift)) return <Tag color="processing">Đang diễn ra</Tag>;
    if (isUpcomingShift(shift)) return <Tag color="warning">Sắp tới</Tag>;
    return <Tag color="default">Đã qua</Tag>;
  };

  const canRequestChange = Boolean(
    selectedShift &&
      selectedShift.staffId === currentUserId &&
      selectedShift.status === "assigned" &&
      dayjs(selectedShift.start).isAfter(dayjs()),
  );

  useEffect(() => {
    if (!openDetails || !canRequestChange) return;

    (async () => {
      try {
        const data = await getAvailableShiftsForChangeRequest();
        setAvailableShifts(data);
      } catch (error) {
        message.error(error?.response?.data?.message || "Không tải được danh sách ca");
        setAvailableShifts([]);
      }
    })();
  }, [openDetails, canRequestChange, message]);

  const handleCardClick = (card) => {
    const shift = filteredWeekShifts.find((item) => item.assignmentId === card.assignmentId) || null;
    setSelectedShift(shift);
    setOpenDetails(true);
  };

  const handleRequestChange = async () => {
    if (!selectedShift?.assignmentId) return;
    if (!requestReason.trim()) {
      message.error("Vui lòng nhập lý do đổi ca");
      return;
    }

    setSubmitting(true);
    try {
      await createShiftChangeRequest({
        staffShiftId: selectedShift.assignmentId,
        reason: requestReason.trim(),
      });
      message.success("Đã gửi yêu cầu đổi ca");
      setRequestReason("");
      setOpenDetails(false);
    } catch (error) {
      message.error(error?.response?.data?.message || "Không thể gửi yêu cầu đổi ca");
    } finally {
      setSubmitting(false);
    }
  };

  const weekLabel = `${weekStart.format("D MMM")} - ${weekEnd.format("D MMM, YYYY")}`;

  return (
    <div className="schedule-page">
      <Space direction="vertical" size={14} style={{ width: "100%" }}>
        <ScheduleHeader
          title="Staff Schedule"
          weekLabel={weekLabel}
          onPrevWeek={() => setCurrentWeek((prev) => prev.subtract(7, "day"))}
          onToday={() => setCurrentWeek(dayjs().startOf("week"))}
          onNextWeek={() => setCurrentWeek((prev) => prev.add(7, "day"))}
        />

        <div className="surface-card" aria-busy={loading}>
          <ReadonlyScheduleView
            weekDates={weekDates}
            shifts={shiftRows}
            assignments={assignments}
            onCardClick={handleCardClick}
          />
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
          setRequestReason("");
        }}
        footer={
          <Space>
            <Button onClick={() => setOpenDetails(false)}>Đóng</Button>

            {canRequestChange && (
              <Button loading={submitting} onClick={handleRequestChange}>
                Request Change Shift
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
            {selectedShift ? `${selectedShift.shiftStartTime} - ${selectedShift.shiftEndTime}` : "—"}
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

        {canRequestChange && (
          <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 600 }}>Lý do đổi ca</div>
            <Input.TextArea
              value={requestReason}
              onChange={(event) => setRequestReason(event.target.value)}
              placeholder="Nhập lý do đổi ca"
              rows={3}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
