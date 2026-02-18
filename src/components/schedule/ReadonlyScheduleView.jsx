import ScheduleGrid from "@/components/schedule/ScheduleGrid";

export default function ReadonlyScheduleView({
  weekDates,
  shifts,
  assignments,
  onCardClick,
}) {
  return (
    <div className="schedule-view-readonly">
      <ScheduleGrid
        weekDates={weekDates}
        shifts={shifts}
        assignments={assignments}
        editable={false}
        onCardClick={onCardClick}
      />
    </div>
  );
}
