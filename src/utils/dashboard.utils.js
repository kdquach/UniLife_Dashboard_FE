import dayjs from "dayjs";

/* ──────────────── Currency & Number Formatting ──────────────── */

/**
 * Format an integer (VND) to locale string with ₫ suffix.
 * 342000 → "342.000₫"
 */
export function formatVND(num) {
  if (num == null || isNaN(num)) return "0₫";
  return Number(num).toLocaleString("vi-VN") + "₫";
}

/**
 * Format a number with dot separator (no currency).
 * 342000 → "342.000"
 */
export function formatNumber(num) {
  if (num == null || isNaN(num)) return "0";
  return Number(num).toLocaleString("vi-VN");
}

/* ──────────────── Delta / Trend ──────────────── */

export function getTrendColor(trend) {
  switch (trend) {
    case "up":
      return "var(--success)";
    case "down":
      return "var(--danger)";
    default:
      return "var(--text-muted)";
  }
}

export function getTrendBg(trend) {
  switch (trend) {
    case "up":
      return "rgba(46,125,50,0.12)";
    case "down":
      return "rgba(135,40,34,0.12)";
    default:
      return "rgba(95,107,115,0.10)";
  }
}

export function getTrendIcon(trend) {
  switch (trend) {
    case "up":
      return "▲";
    case "down":
      return "▼";
    default:
      return "─";
  }
}

/**
 * Determine if a KPI value should be formatted as VND.
 */
const MONEY_KEYWORDS = [
  "doanh thu",
  "hoàn tiền",
  "trung bình",
  "lớn nhất",
  "nhỏ nhất",
  "giảm giá",
  "revenue",
  "refund",
  "discount",
  "avg",
  "max",
  "min",
];

export function isMoneyKpi(label = "") {
  const lower = label.toLowerCase();
  return MONEY_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Format a KPI value smartly based on its label and unit.
 */
export function formatKpiValue(kpi) {
  if (!kpi) return "0";
  const { value, unit, label } = kpi;
  if (unit === "%") return `${value ?? 0}%`;
  if (isMoneyKpi(label || "")) return formatVND(value);
  return formatNumber(value ?? 0);
}

/* ──────────────── Preset & Granularity options ──────────────── */

export const PRESET_OPTIONS = [
  { label: "Hôm nay", value: "today" },
  { label: "Hôm qua", value: "yesterday" },
  { label: "Tuần này", value: "this_week" },
  { label: "Tuần trước", value: "last_week" },
  { label: "Tháng này", value: "this_month" },
  { label: "Tháng trước", value: "last_month" },
  { label: "Quý này", value: "this_quarter" },
  { label: "Quý trước", value: "last_quarter" },
  { label: "Năm nay", value: "this_year" },
  { label: "Năm trước", value: "last_year" },
];

export const GRANULARITY_OPTIONS = [
  { label: "Tự động", value: "" },
  { label: "Giờ", value: "hour" },
  { label: "Ngày", value: "day" },
  { label: "Tuần", value: "week" },
  { label: "Tháng", value: "month" },
  { label: "Quý", value: "quarter" },
  { label: "Năm", value: "year" },
];

/* ──────────────── Weekday mapping (MongoDB $dayOfWeek) ──────────────── */

const WEEKDAY_MAP = {
  1: "CN",
  2: "T2",
  3: "T3",
  4: "T4",
  5: "T5",
  6: "T6",
  7: "T7",
};

export function mapWeekday(num) {
  return WEEKDAY_MAP[num] || `?${num}`;
}

/* ──────────────── Date Validation (FE-side, before API call) ──────────────── */

const VALID_PRESETS = PRESET_OPTIONS.map((p) => p.value);
const VALID_GRANULARITIES = ["hour", "day", "week", "month", "quarter", "year"];

/**
 * Validate date params before sending to API.
 * Returns { valid: true } or { valid: false, message: string }
 */
export function validateDateParams({ preset, from, to, granularity }) {
  // V5: preset and from/to cannot be used together
  if (preset && (from || to)) {
    return { valid: false, message: "Không thể dùng Preset cùng với khoảng ngày tuỳ chọn" };
  }

  // V4: preset must be valid
  if (preset && !VALID_PRESETS.includes(preset)) {
    return { valid: false, message: `Preset "${preset}" không hợp lệ` };
  }

  // V14: granularity must be valid
  if (granularity && !VALID_GRANULARITIES.includes(granularity)) {
    return { valid: false, message: `Granularity "${granularity}" không hợp lệ` };
  }

  // Custom range validations
  if (from || to) {
    // V6: both required
    if (!from || !to) {
      return { valid: false, message: "Cần nhập cả Từ ngày và Đến ngày" };
    }

    const fromDate = dayjs(from, "YYYY-MM-DD", true);
    const toDate = dayjs(to, "YYYY-MM-DD", true);

    // V7, V8: format
    if (!fromDate.isValid()) {
      return { valid: false, message: "Từ ngày không đúng định dạng YYYY-MM-DD" };
    }
    if (!toDate.isValid()) {
      return { valid: false, message: "Đến ngày không đúng định dạng YYYY-MM-DD" };
    }

    const now = dayjs();

    // V9, V10: future dates
    if (fromDate.isAfter(now, "day")) {
      return { valid: false, message: "Từ ngày không được ở tương lai" };
    }
    if (toDate.isAfter(now, "day")) {
      return { valid: false, message: "Đến ngày không được ở tương lai" };
    }

    // V11: from before to
    if (fromDate.isAfter(toDate, "day")) {
      return { valid: false, message: "Từ ngày phải trước Đến ngày" };
    }

    // V12: not older than 3 years
    const threeYearsAgo = now.subtract(3, "year");
    if (fromDate.isBefore(threeYearsAgo, "day")) {
      return { valid: false, message: "Từ ngày không được cũ hơn 3 năm" };
    }

    // V13: max 730 days
    const diffDays = toDate.diff(fromDate, "day");
    if (diffDays > 730) {
      return { valid: false, message: `Khoảng thời gian không được vượt quá 730 ngày (hiện tại: ${diffDays} ngày)` };
    }
  }

  return { valid: true };
}

/* ──────────────── Chart Color Palette ──────────────── */

export const CHART_COLORS = {
  primary: "#4F46E5",
  primaryAlpha: "rgba(79,70,229,0.15)",
  success: "#10B981",
  successAlpha: "rgba(16,185,129,0.15)",
  danger: "#EF4444",
  dangerAlpha: "rgba(239,68,68,0.15)",
  warning: "#F59E0B",
  gray: "#9CA3AF",
  grayAlpha: "rgba(156,163,175,0.15)",
  momo: "#A855F7",
  cash: "#6B7280",
  vnpay: "#EF4444",
  sepay: "#3B82F6",
  morning: "#FCD34D",
  lunch: "#F97316",
  afternoon: "#818CF8",
  offHours: "#9CA3AF",
};

/* ──────────────── Heatmap color scale ──────────────── */

/**
 * Generate a color on a green → yellow → red scale based on intensity 0..1
 */
export function heatmapColor(intensity) {
  if (intensity <= 0) return "rgba(79,70,229,0.04)";
  if (intensity < 0.25) return "rgba(79,70,229,0.15)";
  if (intensity < 0.5) return "rgba(79,70,229,0.30)";
  if (intensity < 0.75) return "rgba(79,70,229,0.50)";
  return "rgba(79,70,229,0.75)";
}
