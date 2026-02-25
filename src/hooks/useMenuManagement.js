import { useCallback, useState } from 'react';
import dayjs from 'dayjs';
import { message, Modal } from 'antd';
import {
  getAllMenus,
  getAllMenuSchedules,
  createMenu,
  createMenuSchedule,
  updateMenu,
  deleteMenu,
  getMenuById,
} from '@/services/menu.service';
import { DEFAULT_PAGE_SIZE } from '@/config/constants';

// Hook quản lý danh sách thực đơn và tạo lịch áp dụng nhanh
export const useMenuManagement = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });
  const [currentCanteenId, setCurrentCanteenId] = useState(null);

  // Lấy danh sách thực đơn và lịch áp dụng theo căng tin
  const fetchData = useCallback(
    async (canteenId, options = {}) => {
      if (!canteenId) return;

      setCurrentCanteenId(canteenId);

      const page = options.page || 1;
      const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;

      setLoading(true);
      try {
        const [menusResponse, schedulesResponse] = await Promise.all([
          getAllMenus({ canteenId, page, limit: pageSize }),
          getAllMenuSchedules({ canteenId }),
        ]);

        const apiMenus = menusResponse?.data?.menus || [];
        const apiPagination = menusResponse?.data?.pagination;
        const apiSchedules = schedulesResponse?.data?.schedules || [];

        setMenus(apiMenus);
        setSchedules(apiSchedules);

        setPagination((prev) => ({
          ...prev,
          current: apiPagination?.page || page,
          pageSize: apiPagination?.limit || pageSize,
          total: apiPagination?.total || apiMenus.length,
        }));
      } catch (error) {
        // Comment: Thông báo lỗi khi không tải được dữ liệu thực đơn
        messageApi.error(
          error?.response?.data?.message || 'Không thể tải danh sách thực đơn',
        );
      } finally {
        setLoading(false);
      }
    },
    [messageApi],
  );

  const handleTableChange = useCallback(
    (tablePagination) => {
      if (!currentCanteenId) return;

      fetchData(currentCanteenId, {
        page: tablePagination.current,
        pageSize: tablePagination.pageSize,
      });
    },
    [currentCanteenId, fetchData],
  );

  // Tạo một thực đơn rỗng
  const handleCreateEmptyMenu = useCallback(
    async (name) => {
      const trimmedName = name?.trim();
      if (!trimmedName) {
        messageApi.error('Vui lòng nhập tên thực đơn');
        return false;
      }

      try {
        const response = await createMenu({ name: trimmedName });
        const createdMenu = response?.data?.menu || response?.data;

        if (createdMenu) {
          setMenus((prev) => [createdMenu, ...prev]);
        }

        messageApi.success('Tạo thực đơn rỗng thành công');
        return true;
      } catch (error) {
        // Comment: Thông báo lỗi khi không tạo được thực đơn rỗng
        messageApi.error(
          error?.response?.data?.message || 'Không thể tạo thực đơn rỗng',
        );
        return false;
      }
    },
    [messageApi],
  );

  // Đổi tên thực đơn
  const handleRenameMenu = useCallback(
    async (menuId, name) => {
      const trimmedName = name?.trim();
      if (!trimmedName) {
        // Comment: Chỉ thông báo khi người dùng bấm lưu nhưng không nhập tên
        messageApi.error('Vui lòng nhập tên thực đơn');
        return false;
      }

      try {
        const response = await updateMenu(menuId, { name: trimmedName });
        const updated = response?.data?.menu || response?.data;

        if (updated) {
          setMenus((prev) =>
            prev.map((item) => (item._id === updated._id ? updated : item)),
          );
        }

        messageApi.success('Cập nhật tên thực đơn thành công');
        return true;
      } catch (error) {
        return false;
      }
    },
    [messageApi],
  );

  // Xuất bản thực đơn (chuyển từ draft sang active)
  const handlePublishMenu = useCallback(
    async (menuId) => {
      try {
        const response = await updateMenu(menuId, { status: 'active' });
        const updated = response?.data?.menu || response?.data;

        if (updated) {
          setMenus((prev) =>
            prev.map((item) => (item._id === updated._id ? updated : item)),
          );
        }

        messageApi.success('Xuất bản thực đơn thành công');
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message || 'Không thể xuất bản thực đơn',
        );
      }
    },
    [messageApi],
  );

  // Xóa thực đơn (chỉ áp dụng khi không hoạt động)
  const handleDeleteMenu = useCallback(
    (menuId, menuName) => {
      Modal.confirm({
        title: 'Xác nhận xóa thực đơn',
        content: `Bạn có chắc chắn muốn xóa thực đơn "${menuName}"?`,
        okText: 'Xóa',
        cancelText: 'Hủy',
        okButtonProps: { danger: true },
        async onOk() {
          try {
            await deleteMenu(menuId);

            // Cập nhật lại danh sách thực đơn và lịch liên quan
            setMenus((prev) => prev.filter((item) => item._id !== menuId));
            setSchedules((prev) =>
              prev.filter((schedule) => {
                const ref = schedule.menuId;
                const refId = typeof ref === 'string' ? ref : ref?._id;
                return refId !== menuId;
              }),
            );

            messageApi.success('Xóa thực đơn thành công');
          } catch (error) {
            messageApi.error(
              error?.response?.data?.message || 'Không thể xóa thực đơn',
            );
          }
        },
      });
    },
    [messageApi],
  );

  // Xem chi tiết thực đơn (lấy danh sách món ăn)
  const handleViewMenuDetail = useCallback(
    async (menuId) => {
      if (!menuId) return null;

      try {
        const response = await getMenuById(menuId);
        const menu = response?.data?.menu || response?.data;
        return menu || null;
      } catch (error) {
        // Comment: Thông báo lỗi khi không lấy được chi tiết thực đơn
        messageApi.error(
          error?.response?.data?.message || 'Không thể tải chi tiết thực đơn',
        );
        return null;
      }
    },
    [messageApi],
  );

  return {
    contextHolder,
    loading,
    menus,
    schedules,
    pagination,
    fetchData,
    handleTableChange,
    handleCreateEmptyMenu,
    handleRenameMenu,
    handlePublishMenu,
    handleDeleteMenu,
    handleViewMenuDetail,
  };
};
