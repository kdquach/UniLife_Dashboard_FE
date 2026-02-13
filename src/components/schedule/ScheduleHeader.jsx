export default function ScheduleHeader({
  title,
  weekLabel,
  onPrevWeek,
  onToday,
  onNextWeek,
}) {
  return (
    <div className="schedule-header">
      <div className="schedule-header-left">
        <button type="button" className="schedule-nav-btn" onClick={onPrevWeek}>
          ‹
        </button>
        <button type="button" className="schedule-nav-btn schedule-today-btn" onClick={onToday}>
          Today
        </button>
        <button type="button" className="schedule-nav-btn" onClick={onNextWeek}>
          ›
        </button>
      </div>

      <div className="schedule-header-right">
        <div className="schedule-header-title">{title}</div>
        <div className="schedule-header-week">{weekLabel}</div>
      </div>
    </div>
  );
}
