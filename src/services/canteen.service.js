import { api } from './axios.config';

export const getAllCanteens = async (params = {}) => {
  const response = await api.get('/canteens', { params });
  return response.data;
};
