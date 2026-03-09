import { useEffect, useMemo, useRef, useState } from "react";
import { message, Space } from "antd";
import dayjs from "dayjs";
import { useAuthStore } from "@/store/useAuthStore";
import ScheduleGrid from "@/components/schedule/ScheduleGrid";
import ScheduleHeader from "@/components/schedule/ScheduleHeader";
import DraftControls from "@/components/schedule/DraftControls";
import StaffPlanningPanel from "@/components/schedule/StaffPlanningPanel";
import {
  cancelShiftDraft,
  getManagerAssignments,
  getShiftDraft,
  getManagerShifts,
  getShiftStaffList,
  publishShiftDraft,
  saveShiftDraft,
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

function makeSlotKey(dateKey, shiftId) {
  return `${dateKey}_${shiftId}`;
}

const SHIFT_TIME_SLOTS = {
  morning: { key: "morning", label: "Ca sáng", startTime: "06:00", endTime: "12:00" },
  afternoon: { key: "afternoon", label: "Ca chiều", startTime: "12:00", endTime: "18:00" },
};

const PUBLISHED_STATUS_META = {
  scheduled: { label: "Chưa vào ca", color: "#f59e0b" },
  checked_in: { label: "Đang làm việc", color: "#16a34a" },
  checked_out: { label: "Đã hoàn thành", color: "#2563eb" },
  absent: { label: "Vắng mặt", color: "#ef4444" },
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

function normalizeAssignments(assignments, shiftRows) {
  const rowIds = new Set(shiftRows.map((item) => item.id));
  const rowBySlot = shiftRows.reduce((acc, item) => {
    acc[item.slotKey] = item;
    return acc;
  }, {});
  const slots = {};
  const assignmentsById = {};

  for (const assignment of assignments) {
    if (!["assigned", "draft", "scheduled", "checked_in", "checked_out", "absent"].includes(assignment?.status)) {
      continue;
    }

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

    const assignmentId = String(assignment._id || `${dateKey}_${targetShiftId}_${staffId}`);
    const slotKey = makeSlotKey(dateKey, targetShiftId);

    if (!slots[slotKey]) {
      slots[slotKey] = {
        date: dateKey,
        shiftId: targetShiftId,
        assignments: [],
      };
    }

    const existed = slots[slotKey].assignments.some((id) => {
      return assignmentsById[id]?.staffId === staffId;
    });
    if (existed) continue;

    const normalizedStatus = assignment.status === "assigned" ? "scheduled" : assignment.status;

    assignmentsById[assignmentId] = {
      id: assignmentId,
      assignmentId,
      staffId,
      shiftId: targetShiftId,
      date: dateKey,
      name: staff.fullName || "Nhân viên",
      shiftColor: staff.shiftColor || "var(--primary)",
      status: normalizedStatus,
      badgeId: buildBadgeId(dateKey, targetShiftId, assignmentId),
    };

    slots[slotKey].assignments.push(assignmentId);
  }

  return {
    slots,
    assignmentsById,
  };
}

function denormalizeToGrid(slots, assignmentsById) {
  const mapped = {};

  for (const slot of Object.values(slots || {})) {
    const dateKey = slot.date;
    const shiftId = slot.shiftId;

    mapped[dateKey] = mapped[dateKey] || {};
    mapped[dateKey][shiftId] = (slot.assignments || [])
      .map((assignmentId) => assignmentsById?.[assignmentId])
      .filter(Boolean)
      .map((item) => ({
        id: item.staffId,
        assignmentId: item.assignmentId,
        name: item.name,
        shiftColor: item.shiftColor,
        status: item.status,
        badgeId: item.badgeId,
      }));
  }

  return mapped;
}

function flattenNormalized(assignmentsById) {
  return Object.values(assignmentsById || {}).map((item) => ({
    shiftId: item.shiftId,
    staffId: item.staffId,
    date: item.date,
    status: "draft",
  }));
}

export default function ManagerSchedulePage() {
  const { user } = useAuthStore();
  const canteenId = user?.canteenId?._id || user?.canteenId || null;

  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf("week"));
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [cancelingDraft, setCancelingDraft] = useState(false);
  const [mode, setMode] = useState("published");
  const [hasDraftData, setHasDraftData] = useState(false);

  const [shiftsRaw, setShiftsRaw] = useState([]);
  const [slots, setSlots] = useState({});
  const [assignmentsById, setAssignmentsById] = useState({});
  const [draftChanges, setDraftChanges] = useState(false);

  const slotsRef = useRef({});
  const assignmentsByIdRef = useRef({});

  const [staffSearch, setStaffSearch] = useState("");
  const [staffList, setStaffList] = useState([]);

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

  const gridAssignments = useMemo(() => {
    return denormalizeToGrid(slots, assignmentsById);
  }, [slots, assignmentsById]);

  const publishedStatusStats = useMemo(() => {
    const counters = {
      scheduled: 0,
      checked_in: 0,
      checked_out: 0,
      absent: 0,
      total: 0,
    };

    for (const item of Object.values(assignmentsById || {})) {
      if (mode !== "published") continue;
      if (!item?.status || counters[item.status] === undefined) continue;
      counters[item.status] += 1;
      counters.total += 1;
    }

    return counters;
  }, [assignmentsById, mode]);

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    assignmentsByIdRef.current = assignmentsById;
  }, [assignmentsById]);

  const loadWeekData = async (targetMode = mode) => {
    if (!canteenId) {
      throw new Error("Tài khoản manager chưa được gán canteen. Vui lòng liên hệ admin.");
    }

    const startDate = formatDateISO(weekStart);
    const endDate = formatDateISO(weekEnd);

    const [shiftData, draftData, publishedData] = await Promise.all([
      getManagerShifts({ status: "active", limit: 200, page: 1, canteenId }),
      getShiftDraft({
        weekStart: startDate,
      }),
      getManagerAssignments({
        startDate,
        endDate,
        limit: 1000,
        page: 1,
      }),
    ]);

    const rows = buildSlotRows(shiftData);
    const normalizedDraft = normalizeAssignments(draftData, rows);
    const normalizedPublished = normalizeAssignments(publishedData, rows);

    const displayData = targetMode === "draft"
      ? (draftData.length ? normalizedDraft : normalizedPublished)
      : normalizedPublished;

    setShiftsRaw(shiftData);
    setSlots(displayData.slots);
    setAssignmentsById(displayData.assignmentsById);
    setHasDraftData(draftData.length > 0);
    setDraftChanges(false);
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
    } catch (error) {
      message.error(error?.response?.data?.message || "Không tải được dữ liệu phân ca");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart.valueOf(), canteenId, mode]);

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
    if (mode !== "draft") return;

    const assignmentId = String(staff.assignmentId || "");
    if (!assignmentId) return;

    const nextAssignments = { ...assignmentsByIdRef.current };
    const nextSlots = { ...slotsRef.current };
    const slotKey = makeSlotKey(dateKey, shiftId);
    const targetSlot = nextSlots[slotKey];

    if (targetSlot) {
      nextSlots[slotKey] = {
        ...targetSlot,
        assignments: (targetSlot.assignments || []).filter((id) => id !== assignmentId),
      };
    }

    delete nextAssignments[assignmentId];

    setSlots(nextSlots);
    setAssignmentsById(nextAssignments);

    setDraftChanges(true);
  };

  const handleGridDragEnd = ({ staff, from, to }) => {
    if (mode !== "draft") return;
    if (!to?.dateKey || !to?.shiftId) return;

    if (from.type === "cell-badge" && from.dateKey === to.dateKey && from.shiftId === to.shiftId) {
      return;
    }

    const nextAssignments = { ...assignmentsByIdRef.current };
    const nextSlots = { ...slotsRef.current };

    const ensureSlot = (dateKey, shiftId) => {
      const slotKey = makeSlotKey(dateKey, shiftId);
      if (!nextSlots[slotKey]) {
        nextSlots[slotKey] = {
          date: dateKey,
          shiftId,
          assignments: [],
        };
      }
      return slotKey;
    };

    const targetSlotKey = ensureSlot(to.dateKey, to.shiftId);
    const targetSlot = nextSlots[targetSlotKey];

    const hasSameStaff = (targetSlot.assignments || []).some((id) => {
      return nextAssignments[id]?.staffId === String(staff.id);
    });
    if (hasSameStaff) return;

    if (from.type === "panel-staff") {
      const assignmentId = crypto.randomUUID();
      nextAssignments[assignmentId] = {
        id: assignmentId,
        assignmentId,
        staffId: String(staff.id),
        shiftId: String(to.shiftId),
        date: to.dateKey,
        name: staff.name || "Nhân viên",
        shiftColor: staff.shiftColor || "var(--primary)",
        status: "draft",
        badgeId: buildBadgeId(to.dateKey, to.shiftId, assignmentId),
      };

      nextSlots[targetSlotKey] = {
        ...targetSlot,
        assignments: [...(targetSlot.assignments || []), assignmentId],
      };
    }

    if (from.type === "cell-badge") {
      const assignmentId = String(staff.assignmentId || "");
      if (!assignmentId || !nextAssignments[assignmentId]) return;

      if (from.dateKey && from.shiftId) {
        const sourceSlotKey = makeSlotKey(from.dateKey, from.shiftId);
        const sourceSlot = nextSlots[sourceSlotKey];
        if (sourceSlot) {
          nextSlots[sourceSlotKey] = {
            ...sourceSlot,
            assignments: (sourceSlot.assignments || []).filter((id) => id !== assignmentId),
          };
        }
      }

      nextSlots[targetSlotKey] = {
        ...nextSlots[targetSlotKey],
        assignments: [...(nextSlots[targetSlotKey].assignments || []), assignmentId],
      };

      nextAssignments[assignmentId] = {
        ...nextAssignments[assignmentId],
        date: to.dateKey,
        shiftId: String(to.shiftId),
        status: "draft",
        badgeId: buildBadgeId(to.dateKey, to.shiftId, assignmentId),
      };
    }

    setSlots(nextSlots);
    setAssignmentsById(nextAssignments);

    setDraftChanges(true);
  };

  const handleSaveDraft = async ({ silent = false } = {}) => {
    const assignmentPayload = flattenNormalized(assignmentsByIdRef.current);

    if (!assignmentPayload.length) {
      if (!silent) message.info("Không có thay đổi để lưu");
      return;
    }

    setSavingDraft(true);
    try {
      await saveShiftDraft({
        weekStart: formatDateISO(weekStart),
        assignments: assignmentPayload,
      });

      await refreshAll();
      if (!silent) message.success("Lưu nháp thành công");
    } catch (error) {
      message.error(error?.response?.data?.message || "Không thể lưu nháp");
      throw error;
    } finally {
      setSavingDraft(false);
    }
  };

  const handleCancelDraft = async () => {
    setCancelingDraft(true);
    try {
      await cancelShiftDraft({ weekStart: formatDateISO(weekStart) });
      setMode("published");
      await refreshAll();
      message.success("Đã hủy nháp tuần hiện tại");
    } catch (error) {
      message.error(error?.response?.data?.message || "Không thể hủy nháp");
    } finally {
      setCancelingDraft(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      if (draftChanges) {
        await handleSaveDraft({ silent: true });
      }

      await publishShiftDraft({
        weekStart: formatDateISO(weekStart),
      });

      setMode("published");
      await refreshAll();
      message.success("Phát hành lịch tuần thành công");
    } catch (error) {
      message.error(error?.response?.data?.message || "Không thể phát hành lịch");
    } finally {
      setPublishing(false);
    }
  };

  const handleSwitchMode = (nextMode) => {
    if (nextMode === mode) return;

    if (mode === "draft" && draftChanges) {
      const accepted = window.confirm("Bạn có thay đổi chưa lưu. Chuyển chế độ sẽ bỏ các thay đổi này. Tiếp tục?");
      if (!accepted) return;
    }

    setMode(nextMode);
  };

  const handleEnterEditMode = () => {
    handleSwitchMode("draft");
  };

  return (
    <div className="schedule-page">
      <Space direction="vertical" size={14} style={{ width: "100%" }}>
        <ScheduleHeader
          title="Lập lịch làm việc"
          weekLabel={weekLabel}
          onPrevWeek={() => setCurrentWeek((prev) => prev.subtract(7, "day"))}
          onToday={() => setCurrentWeek(dayjs().startOf("week"))}
          onNextWeek={() => setCurrentWeek((prev) => prev.add(7, "day"))}
        />

        <DraftControls
          mode={mode}
          hasDraftData={hasDraftData}
          draftChanges={draftChanges}
          savingDraft={savingDraft}
          publishing={publishing}
          cancelingDraft={cancelingDraft}
          onSwitchMode={handleSwitchMode}
          onEnterEditMode={handleEnterEditMode}
          onSaveDraft={() => handleSaveDraft()}
          onCancelDraft={handleCancelDraft}
          onPublish={handlePublish}
        />

        <div className="schedule-layout">
          <ScheduleGrid
            weekDates={weekDates}
            shifts={shiftRows}
            assignments={gridAssignments}
            editable={mode === "draft"}
            onDragEnd={handleGridDragEnd}
            onRemove={handleRemove}
            panelRenderer={() => (
              <StaffPlanningPanel
                staffSearch={staffSearch}
                onStaffSearch={setStaffSearch}
                staffItems={panelStaffItems}
              />
            )}
          />

          {mode === "published" && (
            <aside className="right-panel schedule-insight-panel">
              <div className="schedule-published-insight">
                <div className="schedule-status-summary-grid">
                  <div className="schedule-status-summary-item">
                    <span className="schedule-status-summary-label">Tổng nhân sự tuần</span>
                    <span className="schedule-status-summary-value">{publishedStatusStats.total}</span>
                  </div>
                  <div className="schedule-status-summary-item">
                    <span className="schedule-status-summary-label">Chưa vào ca</span>
                    <span className="schedule-status-summary-value">{publishedStatusStats.scheduled}</span>
                  </div>
                  <div className="schedule-status-summary-item">
                    <span className="schedule-status-summary-label">Đang làm việc</span>
                    <span className="schedule-status-summary-value">{publishedStatusStats.checked_in}</span>
                  </div>
                  <div className="schedule-status-summary-item">
                    <span className="schedule-status-summary-label">Đã hoàn thành</span>
                    <span className="schedule-status-summary-value">{publishedStatusStats.checked_out}</span>
                  </div>
                  <div className="schedule-status-summary-item">
                    <span className="schedule-status-summary-label">Vắng mặt</span>
                    <span className="schedule-status-summary-value">{publishedStatusStats.absent}</span>
                  </div>
                </div>

                <div className="schedule-status-legend">
                  <span className="schedule-status-legend-title">Chú thích trạng thái:</span>
                  {Object.entries(PUBLISHED_STATUS_META).map(([key, meta]) => (
                    <span key={key} className="schedule-status-legend-item">
                      <span className="schedule-status-legend-dot" style={{ backgroundColor: meta.color }} />
                      {meta.label}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>

        {loading && <div style={{ color: "var(--text-muted)" }}>Đang tải dữ liệu...</div>}
      </Space>
    </div>
  );
}
