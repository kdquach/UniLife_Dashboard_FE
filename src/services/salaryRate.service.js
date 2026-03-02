import api from "./axios.config";

/**
 * Thiết lập mức lương cho nhân viên
 * @param {Object} data - { userId, canteenId, hourlyRate, effectiveFrom, note }
 * @returns {Promise}
 */
export const setSalaryRate = async (data) => {
  const response = await api.post("/salary-rates", data);
  return response.data;
};

/**
 * Lấy mức lương của một nhân viên
 * @param {string} userId - User ID
 * @returns {Promise}
 */
export const getSalaryRateByUser = async (userId) => {
  const response = await api.get(`/salary-rates/user/${userId}`);
  return response.data;
};

/**
 * Lấy danh sách mức lương theo canteen
 * @param {string} canteenId - Canteen ID
 * @returns {Promise}
 */
export const getSalaryRatesByCanteen = async (canteenId) => {
  const response = await api.get(`/salary-rates/canteen/${canteenId}`);
  return response.data;
};

/**
 * Lấy tất cả mức lương
 * @returns {Promise}
 */
export const getAllSalaryRates = async () => {
  const response = await api.get("/salary-rates");
  return response.data;
};

/**
 * Xóa mức lương
 * @param {string} userId - User ID
 * @returns {Promise}
 */
export const deleteSalaryRate = async (userId) => {
  const response = await api.delete(`/salary-rates/user/${userId}`);
  return response.data;
};
