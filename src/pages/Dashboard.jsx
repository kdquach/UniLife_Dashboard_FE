import { Card, Table, Tag, Button } from "antd";
import GIcon from "@/components/GIcon";

export default function DashboardPage() {
  const topStats = [
    { label: "Total Revenue", value: "$216k", delta: "+3.4%", icon: "payments" },
    { label: "Invoices", value: "2,221", delta: "+12%", icon: "receipt_long" },
    { label: "Clients", value: "1,423", delta: "+9.1%", icon: "group" },
    { label: "Loyalty", value: "78%", delta: "-1.5%", icon: "favorite" },
  ];

  const recentOrders = [
    {
      key: "1",
      orderNumber: "#12345",
      customer: "Daniel Padilla",
      amount: 150000,
      status: "completed",
      time: "3 Jul, 2020",
    },
    {
      key: "2",
      orderNumber: "#12346",
      customer: "Christina Jacobs",
      amount: 250000,
      status: "preparing",
      time: "21 May, 2021",
    },
    {
      key: "3",
      orderNumber: "#12347",
      customer: "Elizabeth Bailey",
      amount: 180000,
      status: "pending",
      time: "14 Apr, 2020",
    },
  ];

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "orderNumber",
      key: "orderNumber",
    },
    {
      title: "Khách hàng",
      dataIndex: "customer",
      key: "customer",
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => `${amount.toLocaleString("vi-VN")}đ`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const colors = {
          pending: "warning",
          preparing: "processing",
          completed: "success",
        };
        const labels = {
          pending: "Chờ xác nhận",
          preparing: "Đang chuẩn bị",
          completed: "Hoàn thành",
        };
        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      },
    },
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
    },
  ];

  const activities = [
    {
      key: "a1",
      title: "New invoice",
      desc: "Francisco Gibbs created invoice PQ-4491C",
      icon: "receipt_long",
      color: "var(--success)",
    },
    {
      key: "a2",
      title: "Reminder sent",
      desc: "Invoice JL-3432B reminder was sent to Chester Corp",
      icon: "notifications",
      color: "var(--warning)",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 4 }}>
            Home
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text)" }}>
            Dashboard
          </div>
        </div>

        <Button
          type="primary"
          style={{ height: 42, borderRadius: 14, fontWeight: 600 }}
          icon={<GIcon name="add" />}
        >
          New
        </Button>
      </div>

      <Card className="surface-card" styles={{ body: { padding: 14 } }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          {topStats.map((stat) => {
            const isNegative = String(stat.delta).startsWith("-");
            return (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  borderRadius: 16,
                  background: "rgba(245,246,248,0.75)",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    background: "#fff",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
                  }}
                >
                  <GIcon name={stat.icon} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {stat.label}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
                      {stat.value}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: isNegative ? "rgba(135,40,34,0.12)" : "rgba(46,125,50,0.12)",
                        color: isNegative ? "var(--danger)" : "var(--success)",
                      }}
                    >
                      {stat.delta}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        <Card className="surface-card" title="Monthly Revenue">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 180 }}>
            {[40, 55, 28, 18, 70, 24, 30, 26, 22, 34, 28].map((h, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  background: idx === 4 ? "var(--primary)" : "rgba(15,35,46,0.08)",
                  height: `${h * 2}px`,
                }}
                title={idx === 4 ? "$15,000" : undefined}
              />
            ))}
          </div>
          <div style={{ marginTop: 12, color: "var(--text-muted)", fontSize: 12 }}>
            (Placeholder chart)
          </div>
        </Card>

        <Card
          className="surface-card"
          style={{
            background:
              "radial-gradient(600px 260px at 30% 20%, rgba(255,255,255,0.22), transparent 55%), linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 55%, rgba(255,184,14,0.95) 115%)",
            border: "none",
            color: "white",
          }}
          styles={{
            header: { color: "white", borderBottom: "1px solid rgba(255,255,255,0.18)" },
          }}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.18)",
                }}
              >
                NEW
              </span>
              <span style={{ fontWeight: 700 }}>Templates</span>
            </div>
          }
        >
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            We have added new invoicing templates!
          </div>
          <div style={{ opacity: 0.9, fontSize: 13, lineHeight: 1.45 }}>
            New templates focused on helping you improve your business.
          </div>
          <Button
            style={{
              marginTop: 16,
              height: 42,
              borderRadius: 14,
              fontWeight: 700,
              background: "rgba(255,255,255,0.92)",
              borderColor: "rgba(255,255,255,0.65)",
            }}
          >
            Download Now
          </Button>
        </Card>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        <Card className="surface-card" title="Activities">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {activities.map((a) => (
              <div
                key={a.key}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: 12,
                  borderRadius: 16,
                  background: "rgba(245,246,248,0.75)",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    background: "#fff",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
                    color: a.color,
                  }}
                >
                  <GIcon name={a.icon} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>
                    {a.title}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {a.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          className="surface-card"
          title="Recent Invoices"
          extra={
            <a href="/orders" style={{ color: "var(--primary)", fontWeight: 700 }}>
              View all
            </a>
          }
        >
          <Table columns={columns} dataSource={recentOrders} pagination={false} />
        </Card>
      </div>
    </div>
  );
}
