import { api } from "./axios.config";

/**
 * Lấy danh sách banner có phân trang
 * @param {Object} params - Query params
 * @returns {Promise}
 */
export const getBannerList = async (params = {}) => {
  const response = await api.get("/banners", { params });
  return response.data;
};

/**
 * Lấy chi tiết banner
 * @param {string} id - ID banner
 * @returns {Promise}
 */
export const getBannerDetail = async (id) => {
  const response = await api.get(`/banners/${id}`);
  return response.data;
};

/**
 * Tạo banner mới
 * @param {Object} payload - Dữ liệu banner
 * @returns {Promise}
 */
export const createBanner = async (payload) => {
  const response = await api.post("/banners", payload);
  return response.data;
};

/**
 * Cập nhật banner
 * @param {string} id - ID banner
 * @param {Object} payload - Dữ liệu cần cập nhật
 * @returns {Promise}
 */
export const updateBanner = async (id, payload) => {
  const response = await api.patch(`/banners/${id}`, payload);
  return response.data;
};

/**
 * Xóa banner
 * @param {string} id - ID banner
 * @returns {Promise}
 */
export const deleteBanner = async (id) => {
  const response = await api.delete(`/banners/${id}`);
  return response.data;
};

/**
 * Upload ảnh banner lên Cloudinary
 * @param {File} file - File ảnh banner
 * @returns {Promise}
 */
export const uploadBannerImage = async (file) => {
  const formData = new FormData();
  formData.append("banner", file);

  const response = await api.post("/upload/banner", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};
