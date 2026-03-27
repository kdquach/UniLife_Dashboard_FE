import { Layout, Button, Dropdown, Avatar, Space, Input, message } from "antd";
import { useAuthStore } from "@/store/useAuthStore";
import { useGlobalSearchStore } from "@/store/useGlobalSearchStore";
import { useNavigate } from "react-router-dom";
import GIcon from "@/components/GIcon";
import NotificationCenter from "@/components/NotificationCenter";

const { Header: AntHeader } = Layout;

export default function Header({ collapsed, onToggle, isMobile = false }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const { keyword, setKeyword } = useGlobalSearchStore();

  const handleLogout = async () => {
    try {
      await logout();
      messageApi.success("Đăng xuất thành công");
      navigate("/login");
    } catch {
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
        padding: isMobile ? "0 12px" : "0 24px",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      {contextHolder}
      <Space size={isMobile ? 8 : "middle"} style={{ flex: 1, minWidth: 0 }}>
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
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{
            width: "100%",
            maxWidth: isMobile ? "100%" : 520,
            height: 44,
            borderRadius: 14,
            background: "rgba(245,246,248,0.9)",
          }}
        />
      </Space>

      <Space size={isMobile ? 8 : "middle"}>
        <NotificationCenter />

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: "pointer" }}>
            <Avatar icon={<GIcon name="person" />} src={user?.user?.avatar || user?.avatar} />
            <span style={{ fontWeight: 500 }}>
              {user?.user?.fullName || user?.fullName || user?.user?.name || user?.name || "Admin"}
            </span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
}
