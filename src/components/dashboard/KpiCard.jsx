import { Tooltip } from "antd";
import {
  formatKpiValue,
  getTrendColor,
  getTrendBg,
  getTrendIcon,
  formatVND,
  isMoneyKpi,
} from "@/utils/dashboard.utils";

/**
 * KpiCard — renders a single KPI metric card.
 *
 * Props:
 *  - kpi: { label, value, unit, delta?: { display, trend, value }, comparisonValue? }
 */
export default function KpiCard({ kpi }) {
  if (!kpi) return null;

  const { label, delta, comparisonValue } = kpi;
  const displayValue = formatKpiValue(kpi);
  const hasDelta = delta && delta.display != null;

  const comparisonText =
    comparisonValue != null
      ? `Kỳ trước: ${isMoneyKpi(label) ? formatVND(comparisonValue) : comparisonValue}`
      : null;

  return (
    <div className="cd-kpi-card">
      <div className="cd-kpi-label">{label}</div>
      <div className="cd-kpi-value">{displayValue}</div>

      {hasDelta && (
        <Tooltip title={comparisonText}>
          <div
            className="cd-kpi-delta"
            style={{
              color: getTrendColor(delta.trend),
              background: getTrendBg(delta.trend),
            }}
          >
            <span>{getTrendIcon(delta.trend)}</span>
            <span>{delta.display}</span>
          </div>
        </Tooltip>
      )}

      {!hasDelta && comparisonText && (
        <div className="cd-kpi-comparison">{comparisonText}</div>
      )}
    </div>
  );
}
