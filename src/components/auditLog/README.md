# Audit Log Module - Frontend

Module này cung cấp giao diện quản lý nhật ký hoạt động hệ thống (Audit Log).

## 📁 Cấu Trúc Thư Mục

```
src/
├── components/auditLog/          # Components cho Audit Log module
│   ├── AuditLogTable.jsx         # Bảng danh sách nhật ký
│   ├── AuditStatistics.jsx       # Biểu đồ thống kê hoạt động
│   └── AuditErrorLogs.jsx        # Danh sách lỗi hệ thống
├── pages/
│   ├── AuditLog.jsx              # Main page - Trang chính
│   └── AuditLogDetail.jsx        # Modal chi tiết nhật ký
└── services/
    └── auditLog.service.js       # Service gọi API
```

## 🎯 Các Trang

### 1. **AuditLog.jsx** - Trang Chính

Trang chính quản lý Audit Log với 3 tab chính:

- **Nhật ký hoạt động**: Danh sách tất cả hoạt động trong hệ thống
  - Lọc theo: Hành động, Loại tài nguyên, Khoảng thời gian
  - Xem chi tiết từng log
  - Phân trang

- **Thống kê**: Biểu đồ và thống kê hoạt động
  - Tổng số hoạt động
  - Biểu đồ cột: Hoạt động theo loại hành động
  - Biểu đồ tròn: Tỷ lệ hoạt động
  - Top 10 nhân viên hoạt động nhiều nhất

- **Danh sách lỗi**: Lỗi xảy ra trong hệ thống
  - Lọc theo khoảng thời gian
  - Xem chi tiết lỗi
  - Hiển thị Error Message và Stack Trace

### 2. **AuditLogDetail.jsx** - Modal Chi Tiết

Hiển thị toàn bộ thông tin chi tiết của một log:

- Thông tin cơ bản (ID, Hành động, Module, Mô tả)
- Thông tin người dùng (Tên, Email, Role)
- Thông tin HTTP (Method, Endpoint, Status Code, IP)
- Dữ liệu thay đổi (Old values, New values)
- Thông tin lỗi (Error message, Stack trace)
- Nút sao chép dữ liệu

## 🧩 Các Components

### 1. **AuditLogTable.jsx**

Bảng hiển thị danh sách nhật ký hoạt động

**Tính năng:**

- Hiển thị các cột: Thời gian, Hành động, Module, Tài nguyên, Người dùng, Mô tả, Status Code
- Lọc theo: Action, Resource Type, Khoảng thời gian
- Phân trang với 20 items/trang
- Nút làm mới, Reset filters
- Xem chi tiết từng log

```jsx
import AuditLogTable from '@/components/auditLog/AuditLogTable';

<AuditLogTable onViewDetail={(logId) => handleViewDetail(logId)} />;
```

### 2. **AuditStatistics.jsx**

Thống kê và biểu đồ hoạt động

**Tính năng:**

- Chọn khoảng thời gian: 7 ngày, 30 ngày, 90 ngày, 365 ngày
- Hiển thị tổng số hoạt động
- Biểu đồ cột hoạt động theo loại
- Biểu đồ tròn tỷ lệ hoạt động
- Bảng Top 10 nhân viên

```jsx
import AuditStatistics from '@/components/auditLog/AuditStatistics';

<AuditStatistics />;
```

### 3. **AuditErrorLogs.jsx**

Danh sách lỗi hệ thống

**Tính năng:**

- Lọc theo khoảng thời gian: Hôm nay, 7 ngày, 30 ngày, 90 ngày
- Hiển thị các cột: Thời gian, Module, Người dùng, Error message, Endpoint, Method, IP
- Phân trang
- Xem chi tiết lỗi

```jsx
import AuditErrorLogs from '@/components/auditLog/AuditErrorLogs';

<AuditErrorLogs onViewDetail={(logId) => handleViewDetail(logId)} />;
```

## 🔌 Service APIs

### **auditLog.service.js**

```javascript
const {
  getAllAuditLogs, // Danh sách log với filters
  getAuditLogById, // Chi tiết một log
  getAuditLogsByUser, // Log của một user
  getAuditLogsByResource, // Log của một tài nguyên
  getActivityStatistics, // Thống kê hoạt động
  getErrorLogs, // Danh sách lỗi
  deleteOldAuditLogs, // Xóa log cũ (Admin)
} = useAuditLogService();
```

### Ví dụ Sử Dụng

```javascript
// Lấy danh sách log
const response = await getAllAuditLogs({
  page: 1,
  limit: 20,
  action: 'UPDATE',
  resourceType: 'Product',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});

// Lấy thống kê
const stats = await getActivityStatistics(30); // 30 ngày

// Xóa log cũ (Admin only)
const result = await deleteOldAuditLogs(90); // Xóa > 90 ngày
```

## 📊 Dữ Liệu Document

Một document nhật ký chứa:

```javascript
{
  _id: ObjectId,
  action: "CREATE|UPDATE|DELETE|READ|LOGIN|LOGOUT|ERROR",
  module: "Tên module",
  description: "Mô tả hành động",

  // Người dùng
  userId: ObjectId,
  userName: "Nguyễn Văn A",
  userEmail: "email@example.com",
  userRole: "admin|staff|manager|customer",

  // Tài nguyên
  resourceType: "User|Product|Order|Menu|...",
  resourceId: ObjectId,
  resourceName: "Tên tài nguyên",

  // HTTP Info
  method: "GET|POST|PUT|PATCH|DELETE",
  endpoint: "/api/v1/products/123",
  statusCode: 200,
  ipAddress: "192.168.1.1",

  // Dữ liệu thay đổi
  oldValues: { ... },
  newValues: { ... },

  // Lỗi (nếu có)
  errorMessage: "Error message",
  errorStack: "Stack trace",

  createdAt: "2024-03-05T10:30:00Z"
}
```

## 🔐 Quyền Hạn

- **Xem danh sách log**: Admin, Staff, Manager
- **Xem chi tiết log**: Admin, Staff, Manager
- **Xem thống kê**: Admin, Staff, Manager
- **Xóa log cũ**: Admin only

## 🛣️ Routes

```
GET  /audit-logs                              # Danh sách log
GET  /audit-logs/:id                          # Chi tiết log
GET  /audit-logs/statistics/activity          # Thống kê
GET  /audit-logs/errors/list                  # Danh sách lỗi
GET  /audit-logs/users/:userId                # Log của user
GET  /audit-logs/resources/:type/:id          # Log của tài nguyên
DELETE /audit-logs/cleanup/old                # Xóa log cũ (Admin)
```

## 📱 Responsive Design

- Mobile: 1 cột
- Tablet: 2 cột
- Desktop: 3+ cột

## 🎨 Màu Sắc Tag

### Action Colors

- **CREATE**: Green
- **UPDATE**: Blue
- **DELETE**: Red
- **LOGIN**: Cyan
- **LOGOUT**: Orange
- **ERROR**: Volcano

### HTTP Method Colors

- **GET**: Blue
- **POST**: Green
- **PUT**: Orange
- **PATCH**: Cyan
- **DELETE**: Red

### Status Code Colors

- **2xx**: Green (Thành công)
- **3xx**: Orange (Redirect)
- **4xx**: Red (Client error)
- **5xx**: Volcano (Server error)

## 🔄 Cập Nhật & Mở Rộng

### Thêm Filter Mới

1. Sửa `AuditLogTable.jsx`:

```javascript
const handleFilterChange = (key, value) => {
  setFilters({
    ...filters,
    [key]: value, // Thêm filter mới
  });
};
```

2. Thêm Select input:

```jsx
<Select
  placeholder="Lọc theo field mới"
  onChange={(value) => handleFilterChange('newField', value)}
/>
```

### Thêm Cột Mới

Sửa `columns` array trong `AuditLogTable.jsx`:

```javascript
{
  title: 'Tên cột',
  dataIndex: 'fieldName',
  key: 'fieldName',
  render: (text) => <Tag>{text}</Tag>
}
```

## ⚠️ Lưu Ý

1. **Performance**: Dữ liệu được phân trang tự động
2. **Auto-delete**: Log cũ > 90 ngày tự động xóa qua TTL index
3. **No edit**: Không thể sửa/xóa log đơn lẻ (chỉ xóa hàng loạt log cũ)
4. **Fire and forget**: Ghi log không chặn request chính

## 📚 Tài Liệu Related

- [Backend Audit Log Documentation](../../UniLife_BE/docs/)
- [Copilot Instructions](../../UniLife_Dashboard_FE/.github/copilot-instructions.md)
