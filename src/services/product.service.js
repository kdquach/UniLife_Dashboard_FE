import { api } from './axios.config';

const buildProductFormData = (data) => {
  const formData = new FormData();

  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === 'image' && value?.originFileObj) {
      formData.append('image', value.originFileObj);
      return;
    }

    if (key === 'images' && Array.isArray(value)) {
      value
        .filter((file) => file?.originFileObj)
        .forEach((file) => {
          formData.append('images', file.originFileObj);
        });
      return;
    }

    if (typeof value === 'boolean') {
      formData.append(key, value ? 'true' : 'false');
      return;
    }

    formData.append(key, value);
  });

  return formData;
};

export const getAllProducts = async (params = {}) => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (data) => {
  const formData = buildProductFormData(data);
  const response = await api.post('/products', formData);
  return response.data;
};

export const updateProduct = async (id, data) => {
  const formData = buildProductFormData(data);
  const response = await api.patch(`/products/${id}`, formData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export const getDeletedProducts = async (params = {}) => {
  const response = await api.get('/products/deleted', { params });
  return response.data;
};
