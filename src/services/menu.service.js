import { api } from './axios.config';

/**
 * Lấy danh sách thực đơn
 * @param {Object} params - Tham số query (canteenId, status, ...)
 * @returns {Promise} Response chứa danh sách thực đơn
 */
export const getAllMenus = async (params = {}) => {
  const response = await api.get('/menus', { params });
  return response.data;
};

/**
 * Lấy chi tiết thực đơn theo ID
 * @param {string} id - ID của thực đơn
 * @returns {Promise} Response chứa thông tin thực đơn
 */
export const getMenuById = async (id) => {
  const response = await api.get(`/menus/${id}`);
  return response.data;
};

/**
 * Tạo mới thực đơn
 * @param {Object} data - Dữ liệu thực đơn
 * @returns {Promise} Response chứa thực đơn vừa tạo
 */
export const createMenu = async (data) => {
  const response = await api.post('/menus', data);
  return response.data;
};

/**
 * Cập nhật thực đơn
 * @param {string} id - ID của thực đơn
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Promise} Response chứa thực đơn đã cập nhật
 */
export const updateMenu = async (id, data) => {
  const response = await api.patch(`/menus/${id}`, data);
  return response.data;
};

/**
 * Xóa thực đơn
 * @param {string} id - ID của thực đơn
 * @returns {Promise} Response sau khi xóa
 */
export const deleteMenu = async (id) => {
  const response = await api.delete(`/menus/${id}`);
  return response.data;
};

/**
 * Thêm một món vào thực đơn
 * @param {string} menuId - ID của thực đơn
 * @param {Object} item - Dữ liệu món (productId, order)
 * @returns {Promise} Response chứa thực đơn đã cập nhật
 */
export const addMenuItem = async (menuId, item) => {
  const response = await api.post(`/menus/${menuId}/items`, item);
  return response.data;
};

/**
 * Xóa một món khỏi thực đơn
 * @param {string} menuId - ID của thực đơn
 * @param {string} productId - ID của sản phẩm cần xóa
 * @returns {Promise} Response chứa thực đơn đã cập nhật
 */
export const removeMenuItem = async (menuId, productId) => {
  const response = await api.delete(`/menus/${menuId}/items/${productId}`);
  return response.data;
};

/**
 * Lấy danh sách lịch áp dụng thực đơn
 * @param {Object} params - Tham số query (canteenId, status, ...)
 * @returns {Promise} Response chứa danh sách lịch
 */
export const getAllMenuSchedules = async (params = {}) => {
  const response = await api.get('/menus/schedules', { params });
  return response.data;
};

/**
 * Lấy chi tiết lịch thực đơn theo ID
 * @param {string} id - ID của lịch
 * @returns {Promise} Response chứa thông tin lịch
 */
export const getMenuScheduleById = async (id) => {
  const response = await api.get(`/menus/schedules/${id}`);
  return response.data;
};

/**
 * Tạo lịch áp dụng thực đơn
 * @param {Object} data - Dữ liệu lịch (menuId, canteenId, startAt, endAt)
 * @returns {Promise} Response chứa lịch vừa tạo
 */
export const createMenuSchedule = async (data) => {
  const response = await api.post('/menus/schedules', data);
  return response.data;
};

/**
 * Cập nhật lịch áp dụng thực đơn
 * @param {string} id - ID của lịch
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Promise} Response chứa lịch đã cập nhật
 */
export const updateMenuSchedule = async (id, data) => {
  const response = await api.patch(`/menus/schedules/${id}`, data);
  return response.data;
};

/**
 * Bật/tắt trạng thái lịch áp dụng thực đơn
 * @param {string} id - ID của lịch
 * @returns {Promise} Response chứa lịch sau khi cập nhật trạng thái
 */
export const toggleMenuScheduleStatus = async (id) => {
  const response = await api.patch(`/menus/schedules/${id}/toggle`);
  return response.data;
};

/**
 * Nhân bản một lịch áp dụng thực đơn sang khoảng thời gian mới
 * @param {string} id - ID lịch gốc
 * @param {Object} data - Dữ liệu thời gian mới (startAt, endAt)
 * @returns {Promise} Response chứa lịch mới
 */
export const duplicateMenuSchedule = async (id, data) => {
  const response = await api.post(`/menus/schedules/${id}/duplicate`, data);
  return response.data;
};

/**
 * Xóa lịch áp dụng thực đơn
 * @param {string} id - ID của lịch
 * @returns {Promise} Response sau khi xóa
 */
export const deleteMenuSchedule = async (id) => {
  const response = await api.delete(`/menus/schedules/${id}`);
  return response.data;
};
