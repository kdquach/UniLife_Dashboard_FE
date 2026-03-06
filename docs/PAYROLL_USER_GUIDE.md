# 💰 Quản lý Bảng lương - Hướng dẫn sử dụng

## 🎯 Tổng quan

Module quản lý bảng lương với 3 chức năng chính:

1. **Quản lý mức lương cá nhân** (`/manager/salary-rates`)
2. **Tạo & quản lý bảng lương** (`/manager/payroll`)
3. **Chi tiết & điều chỉnh lương** (`/manager/payroll/:id`)

## 📋 Quy trình sử dụng

### Bước 1: Thiết lập mức lương cho nhân viên

**Vị trí:** Sidebar → "Quản lý mức lương"

**Chức năng:**

- ✅ Xem danh sách mức lương hiện tại
- ✅ Thêm/Sửa mức lương cho từng nhân viên
- ✅ Cấu hình chi tiết: lương giờ, thưởng chuyên cần, phạt đi muộn/vắng

**Thông tin cần nhập:**

- Nhân viên (chọn từ dropdown)
- Lương theo giờ (VNĐ)
- Ngày hiệu lực
- Thưởng chuyên cần 100%, 95%, 90%
- Hệ số làm thêm (1.2x, 1.5x...)
- Phạt đi muộn/về sớm/vắng
- Số lần muộn tối đa được phép

**Lưu ý:** Mỗi nhân viên chỉ có 1 mức lương hiện tại. Sửa sẽ ghi đè mức cũ.

---

### Bước 2: Tạo bảng lương tự động

**Vị trí:** Sidebar → "Quản lý bảng lương" → Nút "Tạo bảng lương"

**Thao tác:**

1. Nhấn nút "Tạo bảng lương"
2. Chọn kỳ lương (Từ ngày - Đến ngày)
   - Thường chọn ngày 1 → ngày cuối tháng
3. Nhấn "Tạo bảng lương"

**Hệ thống sẽ tự động:**

- ✅ Lấy tất cả ca làm đã check-out trong kỳ
- ✅ Tính tổng giờ làm của từng nhân viên
- ✅ Tính lương theo mức lương cá nhân
- ✅ Tính thưởng chuyên cần, làm thêm
- ✅ Khấu trừ đi muộn, về sớm, vắng
- ✅ Tạo bảng lương ở trạng thái "Nháp"

**Kết quả:**

- Bảng lương mới xuất hiện trong danh sách
- Trạng thái: 🔵 Đã tính
- Có thể xem chi tiết và điều chỉnh

---

### Bước 3: Xem chi tiết & điều chỉnh lương

**Vị trí:** Nhấn vào bảng lương trong danh sách

**Thông tin hiển thị:**

📊 **Thống kê tổng quan:**

- Số nhân viên
- Tổng giờ làm
- Tổng lương
- Kỳ lương

📋 **Bảng chi tiết từng nhân viên:**

| Nhân viên    | Lương giờ | Số giờ  | Lương cơ bản | Thưởng    | Khấu trừ | Tổng lương | Thao tác      |
| ------------ | --------- | ------- | ------------ | --------- | -------- | ---------- | ------------- |
| Nguyễn Văn A | 50,000đ/h | 160 giờ | 8,000,000đ   | +500,000đ | -50,000đ | 8,450,000đ | 🔧 Điều chỉnh |

**Điều chỉnh lương nhân viên:**

1. Nhấn nút "Điều chỉnh" ở cột thao tác
2. Dialog hiển thị:
   - **Phần 1:** Thông tin nhân viên, lương hiện tại
   - **Phần 2:** Chi tiết cấu hình mức lương cá nhân
   - **Phần 3:** Form điều chỉnh
3. Chọn loại điều chỉnh:
   - 🎁 **Thưởng thêm:** Cho các khoản thưởng đặc biệt
   - ⚠️ **Khấu trừ:** Cho các khoản phạt bổ sung
4. Nhập số tiền và lý do (tối thiểu 10 ký tự)
5. Xem preview tổng lương sau điều chỉnh
6. Nhấn "Lưu thay đổi"

**Ví dụ điều chỉnh:**

- Thưởng thêm 500,000đ - "Hoàn thành xuất sắc KPI tháng"
- Khấu trừ 200,000đ - "Vi phạm quy định về trang phục"

---

### Bước 4: Duyệt kỳ lương

**Điều kiện:** Đã kiểm tra kỹ, không còn chỉnh sửa

**Thao tác:**

1. Trong trang chi tiết bảng lương
2. Nhấn nút "Duyệt kỳ lương" (màu xanh)
3. Xác nhận trong popup

**Kết quả:**

- ✅ Trạng thái chuyển sang "Đã duyệt"
- 🔒 Không thể chỉnh sửa lương nữa
- Có thể xác nhận thanh toán

---

### Bước 5: Xác nhận thanh toán

**Điều kiện:** Đã duyệt + Đã trả lương thực tế

**Thao tác:**

1. Nhấn nút "Xác nhận thanh toán"
2. Xác nhận trong popup

**Kết quả:**

- ✅ Trạng thái chuyển sang "Đã thanh toán"
- 📅 Ghi nhận thời gian thanh toán
- Kỳ lương hoàn tất

---

## 🎨 Giao diện & Tính năng

### Danh sách bảng lương

```
┌─────────────────────────────────────────────────────────┐
│  Quản lý bảng lương           [🔄 Làm mới] [➕ Tạo mới] │
├─────────────────────────────────────────────────────────┤
│  Lọc: [Trạng thái ▼] [Tháng ▼] [Năm ▼]                 │
├─────────────────────────────────────────────────────────┤
│  Kỳ lương    | Trạng thái  | Nhân viên | Tổng lương    │
│  02/2026     | 🔵 Đã tính  | 8 người   | 68,500,000đ   │
│  01/2026     | 🟢 Đã duyệt | 8 người   | 65,200,000đ   │
│  12/2025     | ✅ Đã TT    | 7 người   | 58,900,000đ   │
└─────────────────────────────────────────────────────────┘
```

### Chi tiết bảng lương

```
┌─────────────────────────────────────────────────────────┐
│  ← Chi tiết bảng lương - 02/2026     [🗑️ Xóa]          │
│                                      [✅ Duyệt kỳ lương] │
├─────────────────────────────────────────────────────────┤
│  📊 Thống kê:                                            │
│  • Số nhân viên: 8 người                                 │
│  • Tổng giờ làm: 1,280 giờ                               │
│  • Tổng lương: 68,500,000đ                               │
├─────────────────────────────────────────────────────────┤
│  💡 Bạn có thể điều chỉnh lương của từng nhân viên      │
│     trước khi duyệt                                      │
├─────────────────────────────────────────────────────────┤
│  📋 Chi tiết lương nhân viên                             │
│  [Bảng chi tiết...]                                      │
└─────────────────────────────────────────────────────────┘
```

### Dialog điều chỉnh lương

```
┌─────────────────────────────────────────────────────────┐
│  ✏️ Điều chỉnh lương nhân viên          [Lưu] [Hủy]     │
├─────────────────────────────────────────────────────────┤
│  📄 Thông tin nhân viên                                  │
│  • Nhân viên: Nguyễn Văn A (nva@email.com)               │
│  • Số giờ làm việc: 160 giờ                              │
│  • Lương cơ bản: 8,000,000đ                              │
│  • Thưởng hiện tại: +500,000đ | Khấu trừ: -50,000đ      │
├─────────────────────────────────────────────────────────┤
│  💰 Cấu hình lương cá nhân                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Lương giờ:        50,000đ/h                       │  │
│  │ Hiệu lực từ:      01/01/2026                      │  │
│  │ Thưởng CC 100%:   500,000đ                        │  │
│  │ Thưởng CC 95%:    300,000đ                        │  │
│  │ Hệ số làm thêm:   x1.5                            │  │
│  │ Phạt đi muộn:     50,000đ/lần                     │  │
│  └───────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  ➕ Điều chỉnh bổ sung                                   │
│  Loại điều chỉnh: [Thưởng thêm ▼]                       │
│  Số tiền:         [________] VNĐ                        │
│  Lý do:           [_______________________________]     │
│                   [_______________________________]     │
│  ⚠️ Tổng lương sau điều chỉnh: 8,950,000đ               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Trạng thái bảng lương

| Trạng thái    | Màu           | Ý nghĩa                     | Có thể làm gì               |
| ------------- | ------------- | --------------------------- | --------------------------- |
| Nháp          | ⚪ Xám        | Vừa tạo, chưa tính          | Xóa, Chỉnh sửa              |
| Đã tính       | 🔵 Xanh dương | Đã tính toán xong           | Xem, Điều chỉnh, Duyệt, Xóa |
| Đã duyệt      | 🟢 Xanh lá    | Đã xác nhận, chờ thanh toán | Xem, Xác nhận TT            |
| Đã thanh toán | ✅ Xanh tích  | Hoàn tất                    | Chỉ xem                     |
| Đã hủy        | 🔴 Đỏ         | Bị hủy                      | Chỉ xem                     |

---

## 💡 Tips & Best Practices

### ✅ Nên làm:

1. **Thiết lập mức lương cho tất cả nhân viên trước**
   - Vào "Quản lý mức lương"
   - Thêm đầy đủ thông tin cho mỗi nhân viên
   - Lưu lại trước khi tạo bảng lương

2. **Kiểm tra dữ liệu chấm công trước khi tạo**
   - Đảm bảo tất cả ca đã check-out đúng
   - Xác nhận thời gian check-in/out chính xác

3. **Xem kỹ trước khi duyệt**
   - Kiểm tra từng dòng lương
   - Sử dụng chức năng điều chỉnh nếu cần
   - Không thể sửa sau khi duyệt

4. **Ghi chú rõ ràng khi điều chỉnh**
   - Lý do phải cụ thể, tối thiểu 10 ký tự
   - Ví dụ: "Thưởng hoàn thành dự án X đúng hạn"

### ❌ Không nên:

1. ❌ Tạo bảng lương khi chưa thiết lập mức lương
2. ❌ Tạo nhiều bảng lương cho cùng 1 kỳ
3. ❌ Duyệt vội mà chưa kiểm tra kỹ
4. ❌ Điều chỉnh lương mà không ghi rõ lý do

---

## 🐛 Xử lý lỗi thường gặp

### Lỗi: "Không thể tải thông tin mức lương"

**Nguyên nhân:** Nhân viên chưa có SalaryRate  
**Giải pháp:** Vào "Quản lý mức lương" → Thêm mức lương cho nhân viên

### Lỗi: "Kỳ lương này đã tồn tại"

**Nguyên nhân:** Đã tạo bảng lương cho kỳ này  
**Giải pháp:** Xem lại danh sách hoặc chọn kỳ khác

### Không tính được thưởng/phạt

**Kiểm tra:**

- Cấu hình SalaryRate đã đầy đủ chưa
- Dữ liệu chấm công có chính xác không
- Xem field "Ghi chú" trong bảng chi tiết

### Dialog điều chỉnh không mở

**Kiểm tra:**

- Bảng lương đã duyệt chưa (nếu rồi thì không sửa được)
- Refresh lại trang

---

## 📱 Responsive

- ✅ Desktop: Hiển thị đầy đủ tính năng
- ✅ Tablet: Scroll ngang bảng chi tiết
- ⚠️ Mobile: Nên sử dụng landscape mode

---

## 🔐 Phân quyền

| Vai trò | Quyền hạn                           |
| ------- | ----------------------------------- |
| Admin   | Toàn quyền tất cả canteen           |
| Manager | Quản lý bảng lương canteen của mình |
| Staff   | Chỉ xem lương của bản thân          |

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, liên hệ:

- 📧 Email: support@unilife.com
- 📱 Hotline: 1900 xxxx
- 💬 Chat: Góc dưới bên phải màn hình

---

**Cập nhật lần cuối:** 04/03/2026  
**Phiên bản:** 2.0 - Tích hợp SalaryRate tự động
