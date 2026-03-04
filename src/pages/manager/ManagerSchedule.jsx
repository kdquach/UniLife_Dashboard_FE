import { useEffect, useMemo, useState } from "react";
import { message, Space } from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import ScheduleGrid from "@/components/schedule/ScheduleGrid";
import ScheduleHeader from "@/components/schedule/ScheduleHeader";
import DraftControls from "@/components/schedule/DraftControls";
import RightPanel from "@/components/schedule/RightPanel";
import {
  bulkSaveShiftAssignments,
  getManagerAssignments,
  getManagerShifts,
  getShiftChangeRequests,
  getShiftStaffList,
  publishShiftAssignments,
  reviewShiftChangeRequest,
  removeAssignment,
} from "@/services/shiftManagement.service";
import "@/styles/schedule-shared.css";

function formatDateISO(date) {
  return dayjs(date).format("YYYY-MM-DD");
}

function toMinutes(value) {
  const [hours = "0", minutes = "0"] = String(value || "").split(":");
  return Number(hours) * 60 + Number(minutes);
}

function buildBadgeId(dateKey, shiftId, staffId) {
  return `cell:${dateKey}:${shiftId}:${staffId}`;
}

const SHIFT_TIME_SLOTS = {
  morning: { key: "morning", label: "Ca sáng", startTime: "06:00", endTime: "12:00" },
  afternoon: { key: "afternoon", label: "Ca chiều", startTime: "12:00", endTime: "18:00" },
};

function resolveSlotKey(startTime, endTime) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const noon = 12 * 60;

  if (start === 6 * 60 && end === noon) return "morning";
  if (start === noon && end === 18 * 60) return "afternoon";
  if (start >= noon) return "afternoon";
  return "morning";
}

function pickSlotShift(shifts, slotKey, usedIds = new Set()) {
  const slot = SHIFT_TIME_SLOTS[slotKey];
  const exact = shifts.find(
    (item) =>
      !usedIds.has(String(item._id)) &&
      String(item.startTime) === slot.startTime &&
      String(item.endTime) === slot.endTime,
  );
  if (exact) return exact;

  return shifts.find(
    (item) => !usedIds.has(String(item._id)) && resolveSlotKey(item.startTime, item.endTime) === slotKey,
  ) || null;
}

function buildSlotRows(shifts = []) {
  const sorted = [...shifts].sort((left, right) => {
    return toMinutes(left.startTime) - toMinutes(right.startTime);
  });

  const usedIds = new Set();
  const morningShift = pickSlotShift(sorted, "morning", usedIds);
  if (morningShift?._id) usedIds.add(String(morningShift._id));
  const afternoonShift = pickSlotShift(sorted, "afternoon", usedIds);

  const rows = [];
  if (morningShift?._id) {
    rows.push({
      id: String(morningShift._id),
      slotKey: "morning",
      label: SHIFT_TIME_SLOTS.morning.label,
      timeRange: `${SHIFT_TIME_SLOTS.morning.startTime} - ${SHIFT_TIME_SLOTS.morning.endTime}`,
    });
  }

  if (afternoonShift?._id) {
    rows.push({
      id: String(afternoonShift._id),
      slotKey: "afternoon",
      label: SHIFT_TIME_SLOTS.afternoon.label,
      timeRange: `${SHIFT_TIME_SLOTS.afternoon.startTime} - ${SHIFT_TIME_SLOTS.afternoon.endTime}`,
    });
  }

  return rows;
}

function mapAssignmentsToGrid(assignments, shiftRows) {
  const rowIds = new Set(shiftRows.map((item) => item.id));
  const rowBySlot = shiftRows.reduce((acc, item) => {
    acc[item.slotKey] = item;
    return acc;
  }, {});
  const mapped = {};

  for (const assignment of assignments) {
    if (!["assigned", "draft", "scheduled"].includes(assignment?.status)) continue;

    const dateKey = dayjs(assignment.date).format("YYYY-MM-DD");
    const shift = assignment.shiftId || {};
    const staff = assignment.staffId || {};
    const shiftId = String(shift._id || shift);
    const staffId = String(staff._id || staff.id || assignment.staffId);

    if (!staffId || !dateKey) continue;

    let targetShiftId = shiftId;
    if (!rowIds.has(targetShiftId)) {
      const slotKey = resolveSlotKey(shift.startTime, shift.endTime);
      const targetRow = rowBySlot[slotKey];
      if (!targetRow) continue;
      targetShiftId = targetRow.id;
    }

    mapped[dateKey] = mapped[dateKey] || {};
    mapped[dateKey][targetShiftId] = mapped[dateKey][targetShiftId] || [];

    const existed = mapped[dateKey][targetShiftId].some((item) => item.id === staffId);
    if (existed) continue;

    mapped[dateKey][targetShiftId].push({
      id: staffId,
      name: staff.fullName || "Nhân viên",
      shiftColor: staff.shiftColor || "var(--primary)",
      assignmentId: assignment._id,
      status: assignment.status === "scheduled" ? "assigned" : assignment.status,
      badgeId: buildBadgeId(dateKey, shiftId, staffId),
    });
  }

  return mapped;
}

function flattenAssignments(assignments) {
  const payload = [];

  for (const [date, shiftMap] of Object.entries(assignments || {})) {
    for (const [shiftId, items] of Object.entries(shiftMap || {})) {
      for (const item of items || []) {
        payload.push({
          shiftId,
          staffId: item.id,
          date,
          status: "draft",
        });
      }
    }
  }

  return payload;
}

export default function ManagerSchedulePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canteenId = user?.canteenId?._id || user?.canteenId || null;

  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf("week"));
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [shiftsRaw, setShiftsRaw] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [removedAssignmentIds, setRemovedAssignmentIds] = useState([]);
  const [draftChanges, setDraftChanges] = useState(false);

  const [staffSearch, setStaffSearch] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestPendingCount, setRequestPendingCount] = useState(0);

  const weekStart = useMemo(() => currentWeek.startOf("day"), [currentWeek]);
  const weekEnd = useMemo(() => weekStart.add(6, "day"), [weekStart]);
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => weekStart.add(index, "day")),
    [weekStart],
  );

  const shiftRows = useMemo(() => {
    return buildSlotRows(shiftsRaw);
  }, [shiftsRaw]);

  const weekLabel = `${weekStart.format("DD/MM")} - ${weekEnd.format("DD/MM/YYYY")}`;

  const panelStaffItems = useMemo(
    () =>
      staffList.map((item) => ({
        id: String(item._id),
        name: item.fullName,
        shiftColor: item.shiftColor || "var(--primary)",
        badgeId: `panel:${item._id}`,
      })),
    [staffList],
  );

  const loadWeekData = async () => {
    if (!canteenId) {
      throw new Error("Tài khoản manager chưa được gán canteen. Vui lòng liên hệ admin.");
    }

    const [shiftData, assignmentData, requestData] = await Promise.all([
      getManagerShifts({ status: "active", limit: 200, page: 1, canteenId }),
      getManagerAssignments({
        startDate: formatDateISO(weekStart),
        endDate: formatDateISO(weekEnd),
        limit: 500,
        page: 1,
        canteenId,
      }),
      getShiftChangeRequests({ status: "pending", canteenId }),
    ]);

    const rows = buildSlotRows(shiftData);

    setShiftsRaw(shiftData);
    setAssignments(mapAssignmentsToGrid(assignmentData, rows));
    setRequests(requestData);
    setRequestPendingCount(requestData.length);
  };

  const loadStaff = async (search = "") => {
    if (!canteenId) {
      setStaffList([]);
      return;
    }
    const data = await getShiftStaffList({ search, canteenId });
    setStaffList(data);
  };

  const refreshAll = async () => {
    try {
      setLoading(true);
      await Promise.all([loadWeekData(), loadStaff(staffSearch)]);
      setDraftChanges(false);
      setRemovedAssignmentIds([]);
    } catch (error) {
      message.error(error?.response?.data?.message || "Không tải được dữ liệu phân ca");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart.valueOf(), canteenId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadStaff(staffSearch).catch((error) => {
        message.error(error?.response?.data?.message || "Không tải được danh sách nhân viên");
      });
    }, 250);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffSearch]);

  const handleRemove = (staff, dateKey, shiftId) => {
    if (staff.assignmentId) {
      setRemovedAssignmentIds((prev) => Array.from(new Set([...prev, staff.assignmentId])));
    }

    setAssignments((prev) => {
      const next = { ...prev };
      next[dateKey] = next[dateKey] || {};
      next[dateKey][shiftId] = (next[dateKey][shiftId] || []).filter((item) => item.id !== staff.id);
      return next;
    });

    setDraftChanges(true);
  };

  const handleGridDragEnd = ({ staff, from, to }) => {
    if (!to?.dateKey || !to?.shiftId) return;

    if (from.type === "cell-badge" && from.dateKey === to.dateKey && from.shiftId === to.shiftId) {
      return;
    }

    setAssignments((prev) => {
      const next = {};

      for (const [date, shiftMap] of Object.entries(prev)) {
        next[date] = {};
        for (const [shiftId, cards] of Object.entries(shiftMap || {})) {
          next[date][shiftId] = [...(cards || [])];
        }
      }

      if (from.type === "cell-badge" && from.dateKey && from.shiftId) {
        next[from.dateKey] = next[from.dateKey] || {};
        next[from.dateKey][from.shiftId] = (next[from.dateKey][from.shiftId] || []).filter(
          (item) => item.id !== staff.id,
        );

        if (staff.assignmentId) {
          setRemovedAssignmentIds((prevIds) =>
            Array.from(new Set([...prevIds, staff.assignmentId])),
          );
        }
      }

      next[to.dateKey] = next[to.dateKey] || {};
      next[to.dateKey][to.shiftId] = next[to.dateKey][to.shiftId] || [];

      const exists = next[to.dateKey][to.shiftId].some((item) => item.id === staff.id);
      if (!exists) {
        next[to.dateKey][to.shiftId].push({
          ...staff,
          assignmentId: null,
          status: "draft",
          badgeId: buildBadgeId(to.dateKey, to.shiftId, staff.id),
        });
      }

      return next;
    });

    setDraftChanges(true);
  };

  const handleSaveDraft = async ({ silent = false } = {}) => {
    const assignmentPayload = flattenAssignments(assignments);
    const deletionIds = [...removedAssignmentIds];

    if (!assignmentPayload.length && !deletionIds.length) {
      if (!silent) message.info("Không có thay đổi để lưu");
      return;
    }

    setSavingDraft(true);
    try {
      if (deletionIds.length) {
        await Promise.all(deletionIds.map((assignmentId) => removeAssignment(assignmentId)));
      }

      if (assignmentPayload.length) {
        await bulkSaveShiftAssignments({ assignments: assignmentPayload });
      }

      await refreshAll();
      if (!silent) message.success("Lưu nháp thành công");
    } catch (error) {
      message.error(error?.response?.data?.message || "Không thể lưu nháp");
      throw error;
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      if (draftChanges) {
        await handleSaveDraft({ silent: true });
      }

      await publishShiftAssignments({
        startDate: formatDateISO(weekStart),
        endDate: formatDateISO(weekEnd),
      });

      await refreshAll();
      message.success("Phát hành lịch tuần thành công");
    } catch (error) {
      message.error(error?.response?.data?.message || "Không thể phát hành lịch");
    } finally {
      setPublishing(false);
    }
  };

  const handleReviewRequest = async (requestId, status) => {
    try {
      await reviewShiftChangeRequest(requestId, status);
      message.success(status === "approved" ? "Đã duyệt yêu cầu" : "Đã từ chối yêu cầu");
      await refreshAll();
    } catch (error) {
      message.error(error?.response?.data?.message || "Không thể xử lý yêu cầu");
    }
  };

  return (
    <div className="schedule-page">
      <Space direction="vertical" size={14} style={{ width: "100%" }}>
        <ScheduleHeader
          title="Lịch làm việc quản lý"
          weekLabel={weekLabel}
          onPrevWeek={() => setCurrentWeek((prev) => prev.subtract(7, "day"))}
          onToday={() => setCurrentWeek(dayjs().startOf("week"))}
          onNextWeek={() => setCurrentWeek((prev) => prev.add(7, "day"))}
        />

        <DraftControls
          draftChanges={draftChanges}
          savingDraft={savingDraft}
          publishing={publishing}
          onSaveDraft={() => handleSaveDraft()}
          onPublish={handlePublish}
        />

        <div className="schedule-layout">
          <ScheduleGrid
            weekDates={weekDates}
            shifts={shiftRows}
            assignments={assignments}
            editable
            onDragEnd={handleGridDragEnd}
            onRemove={handleRemove}
            panelRenderer={() => (
              <RightPanel
                staffSearch={staffSearch}
                onStaffSearch={setStaffSearch}
                staffItems={panelStaffItems}
                requests={requests}
                requestPendingCount={requestPendingCount}
                onGoToRequests={() => navigate("/manager/shift-requests")}
                onApproveRequest={(requestId) => handleReviewRequest(requestId, "approved")}
                onRejectRequest={(requestId) => handleReviewRequest(requestId, "rejected")}
              />
            )}
          />
        </div>

        {loading && <div style={{ color: "var(--text-muted)" }}>Đang tải dữ liệu...</div>}
      </Space>
    </div>
  );
}
