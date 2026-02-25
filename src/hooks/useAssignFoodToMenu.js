import { useState, useCallback } from 'react';
import { message } from 'antd';
import { getAllMenus, updateMenu } from '@/services/menu.service';

/**
 * Hook quản lý logic phân bổ thực phẩm vào thực đơn
 * Dùng API menu từ backend để lấy và cập nhật thực đơn
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

  // Hàm map dữ liệu thực đơn từ API sang dạng dùng cho UI
  const mapMenuFromApi = useCallback((menu) => {
    if (!menu) return null;

    const foods = (menu.items || []).map((item, index) => {
      const product = item.productId || {};
      const category = product.categoryId || null;

      return {
        _id: product._id || item.productId,
        name: product.name,
        price: product.price,
        image: product.image,
        // Comment: Lưu lại thông tin danh mục nếu BE đã populate categoryId
        categoryId: category,
        sequence: typeof item.order === 'number' ? item.order : index,
      };
    });

    return {
      ...menu,
      foods,
    };
  }, []);

  // Lấy danh sách thực đơn theo căng tin
  const fetchMenus = useCallback(
    async (canteenId) => {
      setMenuLoading(true);
      try {
        const response = await getAllMenus({ canteenId });
        const apiMenus = response?.data?.menus || [];
        const mappedMenus = apiMenus.map((menu) => mapMenuFromApi(menu));

        setMenus(mappedMenus);

        // Nếu chưa chọn menu thì tự động chọn menu đầu tiên
        setSelectedMenu((prevSelected) => {
          if (!prevSelected && mappedMenus.length > 0) {
            setSelectedFoods(mappedMenus[0].foods || []);
            return mappedMenus[0];
          }
          return prevSelected;
        });

        return mappedMenus;
      } catch (error) {
        messageApi.error(
          error?.response?.data?.message || 'Không thể tải thực đơn'
        );
        return [];
      } finally {
        setMenuLoading(false);
      }
    },
    [messageApi, mapMenuFromApi]
  );

  // Chọn thực đơn để phân bổ
  const handleSelectMenu = useCallback((menu) => {
    setSelectedMenu(menu);
    setSelectedFoods(menu?.foods || []);
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
      // Gọi API cập nhật danh sách món trong thực đơn
      const payload = {
        items: selectedFoods.map((food, index) => ({
          productId: food._id,
          order:
            typeof food.sequence === 'number' ? food.sequence : index,
        })),
      };

      const response = await updateMenu(selectedMenu._id, payload);
      const updatedMenuApi = response?.data?.menu;
      const mappedMenu = mapMenuFromApi(updatedMenuApi || selectedMenu);

      setSelectedMenu(mappedMenu);
      setMenus((prev) =>
        prev.map((menu) =>
          menu._id === mappedMenu._id ? mappedMenu : menu
        )
      );
      setSelectedFoods(mappedMenu.foods || []);
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
      const response = await updateMenu(selectedMenu._id, {
        status: 'active',
      });

      const updatedMenuApi = response?.data?.menu;
      const mappedMenu = mapMenuFromApi(updatedMenuApi || selectedMenu);

      setSelectedMenu(mappedMenu);
      setMenus((prev) =>
        prev.map((menu) =>
          menu._id === mappedMenu._id ? mappedMenu : menu
        )
      );

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
