import { useMemo, useState } from "react";
import StaffCard from "@/components/schedule/StaffCard";

export default function RightPanel({
  staffSearch,
  onStaffSearch,
  staffItems,
  requests,
  requestPendingCount,
  onGoToRequests,
  onApproveRequest,
  onRejectRequest,
}) {
  const [activeTab, setActiveTab] = useState("staff");

  const displayedRequests = useMemo(() => requests.slice(0, 6), [requests]);

  return (
    <aside className="right-panel">
      <div className="right-panel-tabs">
        <button
          type="button"
          className={`right-panel-tab ${activeTab === "staff" ? "active" : ""}`}
          onClick={() => setActiveTab("staff")}
        >
          Staff List
        </button>
        <button
          type="button"
          className={`right-panel-tab ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          Change Requests
          {requestPendingCount > 0 && <span className="right-panel-badge">{requestPendingCount}</span>}
        </button>
      </div>

      {activeTab === "staff" ? (
        <div className="right-panel-body">
          <input
            type="text"
            className="right-panel-search"
            value={staffSearch}
            placeholder="Search staff"
            onChange={(event) => onStaffSearch?.(event.target.value)}
          />

          <div className="schedule-panel-list">
            {staffItems.map((staff) => (
              <StaffCard
                key={staff.badgeId}
                cardId={staff.badgeId}
                staff={staff}
                draggable
                dragData={{ type: "panel-staff", staff }}
                showAvatar
                hideAccent
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="right-panel-body">
          <div className="request-list">
            {displayedRequests.map((request) => (
              <div key={request._id} className="request-item">
                <div className="request-item-name">{request.staffId?.fullName || "Staff"}</div>
                <div className="request-item-reason">
                  Old shift: {request.staffShiftId?.shiftId?.name || "—"}
                  {request.staffShiftId?.shiftId?.startTime && request.staffShiftId?.shiftId?.endTime
                    ? ` (${request.staffShiftId.shiftId.startTime} - ${request.staffShiftId.shiftId.endTime})`
                    : ""}
                </div>
                <div className="request-item-reason">
                  Requested shift: {request.requestedShiftId?.name || "—"}
                  {request.requestedShiftId?.startTime && request.requestedShiftId?.endTime
                    ? ` (${request.requestedShiftId.startTime} - ${request.requestedShiftId.endTime})`
                    : ""}
                </div>
                <div className="request-item-reason">Reason: {request.reason || "—"}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn-soft"
                    onClick={() => onRejectRequest?.(request._id)}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="btn-solid"
                    onClick={() => onApproveRequest?.(request._id)}
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="btn-solid right-panel-action" onClick={onGoToRequests}>
            Staff Requests Management
          </button>
        </div>
      )}
    </aside>
  );
}
