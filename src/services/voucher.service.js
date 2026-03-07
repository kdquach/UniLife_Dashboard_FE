import { api } from "./axios.config";

/**
 * Lấy danh sách voucher (Admin/Manager)
 * @param {Object} params - Query parameters (page, limit, search, state, scope, discountType, canteen_ids, createdBy, showArchived, sort)
 * @returns {Promise} Response chứa danh sách voucher và pagination
 */
export const getVouchers = async (params = {}) => {
  const response = await api.get("/vouchers", { params });
  return response.data;
};

/**
 * Lấy chi tiết voucher + thống kê sử dụng
 * @param {string} id - ID của voucher
 * @returns {Promise} Response chứa chi tiết voucher và stats
 */
export const getVoucherById = async (id) => {
  const response = await api.get(`/vouchers/${id}`);
  return response.data;
};

/**
 * Tạo mới voucher
 * @param {Object} data - Dữ liệu voucher mới
 * @returns {Promise} Response chứa voucher vừa tạo
 */
export const createVoucher = async (data) => {
  const response = await api.post("/vouchers", data);
  return response.data;
};

/**
 * Cập nhật voucher
 * @param {string} id - ID của voucher
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Promise} Response chứa voucher đã cập nhật
 */
export const updateVoucher = async (id, data) => {
  const response = await api.patch(`/vouchers/${id}`, data);
  return response.data;
};

/**
 * Xóa voucher (Chỉ khi Draft và usedCount = 0)
 * @param {string} id - ID của voucher
 * @returns {Promise} Response sau khi xóa (204 No Content)
 */
export const deleteVoucher = async (id) => {
  const response = await api.delete(`/vouchers/${id}`);
  return response.data;
};

/**
 * Tự động tạo mã voucher unique 8 ký tự
 * @returns {Promise} Response chứa mã code
 */
export const generateVoucherCode = async () => {
  const response = await api.get("/vouchers/generate-code");
  return response.data;
};

/**
 * Nhân bản voucher
 * @param {string} id - ID của voucher gốc
 * @returns {Promise} Response chứa voucher nháp (chưa lưu vào DB)
 */
export const cloneVoucher = async (id) => {
  const response = await api.post(`/vouchers/${id}/clone`);
  return response.data;
};

/**
 * Xuất bản voucher (Draft -> Upcoming)
 * @param {string} id - ID của voucher
 * @returns {Promise} Response chứa voucher đã cập nhật trạng thái
 */
export const publishVoucher = async (id) => {
  const response = await api.patch(`/vouchers/${id}/publish`);
  return response.data;
};

/**
 * Tạm ngưng voucher (Active -> Inactive)
 * @param {string} id - ID của voucher
 * @returns {Promise} Response chứa voucher đã cập nhật trạng thái
 */
export const deactivateVoucher = async (id) => {
  const response = await api.patch(`/vouchers/${id}/deactivate`);
  return response.data;
};

/**
 * Kích hoạt lại voucher (Inactive -> Active)
 * @param {string} id - ID của voucher
 * @returns {Promise} Response chứa voucher đã cập nhật trạng thái
 */
export const reactivateVoucher = async (id) => {
  const response = await api.patch(`/vouchers/${id}/reactivate`);
  return response.data;
};

/**
 * Lưu trữ voucher (Expired/OutOfQuota -> Archived)
 * @param {string} id - ID của voucher
 * @returns {Promise} Response chứa voucher đã cập nhật trạng thái
 */
export const archiveVoucher = async (id) => {
  const response = await api.patch(`/vouchers/${id}/archive`);
  return response.data;
};

/**
 * Thống kê sử dụng voucher
 * @param {string} id - ID của voucher
 * @returns {Promise} Response chứa thông tin thống kê
 */
export const getVoucherStats = async (id) => {
  const response = await api.get(`/vouchers/${id}/stats`);
  return response.data;
};

/**
 * Lịch sử sử dụng voucher chi tiết
 * @param {string} id - ID của voucher
 * @param {Object} params - Query parameters (page, limit, startDate, endDate, canteenId, orderStatus, voucherStatus, sort)
 * @returns {Promise} Response chứa lịch sử sử dụng và pagination
 */
export const getVoucherUsageHistory = async (id, params = {}) => {
  const response = await api.get(`/vouchers/${id}/usage-history`, { params });
  return response.data;
};

/**
 * Xuất báo cáo sử dụng voucher
 * @param {Object} params - format (xlsx/csv), startDate, endDate, canteenId, state, discountType
 * @returns {Promise} Tệp nhị phân Blob
 */
export const exportVouchers = async (params = {}) => {
  const response = await api.get("/vouchers/export", {
    params,
    responseType: "blob", // Quan trọng: Báo cho Axios biết đây là file
  });
  return response.data;
};
