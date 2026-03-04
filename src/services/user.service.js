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

export const getStaffListByManager = async (params = {}) => {
  const response = await api.get("/users/staff", { params });
  return response.data;
};

export const getStaffDetailByManager = async (id) => {
  const response = await api.get(`/users/staff/${id}`);
  return response.data;
};

export const createStaffByManager = async (payload) => {
  const response = await api.post("/users/staff", payload);
  return response.data;
};

export const updateStaffByManager = async (id, payload) => {
  const response = await api.patch(`/users/staff/${id}`, payload);
  return response.data;
};
