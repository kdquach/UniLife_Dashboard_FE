import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Spin } from "antd";
import KpiCard from "./KpiCard";
import ChartCard from "./ChartCard";
import { CHART_COLORS } from "@/utils/dashboard.utils";

/**
 * OrderMetricsTab — Tab 1: Tổng quan Đơn hàng
 *
 * Props:
 *  - data: API response data from /dashboard/order-metrics
 *  - loading: boolean
 */
export default function OrderMetricsTab({ data, loading }) {
  if (loading) {
    return (
      <div className="cd-tab-panel">
        <div className="cd-kpi-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="cd-skeleton" style={{ height: 110 }} />
          ))}
        </div>
        <div className="cd-skeleton" style={{ height: 350 }} />
      </div>
    );
  }

  const kpi = data?.kpi || {};
  const timeSeries = data?.timeSeries;

  // Build Recharts-friendly data from timeSeries
  const chartData = timeSeries?.labels?.map((label, index) => {
    const point = { name: label };
    timeSeries.datasets?.forEach((ds) => {
      point[ds.label] = ds.data?.[index] ?? 0;
    });
    return point;
  }) || [];

  const DATASET_COLORS = [CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.danger];

  const kpiKeys = [
    "totalOrders",
    "completedOrders",
    "cancelledOrders",
    "pendingOrders",
    "completionRate",
    "cancellationRate",
    "uniqueCustomers",
    "qrScanRate",
  ];

  return (
    <div className="cd-tab-panel">
      {/* KPI Cards */}
      <div className="cd-kpi-grid">
        {kpiKeys.map((key) => (
          <KpiCard key={key} kpi={kpi[key]} />
        ))}
      </div>

      {/* Line Chart: Order timeSeries */}
      <ChartCard
        title="📈 Biểu đồ Đơn hàng theo thời gian"
        icon="show_chart"
        empty={chartData.length === 0}
      >
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
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
            <Tooltip
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
                stroke={DATASET_COLORS[i] || CHART_COLORS.gray}
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
