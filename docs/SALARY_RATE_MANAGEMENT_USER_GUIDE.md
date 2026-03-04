# Hướng dẫn sử dụng trang Cấu hình lương

## 📍 Vị trí

**Sidebar Menu:** `Quản lý lương` → `Cấu hình lương`

**URL:** `/manager/salary-rates`

**Quyền truy cập:** Manager, Canteen Owner, Admin

---

## 🎯 Chức năng

Trang này cho phép Manager cấu hình:

- ✅ Mức lương theo giờ
- ✅ Thưởng chuyên cần (3 mức: 100%, ≥95%, ≥90%)
- ✅ Hệ số thưởng overtime
- ✅ Mức phạt (đi muộn, về sớm, nghỉ không phép)
- ✅ Ngưỡng số lần đi muộn cho phép

---

## 📊 Giao diện

### 1. **Thống kê tổng quan**

4 cards hiển thị:

- Tổng nhân viên đã cấu hình
- Lương giờ trung bình
- Lương giờ cao nhất
- Lương giờ thấp nhất

### 2. **Bảng danh sách**

Columns:

- Nhân viên (tên + email)
- Lương giờ
- Thưởng chuyên cần (100%, ≥95%, ≥90%)
- Hệ số OT
- Phạt (đi muộn, về sớm, nghỉ KP)
- Cho phép muộn
- Thao tác (nút Sửa)

### 3. **Form cấu hình**

Modal form với các trường:

- **Lương cơ bản:**
  - Mức lương theo giờ (VNĐ)
- **Thưởng chuyên cần:**
  - Thưởng 100% ca
  - Thưởng ≥95% ca
  - Thưởng ≥90% ca
  - Hệ số thưởng overtime
- **Khấu trừ:**
  - Phạt đi muộn (mỗi lần)
  - Phạt về sớm (mỗi lần)
  - Phạt nghỉ không phép (mỗi ca)
  - Số lần đi muộn tối đa cho phép
- **Ghi chú:** Mô tả về cấu hình

---

## 🔧 Cách sử dụng

### **Thêm cấu hình mới**

1. Click nút **"Thêm cấu hình"** (góc trên bên phải)
2. Chọn nhân viên từ dropdown (chỉ hiển thị nhân viên chưa có cấu hình)
3. Điền các thông tin:
   - Form đã có giá trị mặc định
   - Có thể điều chỉnh theo nhu cầu
4. Click **"Lưu"**

### **Sửa cấu hình**

1. Click nút **"Sửa"** ở hàng nhân viên cần chỉnh sửa
2. Form hiện ra với dữ liệu hiện tại
3. Điều chỉnh các giá trị cần thiết
4. Click **"Lưu"**

---

## 💡 Ví dụ cấu hình

### **Case 1: Nhân viên thường**

```
Lương giờ: 50,000đ
Thưởng 100%: 500,000đ
Thưởng ≥95%: 300,000đ
Thưởng ≥90%: 100,000đ
Hệ số OT: 1.5
Phạt đi muộn: 50,000đ
Phạt về sớm: 30,000đ
Phạt nghỉ KP: 200,000đ
Cho phép muộn: 3 lần
```

### **Case 2: Nhân viên senior**

```
Lương giờ: 80,000đ
Thưởng 100%: 1,000,000đ
Thưởng ≥95%: 600,000đ
Thưởng ≥90%: 300,000đ
Hệ số OT: 2.0
Phạt đi muộn: 100,000đ
Phạt về sớm: 50,000đ
Phạt nghỉ KP: 300,000đ
Cho phép muộn: 2 lần
Ghi chú: "Nhân viên senior - yêu cầu kỷ luật cao"
```

### **Case 3: Nhân viên part-time**

```
Lương giờ: 35,000đ
Thưởng 100%: 200,000đ
Thưởng ≥95%: 100,000đ
Thưởng ≥90%: 50,000đ
Hệ số OT: 1.3
Phạt đi muộn: 30,000đ
Phạt về sớm: 20,000đ
Phạt nghỉ KP: 100,000đ
Cho phép muộn: 2 lần
Ghi chú: "Part-time - ít ca"
```

---

## ⚙️ Giá trị mặc định

Khi thêm mới, form có sẵn giá trị:

- Lương giờ: 50,000đ
- Thưởng 100%: 500,000đ
- Thưởng ≥95%: 300,000đ
- Thưởng ≥90%: 100,000đ
- Hệ số OT: 1.5
- Phạt đi muộn: 50,000đ
- Phạt về sớm: 30,000đ
- Phạt nghỉ KP: 200,000đ
- Cho phép muộn: 3 lần

---

## 🔗 Liên kết với tính lương

1. **Manager cấu hình** salary rate cho nhân viên
2. **Khi tạo bảng lương** (`Generate Payroll`):
   - Hệ thống tự động lấy config của từng nhân viên
   - Tính thưởng/phạt theo config riêng
   - Nếu nhân viên chưa có config → dùng giá trị mặc định
3. **Kết quả:** Mỗi nhân viên có mức thưởng/phạt phù hợp

---

## ⚠️ Lưu ý

1. **Mỗi nhân viên chỉ có 1 cấu hình** - Update sẽ ghi đè
2. **Cấu hình mới chỉ áp dụng cho bảng lương tương lai** - Không ảnh hưởng payroll đã tạo
3. **Nhân viên chưa có config vẫn tính lương được** - Dùng giá trị mặc định
4. **Nên cấu hình trước khi tạo bảng lương** để có hiệu quả ngay

---

## 🎨 Gợi ý sử dụng

### **Theo vị trí:**

| Vị trí     | Lương giờ | Thưởng 100% | Phạt đi muộn | Cho phép muộn |
| ---------- | --------- | ----------- | ------------ | ------------- |
| Bếp trưởng | 100,000đ  | 1,500,000đ  | 150,000đ     | 1 lần         |
| Thu ngân   | 60,000đ   | 700,000đ    | 70,000đ      | 2 lần         |
| Phục vụ    | 50,000đ   | 500,000đ    | 50,000đ      | 3 lần         |
| Bảo vệ     | 45,000đ   | 400,000đ    | 40,000đ      | 3 lần         |

### **Theo thâm niên:**

| Thâm niên              | Lương giờ | Thưởng 100% | Hệ số OT |
| ---------------------- | --------- | ----------- | -------- |
| Thử việc (< 3 tháng)   | 40,000đ   | 200,000đ    | 1.0      |
| Nhân viên (3-12 tháng) | 50,000đ   | 500,000đ    | 1.5      |
| Senior (1-3 năm)       | 70,000đ   | 800,000đ    | 2.0      |
| Trưởng nhóm (> 3 năm)  | 100,000đ  | 1,500,000đ  | 2.5      |

---

## 🚀 Workflow khuyên dùng

1. **Tháng đầu:**
   - Set config cho tất cả nhân viên hiện tại
   - Dùng mức cơ bản/trung bình

2. **Review định kỳ (3 tháng/lần):**
   - Tăng lương cho nhân viên xuất sắc
   - Điều chỉnh mức phạt nếu cần

3. **Nhân viên mới:**
   - Set config ngay khi onboard
   - Dùng mức thử việc ban đầu

4. **Trước kỳ lương:**
   - Review lại config
   - Đảm bảo công bằng giữa các nhân viên

---

## 📝 Checklist triển khai

- [x] Tạo trang UI
- [x] Kết nối API
- [x] Thêm vào menu Sidebar
- [x] Thêm route
- [ ] **TODO:** Test với nhiều nhân viên
- [ ] **TODO:** Export/Import config hàng loạt
- [ ] **TODO:** History log thay đổi config
- [ ] **TODO:** Notification khi config thay đổi

---

## 🔮 Tính năng tương lai

1. **Template cấu hình:**
   - Tạo template cho từng vị trí
   - Apply nhanh cho nhiều người

2. **Bulk update:**
   - Tăng lương hàng loạt X%
   - Copy config từ người này sang người khác

3. **Config theo mùa:**
   - Tháng 12 tăng gấp đôi thưởng
   - Tết tăng hệ số OT

4. **Approval workflow:**
   - Manager đề xuất
   - Admin phê duyệt

5. **Report & Analytics:**
   - Chi phí lương dự kiến
   - So sánh giữa các nhân viên
