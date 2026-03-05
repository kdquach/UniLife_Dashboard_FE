# Ingredient Management Components

Các components React để quản lý nguyên liệu trong hệ thống.

## 📁 Cấu trúc

```
src/
├── components/ingredient/
│   ├── IngredientFormModal.jsx    # Modal thêm/sửa nguyên liệu
│   ├── IngredientListView.jsx     # Hiển thị danh sách nguyên liệu
│   ├── StockUpdateModal.jsx       # Modal cập nhật tồn kho
│   └── index.js                    # Export tập trung
├── pages/manager/
│   └── IngredientManagement.jsx   # Trang quản lý nguyên liệu
└── services/
    └── ingredient.service.js       # API calls cho nguyên liệu
```

## 🎨 Components

### 1. IngredientFormModal

Modal form để thêm mới hoặc chỉnh sửa nguyên liệu.

**Props:**

- `open` (boolean): Hiển thị/ẩn modal
- `mode` ('create' | 'edit'): Chế độ thêm mới hoặc chỉnh sửa
- `initialValues` (object): Dữ liệu ban đầu khi edit
- `categories` (array): Danh sách danh mục nguyên liệu
- `onSubmit` (function): Callback khi submit form
- `onCancel` (function): Callback khi đóng modal

**Fields:**

- Tên nguyên liệu (required, max 100 ký tự)
- Danh mục (required, select)
- Đơn vị (required, enum: kg, g, lít, ml, cái, gói, hộp, lon)
- Tồn kho (required, number >= 0)
- Ngưỡng cảnh báo (number >= 0, default: 10)
- Trạng thái (boolean, default: true)

**Example:**

```jsx
<IngredientFormModal
  open={isOpen}
  mode="create"
  categories={categories}
  onSubmit={handleSubmit}
  onCancel={handleClose}
/>
```

### 2. IngredientListView

Component hiển thị danh sách nguyên liệu dạng bảng với các chức năng search, filter, pagination.

**Props:**

- `loading` (boolean): Trạng thái loading
- `items` (array): Danh sách nguyên liệu
- `pagination` (object): Thông tin phân trang
- `searchText` (string): Giá trị search hiện tại
- `onSearchChange` (function): Callback khi thay đổi search text
- `onSearch` (function): Callback khi submit search
- `onPaginationChange` (function): Callback khi thay đổi trang
- `onAdd` (function): Callback khi click thêm mới
- `onEdit` (function): Callback khi click chỉnh sửa
- `onDelete` (function): Callback khi click xóa
- `onUpdateStock` (function): Callback khi click cập nhật tồn kho

**Table Columns:**

- Tên nguyên liệu (sortable)
- Danh mục
- Tồn kho (với tag màu: đỏ nếu <= ngưỡng, xanh nếu > ngưỡng)
- Đơn vị
- Ngưỡng cảnh báo
- Trạng thái (filterable)
- Ngày tạo (sortable)
- Hành động (Cập nhật kho, Sửa, Xóa)

**Example:**

```jsx
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
```

### 3. StockUpdateModal

Modal để cập nhật tồn kho nguyên liệu với 3 thao tác: Nhập thêm, Xuất kho, Đặt lại số lượng.

**Props:**

- `open` (boolean): Hiển thị/ẩn modal
- `ingredient` (object): Thông tin nguyên liệu cần cập nhật
- `onSubmit` (function): Callback khi submit ({ ingredientId, quantity, operation })
- `onCancel` (function): Callback khi đóng modal

**Operations:**

- `add`: Nhập thêm (stock += quantity)
- `subtract`: Xuất kho (stock -= quantity)
- `set`: Đặt lại (stock = quantity)

**Features:**

- Hiển thị tồn kho hiện tại
- Tính toán và preview tồn kho sau cập nhật
- Validation:
  - Số lượng phải > 0 (với add/subtract)
  - Không được xuất vượt quá tồn kho
  - Cảnh báo nếu tồn kho mới <= ngưỡng
- Real-time preview với Form.useWatch

**Example:**

```jsx
<StockUpdateModal
  open={isOpen}
  ingredient={selectedIngredient}
  onSubmit={handleStockSubmit}
  onCancel={handleClose}
/>
```

## 🎯 Page

### IngredientManagement

Trang quản lý nguyên liệu với đầy đủ CRUD operations.

**Features:**

- ✅ Danh sách nguyên liệu với pagination
- ✅ Tìm kiếm nguyên liệu
- ✅ Thêm mới nguyên liệu
- ✅ Chỉnh sửa nguyên liệu
- ✅ Xóa nguyên liệu (với confirm dialog)
- ✅ Cập nhật tồn kho (add/subtract/set)
- ✅ Auto-refresh sau mỗi thao tác
- ✅ Message thông báo thành công/lỗi
- ✅ Lọc theo danh mục và trạng thái
- ✅ Sắp xếp theo nhiều cột

**Routes:**

- `/staff/ingredients` - Cho Staff
- `/manager/ingredients` - Cho Manager

**Permissions:**

- Staff: CRUD nguyên liệu, cập nhật tồn kho
- Manager: Tất cả quyền của Staff

## 🔧 Services

### ingredient.service.js

API calls cho module Ingredient.

**Methods:**

- `getAllIngredients(params)` - Lấy danh sách nguyên liệu (có pagination, search)
- `getIngredientById(id)` - Lấy chi tiết một nguyên liệu
- `createIngredient(data)` - Tạo nguyên liệu mới
- `updateIngredient(id, data)` - Cập nhật thông tin nguyên liệu
- `deleteIngredient(id)` - Xóa nguyên liệu
- `updateIngredientStock(id, { quantity, operation })` - Cập nhật tồn kho
- `getLowStockIngredients(params)` - Lấy danh sách nguyên liệu sắp hết

## 🚀 Usage

### 1. Import page vào route

```jsx
// App.jsx
import IngredientManagementPage from '@/pages/manager/IngredientManagement';

// Add route
<Route path="ingredients" element={<IngredientManagementPage />} />;
```

### 2. Thêm menu item

```jsx
// Sidebar.jsx
{
  key: '/staff/ingredients',
  label: 'Nguyên liệu',
}
```

### 3. Sử dụng components riêng lẻ

```jsx
import IngredientFormModal from '@/components/ingredient/IngredientFormModal';
import IngredientListView from '@/components/ingredient/IngredientListView';
import StockUpdateModal from '@/components/ingredient/StockUpdateModal';

// Trong component của bạn
<IngredientListView {...props} />;
```

## 📝 Data Schema

```javascript
{
  _id: "648abc...",
  canteenId: {
    _id: "648xyz...",
    name: "Căng tin A"
  },
  categoryId: {
    _id: "649def...",
    name: "Thịt"
  },
  name: "Thịt bò",
  stock: 50,
  unit: "kg",
  lowStockThreshold: 10,
  isActive: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-15T10:30:00.000Z"
}
```

## ⚠️ Important Notes

1. **Đơn vị (unit)**: Phải khớp với BE - có 8 giá trị hợp lệ
2. **canteenId**: Tự động lấy từ user.canteenId khi create
3. **Validation**: Tồn kho và ngưỡng cảnh báo không được âm
4. **Stock operations**:
   - `add`: Tăng tồn kho
   - `subtract`: Giảm tồn kho (phải đủ số lượng)
   - `set`: Đặt lại tồn kho (có thể set = 0)
5. **Delete**: Sẽ xóa cả các recipe liên quan (cascade delete ở BE)

## 🎨 UI/UX

- **Colors**:
  - Tồn kho thấp: Tag màu đỏ (#ff4d4f)
  - Tồn kho đủ: Tag màu xanh (#52c41a)
  - Hoạt động: Tag success
  - Tạm ngưng: Tag default

- **Icons** (Material Icons):
  - `inventory_2`: Nguyên liệu
  - `inventory`: Cập nhật tồn kho
  - `edit`: Chỉnh sửa
  - `delete`: Xóa
  - `add`: Thêm mới

- **Responsive**: Table scroll ngang từ 1200px trở xuống

## 🔗 Related

- [Backend Ingredient API](../../../UniLife_BE/src/modules/ingredient/README.md)
- [IngredientCategory Components](./IngredientCategories.jsx)
- [Product Management](../pages/manager/ProductManagement.jsx)
