import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import KpiCard from "./KpiCard";
import ChartCard from "./ChartCard";
import HeatmapChart from "./HeatmapChart";
import { CHART_COLORS, formatVND, formatNumber } from "@/utils/dashboard.utils";

/**
 * RevenueTab — Tab 3: Doanh thu
 *
 * Props:
 *  - data: API response data from /dashboard/revenue
 *  - loading: boolean
 */
export default function RevenueTab({ data, loading }) {
  if (loading) {
    return (
      <div className="cd-tab-panel">
        <div className="cd-kpi-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="cd-skeleton" style={{ height: 110 }} />
          ))}
        </div>
        <div className="cd-skeleton" style={{ height: 350, marginBottom: 20 }} />
        <div className="cd-charts-row">
          <div className="cd-skeleton" style={{ height: 300 }} />
          <div className="cd-skeleton" style={{ height: 300 }} />
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const revenueTimeSeries = data?.revenueTimeSeries;
  const byPaymentMethod = data?.byPaymentMethod;
  const byShift = data?.byShift;
  const topMenuItems = data?.topMenuItems;
  const hourlyHeatmap = data?.hourlyHeatmap;

  // KPI keys
  const kpiKeys = [
    "grossRevenue",
    "netRevenue",
    "refundedAmount",
    "transactions",
    "avgOrderValue",
    "maxOrderValue",
    "minOrderValue",
    "discountTotal",
  ];

  /* ── Area chart data ── */
  const areaData = revenueTimeSeries?.labels?.map((label, index) => {
    const point = { name: label };
    revenueTimeSeries.datasets?.forEach((ds) => {
      point[ds.label] = ds.data?.[index] ?? 0;
    });
    return point;
  }) || [];

  /* ── Payment method donut ── */
  const paymentLabels = byPaymentMethod?.labels || [];
  const paymentData = paymentLabels.map((label, i) => ({
    name: label.toUpperCase(),
    value: byPaymentMethod?.datasets?.[0]?.data?.[i] || 0,
  }));
  const paymentColors = byPaymentMethod?.datasets?.[0]?.backgroundColor || [
    CHART_COLORS.momo,
    CHART_COLORS.cash,
    CHART_COLORS.vnpay,
    CHART_COLORS.sepay,
  ];

  /* ── Shift bar data ── */
  const shiftData = byShift?.labels?.map((label, i) => ({
    name: label,
    value: byShift?.datasets?.[0]?.data?.[i] || 0,
  })) || [];
  const shiftColors = byShift?.datasets?.[0]?.backgroundColor || [
    CHART_COLORS.morning,
    CHART_COLORS.lunch,
    CHART_COLORS.afternoon,
    CHART_COLORS.offHours,
  ];

  /* ── Top menu items horizontal bar ── */
  const topItemsData = topMenuItems?.labels?.map((label, i) => ({
    name: label,
    revenue: topMenuItems?.datasets?.[0]?.data?.[i] || 0,
  })) || [];

  /* ── VND tooltip formatter ── */
  const vndFormatter = (value) => formatVND(value);

  return (
    <div className="cd-tab-panel">
      {/* KPI Cards */}
      <div className="cd-kpi-grid">
        {kpiKeys.map((key) => (
          <KpiCard key={key} kpi={summary[key]} />
        ))}
      </div>

      {/* Area Chart: Revenue over time */}
      <ChartCard
        title="📈 Doanh thu theo thời gian"
        icon="area_chart"
        empty={areaData.length === 0}
      >
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={areaData}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#5f6b73" }}
              axisLine={{ stroke: "#ececec" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#5f6b73" }}
              axisLine={{ stroke: "#ececec" }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <RechartsTooltip
              formatter={vndFormatter}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #ececec",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Legend />
            {revenueTimeSeries?.datasets?.map((ds) => (
              <Area
                key={ds.label}
                type="monotone"
                dataKey={ds.label}
                stroke={ds.borderColor || CHART_COLORS.primary}
                fill="url(#revenueGrad)"
                strokeWidth={2.5}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Row: Payment Donut + Shift Bar */}
      <div className="cd-charts-row">
        {/* Payment Method Donut */}
        <ChartCard
          title="🍩 Phương thức Thanh toán"
          icon="payments"
          empty={paymentData.length === 0 || paymentData.every((d) => d.value === 0)}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {paymentData.map((_, i) => (
                  <Cell key={i} fill={paymentColors[i] || CHART_COLORS.gray} />
                ))}
              </Pie>
              <RechartsTooltip
                formatter={vndFormatter}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #ececec",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          {/* Breakdown details */}
          {byPaymentMethod?.breakdown && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8, justifyContent: "center" }}>
              {Object.entries(byPaymentMethod.breakdown).map(([method, info]) => (
                <div
                  key={method}
                  style={{
                    background: "rgba(245,246,248,0.75)",
                    borderRadius: 10,
                    padding: "6px 12px",
                    fontSize: 12,
                  }}
                >
                  <strong>{method.toUpperCase()}</strong>: {formatVND(info.total)} ({info.count} đơn)
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* Revenue by Shift */}
        <ChartCard
          title="📊 Doanh thu theo Ca"
          icon="schedule"
          empty={shiftData.length === 0 || shiftData.every((d) => d.value === 0)}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={shiftData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#5f6b73" }}
                axisLine={{ stroke: "#ececec" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#5f6b73" }}
                axisLine={{ stroke: "#ececec" }}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              />
              <RechartsTooltip
                formatter={vndFormatter}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #ececec",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              >
                {shiftData.map((_, i) => (
                  <Cell key={i} fill={shiftColors[i] || CHART_COLORS.gray} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top 10 Menu Items — Horizontal Bar */}
      <ChartCard
        title="🔥 Top Món bán chạy"
        icon="restaurant"
        empty={topItemsData.length === 0}
      >
        <ResponsiveContainer width="100%" height={Math.max(300, topItemsData.length * 42)}>
          <BarChart data={topItemsData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "#5f6b73" }}
              axisLine={{ stroke: "#ececec" }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: "#5f6b73" }}
              axisLine={{ stroke: "#ececec" }}
              width={100}
            />
            <RechartsTooltip
              formatter={vndFormatter}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #ececec",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Bar
              dataKey="revenue"
              fill={CHART_COLORS.primary}
              radius={[0, 8, 8, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Details table */}
        {topMenuItems?.details && topMenuItems.details.length > 0 && (
          <table className="cd-top-items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên món</th>
                <th>Doanh thu</th>
                <th>SL bán</th>
                <th>Đơn hàng</th>
              </tr>
            </thead>
            <tbody>
              {topMenuItems.details.map((item, i) => (
                <tr key={item._id || i}>
                  <td>
                    <div className="cd-top-items-rank">{i + 1}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>{formatVND(item.revenue)}</td>
                  <td>{item.quantity}</td>
                  <td>{item.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ChartCard>

      {/* Heatmap: Revenue by Hour × Weekday */}
      <ChartCard
        title="🔥 Heatmap — Doanh thu theo Giờ × Thứ"
        icon="calendar_view_day"
        empty={!hourlyHeatmap || hourlyHeatmap.length === 0}
      >
        <HeatmapChart data={hourlyHeatmap || []} />
      </ChartCard>
    </div>
  );
}
