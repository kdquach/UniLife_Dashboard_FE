import { api } from './axios.config';

/**
 * Lấy tất cả sản phẩm
 * @param {Object} params - Query parameters (page, limit, search, status, categoryId, etc.)
 * @returns {Promise} Response chứa danh sách sản phẩm
 */
export const getAllProducts = async (params = {}) => {
  const response = await api.get('/products', { params });
  return response.data;
};

/**
 * Lấy chi tiết sản phẩm theo ID
 * @param {string} id - ID của sản phẩm
 * @returns {Promise} Response chứa thông tin sản phẩm
 */
export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

/**
 * Lấy sản phẩm theo căng tin
 * @param {string} canteenId - ID của căng tin
 * @param {Object} params - Query parameters
 * @returns {Promise} Response chứa danh sách sản phẩm
 */
export const getProductsByCanteen = async (canteenId, params = {}) => {
  const response = await api.get(`/canteens/${canteenId}/products`, { params });
  return response.data;
};

/**
 * Tạo mới sản phẩm
 * @param {FormData} formData - Dữ liệu sản phẩm (bao gồm images)
 * @returns {Promise} Response chứa sản phẩm vừa tạo
 */
export const createProduct = async (formData) => {
  const response = await api.post('/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Cập nhật sản phẩm
 * @param {string} id - ID của sản phẩm
 * @param {FormData} formData - Dữ liệu cập nhật
 * @returns {Promise} Response chứa sản phẩm đã cập nhật
 */
export const updateProduct = async (id, formData) => {
  const response = await api.patch(`/products/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Xóa sản phẩm (soft delete)
 * @param {string} id - ID của sản phẩm
 * @returns {Promise} Response sau khi xóa
 */
export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

/**
 * Khôi phục sản phẩm đã xóa (Admin)
 * @param {string} id - ID của sản phẩm
 * @returns {Promise} Response chứa sản phẩm sau khi khôi phục
 */
export const restoreProduct = async (id) => {
  const response = await api.patch(`/products/${id}/restore`);
  return response.data;
};

/**
 * Lấy danh sách sản phẩm đã xóa (Admin)
 * @param {Object} params - Query parameters
 * @returns {Promise} Response chứa danh sách sản phẩm đã xóa
 */
export const getDeletedProducts = async (params = {}) => {
  const response = await api.get('/products/deleted', { params });
  return response.data;
};

/**
 * Lấy sản phẩm hết hàng
 * @param {Object} params - Query parameters
 * @returns {Promise} Response chứa danh sách sản phẩm hết hàng
 */
export const getOutOfStockProducts = async (params = {}) => {
  const response = await api.get('/products/inventory/out-of-stock', {
    params,
  });
  return response.data;
};

/**
 * Lấy sản phẩm sắp hết hàng
 * @param {Object} params - Query parameters
 * @returns {Promise} Response chứa danh sách sản phẩm sắp hết hàng
 */
export const getLowStockProducts = async (params = {}) => {
  const response = await api.get('/products/inventory/low-stock', { params });
  return response.data;
};

/**
 * Thêm nguyên liệu vào công thức sản phẩm
 * @param {string} productId - ID sản phẩm
 * @param {Object} ingredientData - Dữ liệu nguyên liệu
 * @returns {Promise} Response chứa sản phẩm đã cập nhật
 */
export const addRecipeIngredient = async (productId, ingredientData) => {
  const response = await api.post(
    `/products/${productId}/recipe`,
    ingredientData
  );
  return response.data;
};

/**
 * Xóa nguyên liệu khỏi công thức sản phẩm
 * @param {string} productId - ID sản phẩm
 * @param {string} ingredientId - ID nguyên liệu
 * @returns {Promise} Response chứa sản phẩm đã cập nhật
 */
export const removeRecipeIngredient = async (productId, ingredientId) => {
  const response = await api.delete(
    `/products/${productId}/recipe/${ingredientId}`
  );
  return response.data;
};
