import { api } from "./axios.config";

/**
 * Lấy tất cả danh mục nguyên liệu
 * @param {Object} params - Query parameters
 * @returns {Promise} Response chứa danh sách categories
 */
export const getAllIngredientCategories = async (params = {}) => {
  const response = await api.get("/ingredient-categories", { params });
  return response.data;
};

/**
 * Lấy danh mục nguyên liệu đang hoạt động
 * @returns {Promise} Response chứa danh sách categories active
 */
export const getActiveIngredientCategories = async () => {
  const response = await api.get("/ingredient-categories/active");
  return response.data;
};

/**
 * Lấy chi tiết danh mục nguyên liệu theo ID
 * @param {string} id - ID của danh mục
 * @returns {Promise} Response chứa thông tin category
 */
export const getIngredientCategoryById = async (id) => {
  const response = await api.get(`/ingredient-categories/${id}`);
  return response.data;
};

/**
 * Tạo mới danh mục nguyên liệu
 * @param {Object} data - Dữ liệu danh mục
 * @returns {Promise} Response chứa category vừa tạo
 */
export const createIngredientCategory = async (data) => {
  const response = await api.post("/ingredient-categories", data);
  return response.data;
};

/**
 * Cập nhật danh mục nguyên liệu
 * @param {string} id - ID của danh mục
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Promise} Response chứa category đã cập nhật
 */
export const updateIngredientCategory = async (id, data) => {
  const response = await api.patch(`/ingredient-categories/${id}`, data);
  return response.data;
};

/**
 * Xóa danh mục nguyên liệu
 * @param {string} id - ID của danh mục
 * @returns {Promise} Response xác nhận xóa
 */
export const deleteIngredientCategory = async (id) => {
  const response = await api.delete(`/ingredient-categories/${id}`);
  return response.data;
};
