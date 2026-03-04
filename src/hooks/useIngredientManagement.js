import { useCallback, useEffect, useState } from 'react';
import { message, Modal } from 'antd';
import { useAuthStore } from '@/store/useAuthStore';
import {
  getAllIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  updateIngredientStock,
} from '@/services/ingredient.service';
import { getActiveIngredientCategories } from '@/services/ingredientCategory.service';

const { confirm } = Modal;

// Hook quản lý logic CRUD nguyên liệu
export const useIngredientManagement = () => {
  const { user } = useAuthStore();
  const [messageApi, contextHolder] = message.useMessage();

  // State UI
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // State data
  const [ingredients, setIngredients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // State modal
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  // Fetch danh sách categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await getActiveIngredientCategories();
      setCategories(response?.data?.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      messageApi.error('Không thể tải danh mục nguyên liệu');
    }
  }, [messageApi]);

  // Fetch danh sách nguyên liệu
  const fetchIngredients = useCallback(
    async (page = 1, pageSize = 10, search = '') => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: pageSize,
        };

        if (search) {
          params.search = search;
        }

        const response = await getAllIngredients(params);

        setIngredients(response?.data || []);
        setPagination({
          current: response?.pagination?.page || page,
          pageSize: response?.pagination?.limit || pageSize,
          total: response?.pagination?.total || 0,
        });
      } catch (error) {
        console.error('Error fetching ingredients:', error);
        messageApi.error('Không thể tải danh sách nguyên liệu');
      } finally {
        setLoading(false);
      }
    },
    [messageApi]
  );

  // Load dữ liệu ban đầu
  useEffect(() => {
    fetchCategories();
    fetchIngredients();
  }, [fetchCategories, fetchIngredients]);

  // Tìm kiếm nguyên liệu
  const handleSearch = useCallback(() => {
    fetchIngredients(1, pagination.pageSize, searchText);
  }, [fetchIngredients, pagination.pageSize, searchText]);

  // Chuyển trang
  const handlePaginationChange = useCallback(
    (page, pageSize) => {
      fetchIngredients(page, pageSize, searchText);
    },
    [fetchIngredients, searchText]
  );

  // Mở modal thêm mới
  const handleAdd = useCallback(() => {
    setModalMode('create');
    setSelectedIngredient(null);
    setFormModalOpen(true);
  }, []);

  // Mở modal chỉnh sửa
  const handleEdit = useCallback((ingredient) => {
    setModalMode('edit');
    setSelectedIngredient(ingredient);
    setFormModalOpen(true);
  }, []);

  // Mở modal cập nhật tồn kho
  const handleUpdateStock = useCallback((ingredient) => {
    setSelectedIngredient(ingredient);
    setStockModalOpen(true);
  }, []);

  // Đóng modal form
  const handleCloseFormModal = useCallback(() => {
    setFormModalOpen(false);
    setSelectedIngredient(null);
  }, []);

  // Đóng modal cập nhật tồn kho
  const handleCloseStockModal = useCallback(() => {
    setStockModalOpen(false);
    setSelectedIngredient(null);
  }, []);

  // Submit form thêm/sửa
  const handleFormSubmit = useCallback(
    async (values) => {
      try {
        const payload = {
          ...values,
          canteenId: user?.canteenId,
        };

        if (modalMode === 'create') {
          await createIngredient(payload);
          messageApi.success('Thêm nguyên liệu thành công');
        } else {
          await updateIngredient(selectedIngredient?._id, payload);
          messageApi.success('Cập nhật nguyên liệu thành công');
        }

        handleCloseFormModal();
        fetchIngredients(pagination.current, pagination.pageSize, searchText);
      } catch (error) {
        console.error('Error submitting ingredient:', error);
        messageApi.error(
          error?.response?.data?.message ||
            `${modalMode === 'create' ? 'Thêm' : 'Cập nhật'} nguyên liệu thất bại`
        );
      }
    },
    [
      fetchIngredients,
      handleCloseFormModal,
      messageApi,
      modalMode,
      pagination,
      searchText,
      selectedIngredient?._id,
      user?.canteenId,
    ]
  );

  // Submit cập nhật tồn kho
  const handleStockSubmit = useCallback(
    async ({ ingredientId, quantity, operation }) => {
      try {
        await updateIngredientStock(ingredientId, {
          quantity,
          operation,
        });

        messageApi.success('Cập nhật tồn kho thành công');
        handleCloseStockModal();
        fetchIngredients(pagination.current, pagination.pageSize, searchText);
      } catch (error) {
        console.error('Error updating stock:', error);
        messageApi.error(
          error?.response?.data?.message || 'Cập nhật tồn kho thất bại'
        );
      }
    },
    [
      fetchIngredients,
      handleCloseStockModal,
      messageApi,
      pagination,
      searchText,
    ]
  );

  // Xóa nguyên liệu
  const handleDelete = useCallback(
    (ingredient) => {
      confirm({
        title: 'Xác nhận xóa',
        content: `Bạn có chắc chắn muốn xóa nguyên liệu "${ingredient.name}"? Hành động này không thể hoàn tác.`,
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await deleteIngredient(ingredient._id);
            messageApi.success('Xóa nguyên liệu thành công');
            fetchIngredients(
              pagination.current,
              pagination.pageSize,
              searchText
            );
          } catch (error) {
            console.error('Error deleting ingredient:', error);
            messageApi.error(
              error?.response?.data?.message || 'Xóa nguyên liệu thất bại'
            );
          }
        },
      });
    },
    [fetchIngredients, messageApi, pagination, searchText]
  );

  return {
    contextHolder,
    loading,
    searchText,
    ingredients,
    categories,
    pagination,
    formModalOpen,
    stockModalOpen,
    modalMode,
    selectedIngredient,
    setSearchText,
    handleSearch,
    handlePaginationChange,
    handleAdd,
    handleEdit,
    handleUpdateStock,
    handleDelete,
    handleFormSubmit,
    handleStockSubmit,
    handleCloseFormModal,
    handleCloseStockModal,
  };
};
