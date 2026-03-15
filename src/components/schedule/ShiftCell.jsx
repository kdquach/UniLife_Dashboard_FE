import { useDroppable } from "@dnd-kit/core";
import StaffCard from "@/components/schedule/StaffCard";

export default function ShiftCell({
  dateKey,
  shift,
  isToday = false,
  items,
  editable,
  onRemove,
  onCardClick,
}) {
  const droppableId = `cell:${dateKey}:${shift.id}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: {
      type: "shift-cell",
      dateKey,
      shiftId: shift.id,
    },
    disabled: !editable,
  });

  return (
    <div
      ref={setNodeRef}
      className={`shift-cell ${isToday ? "today-cell" : ""} ${isOver ? "drag-over" : ""} ${items.length ? "has-items" : "is-empty"}`}
    >
      {!items.length && <div className="shift-cell-placeholder">Drag staff here</div>}

      {items.map((item) => {
        const canEditItem = editable && ["draft", "assigned", "scheduled"].includes(item.status);

        return (
          <StaffCard
            key={item.badgeId}
            cardId={item.badgeId}
            staff={item}
            showAvatar={false}
            draggable={canEditItem}
            dragData={{
              type: "cell-badge",
              staff: item,
              dateKey,
              shiftId: shift.id,
            }}
            removable={canEditItem}
            onRemove={() => onRemove?.(item, dateKey, shift.id)}
            onClick={() => onCardClick?.(item)}
          />
        );
      })}
    </div>
  );
}
