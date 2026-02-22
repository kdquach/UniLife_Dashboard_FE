import { api } from './axios.config';

/**
 * Lấy tất cả nguyên liệu
 * @param {Object} params - Query parameters (page, limit, search, etc.)
 * @returns {Promise} Response chứa danh sách nguyên liệu
 */
export const getAllIngredients = async (params = {}) => {
  const response = await api.get('/ingredients', { params });
  return response.data;
};

/**
 * Lấy chi tiết nguyên liệu theo ID
 * @param {string} id - ID của nguyên liệu
 * @returns {Promise} Response chứa thông tin nguyên liệu
 */
export const getIngredientById = async (id) => {
  const response = await api.get(`/ingredients/${id}`);
  return response.data;
};

/**
 * Tạo mới nguyên liệu
 * @param {Object} data - Dữ liệu nguyên liệu
 * @returns {Promise} Response chứa nguyên liệu vừa tạo
 */
export const createIngredient = async (data) => {
  const response = await api.post('/ingredients', data);
  return response.data;
};

/**
 * Cập nhật nguyên liệu
 * @param {string} id - ID của nguyên liệu
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Promise} Response chứa nguyên liệu đã cập nhật
 */
export const updateIngredient = async (id, data) => {
  const response = await api.patch(`/ingredients/${id}`, data);
  return response.data;
};

/**
 * Xóa nguyên liệu
 * @param {string} id - ID của nguyên liệu
 * @returns {Promise} Response sau khi xóa
 */
export const deleteIngredient = async (id) => {
  const response = await api.delete(`/ingredients/${id}`);
  return response.data;
};

/**
 * Lấy nguyên liệu có tồn kho thấp
 * @param {Object} params - Query parameters
 * @returns {Promise} Response chứa danh sách nguyên liệu sắp hết
 */
export const getLowStockIngredients = async (params = {}) => {
  const response = await api.get('/ingredients/low-stock', { params });
  return response.data;
};
