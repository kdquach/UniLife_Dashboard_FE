import { api } from './axios.config';

// Service cho Audit Log
export const useAuditLogService = () => {
  // Lấy danh sách tất cả nhật ký hoạt động
  const getAllAuditLogs = async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.action) params.append('action', filters.action);
    if (filters.resourceType)
      params.append('resourceType', filters.resourceType);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.canteenId) params.append('canteenId', filters.canteenId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/audit-logs?${params.toString()}`);
    return response.data;
  };

  // Lấy chi tiết một nhật ký
  const getAuditLogById = async (id) => {
    const response = await api.get(`/audit-logs/${id}`);
    return response.data;
  };

  // Lấy nhật ký theo người dùng
  const getAuditLogsByUser = async (userId, options = {}) => {
    const params = new URLSearchParams();

    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.days) params.append('days', options.days);

    const response = await api.get(
      `/audit-logs/users/${userId}?${params.toString()}`
    );
    return response.data;
  };

  // Lấy nhật ký theo tài nguyên
  const getAuditLogsByResource = async (
    resourceType,
    resourceId,
    options = {}
  ) => {
    const params = new URLSearchParams();

    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);

    const response = await api.get(
      `/audit-logs/resources/${resourceType}/${resourceId}?${params.toString()}`
    );
    return response.data;
  };

  // Lấy thống kê hoạt động
  const getActivityStatistics = async (days = 30) => {
    const response = await api.get(
      `/audit-logs/statistics/activity?days=${days}`
    );
    return response.data;
  };

  // Lấy danh sách lỗi
  const getErrorLogs = async (options = {}) => {
    const params = new URLSearchParams();

    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.days) params.append('days', options.days);

    const response = await api.get(
      `/audit-logs/errors/list?${params.toString()}`
    );
    return response.data;
  };

  // Xóa nhật ký cũ (Admin only)
  const deleteOldAuditLogs = async (days = 90) => {
    const response = await api.delete(`/audit-logs/cleanup/old?days=${days}`);
    return response.data;
  };

  return {
    getAllAuditLogs,
    getAuditLogById,
    getAuditLogsByUser,
    getAuditLogsByResource,
    getActivityStatistics,
    getErrorLogs,
    deleteOldAuditLogs,
  };
};
