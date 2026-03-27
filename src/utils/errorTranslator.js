/**
 * Global utility to translate backend error messages to Vietnamese.
 */
const ERROR_MAPPINGS = {
  // Authentication & Profile
  "This account is not registered to a canteen": "Tài khoản của bạn chưa được gán cho căn tin nào. Vui lòng liên hệ Admin.",
  "Current password is incorrect": "Mật khẩu hiện tại không chính xác",
  "User not found": "Không tìm thấy người dùng",
  "Invalid credentials": "Thông tin đăng nhập không hợp lệ",
  "Forbidden": "Bạn không có quyền thực hiện hành động này",
  "Unauthorized": "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.",

  // Dashboard & Canteen Errors
  "No canteen assigned to this account": "Tài khoản này chưa được gán cho căn tin nào. Vui lòng liên hệ Admin.",
  "No canteen registered": "Căn tin chưa được đăng ký trong hệ thống.",

  // Vouchers
  "Voucher cloned as Draft. Please complete required fields (code, dates) and save.": "Đã nhân bản voucher thành bản nháp. Vui lòng cập nhật mã và thời gian rồi lưu lại.",
  
  // Generic
  "Network Error": "Lỗi kết nối mạng",
  "Internal Server Error": "Lỗi hệ thống máy chủ",
};

/**
 * Translates an English message (error or success) from the backend to Vietnamese.
 * @param {string} msg - The message to translate.
 * @returns {string} - The translated message or the original if no mapping exists.
 */
export const translateMessage = (msg) => {
  if (!msg) return "";
  
  // Try exact match first
  if (ERROR_MAPPINGS[msg]) return ERROR_MAPPINGS[msg];

  // Try partial or case-insensitive matching if needed
  const normalizedMsg = msg.trim();
  if (ERROR_MAPPINGS[normalizedMsg]) return ERROR_MAPPINGS[normalizedMsg];

  return msg;
};

// Alias for backward compatibility
export const translateError = translateMessage;
