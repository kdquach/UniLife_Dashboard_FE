import { useCallback, useState } from "react";
import { message } from "antd";
import {
  createStaffByManager,
  getStaffDetailByManager,
  getStaffListByManager,
  updateStaffByManager,
} from "@/services/user.service";
import { DEFAULT_PAGE_SIZE } from "@/config/constants";

export const useStaffManagement = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    gender: "all",
  });

  const fetchList = useCallback(
    async (page = 1, pageSize = DEFAULT_PAGE_SIZE, nextFilters = null) => {
      const effectiveFilters = nextFilters || filters;

      const params = {
        page,
        limit: pageSize,
      };

      if (effectiveFilters.search?.trim()) {
        params.search = effectiveFilters.search.trim();
      }

      if (effectiveFilters.status && effectiveFilters.status !== "all") {
        params.status = effectiveFilters.status;
      }

      if (effectiveFilters.gender && effectiveFilters.gender !== "all") {
        params.gender = effectiveFilters.gender;
      }

      try {
        setLoading(true);
        const response = await getStaffListByManager(params);
        const data = response?.data || [];
        const paginationData = response?.pagination || {};

        setItems(data);
        setPagination({
          current: paginationData.page || page,
          pageSize: paginationData.limit || pageSize,
          total: paginationData.total || 0,
        });
      } catch (error) {
        messageApi.error(error?.response?.data?.message || "Không thể tải danh sách nhân viên");
      } finally {
        setLoading(false);
      }
    },
    [filters, messageApi],
  );

  const fetchDetail = useCallback(
    async (staffId) => {
      try {
        const response = await getStaffDetailByManager(staffId);
        return response?.data || null;
      } catch (error) {
        messageApi.error(error?.response?.data?.message || "Không thể tải chi tiết nhân viên");
        return null;
      }
    },
    [messageApi],
  );

  const createStaff = useCallback(
    async (payload) => {
      try {
        const response = await createStaffByManager(payload);
        messageApi.success(response?.message || "Tạo tài khoản nhân viên thành công");
        return response?.data || null;
      } catch (error) {
        messageApi.error(error?.response?.data?.message || "Không thể tạo tài khoản nhân viên");
        return null;
      }
    },
    [messageApi],
  );

  const updateStaff = useCallback(
    async (staffId, payload) => {
      try {
        const response = await updateStaffByManager(staffId, payload);
        messageApi.success(response?.message || "Cập nhật nhân viên thành công");
        return response?.data || null;
      } catch (error) {
        messageApi.error(error?.response?.data?.message || "Không thể cập nhật nhân viên");
        return null;
      }
    },
    [messageApi],
  );

  return {
    contextHolder,
    loading,
    items,
    pagination,
    filters,
    setFilters,
    fetchList,
    fetchDetail,
    createStaff,
    updateStaff,
  };
};
