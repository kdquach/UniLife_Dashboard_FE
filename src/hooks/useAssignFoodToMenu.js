import { useState, useCallback } from 'react';
import { message } from 'antd';

/**
 * Hook quản lý logic phân bổ thực phẩm vào thực đơn
 * Hiện tại dùng mock data, sẽ thay bằng real API sau
 */
export const useAssignFoodToMenu = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  // State cho thực đơn
  const [menus, setMenus] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [menuLoading, setMenuLoading] = useState(false);

  // State cho danh sách thực phẩm được chọn
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [preview, setPreview] = useState(null);

  // Lấy danh sách thực đơn theo ngày/tuần
  const fetchMenus = useCallback(
    async (canteenId) => {
      setMenuLoading(true);
      try {
        // TODO: Thay thế mock data bằng thực API menu khi backend hoàn thành
        // const response = await menuService.getMenuByDate(canteenId, date);
        // const actualMenus = response?.data?.menus || [];

        // Mock data
        const mockMenus = [
          {
            _id: 'menu-daily-' + new Date().getTime(),
            type: 'daily',
            date: new Date(),
            status: 'draft',
            foods: [],
            description: 'Thực đơn hôm nay',
            canteenId,
          },
          {
            _id: 'menu-weekly-' + new Date().getTime(),
            type: 'weekly',
            date: new Date(),
            status: 'draft',
            foods: [],
            description: 'Thực đơn tuần này',
            canteenId,
          },
        ];

        setMenus(mockMenus);
        return mockMenus;
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message || 'Không thể tải thực đơn'
        );
        return [];
      } finally {
        setMenuLoading(false);
      }
    },
    [messageApi]
  );

  // Chọn thực đơn để phân bổ
  const handleSelectMenu = useCallback((menu) => {
    setSelectedMenu(menu);
    setSelectedFoods([]);
  }, []);

  // Thêm thực phẩm vào danh sách chọn
  const handleAddFood = useCallback(
    (food) => {
      setSelectedFoods((prev) => {
        const exists = prev.some((f) => f._id === food._id);
        if (exists) {
          messageApi.warning('Thực phẩm đã được chọn');
          return prev;
        }
        return [...prev, { ...food, sequence: prev.length }];
      });
    },
    [messageApi]
  );

  // Xóa thực phẩm khỏi danh sách chọn
  const handleRemoveFood = useCallback((foodId) => {
    setSelectedFoods((prev) => {
      const updated = prev
        .filter((f) => f._id !== foodId)
        .map((f, index) => ({ ...f, sequence: index }));
      return updated;
    });
  }, []);

  // Sắp xếp lại thứ tự thực phẩm
  const handleReorderFoods = useCallback((reorderedFoods) => {
    const updated = reorderedFoods.map((food, index) => ({
      ...food,
      sequence: index,
    }));
    setSelectedFoods(updated);
  }, []);

  // Phân bổ thực phẩm vào thực đơn
  const handleAssignFoods = useCallback(async () => {
    if (!selectedMenu) {
      messageApi.error('Vui lòng chọn thực đơn');
      return false;
    }

    if (selectedFoods.length === 0) {
      messageApi.error('Vui lòng chọn ít nhất 1 thực phẩm');
      return false;
    }

    setLoading(true);
    try {
      // TODO: Thay thế bằng real API menuService.addFoodToMenu()
      // khi backend menu hoàn thành
      // const response = await menuService.addFoodsToMenu(
      //   selectedMenu._id,
      //   selectedFoods
      // );

      // Mock: Giả lập call API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Cập nhật selected menu
      const updatedMenu = {
        ...selectedMenu,
        foods: selectedFoods.map((f) => ({
          foodId: f._id,
          foodName: f.name,
          price: f.price,
          sequence: f.sequence,
        })),
      };

      setSelectedMenu(updatedMenu);
      messageApi.success(
        `Phân bổ ${selectedFoods.length} thực phẩm thành công`
      );

      return true;
    } catch (error) {
      messageApi.error(
        error?.response?.data?.message || 'Không thể phân bổ thực phẩm'
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedMenu, selectedFoods, messageApi]);

  // Xem trước khi lưu
  const handlePreview = useCallback(() => {
    setPreview({
      menu: selectedMenu,
      foods: selectedFoods,
      totalPrice: selectedFoods.reduce((sum, f) => sum + (f.price || 0), 0),
      count: selectedFoods.length,
    });
  }, [selectedMenu, selectedFoods]);

  // Publish thực đơn
  const handlePublish = useCallback(async () => {
    if (!selectedMenu) {
      messageApi.error('Vui lòng chọn thực đơn');
      return false;
    }

    setLoading(true);
    try {
      // TODO: Thay thế bằng real API menuService.publishMenu()
      // const response = await menuService.publishMenu(selectedMenu._id);

      // Mock
      await new Promise((resolve) => setTimeout(resolve, 800));

      const updatedMenu = {
        ...selectedMenu,
        status: 'published',
      };
      setSelectedMenu(updatedMenu);

      messageApi.success('Xuất bản thực đơn thành công');
      return true;
    } catch (error) {
      messageApi.error(
        error?.response?.data?.message || 'Không thể xuất bản thực đơn'
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedMenu, messageApi]);

  return {
    contextHolder,

    // Menu state
    menus,
    selectedMenu,
    menuLoading,

    // Food selection state
    selectedFoods,
    preview,
    loading,

    // Actions - menu
    fetchMenus,
    handleSelectMenu,

    // Actions - food selection
    handleAddFood,
    handleRemoveFood,
    handleReorderFoods,

    // Actions - assign & publish
    handleAssignFoods,
    handlePublish,
    handlePreview,
  };
};
