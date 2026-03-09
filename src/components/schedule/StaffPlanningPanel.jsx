import StaffCard from "@/components/schedule/StaffCard";

export default function StaffPlanningPanel({
  staffSearch,
  onStaffSearch,
  staffItems,
}) {
  return (
    <aside className="right-panel">
      <div className="right-panel-body" style={{ borderTop: "none" }}>
        <input
          type="text"
          className="right-panel-search"
          value={staffSearch}
          placeholder="Tìm nhân viên"
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
    </aside>
  );
}
