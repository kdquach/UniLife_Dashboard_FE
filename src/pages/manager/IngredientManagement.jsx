import { useIngredientManagement } from '@/hooks/useIngredientManagement';
import IngredientListView from '@/components/ingredient/IngredientListView';
import IngredientFormModal from '@/components/ingredient/IngredientFormModal';
import StockUpdateModal from '@/components/ingredient/StockUpdateModal';

// Trang quản lý nguyên liệu
export default function IngredientManagement() {
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

      <StockUpdateModal
        open={stockModalOpen}
        ingredient={selectedIngredient}
        onSubmit={handleStockSubmit}
        onCancel={handleCloseStockModal}
      />
    </div>
  );
}
