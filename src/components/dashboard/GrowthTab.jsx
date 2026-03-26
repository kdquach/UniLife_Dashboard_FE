import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label,
} from "recharts";
import KpiCard from "./KpiCard";
import ChartCard from "./ChartCard";
import { CHART_COLORS, formatNumber } from "@/utils/dashboard.utils";

const DONUT_COLORS = [CHART_COLORS.primary, CHART_COLORS.success];

/**
 * GrowthTab — Tab 2: Tăng trưởng
 *
 * Props:
 *  - data: API response data from /dashboard/growth-summary
 *  - loading: boolean
 */
export default function GrowthTab({ data, loading }) {
  if (loading) {
    return (
      <div className="cd-tab-panel">
        <div className="cd-kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="cd-skeleton" style={{ height: 110 }} />
          ))}
        </div>
        <div className="cd-charts-row">
          <div className="cd-skeleton" style={{ height: 300 }} />
          <div className="cd-skeleton" style={{ height: 300 }} />
        </div>
      </div>
    );
  }

  const growth = data?.growth || {};
  const customerBreakdown = data?.customerBreakdown;
  const timeSeries = data?.timeSeries;

  // KPI keys
  const kpiKeys = ["orders", "revenue", "customers"];

  // Donut chart data
  const donutData = customerBreakdown?.chart
    ? customerBreakdown.chart.labels.map((label, i) => ({
        name: label,
        value: customerBreakdown.chart.datasets?.[0]?.data?.[i] || 0,
      }))
    : [];

  // Line chart data (overlay: current vs previous)
  const lineData = timeSeries?.labels?.map((label, index) => {
    const point = { name: label };
    timeSeries.datasets?.forEach((ds) => {
      point[ds.label] = ds.data?.[index] ?? 0;
    });
    return point;
  }) || [];

  // Custom label for donut chart center
  const renderCenterLabel = ({ viewBox }) => {
    const { cx, cy } = viewBox;
    if (!customerBreakdown) return null;
    return (
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 22, fontWeight: 800, fill: "#0f232e" }}
      >
        {formatNumber(customerBreakdown.total || 0)}
      </text>
    );
  };

  return (
    <div className="cd-tab-panel">
      {/* KPI Cards — 3 columns */}
      <div className="cd-kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {kpiKeys.map((key) => (
          <KpiCard key={key} kpi={growth[key]} />
        ))}
      </div>

      {/* Charts row: Donut + Line overlay */}
      <div className="cd-charts-row">
        {/* Customer Breakdown Donut */}
        <ChartCard
          title="🍩 Phân loại Khách hàng"
          icon="group"
          empty={donutData.length === 0 || donutData.every((d) => d.value === 0)}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {donutData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={customerBreakdown?.chart?.datasets?.[0]?.backgroundColor?.[i] || DONUT_COLORS[i]}
                  />
                ))}
                <Label content={renderCenterLabel} />
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #ececec",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          {/* Summary below chart */}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 8 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: CHART_COLORS.primary }}>
                {customerBreakdown?.new ?? 0}
              </div>
              <div style={{ fontSize: 12, color: "#5f6b73" }}>Khách mới</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: CHART_COLORS.success }}>
                {customerBreakdown?.returning ?? 0}
              </div>
              <div style={{ fontSize: 12, color: "#5f6b73" }}>Quay lại</div>
            </div>
          </div>
        </ChartCard>

        {/* Growth Overlay Line Chart */}
        <ChartCard
          title="📈 So sánh Tăng trưởng"
          icon="trending_up"
          empty={lineData.length === 0}
        >
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#5f6b73" }}
                axisLine={{ stroke: "#ececec" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#5f6b73" }}
                axisLine={{ stroke: "#ececec" }}
                allowDecimals={false}
              />
              <RechartsTooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #ececec",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Legend />
              {timeSeries?.datasets?.map((ds, i) => (
                <Line
                  key={ds.label}
                  type="monotone"
                  dataKey={ds.label}
                  stroke={ds.borderColor || (i === 0 ? CHART_COLORS.primary : CHART_COLORS.gray)}
                  strokeWidth={2.5}
                  strokeDasharray={ds.borderDash ? ds.borderDash.join(" ") : undefined}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
