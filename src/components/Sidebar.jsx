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
      label: "Quản lí lịch làm việc",
    },
    {
      key: "/staff/attendance-group",
      icon: <GIcon name="fingerprint" />,
      label: "Quản lí chấm công",
      children: [
        { key: "/staff/attendance", label: "Chấm công hôm nay" },
        { key: "/staff/attendance-history", label: "Lịch sử chấm công" },
      ],
    },
    {
      key: "/staff/products-group",
      icon: <GIcon name="inventory_2" />,
      label: "Quản lý sản phẩm",
      children: [
        {
          key: "/staff/products",
          label: "Danh sách sản phẩm",
        },
        {
          key: "/staff/inventory",
          label: "Bảng điều khiển tồn kho",
        },
        {
          key: "/staff/assign-food-menu",
          label: "Phân bổ vào thực đơn",
        },
      ],
    },
    {
      key: "/staff/ingredients",
      icon: <GIcon name="restaurant" />,
      label: "Quản lí nguyên liệu",
    },
    {
      key: "/staff/recipes",
      icon: <GIcon name="menu_book" />,
      label: "Quản lí công thức món ăn",
    },
    {
      key: "/staff/categories",
      icon: <GIcon name="category" />,
      label: "Quản lí danh mục",
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
      label: "Quản lí đơn hàng",
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
      label: "Quản lí người dùng",
    },
    {
      key: "/permissions",
      icon: <GIcon name="admin_panel_settings" />,
      label: "Phân quyền",
    },
    // {
    //   key: '/products-group',
    //   icon: <GIcon name="inventory_2" />,
    //   label: 'Quản lý sản phẩm',
    //   children: [
    //     {
    //       key: '/products',
    //       label: 'Danh sách sản phẩm',
    //     },
    //     {
    //       key: '/inventory',
    //       label: 'Bảng điều khiển tồn kho',
    //     },
    //   ],
    // },
    // {
    //   key: '/manager/menu-management-group',
    //   icon: <GIcon name="restaurant_menu" />,
    //   label: 'Quản lý thực đơn',
    //   children: [
    //     {
    //       key: '/manager/menus',
    //       label: 'Danh sách thực đơn',
    //     },
    //     {
    //       key: '/assign-food-menu',
    //       label: 'Phân bổ vào thực đơn',
    //     },
    //   ],
    // },
    // {
    //   key: '/manager/menu-scheduling-group',
    //   icon: <GIcon name="event_note" />,
    //   label: 'Lịch thực đơn',
    //   children: [
    //     {
    //       key: '/manager/menu-schedules',
    //       label: 'Lịch áp dụng thực đơn',
    //     },
    //   ],
    // },
    {
      key: "/categories",
      icon: <GIcon name="category" />,
      label: "Quản lí danh mục",
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
      key: "/vouchers",
      icon: <GIcon name="local_offer" />,
      label: "Quản lí khuyến mãi",
    },
    {
      key: "/canteens",
      icon: <GIcon name="storefront" />,
      label: "Quản lí căn tin",
    },
    {
      key: "/banners",
      icon: <GIcon name="photo" />,
      label: "Quản lí banner",
    },
    {
      key: "/notifications",
      icon: <GIcon name="campaign" />,
      label: "Quản lí thông báo",
    },
    {
      key: "/audit-logs",
      icon: <GIcon name="history" />,
      label: "Quản lí nhật ký hệ thống",
    },
    {
      key: "/settings",
      icon: <GIcon name="settings" />,
      label: "Quản lí cài đặt",
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
      label: "Quản lí ca làm việc",
      children: [
        {
          key: "/manager/schedule-builder",
          label: "Lập lịch làm việc",
        },
        {
          key: "/manager/shift-requests",
          label: "Yêu cầu đổi ca",
        },
      ],
    },
    {
      key: "/manager/products-group",
      icon: <GIcon name="inventory_2" />,
      label: "Quản lí sản phẩm",
      children: [
        {
          key: "/manager/products",
          label: "Danh sách sản phẩm",
        },
        {
          key: "/manager/inventory",
          label: "Bảng điều khiển tồn kho",
        },
      ],
    },
    {
      key: "/manager/ingredients",
      icon: <GIcon name="restaurant" />,
      label: "Quản lí nguyên liệu",
    },
    {
      key: "/manager/recipes",
      icon: <GIcon name="menu_book" />,
      label: "Quản lí công thức món ăn",
    },
    {
      key: "/manager/menu-management-group",
      icon: <GIcon name="restaurant_menu" />,
      label: "Quản lí thực đơn",
      children: [
        {
          key: "/manager/menus",
          label: "Danh sách thực đơn",
        },
        {
          key: "/manager/assign-food-menu",
          label: "Phân bổ vào thực đơn",
        },
      ],
    },
    {
      key: "/manager/menu-scheduling-group",
      icon: <GIcon name="event_note" />,
      label: "Quản lí lịch thực đơn",
      children: [
        {
          key: "/manager/menu-schedules",
          label: "Lịch áp dụng thực đơn",
        },
      ],
    },
    {
      key: "/manager/payroll-group",
      icon: <GIcon name="payments" />,
      label: "Quản lí lương",
      children: [
        {
          key: "/manager/payroll",
          label: "Bảng lương",
        },
        {
          key: "/manager/salary-rates",
          label: "Cấu hình lương",
        },
      ],
    },
    {
      key: "/manager/staff",
      icon: <GIcon name="group" />,
      label: "Quản lí nhân viên",
    },
    {
      key: "/manager/feedback",
      icon: <GIcon name="reviews" />,
      label: "Quản lí phản hồi khách hàng",
    },
    {
      key: "/categories",
      icon: <GIcon name="category" />,
      label: "Quản lí danh mục",
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
      key: "/manager/vouchers",
      icon: <GIcon name="local_offer" />,
      label: "Quản lí khuyến mãi",
    },
    {
      key: "/notifications",
      icon: <GIcon name="campaign" />,
      label: "Quản lí thông báo",
    },
    {
      key: "/audit-logs",
      icon: <GIcon name="history" />,
      label: "Quản lí nhật ký hệ thống",
    },
    {
      key: "/canteens",
      icon: <GIcon name="storefront" />,
      label: "Quản lí căn tin",
    },
  ];

  const menuByRole = {
    staff: staffMenuItems,
    manager: managerMenuItems,
    canteen_owner: managerMenuItems,
    admin: adminMenuItems,
  };

  const menuItems = menuByRole[role] || adminMenuItems;

  // Hàm tìm menu item theo key (support nested children)
  const findMenuItemByKey = (items, targetKey) => {
    for (const item of items) {
      if (item.key === targetKey) {
        return item;
      }
      if (item.children) {
        const found = findMenuItemByKey(item.children, targetKey);
        if (found) return found;
      }
    }
    return null;
  };

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
      className="dashboard-sider"
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={260}
      collapsedWidth={84}
    >
      <div className="sidebar-logo">
        {!collapsed && (
          <img src={logoLg} alt="UniLife Logo" className="sidebar-logo-image" />
        )}
        {collapsed && (
          <img src={logoMd} alt="UniLife Logo" className="sidebar-logo-image" />
        )}
      </div>
      <Menu
        className="sidebar-menu"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => {
          // Kiểm tra nếu item có children thì không navigate (chỉ toggle expand/collapse)
          const item = findMenuItemByKey(menuItems, key);
          if (!item?.children) {
            navigate(key);
          }
        }}
      />
    </Sider>
  );
}
