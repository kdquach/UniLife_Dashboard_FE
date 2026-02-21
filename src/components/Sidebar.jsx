import { Layout, Menu } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import logoLg from "@/assets/images/logo-lg.png";
import logoMd from "@/assets/images/logo-md.png";
import GIcon from "@/components/GIcon";
import { useAuthStore } from "@/store/useAuthStore";

const { Sider } = Layout;

export default function Sidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const role = user?.role;

  const staffMenuItems = [
    {
      key: "/staff/schedule",
      icon: <GIcon name="calendar_month" />,
      label: "Lịch làm việc",
    },
    {
      key: "/staff/attendance-group",
      icon: <GIcon name="fingerprint" />,
      label: "Chấm công",
      children: [
        { key: "/staff/attendance", label: "Chấm công hôm nay" },
        { key: "/staff/attendance-history", label: "Lịch sử chấm công" },
      ],
    },
    {
      key: "/products",
      icon: <GIcon name="inventory_2" />,
      label: "Sản phẩm",
    },
    {
      key: "/staff/categories",
      icon: <GIcon name="category" />,
      label: "Danh mục",
      children: [
        {
          key: "/staff/product-categories",
          label: "Danh mục sản phẩm",
        },
        {
          key: "/staff/ingredient-categories",
          label: "Danh mục nguyên liệu",
        },
      ],
    },
    {
      key: "/staff/orders-group",
      icon: <GIcon name="shopping_cart" />,
      label: "Đơn hàng",
      children: [
        { key: "/staff/orders", label: "Đơn chờ nhận" },
        { key: "/staff/qr-scan", label: "Quét QR trả hàng" },
      ],
    },
  ];

  const adminMenuItems = [
    {
      key: "/",
      icon: <GIcon name="space_dashboard" />,
      label: "Tổng quan",
    },
    {
      key: "/users",
      icon: <GIcon name="group" />,
      label: "Người dùng",
    },
    {
      key: "/products",
      icon: <GIcon name="inventory_2" />,
      label: "Sản phẩm",
    },
    {
      key: "/categories",
      icon: <GIcon name="category" />,
      label: "Danh mục",
      children: [
        {
          key: "/ingredient-categories",
          label: "Nhóm nguyên liệu",
        },
        {
          key: "/product-categories",
          label: "Danh mục sản phẩm",
        },
      ],
    },
    {
      key: "/orders",
      icon: <GIcon name="shopping_cart" />,
      label: "Đơn hàng",
    },
    {
      key: "/canteens",
      icon: <GIcon name="storefront" />,
      label: "Canteen",
    },
    {
      key: "/reports",
      icon: <GIcon name="bar_chart" />,
      label: "Báo cáo",
    },
    {
      key: "/settings",
      icon: <GIcon name="settings" />,
      label: "Cài đặt",
    },
  ];

  const managerMenuItems = [
    {
      key: "/",
      icon: <GIcon name="space_dashboard" />,
      label: "Tổng quan",
    },
    {
      key: "/manager",
      icon: <GIcon name="calendar_month" />,
      label: "Quản lý ca làm việc",
      children: [
        {
          key: "/manager/schedule",
          label: "Lịch làm việc",
        },
        {
          key: "/manager/shift-requests",
          label: "Yêu cầu đổi ca",
        },
      ],
    },
    {
      key: "/categories",
      icon: <GIcon name="category" />,
      label: "Danh mục",
      children: [
        {
          key: "/ingredient-categories",
          label: "Nhóm nguyên liệu",
        },
        {
          key: "/product-categories",
          label: "Danh mục sản phẩm",
        },
      ],
    },
    {
      key: "/orders",
      icon: <GIcon name="shopping_cart" />,
      label: "Đơn hàng",
    },
    {
      key: "/reports",
      icon: <GIcon name="bar_chart" />,
      label: "Báo cáo",
    },
    {
      key: "/canteens",
      icon: <GIcon name="storefront" />,
      label: "Canteen",
    },
  ];

  const menuByRole = {
    staff: staffMenuItems,
    manager: managerMenuItems,
    admin: adminMenuItems,
  };

  const menuItems = menuByRole[role] || adminMenuItems;

  const selectedKey = (() => {
    const path = location.pathname;
    if (path === "/staff") return "/staff/schedule";
    if (path.startsWith("/staff/")) {
      const parts = path.split("/");
      return `/${parts[1]}/${parts[2]}`;
    }
    return path;
  })();

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={260}
      collapsedWidth={84}
      style={{
        background: "transparent",
      }}
    >
      <div
        style={{
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 16px",
        }}
      >
        {!collapsed && (
          <img src={logoLg} alt="UniLife Logo" style={{ height: 36 }} />
        )}
        {collapsed && (
          <img src={logoMd} alt="UniLife Logo" style={{ height: 36 }} />
        )}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{
          borderRight: 0,
          marginTop: 16,
          padding: "0 10px",
        }}
      />
    </Sider>
  );
}
