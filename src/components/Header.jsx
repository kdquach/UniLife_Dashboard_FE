import { Layout, Button, Dropdown, Avatar, Space, Input, message } from "antd";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";
import GIcon from "@/components/GIcon";
import NotificationCenter from "@/components/NotificationCenter";

const { Header: AntHeader } = Layout;

export default function Header({ collapsed, onToggle }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const handleLogout = async () => {
    try {
      await logout();
      messageApi.success("Đăng xuất thành công");
      navigate("/login");
    } catch (error) {
      messageApi.error("Có lỗi xảy ra khi đăng xuất");
    }
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <GIcon name="person" />,
      label: "Thông tin cá nhân",
      onClick: () => navigate("/profile"),
    },
    {
      key: "settings",
      icon: <GIcon name="settings" />,
      label: "Cài đặt",
      onClick: () => navigate("/settings"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <GIcon name="logout" />,
      label: "Đăng xuất",
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader
      style={{
        padding: "0 24px",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {contextHolder}
      <Space size="middle" style={{ flex: 1 }}>
        <Button
          type="text"
          icon={<GIcon name={collapsed ? "menu_open" : "menu"} />}
          onClick={onToggle}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
          }}
        />

        <Input
          placeholder="Tìm kiếm..."
          prefix={<GIcon name="search" />}
          allowClear
          style={{
            maxWidth: 520,
            height: 44,
            borderRadius: 14,
            background: "rgba(245,246,248,0.9)",
          }}
        />
      </Space>

      <Space size="middle">
        <NotificationCenter />

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: "pointer" }}>
            <Avatar icon={<GIcon name="person" />} src={user?.avatar} />
            <span style={{ fontWeight: 500 }}>
              {user?.fullName || user?.name || "Admin"}
            </span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
}
