import { useState, useEffect } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
  useDndMonitor,
} from "@dnd-kit/core";
import ShiftRow from "@/components/schedule/ShiftRow";
import StaffCard from "@/components/schedule/StaffCard";

function resolveTarget(over) {
  const data = over?.data?.current;

  if (data?.type === "shift-cell") {
    return {
      dateKey: data.dateKey,
      shiftId: String(data.shiftId),
    };
  }

  if (data?.type === "cell-badge") {
    return {
      dateKey: data.dateKey,
      shiftId: String(data.shiftId),
    };
  }

  if (typeof over?.id === "string" && over.id.startsWith("cell:")) {
    const [, dateKey, shiftId] = over.id.split(":");
    return {
      dateKey,
      shiftId,
    };
  }

  return null;
}

function GridBody({ weekDates, shifts, assignments, editable, onRemove, onCardClick }) {
  return (
    <>
      <div className="week-header">
        <div />
        {weekDates.map((date) => {
          const isToday = date.isSame(new Date(), "day");
          return (
            <div key={date.format("YYYY-MM-DD")} className={`day-box ${isToday ? "today" : ""}`}>
              <div>{date.format("ddd")}</div>
              <div>{date.format("D/M")}</div>
            </div>
          );
        })}
      </div>

      {shifts.map((shift) => (
        <ShiftRow
          key={shift.id}
          shift={shift}
          weekDates={weekDates}
          assignments={assignments}
          editable={editable}
          onRemove={onRemove}
          onCardClick={onCardClick}
        />
      ))}
    </>
  );
}

function DragOverlayContent({ activeData }) {
  if (!activeData?.staff) return null;

  return (
    <StaffCard
      cardId={activeData.id}
      staff={activeData.staff}
      draggable={false}
      hideAccent={false}
      onClick={() => {}}
    />
  );
}

function DragMonitor({ children }) {
  const [activeData, setActiveData] = useState(null);

  useDndMonitor({
    onDragStart({ active }) {
      setActiveData({ id: active.id, staff: active.data.current?.staff });
    },
    onDragEnd() {
      setActiveData(null);
    },
    onDragCancel() {
      setActiveData(null);
    },
  });

  return (
    <>
      {children}
      <DragOverlay dropAnimation={null}>
        <DragOverlayContent activeData={activeData} />
      </DragOverlay>
    </>
  );
}

export default function ScheduleGrid({
  weekDates,
  shifts,
  assignments,
  editable,
  onDragEnd,
  onRemove,
  onCardClick,
  panelRenderer,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const handleDndEnd = (event) => {
    if (!editable || !onDragEnd) return;

    const { active, over } = event;
    if (!over) return;

    const activeData = active?.data?.current;
    if (!activeData?.staff) return;

    const target = resolveTarget(over);
    if (!target?.dateKey || !target?.shiftId) return;

    onDragEnd({
      staff: activeData.staff,
      from: {
        type: activeData.type,
        dateKey: activeData.dateKey || null,
        shiftId: activeData.shiftId ? String(activeData.shiftId) : null,
      },
      to: target,
    });
  };

  if (!editable) {
    return (
      <div className="schedule-container">
        <GridBody
          weekDates={weekDates}
          shifts={shifts}
          assignments={assignments}
          editable={false}
          onRemove={onRemove}
          onCardClick={onCardClick}
        />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDndEnd}
    >
      <DragMonitor>
        <div className="schedule-container">
          <GridBody
            weekDates={weekDates}
            shifts={shifts}
            assignments={assignments}
            editable
            onRemove={onRemove}
            onCardClick={onCardClick}
          />
        </div>

        {panelRenderer?.()}
      </DragMonitor>
    </DndContext>
  );
}
