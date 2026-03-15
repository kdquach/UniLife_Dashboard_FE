import { useCallback, useEffect, useMemo, useState } from 'react';
import { message, Modal } from 'antd';
import { useAuthStore } from '@/store/useAuthStore';
import { getAllProducts } from '@/services/product.service';
import { getAllIngredients } from '@/services/ingredient.service';
import {
  getRecipeByProduct,
  addRecipeIngredient,
  updateRecipeIngredient,
  removeRecipeIngredient,
} from '@/services/recipe.service';

const { confirm } = Modal;

// Hook quản lý logic CRUD công thức sản phẩm
export const useRecipeManagement = () => {
  const { user } = useAuthStore();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [recipeItems, setRecipeItems] = useState([]);

  const [selectedProductId, setSelectedProductId] = useState(null);
  const [productSearchText, setProductSearchText] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedRecipeItem, setSelectedRecipeItem] = useState(null);

  const normalizeId = useCallback((value) => {
    if (!value) {
      return null;
    }

    if (typeof value === 'object') {
      return value._id || value.id || null;
    }

    return value;
  }, []);

  const selectedProduct = useMemo(
    () => products.find((item) => item._id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const selectedProductCanteenId = useMemo(
    () => normalizeId(selectedProduct?.canteenId),
    [normalizeId, selectedProduct?.canteenId]
  );

  const availableIngredients = useMemo(() => {
    if (!selectedProductCanteenId) {
      return ingredients;
    }

    return ingredients.filter((item) => {
      const ingredientCanteenId = normalizeId(item.canteenId);
      return ingredientCanteenId === selectedProductCanteenId;
    });
  }, [ingredients, normalizeId, selectedProductCanteenId]);

  // Tải danh sách sản phẩm để chọn sản phẩm quản lý công thức
  const fetchProducts = useCallback(
    async (search = '') => {
      try {
        const response = await getAllProducts({
          page: 1,
          limit: 200,
          search,
          status: 'available',
        });

        setProducts(response?.data || []);
      } catch (error) {
        console.error('Error fetching products for recipe:', error);
        messageApi.error('Không thể tải danh sách sản phẩm');
      }
    },
    [messageApi]
  );

  // Tải danh sách nguyên liệu phục vụ form thêm/sửa công thức
  const fetchIngredients = useCallback(
    async (canteenId) => {
      try {
        const params = {
          page: 1,
          limit: 500,
        };

        if (canteenId) {
          params.canteenId = canteenId;
        }

        const response = await getAllIngredients(params);
        setIngredients(response?.data || []);
      } catch (error) {
        console.error('Error fetching ingredients for recipe:', error);
        messageApi.error('Không thể tải danh sách nguyên liệu');
      }
    },
    [messageApi]
  );

  // Tải công thức theo sản phẩm
  const fetchRecipe = useCallback(
    async (productId) => {
      if (!productId) {
        setRecipeItems([]);
        return;
      }

      setLoading(true);
      try {
        const response = await getRecipeByProduct(productId);
        const recipe = response?.data?.recipe || response?.data || [];
        setRecipeItems(Array.isArray(recipe) ? recipe : []);
      } catch (error) {
        console.error('Error fetching recipe:', error);
        messageApi.error(
          error?.response?.data?.message || 'Không thể tải công thức sản phẩm'
        );
        setRecipeItems([]);
      } finally {
        setLoading(false);
      }
    },
    [messageApi]
  );

  useEffect(() => {
    fetchProducts('');
    fetchIngredients(normalizeId(user?.canteenId));
  }, [fetchIngredients, fetchProducts, normalizeId, user?.canteenId]);

  useEffect(() => {
    if (selectedProductCanteenId) {
      fetchIngredients(selectedProductCanteenId);
    }
  }, [fetchIngredients, selectedProductCanteenId]);

  useEffect(() => {
    if (selectedProductId) {
      fetchRecipe(selectedProductId);
    }
  }, [fetchRecipe, selectedProductId]);

  const handleSearchProducts = useCallback(() => {
    fetchProducts(productSearchText.trim());
  }, [fetchProducts, productSearchText]);

  const handleSelectProduct = useCallback((productId) => {
    setSelectedProductId(productId || null);
  }, []);

  const handleRefreshRecipe = useCallback(() => {
    if (selectedProductId) {
      fetchRecipe(selectedProductId);
    }
  }, [fetchRecipe, selectedProductId]);

  const handleOpenCreate = useCallback(() => {
    if (!selectedProductId) {
      messageApi.warning('Vui lòng chọn sản phẩm trước khi thêm công thức');
      return;
    }

    setModalMode('create');
    setSelectedRecipeItem(null);
    setFormModalOpen(true);
  }, [messageApi, selectedProductId]);

  const handleOpenEdit = useCallback((recipeItem) => {
    setModalMode('edit');
    setSelectedRecipeItem(recipeItem);
    setFormModalOpen(true);
  }, []);

  const handleCloseFormModal = useCallback(() => {
    setFormModalOpen(false);
    setSelectedRecipeItem(null);
  }, []);

  const handleFormSubmit = useCallback(
    async (values) => {
      if (!selectedProductId) {
        messageApi.error('Chưa chọn sản phẩm');
        return false;
      }

      try {
        if (modalMode === 'create') {
          await addRecipeIngredient(selectedProductId, {
            ingredientId: values.ingredientId,
            quantity: Number(values.quantity),
            unit: values.unit,
          });
          messageApi.success('Thêm nguyên liệu vào công thức thành công');
        } else {
          await updateRecipeIngredient(
            selectedProductId,
            selectedRecipeItem?.ingredientId,
            {
              quantity: Number(values.quantity),
              unit: values.unit,
            }
          );
          messageApi.success('Cập nhật công thức thành công');
        }

        handleCloseFormModal();
        fetchRecipe(selectedProductId);
        return true;
      } catch (error) {
        console.error('Error submitting recipe form:', error);
        messageApi.error(
          error?.response?.data?.message ||
            `${modalMode === 'create' ? 'Thêm' : 'Cập nhật'} công thức thất bại`
        );
        return false;
      }
    },
    [
      fetchRecipe,
      handleCloseFormModal,
      messageApi,
      modalMode,
      selectedProductId,
      selectedRecipeItem?.ingredientId,
    ]
  );

  const handleDeleteRecipeItem = useCallback(
    (recipeItem) => {
      if (!selectedProductId) {
        return;
      }

      confirm({
        title: 'Xác nhận xóa nguyên liệu',
        content: `Bạn có chắc chắn muốn xóa nguyên liệu "${recipeItem.ingredientName}" khỏi công thức?`,
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await removeRecipeIngredient(
              selectedProductId,
              recipeItem.ingredientId
            );
            messageApi.success('Xóa nguyên liệu khỏi công thức thành công');
            fetchRecipe(selectedProductId);
          } catch (error) {
            console.error('Error deleting recipe item:', error);
            messageApi.error(
              error?.response?.data?.message ||
                'Xóa nguyên liệu khỏi công thức thất bại'
            );
          }
        },
      });
    },
    [fetchRecipe, messageApi, selectedProductId]
  );

  return {
    contextHolder,
    loading,
    products,
    ingredients: availableIngredients,
    recipeItems,
    selectedProduct,
    selectedProductId,
    productSearchText,
    formModalOpen,
    modalMode,
    selectedRecipeItem,
    setProductSearchText,
    handleSearchProducts,
    handleSelectProduct,
    handleRefreshRecipe,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseFormModal,
    handleFormSubmit,
    handleDeleteRecipeItem,
  };
};
