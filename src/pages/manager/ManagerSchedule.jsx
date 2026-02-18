import { useEffect, useMemo, useState } from "react";
import { App, Space } from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
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

function mapAssignmentsToGrid(assignments, shiftRows) {
  const rowIds = new Set(shiftRows.map((item) => item.id));
  const mapped = {};

  for (const assignment of assignments) {
    if (!["assigned", "draft", "scheduled"].includes(assignment?.status)) continue;

    const dateKey = dayjs(assignment.date).format("YYYY-MM-DD");
    const shift = assignment.shiftId || {};
    const staff = assignment.staffId || {};
    const shiftId = String(shift._id || shift);
    const staffId = String(staff._id || staff.id || assignment.staffId);

    if (!rowIds.has(shiftId) || !staffId || !dateKey) continue;

    mapped[dateKey] = mapped[dateKey] || {};
    mapped[dateKey][shiftId] = mapped[dateKey][shiftId] || [];

    const existed = mapped[dateKey][shiftId].some((item) => item.id === staffId);
    if (existed) continue;

    mapped[dateKey][shiftId].push({
      id: staffId,
      name: staff.fullName || "Staff",
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
  const { message } = App.useApp();

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
    const sorted = [...shiftsRaw].sort((left, right) => {
      return toMinutes(left.startTime) - toMinutes(right.startTime);
    });

    return sorted.slice(0, 2).map((shift, index) => ({
      id: String(shift._id),
      label: index === 0 ? "Ca sáng" : "Ca chiều",
      timeRange: `${shift.startTime} - ${shift.endTime}`,
    }));
  }, [shiftsRaw]);

  const weekLabel = `${weekStart.format("D MMM")} - ${weekEnd.format("D MMM, YYYY")}`;

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
    const [shiftData, assignmentData, requestData] = await Promise.all([
      getManagerShifts({ status: "active", limit: 200, page: 1 }),
      getManagerAssignments({
        startDate: formatDateISO(weekStart),
        endDate: formatDateISO(weekEnd),
      }),
      getShiftChangeRequests({ status: "pending" }),
    ]);

    const rows = [...shiftData]
      .sort((left, right) => toMinutes(left.startTime) - toMinutes(right.startTime))
      .slice(0, 2)
      .map((shift) => ({ id: String(shift._id) }));

    setShiftsRaw(shiftData);
    setAssignments(mapAssignmentsToGrid(assignmentData, rows));
    setRequests(requestData);
    setRequestPendingCount(requestData.length);
  };

  const loadStaff = async (search = "") => {
    const data = await getShiftStaffList({ search });
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
  }, [weekStart.valueOf()]);

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
          title="Manager Schedule"
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
