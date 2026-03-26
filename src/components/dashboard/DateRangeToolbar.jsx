import { Select, DatePicker, Button, Tooltip } from "antd";
import dayjs from "dayjs";
import GIcon from "@/components/GIcon";
import {
  PRESET_OPTIONS,
  GRANULARITY_OPTIONS,
} from "@/utils/dashboard.utils";

const { RangePicker } = DatePicker;

/**
 * DateRangeToolbar — shared filter bar for all dashboard tabs.
 *
 * Props:
 *  - preset, onPresetChange
 *  - dateRange ({ from, to }), onDateRangeChange(from, to)
 *  - granularity, onGranularityChange
 *  - onRefresh
 *  - loading
 */
export default function DateRangeToolbar({
  preset,
  onPresetChange,
  dateRange,
  onDateRangeChange,
  granularity,
  onGranularityChange,
  onRefresh,
  loading,
}) {
  const rangeValue =
    dateRange?.from && dateRange?.to
      ? [dayjs(dateRange.from), dayjs(dateRange.to)]
      : null;

  const handleRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      onDateRangeChange(
        dates[0].format("YYYY-MM-DD"),
        dates[1].format("YYYY-MM-DD")
      );
    } else {
      onDateRangeChange("", "");
    }
  };

  const disableFuture = (current) => {
    return current && current.isAfter(dayjs(), "day");
  };

  return (
    <div className="cd-toolbar">
      <span className="cd-toolbar-label">Khoảng thời gian</span>

      <Select
        placeholder="Chọn nhanh..."
        value={preset || undefined}
        onChange={onPresetChange}
        allowClear
        options={PRESET_OPTIONS}
        style={{ minWidth: 150 }}
        popupMatchSelectWidth={false}
      />

      <div className="cd-toolbar-divider" />

      <RangePicker
        value={rangeValue}
        onChange={handleRangeChange}
        format="DD/MM/YYYY"
        placeholder={["Từ ngày", "Đến ngày"]}
        disabledDate={disableFuture}
        allowClear
        style={{ minWidth: 260 }}
      />

      <div className="cd-toolbar-divider" />

      <Select
        placeholder="Granularity"
        value={granularity || undefined}
        onChange={onGranularityChange}
        allowClear
        options={GRANULARITY_OPTIONS.filter((g) => g.value !== "")}
        style={{ minWidth: 120 }}
        popupMatchSelectWidth={false}
      />

      <Tooltip title="Làm mới dữ liệu">
        <Button
          type="default"
          icon={<GIcon name="refresh" />}
          onClick={onRefresh}
          loading={loading}
          style={{ borderRadius: 12, height: 36 }}
        />
      </Tooltip>
    </div>
  );
}
