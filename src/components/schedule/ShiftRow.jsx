import ShiftCell from "@/components/schedule/ShiftCell";

export default function ShiftRow({
  shift,
  weekDates,
  assignments,
  editable,
  onRemove,
  onCardClick,
}) {
  return (
    <div className="shift-row">
      <div className="shift-label">
        <div>{shift.label}</div>
        <div className="shift-time">{shift.timeRange}</div>
      </div>

      {weekDates.map((date) => {
        const dateKey = date.format("YYYY-MM-DD");
        const isToday = date.isSame(new Date(), "day");
        const items = assignments?.[dateKey]?.[shift.id] || [];

        return (
          <ShiftCell
            key={`${shift.id}-${dateKey}`}
            dateKey={dateKey}
            shift={shift}
            isToday={isToday}
            items={items}
            editable={editable}
            onRemove={onRemove}
            onCardClick={onCardClick}
          />
        );
      })}
    </div>
  );
}
