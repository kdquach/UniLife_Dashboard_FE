import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { theme } from "@/config/theme";
import { useAuthStore } from "@/store/useAuthStore";

// Layouts
import DashboardLayout from "@/layouts/DashboardLayout";

// Pages
import LoginPage from "@/pages/Login";
import DashboardPage from "@/pages/Dashboard";
import StaffSchedulePage from "@/pages/staff/StaffSchedule";
import ManagerSchedulePage from "@/pages/manager/ManagerSchedule";
import ShiftRequestsManagementPage from "@/pages/manager/ShiftRequestsManagement";
import ProfilePage from "@/pages/Profile";
import IngredientCategoriesPage from "@/pages/IngredientCategories";
import ProductCategoriesPage from "@/pages/ProductCategories";

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ConfigProvider theme={theme} locale={viVN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />

            <Route path="staff">
              <Route
                index
                element={<Navigate to="/staff/schedule" replace />}
              />
              <Route path="schedule" element={<StaffSchedulePage />} />
            </Route>

            <Route path="manager">
              <Route
                index
                element={<Navigate to="/manager/schedule" replace />}
              />
              <Route path="schedule" element={<ManagerSchedulePage />} />
              <Route
                path="shift-requests"
                element={<ShiftRequestsManagementPage />}
              />
            </Route>

            <Route path="profile" element={<ProfilePage />} />
            <Route
              path="ingredient-categories"
              element={<IngredientCategoriesPage />}
            />
            <Route
              path="product-categories"
              element={<ProductCategoriesPage />}
            />

            <Route path="users" element={<div>Users Page - Coming Soon</div>} />
            <Route
              path="products"
              element={<div>Products Page - Coming Soon</div>}
            />
            <Route
              path="categories"
              element={<div>Categories Page - Coming Soon</div>}
            />
            <Route
              path="orders"
              element={<div>Orders Page - Coming Soon</div>}
            />
            <Route
              path="canteens"
              element={<div>Canteens Page - Coming Soon</div>}
            />
            <Route
              path="reports"
              element={<div>Reports Page - Coming Soon</div>}
            />
            <Route
              path="settings"
              element={<div>Settings Page - Coming Soon</div>}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
