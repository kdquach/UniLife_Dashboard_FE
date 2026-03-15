import { api } from './axios.config';

// Lấy danh sách công thức của sản phẩm
export const getRecipeByProduct = async (productId) => {
  const response = await api.get(`/products/${productId}/recipe`);
  return response.data;
};

// Lấy chi tiết một nguyên liệu trong công thức
export const getRecipeDetail = async (productId, ingredientId) => {
  const response = await api.get(
    `/products/${productId}/recipe/${ingredientId}`
  );
  return response.data;
};

// Thêm nguyên liệu vào công thức sản phẩm
export const addRecipeIngredient = async (productId, payload) => {
  const response = await api.post(`/products/${productId}/recipe`, payload);
  return response.data;
};

// Cập nhật nguyên liệu trong công thức sản phẩm
export const updateRecipeIngredient = async (
  productId,
  ingredientId,
  payload
) => {
  const response = await api.patch(
    `/products/${productId}/recipe/${ingredientId}`,
    payload
  );
  return response.data;
};

// Xóa nguyên liệu khỏi công thức sản phẩm
export const removeRecipeIngredient = async (productId, ingredientId) => {
  const response = await api.delete(
    `/products/${productId}/recipe/${ingredientId}`
  );
  return response.data;
};
