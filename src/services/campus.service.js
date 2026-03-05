import { api } from "@/services/axios.config";

/**
 * Lấy danh sách campus
 * @param {Object} params - Query params nếu sau này có phân trang / filter
 * @returns {Promise} Response chứa danh sách campus
 */
export const getAllCampuses = async (params = {}) => {
    const response = await api.get("/campuses", { params });
    return response.data;
};
