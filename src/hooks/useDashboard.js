import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  getOrderMetrics,
  getGrowthSummary,
  getRevenue,
} from "@/services/dashboard.service";
import { validateDateParams } from "@/utils/dashboard.utils";
import { translateError } from "@/utils/errorTranslator";

const TAB_KEYS = {
  ORDER_METRICS: "order-metrics",
  GROWTH: "growth",
  REVENUE: "revenue",
};

const FETCHERS = {
  [TAB_KEYS.ORDER_METRICS]: getOrderMetrics,
  [TAB_KEYS.GROWTH]: getGrowthSummary,
  [TAB_KEYS.REVENUE]: getRevenue,
};

/**
 * Custom hook for the Canteen Dashboard.
 * Manages active tab, date filters, API state (loading/error/data).
 */
export default function useDashboard() {
  const [activeTab, setActiveTab] = useState(TAB_KEYS.ORDER_METRICS);

  // Date filter state
  const [preset, setPreset] = useState("today");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [granularity, setGranularity] = useState("");

  // API state per tab
  const [data, setData] = useState({
    [TAB_KEYS.ORDER_METRICS]: null,
    [TAB_KEYS.GROWTH]: null,
    [TAB_KEYS.REVENUE]: null,
  });
  const [loading, setLoading] = useState({
    [TAB_KEYS.ORDER_METRICS]: false,
    [TAB_KEYS.GROWTH]: false,
    [TAB_KEYS.REVENUE]: false,
  });
  const [error, setError] = useState({
    [TAB_KEYS.ORDER_METRICS]: null,
    [TAB_KEYS.GROWTH]: null,
    [TAB_KEYS.REVENUE]: null,
  });

  // Track whether initial fetch has occurred for each tab
  const fetchedRef = useRef({
    [TAB_KEYS.ORDER_METRICS]: false,
    [TAB_KEYS.GROWTH]: false,
    [TAB_KEYS.REVENUE]: false,
  });

  /* ── Build query params ── */
  const buildParams = useCallback(() => {
    const params = {};
    if (preset) {
      params.preset = preset;
    } else if (dateRange.from && dateRange.to) {
      params.from = dateRange.from;
      params.to = dateRange.to;
    }
    if (granularity) {
      params.granularity = granularity;
    }
    return params;
  }, [preset, dateRange, granularity]);

  /* ── Fetch a single tab ── */
  const fetchTab = useCallback(
    async (tabKey) => {
      const params = buildParams();

      // Validate before sending
      const validation = validateDateParams({
        preset: params.preset,
        from: params.from,
        to: params.to,
        granularity: params.granularity,
      });
      if (!validation.valid) {
        toast.error(validation.message);
        return;
      }

      setLoading((prev) => ({ ...prev, [tabKey]: true }));
      setError((prev) => ({ ...prev, [tabKey]: null }));

      try {
        const fetcher = FETCHERS[tabKey];
        const response = await fetcher(params);

        if (response?.status === "fail") {
          throw new Error(response.error || "Có lỗi xảy ra");
        }

        setData((prev) => ({ ...prev, [tabKey]: response?.data || response }));
      } catch (err) {
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Không thể tải dữ liệu";
        setError((prev) => ({ ...prev, [tabKey]: msg }));
        toast.error(translateError(msg));
      } finally {
        setLoading((prev) => ({ ...prev, [tabKey]: false }));
      }
    },
    [buildParams]
  );

  /* ── Fetch active tab ── */
  const fetchActiveTab = useCallback(() => {
    fetchTab(activeTab);
  }, [activeTab, fetchTab]);

  /* ── Refresh all cached data ── */
  const refreshAll = useCallback(() => {
    // Clear all data so each tab refetches
    fetchedRef.current = {
      [TAB_KEYS.ORDER_METRICS]: false,
      [TAB_KEYS.GROWTH]: false,
      [TAB_KEYS.REVENUE]: false,
    };
    setData({
      [TAB_KEYS.ORDER_METRICS]: null,
      [TAB_KEYS.GROWTH]: null,
      [TAB_KEYS.REVENUE]: null,
    });
    fetchTab(activeTab);
  }, [activeTab, fetchTab]);

  /* ── Date handler: preset ── */
  const handlePresetChange = useCallback((value) => {
    setPreset(value || "");
    if (value) {
      setDateRange({ from: "", to: "" }); // mutual exclusion
    }
  }, []);

  /* ── Date handler: custom range ── */
  const handleDateRangeChange = useCallback((from, to) => {
    setDateRange({ from, to });
    if (from || to) {
      setPreset(""); // mutual exclusion
    }
  }, []);

  /* ── Granularity handler ── */
  const handleGranularityChange = useCallback((value) => {
    setGranularity(value || "");
  }, []);

  /* ── Tab change handler ── */
  const handleTabChange = useCallback(
    (newTab) => {
      setActiveTab(newTab);
      // If tab data hasn't been fetched yet with current params, fetch it
      if (!data[newTab]) {
        fetchTab(newTab);
      }
    },
    [data, fetchTab]
  );

  /* ── Initial fetch on mount ── */
  useEffect(() => {
    if (!fetchedRef.current[TAB_KEYS.ORDER_METRICS]) {
      fetchedRef.current[TAB_KEYS.ORDER_METRICS] = true;
      fetchTab(TAB_KEYS.ORDER_METRICS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Refetch all on date/granularity change ── */
  const prevParamsRef = useRef(null);
  useEffect(() => {
    const currentParams = JSON.stringify({ preset, dateRange, granularity });
    if (prevParamsRef.current === null) {
      prevParamsRef.current = currentParams;
      return; // skip initial
    }
    if (prevParamsRef.current !== currentParams) {
      prevParamsRef.current = currentParams;
      // Mark all tabs as not fetched so they re-fetch when navigated to
      fetchedRef.current = {
        [TAB_KEYS.ORDER_METRICS]: false,
        [TAB_KEYS.GROWTH]: false,
        [TAB_KEYS.REVENUE]: false,
      };
      setData({
        [TAB_KEYS.ORDER_METRICS]: null,
        [TAB_KEYS.GROWTH]: null,
        [TAB_KEYS.REVENUE]: null,
      });
      fetchTab(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, dateRange, granularity]);

  return {
    // Tab
    activeTab,
    handleTabChange,
    TAB_KEYS,

    // Date filters
    preset,
    dateRange,
    granularity,
    handlePresetChange,
    handleDateRangeChange,
    handleGranularityChange,

    // Data
    data,
    loading,
    error,

    // Actions
    fetchActiveTab,
    refreshAll,
  };
}
