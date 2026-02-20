import { api } from './axios.config';

export const getMenus = async (params = {}) => {
  const response = await api.get('/menus', { params });
  return response.data;
};

export const createMenu = async (data) => {
  const response = await api.post('/menus', data);
  return response.data;
};

export const addMenuItem = async (menuId, item) => {
  const response = await api.post(`/menus/${menuId}/items`, item);
  return response.data;
};
