import { api } from './axios.config';

/**
 * Lấy tất cả căng tin
 * @param {Object} params - Query parameters (page, limit, search, etc.)
 * @returns {Promise} Response chứa danh sách căng tin
 */
export const getAllCanteens = async (params = {}) => {
  const response = await api.get('/canteens', { params });
  return response.data;
};

/**
 * Lấy chi tiết căng tin theo ID
 * @param {string} id - ID của căng tin
 * @returns {Promise} Response chứa thông tin căng tin
 */
export const getCanteenById = async (id) => {
  const response = await api.get(`/canteens/${id}`);
  return response.data;
};

/**
 * Tạo mới căng tin
 * @param {Object} data - Dữ liệu căng tin
 * @returns {Promise} Response chứa căng tin vừa tạo
 */
export const createCanteen = async (data) => {
  const response = await api.post('/canteens', data);
  return response.data;
};

/**
 * Cập nhật căng tin
 * @param {string} id - ID của căng tin
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Promise} Response chứa căng tin đã cập nhật
 */
export const updateCanteen = async (id, data) => {
  const response = await api.patch(`/canteens/${id}`, data);
  return response.data;
};

/**
 * Xóa căng tin
 * @param {string} id - ID của căng tin
 * @returns {Promise} Response sau khi xóa
 */
export const deleteCanteen = async (id) => {
  const response = await api.delete(`/canteens/${id}`);
  return response.data;
};
