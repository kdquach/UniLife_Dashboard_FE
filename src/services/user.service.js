import { api } from "./axios.config";

/**
 * Lấy tất cả users
 * @param {Object} params - Query parameters
 * @returns {Promise}
 */
export const getAllUsers = async (params = {}) => {
  const response = await api.get("/users", { params });
  return response.data;
};

/**
 * Lấy user theo ID
 * @param {string} id
 * @returns {Promise}
 */
export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};
