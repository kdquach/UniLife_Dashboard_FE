import { Tooltip } from "antd";
import { mapWeekday, heatmapColor, formatVND } from "@/utils/dashboard.utils";

// Hours 0–23
const HOURS = Array.from({ length: 24 }, (_, i) => i);
// Weekdays 2–7, 1 (Mon–Sat, Sun) for business-friendly display
const WEEKDAYS = [2, 3, 4, 5, 6, 7, 1];

/**
 * HeatmapChart — custom CSS grid heatmap for revenue by hour × weekday.
 *
 * Props:
 *  - data: array of { _id: { hour, weekday }, revenue, count }
 */
export default function HeatmapChart({ data = [] }) {
  // Build lookup map
  const lookup = {};
  let maxRevenue = 0;
  data.forEach((entry) => {
    const key = `${entry._id.weekday}-${entry._id.hour}`;
    lookup[key] = entry;
    if (entry.revenue > maxRevenue) maxRevenue = entry.revenue;
  });

  return (
    <div className="cd-heatmap">
      {/* Header row: empty corner + hour labels */}
      <div className="cd-heatmap-label" />
      {HOURS.map((h) => (
        <div key={`h-${h}`} className="cd-heatmap-header">
          {h}
        </div>
      ))}

      {/* Data rows */}
      {WEEKDAYS.map((wd) => (
        <>
          <div key={`wd-${wd}`} className="cd-heatmap-label">
            {mapWeekday(wd)}
          </div>
          {HOURS.map((h) => {
            const key = `${wd}-${h}`;
            const entry = lookup[key];
            const intensity = entry && maxRevenue > 0 ? entry.revenue / maxRevenue : 0;
            return (
              <Tooltip
                key={key}
                title={
                  entry
                    ? `${mapWeekday(wd)} ${h}:00 — ${formatVND(entry.revenue)} (${entry.count} đơn)`
                    : `${mapWeekday(wd)} ${h}:00 — Không có dữ liệu`
                }
              >
                <div
                  className="cd-heatmap-cell"
                  style={{ background: heatmapColor(intensity) }}
                />
              </Tooltip>
            );
          })}
        </>
      ))}
    </div>
  );
}
