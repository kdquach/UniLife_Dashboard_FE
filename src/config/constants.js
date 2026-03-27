// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

// App Configuration
export const APP_NAME = "UniLife Dashboard";
export const APP_VERSION = "1.0.0";

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Date Format
export const DATE_FORMAT = "DD/MM/YYYY";
export const DATETIME_FORMAT = "DD/MM/YYYY HH:mm";

// Status Colors
export const STATUS_COLORS = {
  pending: "warning",
  confirmed: "info",
  preparing: "processing",
  ready: "teal",
  completed: "sky",
  received: "success",
  cancelled: "error",
  active: "success",
  inactive: "default",
};

// Status Labels
export const STATUS_LABELS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
  ready: "Đã chế biến xong",
  completed: "Sẵn sàng nhận món",
  received: "Đã nhận hàng",
  cancelled: "Đã hủy",
  active: "Hoạt động",
  inactive: "Không hoạt động",
};

// User Roles
export const USER_ROLES = {
  admin: "Quản trị viên",
  canteen_owner: "Chủ căng tin",
  manager: "Quản lý",
  staff: "Nhân viên",
  customer: "Khách hàng",
};

export const STAFF_GENDER_OPTIONS = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
];

export const STAFF_STATUS_OPTIONS = [
  { value: "active", label: "Đang hoạt động" },
  { value: "inactive", label: "Ngưng hoạt động" },
  { value: "pending", label: "Chờ kích hoạt" },
  { value: "banned", label: "Bị khóa" },
];
