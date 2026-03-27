import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import logoLg from '@/assets/images/logo-lg.png';
import logoMd from '@/assets/images/logo-md.png';
import GIcon from '@/components/GIcon';
import { useAuthStore } from '@/store/useAuthStore';

const { Sider } = Layout;

export default function Sidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const role = user?.role;

  const staffMenuItems = [
    {
      key: '/staff/ops-group',
      icon: <GIcon name="calendar_month" />,
      label: 'Vận hành',
      children: [
        {
          key: '/staff/schedule',
          label: 'Quản lí lịch làm việc',
        },

        { key: '/staff/attendance', label: 'Chấm công hôm nay' },
        { key: '/staff/attendance-history', label: 'Lịch sử chấm công' },
      ],
    },
    {
      key: '/staff/product-group',
      icon: <GIcon name="inventory_2" />,
      label: 'Sản phẩm & kho',
      children: [
        {
          key: '/staff/products',
          label: 'Danh sách sản phẩm',
        },
        {
          key: '/staff/inventory',
          label: 'Bảng điều khiển tồn kho',
        },

        {
          key: '/staff/ingredients',
          label: 'Quản lí nguyên liệu',
        },
        {
          key: '/staff/recipes',
          label: 'Quản lí công thức món ăn',
        },

        {
          key: '/staff/product-categories',
          label: 'Danh mục sản phẩm',
        },
        {
          key: '/staff/ingredient-categories',
          label: 'Danh mục nguyên liệu',
        },
      ],
    },
    {
      key: '/staff/menu-group',
      icon: <GIcon name="restaurant_menu" />,
      label: 'Thực đơn',
      children: [
        {
          key: '/staff/menus',
          label: 'Danh sách thực đơn',
        },
        {
          key: '/staff/assign-food-menu',
          label: 'Phân bổ vào thực đơn',
        },
        {
          key: '/staff/menu-schedules',
          label: 'Lịch áp dụng thực đơn',
        },
      ],
    },
    {
      key: '/staff/orders-group',
      icon: <GIcon name="shopping_cart" />,
      label: 'Đơn hàng',
      children: [
        { key: '/staff/orders', label: 'Đơn chờ nhận' },
        { key: '/staff/qr-scan', label: 'Quét QR trả hàng' },
      ],
    },
  ];

  const adminMenuItems = [
    {
      key: '/users',
      icon: <GIcon name="group" />,
      label: 'Quản lí người dùng',
    },
    {
      key: '/permissions',
      icon: <GIcon name="admin_panel_settings" />,
      label: 'Phân quyền',
    },
    {
      key: '/canteens',
      icon: <GIcon name="storefront" />,
      label: 'Quản lí căn tin',
    },
    {
      key: '/banners',
      icon: <GIcon name="photo" />,
      label: 'Quản lí banner',
    },
    {
      key: '/notifications',
      icon: <GIcon name="campaign" />,
      label: 'Quản lí thông báo',
    },
    {
      key: '/vouchers',
      icon: <GIcon name="local_offer" />,
      label: 'Quản lí khuyến mãi',
    },
    {
      key: '/audit-logs',
      icon: <GIcon name="history" />,
      label: 'Quản lí nhật ký hệ thống',
    },
  ];

  const managerMenuItems = [
    {
      key: '/',
      icon: <GIcon name="space_dashboard" />,
      label: 'Tổng quan',
    },
    {
      key: '/manager/ops-group',
      icon: <GIcon name="calendar_month" />,
      label: 'Vận hành',
      children: [
        {
          key: '/manager/schedule-builder',
          label: 'Lập lịch làm việc',
        },
        {
          key: '/manager/shift-requests',
          label: 'Yêu cầu đổi ca',
        },
      ],
    },
    {
      key: '/manager/menu-group',
      icon: <GIcon name="restaurant_menu" />,
      label: 'Thực đơn',
      children: [
        {
          key: '/manager/menus',
          label: 'Danh sách thực đơn',
        },
        {
          key: '/manager/assign-food-menu',
          label: 'Phân bổ vào thực đơn',
        },
        {
          key: '/manager/menu-schedules',
          label: 'Lịch áp dụng thực đơn',
        },
      ],
    },
    {
      key: '/manager/product-group',
      icon: <GIcon name="inventory_2" />,
      label: 'Sản phẩm & kho',
      children: [
        {
          key: '/manager/products',
          label: 'Danh sách sản phẩm',
        },
        {
          key: '/manager/inventory',
          label: 'Bảng điều khiển tồn kho',
        },
        {
          key: '/manager/ingredients',
          label: 'Quản lí nguyên liệu',
        },
        {
          key: '/manager/recipes',
          label: 'Quản lí công thức món ăn',
        },

        {
          key: '/ingredient-categories',
          label: 'Nhóm nguyên liệu',
        },
        {
          key: '/product-categories',
          label: 'Danh mục sản phẩm',
        },
      ],
    },
    {
      key: '/manager/hr-group',
      icon: <GIcon name="payments" />,
      label: 'Nhân sự & lương',
      children: [
        {
          key: '/manager/staff',
          label: 'Quản lí nhân viên',
        },
        {
          key: '/manager/payroll',
          label: 'Bảng lương',
        },
        {
          key: '/manager/salary-rates',
          label: 'Cấu hình lương',
        },
      ],
    },
    {
      key: '/manager/marketing-group',
      icon: <GIcon name="campaign" />,
      label: 'Marketing & CSKH',
      children: [
        {
          key: '/manager/vouchers',
          label: 'Quản lí khuyến mãi',
        },
        {
          key: '/manager/feedback',
          label: 'Quản lí phản hồi khách hàng',
        },
        {
          key: '/notifications',
          label: 'Quản lí thông báo',
        },
      ],
    },
    {
      key: '/manager/system-group',
      icon: <GIcon name="history" />,
      label: 'Hệ thống',
      children: [
        {
          key: '/audit-logs',
          label: 'Quản lí nhật ký hệ thống',
        },
        {
          key: '/canteens',
          label: 'Quản lí căn tin',
        },
      ],
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
    if (path === '/staff') return '/staff/schedule';
    if (path.startsWith('/staff/')) {
      const parts = path.split('/');
      return `/${parts[1]}/${parts[2]}`;
    }

    if (path === '/manager') return '/manager/schedule-builder';
    if (path.startsWith('/manager/')) {
      const parts = path.split('/');
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
