import { useRecipeManagement } from '@/hooks/useRecipeManagement';
import { useState } from 'react';
import RecipeListView from '@/components/recipe/RecipeListView';
import RecipeIngredientModal from '@/components/recipe/RecipeIngredientModal';
import RecipeDetailModal from '@/components/recipe/RecipeDetailModal';

// Trang quản lý công thức món ăn
export default function RecipeManagementPage() {
  const [detailOpen, setDetailOpen] = useState(false);

  const {
    contextHolder,
    loading,
    products,
    ingredients,
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
  } = useRecipeManagement();

  const handleOpenRecipeDetail = () => {
    setDetailOpen(true);
  };

  const handleCloseRecipeDetail = () => {
    setDetailOpen(false);
  };

  return (
    <div>
      {contextHolder}

      <RecipeListView
        loading={loading}
        products={products}
        ingredients={ingredients}
        recipeItems={recipeItems}
        selectedProduct={selectedProduct}
        selectedProductId={selectedProductId}
        productSearchText={productSearchText}
        onProductSearchTextChange={setProductSearchText}
        onSearchProducts={handleSearchProducts}
        onSelectProduct={handleSelectProduct}
        onViewRecipeDetail={handleOpenRecipeDetail}
        onRefresh={handleRefreshRecipe}
        onAdd={handleOpenCreate}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteRecipeItem}
      />

      <RecipeIngredientModal
        open={formModalOpen}
        mode={modalMode}
        initialValues={selectedRecipeItem}
        ingredients={ingredients}
        onSubmit={handleFormSubmit}
        onCancel={handleCloseFormModal}
      />

      <RecipeDetailModal
        open={detailOpen}
        onClose={handleCloseRecipeDetail}
        product={selectedProduct}
        recipeItems={recipeItems}
        ingredients={ingredients}
      />
    </div>
  );
}
