import { api } from "./axios.config";

/**
 * Lấy tất cả danh mục sản phẩm
 * @param {Object} params - Query parameters
 * @returns {Promise} Response chứa danh sách categories
 */
export const getAllProductCategories = async (params = {}) => {
  const response = await api.get("/product-categories", { params });
  return response.data;
};

/**
 * Lấy danh mục sản phẩm đang hoạt động
 * @returns {Promise} Response chứa danh sách categories active
 */
export const getActiveProductCategories = async () => {
  const response = await api.get("/product-categories/active");
  return response.data;
};

/**
 * Lấy chi tiết danh mục sản phẩm theo ID
 * @param {string} id - ID của danh mục
 * @returns {Promise} Response chứa thông tin category
 */
export const getProductCategoryById = async (id) => {
  const response = await api.get(`/product-categories/${id}`);
  return response.data;
};

/**
 * Tạo mới danh mục sản phẩm
 * @param {Object} data - Dữ liệu danh mục
 * @returns {Promise} Response chứa category vừa tạo
 */
export const createProductCategory = async (data) => {
  const response = await api.post("/product-categories", data);
  return response.data;
};

/**
 * Cập nhật danh mục sản phẩm
 * @param {string} id - ID của danh mục
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Promise} Response chứa category đã cập nhật
 */
export const updateProductCategory = async (id, data) => {
  const response = await api.patch(`/product-categories/${id}`, data);
  return response.data;
};

/**
 * Xóa danh mục sản phẩm
 * @param {string} id - ID của danh mục
 * @returns {Promise} Response xác nhận xóa
 */
export const deleteProductCategory = async (id) => {
  const response = await api.delete(`/product-categories/${id}`);
  return response.data;
};
