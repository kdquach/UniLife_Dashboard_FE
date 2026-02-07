import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useState } from "react";

const { Content } = Layout;

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = () => {
    setCollapsed((prev) => !prev);
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
  };

  return (
    <div className="dashboard-root">
      <Layout className="dashboard-shell">
        <Sidebar collapsed={collapsed} />
        <Layout style={{ minHeight: 0 }}>
          <Header
            collapsed={collapsed}
            onToggle={handleToggle}
          />
          <Content className="dashboard-content" style={{ minHeight: 0 }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}
