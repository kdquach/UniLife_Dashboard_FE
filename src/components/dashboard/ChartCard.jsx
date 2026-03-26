import { Spin } from "antd";
import GIcon from "@/components/GIcon";

/**
 * ChartCard — wrapper for charts with title, loading, and empty state.
 *
 * Props:
 *  - title: string
 *  - icon?: string (material icon name)
 *  - loading?: boolean
 *  - empty?: boolean
 *  - children: chart content
 *  - style?: object
 */
export default function ChartCard({
  title,
  icon,
  loading = false,
  empty = false,
  children,
  style,
}) {
  return (
    <div className="cd-chart-card" style={style}>
      {title && (
        <div className="cd-chart-title">
          {icon && <GIcon name={icon} />}
          {title}
        </div>
      )}

      {loading ? (
        <div className="cd-chart-empty">
          <Spin size="large" />
          <span>Đang tải dữ liệu...</span>
        </div>
      ) : empty ? (
        <div className="cd-chart-empty">
          <span className="cd-chart-empty-icon material-symbols-rounded">
            insert_chart
          </span>
          <span>Chưa có dữ liệu</span>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
