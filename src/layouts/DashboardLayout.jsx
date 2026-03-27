import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useEffect, useState } from "react";

const { Content } = Layout;

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1024px)");
    const syncLayout = (event) => {
      const mobile = event.matches;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };

    syncLayout(media);
    media.addEventListener("change", syncLayout);
    return () => media.removeEventListener("change", syncLayout);
  }, []);

  const handleToggle = () => {
    if (isMobile) {
      setMobileMenuOpen((prev) => !prev);
      return;
    }

    setCollapsed((prev) => !prev);
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
  };

  return (
    <div className="dashboard-root">
      <Layout className="dashboard-shell">
        <Sidebar
          collapsed={collapsed}
          isMobile={isMobile}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
        <Layout style={{ minHeight: 0 }}>
          <Header
            collapsed={collapsed}
            onToggle={handleToggle}
            isMobile={isMobile}
          />
          <Content className="dashboard-content" style={{ minHeight: 0 }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}
