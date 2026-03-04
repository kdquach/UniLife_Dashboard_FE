import { Chip } from "@mui/material";

const PayrollStatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case "draft":
        return { label: "Nháp", color: "default" };
      case "calculated":
        return { label: "Đã tính", color: "info" };
      case "approved":
        return { label: "Đã duyệt", color: "success" };
      case "paid":
        return { label: "Đã thanh toán", color: "primary" };
      case "cancelled":
        return { label: "Đã hủy", color: "error" };
      default:
        return { label: status, color: "default" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  );
};

export default PayrollStatusBadge;
