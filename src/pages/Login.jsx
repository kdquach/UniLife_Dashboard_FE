import { Form, Input, Button, Card, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import logoLg from "@/assets/images/logo-lg.png";
import GIcon from "@/components/GIcon";
import { login } from "@/services/auth.service";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    try {
      const email = String(values.email ?? "").trim();
      const password = String(values.password ?? "");
      if (!email || !password) throw new Error("Missing credentials");

      const { token, user } = await login({
        email,
        password,
      });

      if (!token || !user) throw new Error("Invalid login response");

      setAuth(user, token);
      message.success("Đăng nhập thành công!");
      navigate(user?.role === "staff" ? "/staff/schedule" : "/");
    } catch (err) {
      message.error(err?.response?.data?.message || "Đăng nhập thất bại!");
    }
  };

  return (
    <div className="auth-root">
      <Card className="auth-card" styles={{ body: { padding: 22 } }}>
        <div className="auth-brand">
          <img src={logoLg} alt="UniLife Logo" style={{ height: 46 }} />
          <div className="auth-subtitle">Dashboard • Đăng nhập hệ thống</div>
        </div>

        <Form form={form} onFinish={handleLogin} layout="vertical">
          <Form.Item
            name="email"
            label="Email"
            normalize={(v) => (typeof v === "string" ? v.trim() : v)}
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input
              size="large"
              prefix={<GIcon name="mail" />}
              placeholder="name@unilife.vn"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
          >
            <Input.Password
              size="large"
              prefix={<GIcon name="lock" />}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
            size="large"
            block
            style={{ borderRadius: 14, height: 44, fontWeight: 700 }}
          >
            Đăng nhập
          </Button>

          <div style={{ marginTop: 14, color: "var(--text-muted)", fontSize: 12 }}>
            Gợi ý demo: tài khoản staff sẽ vào màn hình lịch làm việc.
          </div>
        </Form>
      </Card>
    </div>
  );
}
