import { api } from "./axios.config";

/**
 * Lấy danh sách lương theo payrollId
 * @param {string} payrollId - ID của kỳ lương
 * @returns {Promise} Danh sách salaries
 */
export const getSalariesByPayroll = async (payrollId) => {
  const response = await api.get(`/salaries`, {
    params: { payrollId },
  });
  return response.data;
};

/**
 * Lấy chi tiết một bản lương
 * @param {string} id - Salary ID
 * @returns {Promise} Thông tin salary
 */
export const getSalaryById = async (id) => {
  const response = await api.get(`/salaries/${id}`);
  return response.data;
};

/**
 * Cập nhật thông tin lương
 * @param {string} id - Salary ID
 * @param {Object} data - Dữ liệu cần update (bonus, deduction, adjustmentReason, finalAmount)
 * @returns {Promise} Salary đã update
 */
export const updateSalary = async (id, data) => {
  const response = await api.patch(`/salaries/${id}`, data);
  return response.data;
};

/**
 * Xóa một bản lương
 * @param {string} id - Salary ID
 * @returns {Promise}
 */
export const deleteSalary = async (id) => {
  const response = await api.delete(`/salaries/${id}`);
  return response.data;
};
