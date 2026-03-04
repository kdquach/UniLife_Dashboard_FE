import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import {
  getShiftChangeRequests,
  reviewShiftChangeRequest,
} from '@/services/shiftManagement.service';

export const useShiftRequestsManagement = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const canteenId = user?.canteenId?._id || user?.canteenId || undefined;

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getShiftChangeRequests({
        ...(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(canteenId ? { canteenId } : {}),
      });
      setRequests(data);
    } catch (error) {
      message.error(error?.response?.data?.message || 'Không tải được yêu cầu đổi ca');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, canteenId]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refreshToken = params.get('refresh');
    if (!refreshToken) return;
    void loadRequests();
  }, [location.search, loadRequests]);

  const handleReview = useCallback(
    async (id, status) => {
      try {
        await reviewShiftChangeRequest(id, status);
        message.success(status === 'approved' ? 'Đã duyệt yêu cầu' : 'Đã từ chối yêu cầu');
        await loadRequests();
      } catch (error) {
        message.error(error?.response?.data?.message || 'Không thể xử lý yêu cầu');
      }
    },
    [loadRequests],
  );

  return {
    requests,
    statusFilter,
    setStatusFilter,
    loading,
    handleReview,
  };
};
