import { useCallback, useState } from "react";
import { message } from "antd";
import {
  getSystemUsers,
  createSystemUser,
  updateSystemUser,
  disableSystemUser,
  reenableSystemUser,
  assignRoleSystemUser,
  downgradeRoleSystemUser,
  reissuePasswordSystemUser,
  deletePendingSystemUser,
} from "@/services/systemUser.service";
import { DEFAULT_PAGE_SIZE } from "@/config/constants";

export const useSystemUserManagement = () => {
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
    role: "all",
  });

  /* ---- 1. View System Users ---- */
  const fetchList = useCallback(
    async (page = 1, pageSize = DEFAULT_PAGE_SIZE, nextFilters = null) => {
      const f = nextFilters || filters;

      const params = { page, limit: pageSize };
      if (f.search?.trim()) params.search = f.search.trim();
      if (f.status && f.status !== "all") params.status = f.status;
      if (f.role && f.role !== "all") params.role = f.role;

      try {
        setLoading(true);
        const res = await getSystemUsers(params);
        setItems(res?.data || []);
        setPagination({
          current: res?.page || page,
          pageSize: res?.limit || pageSize,
          total: res?.total || 0,
        });
      } catch (error) {
        if (error?.response?.data?.errors?.length > 0) {
          error.response.data.errors.forEach((err) => messageApi.error(err.message));
        } else {
          messageApi.error(
            error?.response?.data?.message || "Không thể tải danh sách người dùng"
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [filters, messageApi]
  );

  /* ---- 2. Create System User ---- */
  const create = useCallback(
    async (payload) => {
      try {
        const res = await createSystemUser(payload);
        messageApi.success(res?.message || "Tạo tài khoản thành công! Mật khẩu đã được tự gửi về email của nhân viên.");
        return res?.data || null;
      } catch (error) {
        if (error?.response?.data?.errors?.length > 0) {
          error.response.data.errors.forEach((err) => messageApi.error(err.message));
        } else {
          messageApi.error(
            error?.response?.data?.message || "Không thể tạo tài khoản"
          );
        }
        return null;
      }
    },
    [messageApi]
  );

  /* ---- 3. Update System User ---- */
  const update = useCallback(
    async (userId, payload) => {
      try {
        const res = await updateSystemUser(userId, payload);
        messageApi.success(res?.message || "Cập nhật thành công");
        return true;
      } catch (error) {
        if (error?.response?.data?.errors?.length > 0) {
          error.response.data.errors.forEach((err) => messageApi.error(err.message));
        } else {
          messageApi.error(
            error?.response?.data?.message || "Không thể cập nhật người dùng"
          );
        }
        return false;
      }
    },
    [messageApi]
  );

  /* ---- 4. Disable System User ---- */
  const disable = useCallback(
    async (userId, reason) => {
      try {
        const res = await disableSystemUser(userId, reason);
        messageApi.success(res?.message || "Vô hiệu hoá tài khoản thành công");
        return true;
      } catch (error) {
        if (error?.response?.data?.errors?.length > 0) {
          error.response.data.errors.forEach((err) => messageApi.error(err.message));
        } else {
          messageApi.error(
            error?.response?.data?.message || "Không thể vô hiệu hoá tài khoản"
          );
        }
        return false;
      }
    },
    [messageApi]
  );

  /* ---- 5. Re-enable System User ---- */
  const reenable = useCallback(
    async (userId, reason) => {
      try {
        const res = await reenableSystemUser(userId, reason);
        messageApi.success(res?.message || "Mở khoá tài khoản thành công");
        return true;
      } catch (error) {
        if (error?.response?.data?.errors?.length > 0) {
          error.response.data.errors.forEach((err) => messageApi.error(err.message));
        } else {
          messageApi.error(
            error?.response?.data?.message || "Không thể mở khoá tài khoản"
          );
        }
        return false;
      }
    },
    [messageApi]
  );

  /* ---- 6. Assign Role ---- */
  const assignRole = useCallback(
    async (userId, newRole) => {
      try {
        const res = await assignRoleSystemUser(userId, newRole);
        messageApi.success(res?.message || "Cập nhật vai trò thành công");
        return true;
      } catch (error) {
        if (error?.response?.data?.errors?.length > 0) {
          error.response.data.errors.forEach((err) => messageApi.error(err.message));
        } else {
          messageApi.error(
            error?.response?.data?.message || "Không thể cập nhật vai trò"
          );
        }
        return false;
      }
    },
    [messageApi]
  );

  /* ---- 7. Downgrade Role ---- */
  const downgradeRole = useCallback(
    async (userId, payload) => {
      try {
        const res = await downgradeRoleSystemUser(userId, payload);
        messageApi.success(res?.message || "Hạ vai trò thành công");
        return true;
      } catch (error) {
        if (error?.response?.data?.errors?.length > 0) {
          error.response.data.errors.forEach((err) => messageApi.error(err.message));
        } else {
          messageApi.error(
            error?.response?.data?.message || "Không thể hạ vai trò"
          );
        }
        return false;
      }
    },
    [messageApi]
  );

  /* ---- 8. Reissue Password ---- */
  const reissuePassword = useCallback(
    async (userId) => {
      try {
        const res = await reissuePasswordSystemUser(userId);
        messageApi.success(res?.message || "Đã cấp lại thành công và gửi mail");
        return true;
      } catch (error) {
        if (error?.response?.data?.errors?.length > 0) {
          error.response.data.errors.forEach((err) => messageApi.error(err.message));
        } else {
          messageApi.error(
            error?.response?.data?.message || "Không thể cấp lại mật khẩu"
          );
        }
        return false;
      }
    },
    [messageApi]
  );

  /* ---- 9. Delete Pending User ---- */
  const deletePending = useCallback(
    async (userId) => {
      try {
        const res = await deletePendingSystemUser(userId);
        messageApi.success(res?.message || "Đã xóa tài khoản thành công");
        return true;
      } catch (error) {
        if (error?.response?.data?.errors?.length > 0) {
          error.response.data.errors.forEach((err) => messageApi.error(err.message));
        } else {
          messageApi.error(
            error?.response?.data?.message || "Không thể xóa tài khoản"
          );
        }
        return false;
      }
    },
    [messageApi]
  );

  return {
    contextHolder,
    loading,
    items,
    pagination,
    filters,
    setFilters,
    fetchList,
    create,
    update,
    disable,
    reenable,
    assignRole,
    downgradeRole,
    reissuePassword,
    deletePending,
  };
};
