import { useIngredientManagement } from '@/hooks/useIngredientManagement';
import { useState } from 'react';
import IngredientListView from '@/components/ingredient/IngredientListView';
import IngredientFormModal from '@/components/ingredient/IngredientFormModal';
import IngredientDetailModal from '@/components/ingredient/IngredientDetailModal';
import StockUpdateModal from '@/components/ingredient/StockUpdateModal';

// Trang quản lý nguyên liệu
export default function IngredientManagement() {
  // State cho detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailIngredientId, setDetailIngredientId] = useState(null);

  const {
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
  } = useIngredientManagement();

  // Handler xem chi tiết
  const handleDetail = (ingredientId) => {
    setDetailIngredientId(ingredientId);
    setDetailModalOpen(true);
  };

  // Handler đóng detail modal
  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setDetailIngredientId(null);
  };

  return (
    <div>
      {contextHolder}

      <IngredientListView
        loading={loading}
        items={ingredients}
        pagination={pagination}
        searchText={searchText}
        onSearchChange={setSearchText}
        onSearch={handleSearch}
        onPaginationChange={handlePaginationChange}
        onAdd={handleAdd}
        onDetail={handleDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onUpdateStock={handleUpdateStock}
      />

      <IngredientFormModal
        open={formModalOpen}
        mode={modalMode}
        initialValues={selectedIngredient}
        categories={categories}
        onSubmit={handleFormSubmit}
        onCancel={handleCloseFormModal}
      />

      <IngredientDetailModal
        open={detailModalOpen}
        ingredientId={detailIngredientId}
        onClose={handleCloseDetailModal}
        onEdit={(ingredient) => {
          handleEdit(ingredient);
          handleCloseDetailModal();
        }}
      />

      <StockUpdateModal
        open={stockModalOpen}
        ingredient={selectedIngredient}
        onSubmit={handleStockSubmit}
        onCancel={handleCloseStockModal}
      />
    </div>
  );
}
