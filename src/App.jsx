import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { theme } from "@/config/theme";
import { useAuthStore } from "@/store/useAuthStore";

// Layouts
import DashboardLayout from "@/layouts/DashboardLayout";

// Pages
import LoginPage from "@/pages/Login";
import DashboardPage from "@/pages/Dashboard";

// Staff pages
import StaffSchedulePage from "@/pages/staff/StaffSchedule";
import StaffAttendancePage from "@/pages/staff/StaffAttendance";
import PendingPickupOrdersPage from "@/pages/staff/PendingPickupOrders";
import QRScanScreenPage from "@/pages/staff/QRScanScreen";
import AttendanceHistoryPage from "@/pages/staff/AttendanceHistory";

// Manager pages
import ManagerSchedulePage from "@/pages/manager/ManagerSchedule";
import ShiftRequestsManagementPage from "@/pages/manager/ShiftRequestsManagement";
import ProductManagementPage from "@/pages/manager/ProductManagement";
import IngredientManagementPage from "@/pages/manager/IngredientManagement";
import InventoryDashboardPage from "@/pages/manager/InventoryDashboard";
import AssignFoodToMenuPage from "@/pages/manager/AssignFoodToMenu";
import MenuSchedulesPage from "@/pages/manager/MenuSchedules";
import MenuManagementPage from "@/pages/manager/MenuManagement";
import CanteenManagementPage from "@/pages/manager/CanteenManagement";
import FeedbackManagementPage from "@/pages/manager/FeedbackManagement";
import AuditLogPage from '@/pages/AuditLog';
import PayrollList from "@/pages/manager/PayrollList";
import PayrollDetail from "@/pages/manager/PayrollDetail";
import SalaryRateManagement from "@/pages/manager/SalaryRateManagement";
import StaffManagementPage from "@/pages/manager/StaffManagement";
import ProfilePage from "@/pages/Profile";
import IngredientCategoriesPage from "@/pages/IngredientCategories";
import ProductCategoriesPage from "@/pages/ProductCategories";
import NotificationPage from "@/pages/notification/NotificationPage";


// Protected Route Component
function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    user?.role === "staff" &&
    user?.forceChangePassword &&
    !location.pathname.startsWith("/profile")
  ) {
    return <Navigate to="/profile?forceChangePassword=1" replace />;
  }

  return children;
}

export default function App() {
  return (
    <ConfigProvider theme={theme} locale={viVN}>
      <BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
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

            {/* STAFF ROUTES */}
            <Route path="staff">
              <Route
                index
                element={<Navigate to="/staff/schedule" replace />}
              />
              <Route path="schedule" element={<StaffSchedulePage />} />
              <Route path="attendance" element={<StaffAttendancePage />} />
              <Route
                path="attendance-history"
                element={<AttendanceHistoryPage />}
              />
              <Route
                path="ingredient-categories"
                element={<IngredientCategoriesPage />}
              />
              <Route
                path="product-categories"
                element={<ProductCategoriesPage />}
              />
              <Route path="products" element={<ProductManagementPage />} />
              <Route
                path="ingredients"
                element={<IngredientManagementPage />}
              />
              <Route path="inventory" element={<InventoryDashboardPage />} />
              <Route
                path="assign-food-menu"
                element={<AssignFoodToMenuPage />}
              />
              <Route path="orders" element={<PendingPickupOrdersPage />} />
              <Route path="qr-scan" element={<QRScanScreenPage />} />
            </Route>

            {/* MANAGER ROUTES */}
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
              <Route path="products" element={<ProductManagementPage />} />
              <Route
                path="ingredients"
                element={<IngredientManagementPage />}
              />
              <Route path="inventory" element={<InventoryDashboardPage />} />
              <Route
                path="assign-food-menu"
                element={<AssignFoodToMenuPage />}
              />
              <Route path="menus" element={<MenuManagementPage />} />
              <Route path="menu-schedules" element={<MenuSchedulesPage />} />
              <Route path="feedback" element={<FeedbackManagementPage />} />
              <Route path="payroll" element={<PayrollList />} />
              <Route path="payroll/:id" element={<PayrollDetail />} />
              <Route path="salary-rates" element={<SalaryRateManagement />} />
              <Route path="staff" element={<StaffManagementPage />} />
            </Route>

            {/* COMMON ROUTES */}
            <Route path="profile" element={<ProfilePage />} />
            <Route
              path="ingredient-categories"
              element={<IngredientCategoriesPage />}
            />
            <Route
              path="product-categories"
              element={<ProductCategoriesPage />}
            />
            <Route path="products" element={<ProductManagementPage />} />
            <Route path="staff-shifts" element={<ManagerSchedulePage />} />
            <Route path="notifications" element={<NotificationPage />} />
            <Route path="notifications/:id" element={<NotificationPage />} />
            <Route path="audit-logs" element={<AuditLogPage />} />

            {/* Placeholder routes */}
            <Route path="users" element={<div>Users Page - Coming Soon</div>} />
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
              element={<CanteenManagementPage />}
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
