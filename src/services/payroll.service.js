import { api } from "./axios.config";

/**
 * Lấy danh sách tất cả kỳ lương
 * @param {Object} params - Query parameters (canteenId, status, periodStart, periodEnd)
 * @returns {Promise} Danh sách payrolls
 */
export const getAllPayrolls = async (params = {}) => {
  const response = await api.get("/payrolls", { params });
  return response.data;
};

/**
 * Lấy chi tiết một kỳ lương
 * @param {string} id - Payroll ID
 * @returns {Promise} Thông tin payroll và danh sách salaries
 */
export const getPayrollById = async (id) => {
  const response = await api.get(`/payrolls/${id}`);
  return response.data;
};

/**
 * Lấy chi tiết payroll bao gồm danh sách salaries
 * @param {string} id - Payroll ID
 * @returns {Promise} Thông tin payroll và salaries
 */
export const getPayrollDetail = async (id) => {
  const response = await api.get(`/payrolls/${id}`);
  return response.data;
};

/**
 * Generate payroll - Tạo kỳ lương và tính lương tự động
 * @param {Object} data - { canteenId, periodStart, periodEnd, hourlyRate, description }
 * @returns {Promise} Payroll và salaries đã tạo
 */
export const generatePayroll = async (data) => {
  const response = await api.post("/payrolls/generate", data);
  return response.data;
};

/**
 * Tạo kỳ lương mới (manual)
 * @param {Object} data - Dữ liệu kỳ lương
 * @returns {Promise} Payroll đã tạo
 */
export const createPayroll = async (data) => {
  const response = await api.post("/payrolls", data);
  return response.data;
};

/**
 * Điều chỉnh lương của một nhân viên
 * @param {string} payrollId - Payroll ID
 * @param {string} salaryId - Salary ID
 * @param {Object} data - { bonus, deduction, note }
 * @returns {Promise} Salary đã update
 */
export const adjustSalary = async (payrollId, salaryId, data) => {
  const response = await api.patch(
    `/payrolls/${payrollId}/salaries/${salaryId}`,
    data,
  );
  return response.data;
};

/**
 * Duyệt kỳ lương
 * @param {string} id - Payroll ID
 * @returns {Promise} Payroll đã duyệt
 */
export const approvePayroll = async (id) => {
  const response = await api.patch(`/payrolls/${id}/approve`);
  return response.data;
};

/**
 * Xác nhận thanh toán kỳ lương
 * @param {string} id - Payroll ID
 * @returns {Promise} Payroll đã thanh toán
 */
export const confirmPayment = async (id) => {
  const response = await api.patch(`/payrolls/${id}/pay`);
  return response.data;
};

/**
 * Xóa kỳ lương
 * @param {string} id - Payroll ID
 * @returns {Promise}
 */
export const deletePayroll = async (id) => {
  const response = await api.delete(`/payrolls/${id}`);
  return response.data;
};

/**
 * Lấy thống kê payroll
 * @param {Object} params - Query parameters
 * @returns {Promise} Thống kê
 */
export const getPayrollStats = async (params = {}) => {
  const response = await api.get("/payrolls/stats", { params });
  return response.data;
};

/**
 * Xuất file Excel của một kỳ lương
 * @param {string} id - Payroll ID
 * @returns {Promise} Axios response chứa Blob
 */
export const exportPayrollExcel = async (id) => {
  const response = await api.get(`/payrolls/${id}/export-excel`, {
    responseType: "blob",
  });
  return response;
};
