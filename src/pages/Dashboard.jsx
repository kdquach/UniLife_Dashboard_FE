import { Tabs } from "antd";
import useDashboard from "@/hooks/useDashboard";
import DateRangeToolbar from "@/components/dashboard/DateRangeToolbar";
import OrderMetricsTab from "@/components/dashboard/OrderMetricsTab";
import GrowthTab from "@/components/dashboard/GrowthTab";
import RevenueTab from "@/components/dashboard/RevenueTab";
import "@/styles/canteen-dashboard.css";

const TAB_ITEMS = [
  {
    key: "order-metrics",
    label: "📦 Tổng quan Đơn hàng",
  },
  {
    key: "growth",
    label: "📈 Tăng trưởng",
  },
  {
    key: "revenue",
    label: "💰 Doanh thu",
  },
];

export default function DashboardPage() {
  const {
    activeTab,
    handleTabChange,
    preset,
    dateRange,
    granularity,
    handlePresetChange,
    handleDateRangeChange,
    handleGranularityChange,
    data,
    loading,
    refreshAll,
  } = useDashboard();

  const isAnyLoading = Object.values(loading).some(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header */}
      <div className="cd-header">
        <div>
          <div className="cd-header-subtitle">Tổng quan</div>
          <div className="cd-header-title">
            <span>📊</span>
            Dashboard Canteen
          </div>
        </div>
      </div>

      {/* Date Range Toolbar (shared) */}
      <DateRangeToolbar
        preset={preset}
        onPresetChange={handlePresetChange}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        granularity={granularity}
        onGranularityChange={handleGranularityChange}
        onRefresh={refreshAll}
        loading={isAnyLoading}
      />

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={TAB_ITEMS}
        size="large"
        style={{ marginBottom: 0 }}
        tabBarStyle={{
          fontWeight: 600,
          marginBottom: 16,
        }}
      />

      {/* Tab Content */}
      {activeTab === "order-metrics" && (
        <OrderMetricsTab
          data={data["order-metrics"]}
          loading={loading["order-metrics"]}
        />
      )}

      {activeTab === "growth" && (
        <GrowthTab
          data={data["growth"]}
          loading={loading["growth"]}
        />
      )}

      {activeTab === "revenue" && (
        <RevenueTab
          data={data["revenue"]}
          loading={loading["revenue"]}
        />
      )}
    </div>
  );
}
